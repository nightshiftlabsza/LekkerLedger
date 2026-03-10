"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GoogleOAuthProvider, googleLogout } from "@react-oauth/google";
import { env } from "@/lib/env";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { GlobalCreateFAB } from "@/components/global-create";
import { CloudOff, X, AlertOctagon, CreditCard, ChevronDown, CircleUserRound, LogOut, Loader2 } from "lucide-react";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { ToastProvider } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";
import { AddHouseholdDialog } from "@/components/household/add-household-dialog";
import { getHouseholds, getSettings, hasMeaningfulLocalData, saveHousehold, saveSettings, setActiveHouseholdId, subscribeToDataChanges } from "@/lib/storage";
import { Household, EmployerSettings } from "@/lib/schema";
import { canUseAutoBackup, canUseMultipleHouseholds, getUserPlan } from "@/lib/entitlements";
import { clearStoredGoogleSession, getStoredGoogleAccessToken, getStoredGoogleEmail } from "@/lib/google-session";
import { syncDataToDrive, performSmartSyncCheck, syncDataFromDrive } from "@/lib/google-drive";
import { ACCOUNT_MENU_LINKS } from "@/src/config/app-nav";
import { usePaidLoginActivation } from "@/components/paid-login-button";
import { useAutoSync } from "@/lib/hooks/useAutoSync";

