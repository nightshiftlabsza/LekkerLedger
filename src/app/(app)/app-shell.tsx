"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { googleLogout } from "@react-oauth/google";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { GlobalCreateDesktop, GlobalCreateFAB } from "@/components/global-create";
import { CloudOff, X, AlertOctagon, CreditCard, ChevronDown, CircleUserRound, Settings, LifeBuoy, Sparkles, LogOut } from "lucide-react";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { ToastProvider } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";
import { getHouseholds, getSettings, saveHousehold, saveSettings, setActiveHouseholdId, subscribeToDataChanges } from "@/lib/storage";
import { Household, EmployerSettings } from "@/lib/schema";
import { canUseMultipleHouseholds, getUserPlan } from "@/lib/entitlements";

export function AppShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { network, sync, payments } = useAppConnectivity();
    const [offlineBannerDismissed, setOfflineBannerDismissed] = React.useState(false);
    const [syncBannerDismissed, setSyncBannerDismissed] = React.useState(false);
    const [paymentsBannerDismissed, setPaymentsBannerDismissed] = React.useState(false);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [households, setHouseholds] = React.useState<Household[]>([{ id: "default", name: "Main household", createdAt: new Date(0).toISOString() }]);
    const [activeHouseholdId, setActiveHouseholdState] = React.useState("default");
    const [multiHouseholdEnabled, setMultiHouseholdEnabled] = React.useState(false);
    const [settings, setSettingsState] = React.useState<EmployerSettings | null>(null);

    React.useEffect(() => {
        if (network === "online") setOfflineBannerDismissed(false);
    }, [network]);

    React.useEffect(() => {
        async function loadShellContext() {
            const [loadedHouseholds, settings] = await Promise.all([getHouseholds(), getSettings()]);
            setHouseholds(loadedHouseholds);
            setSettingsState(settings);
            setActiveHouseholdState(settings.activeHouseholdId || "default");
            setMultiHouseholdEnabled(canUseMultipleHouseholds(getUserPlan(settings)));
        }

        loadShellContext();
        return subscribeToDataChanges(loadShellContext);
    }, []);

    const showOfflineBanner = network === "offline" && !offlineBannerDismissed;
    const showSyncBanner = network === "online" && sync === "error" && !syncBannerDismissed;
    const showPaymentsBanner = network === "online" && payments === "unavailable" && !paymentsBannerDismissed;

    const handleSwitchHousehold = async (householdId: string) => {
        await setActiveHouseholdId(householdId);
        setActiveHouseholdState(householdId);
        window.location.reload();
    };

    const handleAddHousehold = async () => {
        if (!multiHouseholdEnabled) {
            router.push("/upgrade");
            return;
        }

        const name = window.prompt("Name this household workspace");
        if (!name) return;
        const trimmed = name.trim();
        if (!trimmed) return;

        const household = {
            id: crypto.randomUUID(),
            name: trimmed,
            createdAt: new Date().toISOString(),
        } satisfies Household;

        await saveHousehold(household);
        await setActiveHouseholdId(household.id);
        window.location.reload();
    };

    return (
        <ToastProvider>
            <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg)" }}>
                <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border)]">
                    <div className="content-container-wide w-full flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <SideDrawer open={moreOpen} onOpenChange={setMoreOpen} showButton={true} />
                            <Link href="/dashboard" className="lg:hidden flex items-center gap-2 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-2.5 py-2 outline-none shadow-[0_6px_18px_rgba(16,24,40,0.05)] hover:border-[var(--primary)]/20 transition-all">
                                <Logo
                                    iconClassName="h-9 w-9"
                                    textClassName="text-[1.12rem]"
                                    className="gap-2.5"
                                />
                            </Link>
                            <div className="hidden lg:flex items-center gap-4">
                                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-3 py-2.5 shadow-[0_6px_18px_rgba(16,24,40,0.04)]">
                                    <Logo
                                        showText={false}
                                        iconClassName="h-9 w-9"
                                        frameClassName="drop-shadow-[0_8px_18px_rgba(16,24,40,0.08)]"
                                    />
                                    <div className="border-l border-[var(--border)] pl-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                        Workspace
                                    </p>
                                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                        Household payroll
                                    </p>
                                    </div>
                                </div>
                                <HouseholdSwitcher
                                    households={households}
                                    activeId={activeHouseholdId}
                                    isPro={multiHouseholdEnabled}
                                    onSwitch={handleSwitchHousehold}
                                    onAddHousehold={handleAddHousehold}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {network === "offline" && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[10px] font-bold text-[var(--focus)] border border-[var(--focus)]/20">
                                    <CloudOff className="h-3 w-3" /> Offline
                                </span>
                            )}
                            <AccountMenu settings={settings} />
                            <GlobalCreateDesktop />
                        </div>
                    </div>
                </header>

                {showOfflineBanner && (
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold"
                        style={{ backgroundColor: "rgba(196,122,28,0.10)", borderBottom: "1px solid rgba(196,122,28,0.25)", color: "var(--primary)" }}>
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <CloudOff className="h-4 w-4 shrink-0" />
                                <span>You&apos;re offline — your changes are saved locally and will sync when reconnected.</span>
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
                    <div className="animate-slide-down flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: "rgba(180,35,24,0.08)", color: "var(--danger)", borderBottom: "1px solid rgba(180,35,24,0.22)" }}>
                        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
                            <div className="flex items-center gap-2">
                                <AlertOctagon className="h-4 w-4 shrink-0" />
                                <span>Google backup needs attention. Reconnect your Google account or Drive access in Settings.</span>
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

                <main id="main-content" className="flex-1 py-8 content-container-wide w-full flex flex-col gap-8 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-8">
                    {children}
                </main>

                <GlobalCreateFAB />
                <BottomNav onMore={() => setMoreOpen(true)} />
            </div>
        </ToastProvider>
    );
}

