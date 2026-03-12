"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { GlobalCreateFAB } from "@/components/global-create";
import { CloudOff, X, AlertOctagon, CreditCard, ChevronDown, CircleUserRound, LogOut, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { Logo } from "@/components/ui/logo";
import { AddHouseholdDialog } from "@/components/household/add-household-dialog";
import { getHouseholds, getSettings, resetAllData, saveHousehold, setActiveHouseholdId, subscribeToDataChanges } from "@/lib/storage";
import { Household, EmployerSettings } from "@/lib/schema";
import { canUseMultipleHouseholds, getUserPlan } from "@/lib/entitlements";
import { ACCOUNT_MENU_LINKS } from "@/src/config/app-nav";
import { AppModeProvider, useAppMode } from "@/lib/app-mode";
import { RecoveryGate } from "@/components/encryption/recovery-gate";
import { SyncIndicator } from "@/components/sync-indicator";
import { clearVerifiedEntitlementsCache } from "@/lib/billing-client";
import { createClient } from "@/lib/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { network, sync, payments } = useAppConnectivity();
    const [offlineBannerDismissed, setOfflineBannerDismissed] = React.useState(false);
    const [syncBannerDismissed, setSyncBannerDismissed] = React.useState(false);
    const [syncConflict] = React.useState(false);
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
    const [, setSettingsReady] = React.useState(false);
    const settingsRef = React.useRef<typeof settings>(null);
    React.useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);
    const previousNetworkRef = React.useRef(network);

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
            setSettingsReady(true);
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

    // TODO: In Batch 2, implement Supabase-based encrypted sync here

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
        <AppModeProvider>
                <div className="min-h-screen flex flex-col lg:pl-64 min-[1600px]:lg:pl-72" style={{ backgroundColor: "var(--bg)" }}>
                    <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)] shadow-[var(--shadow-sm)] safe-area-pt">
                        <div className="content-container-wide flex w-full items-center justify-between px-3 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <SideDrawer open={moreOpen} onOpenChange={setMoreOpen} showButton={true} />
                                <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-1.5 sm:px-2.5 py-1.5 sm:py-2 outline-none shadow-[0_6px_18px_rgba(16,24,40,0.05)] transition-all hover:border-[var(--primary)]/20 lg:hidden">
                                    <Logo
                                        iconClassName="h-6 sm:h-9 w-6 sm:w-9"
                                        textClassName="text-[0.85rem] sm:text-[1.12rem]"
                                        className="gap-1.5 sm:gap-2.5"
                                    />
                                </Link>
                            </div>

                            <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                                {network === "offline" && (
                                    <span className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--focus)]/20 bg-[var(--primary)]/10 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-[var(--focus)]">
                                        <CloudOff className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> <span className="hidden sm:inline">Offline</span>
                                    </span>
                                )}

                                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                                        <SyncIndicator />
                                        <AccountMenu />
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
                                            ? "Sync conflict detected. Resolve in Settings."
                                            : "Sync needs attention. Check Settings for details."}
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

                    <main id="main-content" className="flex-1 py-4 sm:py-6 lg:py-8 content-container-wide w-full flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-24 sm:pb-28 lg:pb-12 px-3 sm:px-6 lg:px-8 safe-area-pb">
                        <RecoveryGate>
                            {children}
                        </RecoveryGate>
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
        </AppModeProvider>
    );
}