export function AppShell({ children }: { children: React.ReactNode }) {
    useAutoSync();
    const router = useRouter();
    const pathname = usePathname();
    const { network, sync, payments } = useAppConnectivity();
    const [offlineBannerDismissed, setOfflineBannerDismissed] = React.useState(false);
    const [syncBannerDismissed, setSyncBannerDismissed] = React.useState(false);
    const [syncConflict, setSyncConflict] = React.useState(false);
    const [paymentsBannerDismissed, setPaymentsBannerDismissed] = React.useState(false);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [households, setHouseholds] = React.useState<Household[]>([{ id: "default", name: "Main household", createdAt: new Date(0).toISOString() }]);
    const [activeHouseholdId, setActiveHouseholdState] = React.useState("default");
    const [multiHouseholdEnabled, setMultiHouseholdEnabled] = React.useState(false);
    const [settings, setSettingsState] = React.useState<EmployerSettings | null>(null);
    const [addHouseholdOpen, setAddHouseholdOpen] = React.useState(false);
    const [newHouseholdName, setNewHouseholdName] = React.useState("");
    const [addHouseholdError, setAddHouseholdError] = React.useState("");
    const [addingHousehold, setAddingHousehold] = React.useState(false);
    const [lastLocalSaveAt, setLastLocalSaveAt] = React.useState<number | null>(null);
    const previousNetworkRef = React.useRef(network);
    const autoBackupInFlightRef = React.useRef(false);
    const sessionSyncPerformedRef = React.useRef(false);
    const lastSyncAttemptRef = React.useRef<number>(0);
    const pendingSyncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        if (network === "offline" && previousNetworkRef.current !== "offline") {
            setOfflineBannerDismissed(false);
        }
        previousNetworkRef.current = network;
    }, [network]);

    React.useEffect(() => {
        let active = true;
        let lastLoadPromise: Promise<unknown> | null = null;

        async function loadShellContext() {
            const thisPromise = Promise.all([getHouseholds(), getSettings()]);
            lastLoadPromise = thisPromise;
            
            const [loadedHouseholds, settings] = await thisPromise;
            if (!active || lastLoadPromise !== thisPromise) return;

            setHouseholds(loadedHouseholds);
            setSettingsState(settings);
            if (settings) {
                setActiveHouseholdState(settings.activeHouseholdId || "default");
                setMultiHouseholdEnabled(canUseMultipleHouseholds(getUserPlan(settings)));
            }
        }

        loadShellContext();
        const unsubscribe = subscribeToDataChanges(() => {
            setLastLocalSaveAt(Date.now());
            void loadShellContext();
        });
        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    // High-Frequency & Event-Driven Auto-Sync (Issue 175)
    React.useEffect(() => {
        if (!settings || network !== "online") return;
        
        const plan = getUserPlan(settings);
        if (!canUseAutoBackup(plan) || !settings.autoBackupEnabled || !settings.googleSyncEnabled) return;

        const accessToken = getStoredGoogleAccessToken();
        if (!accessToken) return;

        const performSync = async (reason: string) => {
            if (autoBackupInFlightRef.current) return;
            
            // Throttle to once every 5 minutes unless it's the very first session sync
            const now = Date.now();
            const minInterval = 5 * 60 * 1000;
            if (sessionSyncPerformedRef.current && (now - lastSyncAttemptRef.current < minInterval)) {
                return;
            }

            autoBackupInFlightRef.current = true;
            lastSyncAttemptRef.current = now;
            console.log(`Auto-sync: Triggering sync (${reason})`);

            try {
                if (!sessionSyncPerformedRef.current) {
                    // Initial check for this session
                    const check = await performSmartSyncCheck(accessToken);
                    sessionSyncPerformedRef.current = true;

                    if (check.recommendation === "RESTORE") {
                        const hasLocal = await hasMeaningfulLocalData();
                        if (!hasLocal) {
                            console.log("Auto-sync: Restoring data for new device");
                            await syncDataFromDrive(accessToken);
                            return;
                        } else {
                            // Conflict or older local: show banner
                            setSyncConflict(true);
                            setSyncBannerDismissed(false);
                            return; 
                        }
                    } else if (check.recommendation === "BACKUP") {
                        await syncDataToDrive(accessToken);
                        return;
                    }
                }

                // Regular incremental backup
                await syncDataToDrive(accessToken);
            } catch (err) {
                console.error("Auto-sync failed", err);
            } finally {
                autoBackupInFlightRef.current = false;
            }
        };

        // 1. Session start sync
        if (!sessionSyncPerformedRef.current) {
            void performSync("session-start");
        }

        // 2. Event-driven sync (debounced 30s after a change)
        const unsubscribe = subscribeToDataChanges(() => {
            if (pendingSyncTimeoutRef.current) clearTimeout(pendingSyncTimeoutRef.current);
            pendingSyncTimeoutRef.current = setTimeout(() => {
                void performSync("data-change");
            }, 30000); // 30s debounce
        });

        // 3. Periodic sync (every 5 minutes)
        const interval = setInterval(() => {
            void performSync("periodic-interval");
        }, 5 * 60 * 1000);

        return () => {
            unsubscribe();
            clearInterval(interval);
            if (pendingSyncTimeoutRef.current) clearTimeout(pendingSyncTimeoutRef.current);
        };
    }, [settings, network]);

    const showOfflineBanner = network === "offline" && !offlineBannerDismissed;
    const showSyncBanner = network === "online" && (sync === "error" || syncConflict) && !syncBannerDismissed;
    const showPaymentsBanner = network === "online" && payments === "unavailable" && !paymentsBannerDismissed;
    const lastLocalSaveLabel = lastLocalSaveAt
        ? new Intl.DateTimeFormat("en-ZA", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(lastLocalSaveAt)
        : null;

    const handleSwitchHousehold = async (householdId: string) => {
        await setActiveHouseholdId(householdId);
        setActiveHouseholdState(householdId);
        window.location.reload();
    };

    const handleAddHousehold = () => {
        if (!multiHouseholdEnabled) {
            router.push("/upgrade");
            return;
        }

        setNewHouseholdName("");
        setAddHouseholdError("");
        setAddHouseholdOpen(true);
    };

    const handleConfirmAddHousehold = async () => {
        const trimmed = newHouseholdName.trim();
        if (!trimmed) {
            setAddHouseholdError("Enter a household name before you continue.");
            return;
        }

        const duplicateName = households.some((household) => household.name.trim().toLowerCase() === trimmed.toLowerCase());
        if (duplicateName) {
            setAddHouseholdError("That household name already exists. Choose a different label so the workspaces stay clear.");
            return;
        }

        setAddingHousehold(true);
        setAddHouseholdError("");

        try {
            const household = {
                id: crypto.randomUUID(),
                name: trimmed,
                createdAt: new Date().toISOString(),
            } satisfies Household;

            await saveHousehold(household);
            await setActiveHouseholdId(household.id);
            setHouseholds((current) => [...current, household]);
            setActiveHouseholdState(household.id);
            setAddHouseholdOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Failed to add household", error);
            setAddHouseholdError("The household could not be created just now. Please try again.");
            setAddingHousehold(false);
        }
    };


    return (
        <ToastProvider>
            <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg)" }}>
                <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
                    <div className="content-container-wide flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <SideDrawer open={moreOpen} onOpenChange={setMoreOpen} showButton={true} />
                            <Link href="/dashboard" className="flex items-center gap-2 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-2.5 py-2 outline-none shadow-[0_6px_18px_rgba(16,24,40,0.05)] transition-all hover:border-[var(--primary)]/20 lg:hidden">
                                <Logo
                                    iconClassName="h-9 w-9"
                                    textClassName="text-[1.12rem]"
                                    className="gap-2.5"
                                />
                            </Link>
                        </div>

                        <div className="ml-auto flex items-center gap-3">
                            {network === "offline" && (
                                <span className="flex items-center gap-1.5 rounded-full border border-[var(--focus)]/20 bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--focus)]">
                                    <CloudOff className="h-3 w-3" /> Offline
                                </span>
                            )}

                            <div className="flex items-center gap-3">
                                <GoogleOAuthProvider clientId={env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "placeholder"}>
                                    <AccountMenu settings={settings} />
                                </GoogleOAuthProvider>
                                <HouseholdSwitcher
                                    households={households}
                                    activeId={activeHouseholdId}
                                    isPro={multiHouseholdEnabled}
                                    onSwitch={handleSwitchHousehold}
                                    onAddHousehold={handleAddHousehold}
                                    variant="account"
                                    className="hidden lg:block"
                                />
                            </div>
                        </div>
                    </div>
                </header>
                {showOfflineBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold"
                        style={{ backgroundColor: "var(--accent-subtle)", borderBottom: "1px solid var(--border)", color: "var(--primary)" }}>
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <CloudOff className="h-4 w-4 shrink-0" />
                                <span>
                                    Saved locally on this device{lastLocalSaveLabel ? ` at ${lastLocalSaveLabel}` : ""}. Backup will resume when you&apos;re online.
                                </span>
                            </div>
                            <button
                                onClick={() => setOfflineBannerDismissed(true)}
                                aria-label="Dismiss offline notice"
                                className="shrink-0 rounded p-0.5 hover:bg-[var(--primary)]/20 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {showSyncBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "rgba(180,35,24,0.06)", color: "var(--danger)", borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <AlertOctagon className="h-4 w-4 shrink-0" />
                                <span>
                                    {syncConflict 
                                        ? "Sync conflict: Your Google backup and this device both have new data. Decide which to keep in Settings > Google Sync."
                                        : "Google backup needs attention. Reconnect your Google account or Drive access in Settings."}
                                </span>
                            </div>
                            <button
                                onClick={() => setSyncBannerDismissed(true)}
                                aria-label="Dismiss sync notice"
                                className="shrink-0 rounded p-0.5 hover:bg-[var(--danger)]/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {showPaymentsBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: "rgba(180,35,24,0.08)", color: "var(--danger)", borderBottom: "1px solid rgba(180,35,24,0.22)" }}>
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 shrink-0" />
                                <span>Payments system currently unavailable. Check back later.</span>
                            </div>
                            <button
                                onClick={() => setPaymentsBannerDismissed(true)}
                                aria-label="Dismiss payments notice"
                                className="shrink-0 rounded p-0.5 hover:bg-[var(--danger)]/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                <main id="main-content" className="flex-1 py-8 content-container-wide w-full flex flex-col gap-8 pb-32 lg:pb-12 px-4 sm:px-6 lg:px-8 safe-area-pb">
                    {children}
                </main>

                <GlobalCreateFAB />
                <AddHouseholdDialog
                    open={addHouseholdOpen}
                    name={newHouseholdName}
                    error={addHouseholdError}
                    saving={addingHousehold}
                    onNameChange={(value) => {
                        setNewHouseholdName(value);
                        if (addHouseholdError) setAddHouseholdError("");
                    }}
                    onClose={() => {
                        if (addingHousehold) return;
                        setAddHouseholdOpen(false);
                        setAddHouseholdError("");
                    }}
                    onSubmit={() => void handleConfirmAddHousehold()}
                />
                <BottomNav onMore={() => setMoreOpen(true)} />
            </div>
        </ToastProvider>
    );
}

function AccountMenu({ settings }: { settings: EmployerSettings | null }) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [googleEmail, setGoogleEmail] = React.useState<string | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const { start, loading, statusMessage } = usePaidLoginActivation();

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        setGoogleEmail(getStoredGoogleEmail());
    }, []);

    React.useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!menuRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const hasGoogleSession = typeof window !== "undefined" && !!getStoredGoogleAccessToken();
    const googleState = hasGoogleSession
        ? settings?.googleSyncEnabled
            ? "Google backup on"
            : "Google connected"
        : "Local only";

    const accountSummary = hasGoogleSession && googleEmail
        ? `Signed in as ${googleEmail}.`
        : "Your records are currently only on this device until you connect Google.";

    const handleSignOut = () => {
        googleLogout();
        clearStoredGoogleSession();
        setOpen(false);
        router.push("/dashboard?signedOut=1");
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                data-testid="account-menu-toggle"
                className="hidden items-center gap-2 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-3 py-2 shadow-[var(--shadow-sm)] active-scale transition-all hover:border-[var(--primary)]/25 sm:flex"
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
                    <CircleUserRound className="h-4 w-4" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Account</p>
                    <p className="text-sm font-semibold text-[var(--text)]">{hasGoogleSession && googleEmail ? googleEmail : googleState}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-72 rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[0_18px_48px_rgba(16,24,40,0.14)]">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Current setup</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text)]">{googleState}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{accountSummary}</p>
                    </div>

                    <div className="mt-3 space-y-1">
                        {ACCOUNT_MENU_LINKS.map((link) => (
                            <MenuLink
                                key={link.href}
                                href={link.href}
                                icon={link.icon}
                                label={link.label}
                                sublabel={link.sublabel || ""}
                                onNavigate={() => setOpen(false)}
                            />
                        ))}
                    </div>

                    {hasGoogleSession ? (
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)]">
                                <LogOut className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--text)]">Sign out of this session</p>
                                <p className="text-xs text-[var(--text-muted)]">Stop Google access on this device without deleting your Drive backup.</p>
                            </div>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void start()}
                            disabled={loading}
                            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-3 text-left transition-all hover:bg-[var(--primary)]/10 disabled:opacity-50"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleUserRound className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--text)]">
                                    {loading ? (statusMessage || "Signing in...") : "Sign in as a member"}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">Connect Google to sync your data and unlock paid features.</p>
                            </div>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
function MenuLink({
    href,
    icon: Icon,
    label,
    sublabel,
    onNavigate,
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    sublabel: string;
    onNavigate: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className="flex items-start gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
        >
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">{sublabel}</p>
            </div>
        </Link>
    );
}