function AccountMenu({ settings }: { settings: EmployerSettings | null }) {
    const [open, setOpen] = React.useState(false);
    const [googleEmail, setGoogleEmail] = React.useState<string | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        setGoogleEmail(localStorage.getItem("google_email"));
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

    const hasGoogleSession = typeof window !== "undefined" && !!sessionStorage.getItem("google_access_token");
    const googleState = settings?.googleSyncEnabled && hasGoogleSession
        ? "Google backup on"
        : hasGoogleSession
            ? "Google connected"
            : "Local only";

    const handleSignOut = async () => {
        googleLogout();
        sessionStorage.removeItem("google_access_token");
        localStorage.removeItem("google_email");
        localStorage.removeItem("google_has_drive_scope");
        setGoogleEmail(null);
        if (settings) {
            await saveSettings({
                ...settings,
                googleSyncEnabled: false,
                googleAuthToken: undefined,
            });
        }
        setOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="hidden sm:flex items-center gap-2 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-3 py-2 shadow-[0_6px_18px_rgba(16,24,40,0.04)] transition-colors hover:border-[var(--primary)]/25"
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
                    <CircleUserRound className="h-4 w-4" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Account</p>
                    <p className="text-sm font-semibold text-[var(--text)]">{googleEmail || googleState}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-72 rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[0_18px_48px_rgba(16,24,40,0.14)]">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Current setup</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text)]">{googleState}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                            {googleEmail
                                ? `Connected as ${googleEmail}.`
                                : "Your records are currently only on this device until you connect Google."}
                        </p>
                    </div>

                    <div className="mt-3 space-y-1">
                        <MenuLink href="/settings" icon={Settings} label="Settings" sublabel="Employer details, storage, and app preferences" onNavigate={() => setOpen(false)} />
                        <MenuLink href="/upgrade" icon={Sparkles} label="Billing" sublabel="Plans, pricing, and Google-connected access" onNavigate={() => setOpen(false)} />
                        <MenuLink href="/help/compliance" icon={LifeBuoy} label="Help" sublabel="Compliance guide and support resources" onNavigate={() => setOpen(false)} />
                    </div>

                    {hasGoogleSession && (
                        <button
                            type="button"
                            onClick={() => void handleSignOut()}
                            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)]">
                                <LogOut className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--text)]">Sign out of Google</p>
                                <p className="text-xs text-[var(--text-muted)]">Disconnect this session from your Google account.</p>
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