function AccountMenu() {
    const [open, setOpen] = React.useState(false);
    const [signOutPromptOpen, setSignOutPromptOpen] = React.useState(false);
    const [signingOut, setSigningOut] = React.useState<"keep" | "delete" | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    const supabase = React.useMemo(() => createClient(), []);

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

    const { mode, lockAccount } = useAppMode();

    let accountState = "Local mode";
    let accountSummary = "Your data is stored securely on this device. No cloud sync.";

    if (mode === "account_locked") {
        accountState = "Account Locked";
        accountSummary = "Your encrypted data is paused until you provide your recovery key.";
    } else if (mode === "account_unlocked") {
        accountState = "Cloud Sync Active";
        accountSummary = "Your data is securely encrypted and synced to the cloud.";
    }

    const handleSignOut = React.useCallback(async (dataMode: "keep" | "delete") => {
        if (signingOut) return;
        setSigningOut(dataMode);

        try {
            clearVerifiedEntitlementsCache();
            lockAccount();
            await supabase.auth.signOut();
            if (dataMode === "delete") {
                await resetAllData();
            }
            setOpen(false);
            setSignOutPromptOpen(false);
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Sign out failed", error);
        } finally {
            setSigningOut(null);
        }
    }, [lockAccount, router, signingOut, supabase.auth]);

    return (
        <>
            <div className="relative" ref={menuRef}>
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    data-testid="account-menu-toggle"
                    className="flex items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-2 sm:px-3 py-1.5 sm:py-2 shadow-[var(--shadow-sm)] active-scale transition-all hover:border-[var(--primary)]/25 min-h-[40px]"
                >
                    <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-[var(--surface-2)] text-[var(--primary)] shrink-0">
                        <CircleUserRound className="h-4 w-4" />
                    </div>
                    <div className="text-left hidden sm:block max-w-[100px] md:max-w-[140px]">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] leading-none mb-0.5">Account</p>
                        <p className="text-xs font-semibold text-[var(--text)] truncate">{accountState}</p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-[var(--text-muted)] shrink-0 hidden sm:block" />
                </button>

                {open && (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[0_18px_48px_rgba(16,24,40,0.14)]">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Current setup</p>
                            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{accountState}</p>
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

                        <div className="mt-3 border-t border-[var(--border)] pt-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSignOutPromptOpen(true);
                                    setOpen(false);
                                }}
                                className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                            >
                                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--danger-soft)] text-[var(--danger)]">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text)]">Sign out</p>
                                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">Choose whether this device should keep or remove its local records.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {signOutPromptOpen ? (
                <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(9,14,20,0.55)] p-4 sm:items-center sm:p-6">
                    <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)] lg:items-start">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Sign out safely
                                </div>
                                <h2 className="mt-5 font-serif text-3xl font-bold tracking-tight text-[var(--text)]">How should this device be left?</h2>
                                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                                    Signing out always closes the cloud session. You can either keep the local records in this browser for faster access later, or remove them from this device completely.
                                </p>

                                <div className="mt-8 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void handleSignOut("keep")}
                                        disabled={signingOut !== null}
                                        className="flex min-h-[52px] items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
                                    >
                                        <span>
                                            <span className="block text-sm font-bold text-[var(--text)]">Keep local data on this device</span>
                                            <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">Good for your own phone or laptop. Cloud access ends, but local records remain here.</span>
                                        </span>
                                        {signingOut === "keep" ? <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" /> : null}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => void handleSignOut("delete")}
                                        disabled={signingOut !== null}
                                        className="flex min-h-[52px] items-center justify-between rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-5 py-4 text-left transition-colors hover:bg-[rgba(180,35,24,0.12)] disabled:opacity-60"
                                    >
                                        <span>
                                            <span className="block text-sm font-bold text-[var(--text)]">Delete local data from this device</span>
                                            <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">Best for a shared or borrowed computer. The next login will restore from cloud sync.</span>
                                        </span>
                                        {signingOut === "delete" ? <Loader2 className="h-4 w-4 animate-spin text-[var(--danger)]" /> : <Trash2 className="h-4 w-4 text-[var(--danger)]" />}
                                    </button>
                                </div>
                            </div>

                            <aside className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Reminder</p>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                                    <li>Keeping local data does not keep you logged in.</li>
                                    <li>Deleting local data does not cancel your paid plan.</li>
                                    <li>You can still restore on the next login with your recovery key.</li>
                                </ul>
                            </aside>
                        </div>

                        <div className="mt-6 border-t border-[var(--border)] pt-4 text-right">
                            <button
                                type="button"
                                onClick={() => {
                                    if (signingOut) return;
                                    setSignOutPromptOpen(false);
                                }}
                                className="text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
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

