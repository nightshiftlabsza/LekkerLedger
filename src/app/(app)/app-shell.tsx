"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { CloudOff, X, AlertOctagon, CreditCard, ChevronDown, CircleUserRound, LogOut, Loader2, LayoutDashboard, Monitor, Moon, Sun } from "lucide-react";
import { AppBootstrapProvider, useAppBootstrap } from "@/components/app-bootstrap-provider";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { Logo } from "@/components/ui/logo";
import { AddHouseholdDialog } from "@/components/household/add-household-dialog";
import { useAuthState } from "@/components/auth/auth-state-provider";
import { useUI } from "@/components/theme-provider";
import { saveHousehold, setActiveHouseholdId } from "@/lib/storage";
import { Household } from "@/lib/schema";
import { canUseMultipleHouseholds, getPlanById } from "@/lib/entitlements";
import { isPaidDashboardFlow, shouldRedirectFreeUserFromApp } from "@/lib/app-access";
import { readPendingBillingReference } from "@/lib/billing-handoff";
import { ACCOUNT_MENU_LINKS } from "@/src/config/app-nav";
import { AppModeProvider, useAppMode } from "@/lib/app-mode";
import { RecoveryGate } from "@/components/encryption/recovery-gate";
import { clearVerifiedEntitlementsCache } from "@/lib/billing-client";
import { createClient } from "@/lib/supabase/client";
import { clearAllUserDataOnSignOut } from "@/lib/sign-out-cleanup";
import { consumeRecoveryNotice } from "@/lib/recovery-notice";
import { getEncryptionModeLabel, getLockedSummary, getRecoveryCompletedText, getSettingsSummary, type EncryptionMode } from "@/lib/encryption-mode";

function getSyncBannerMessage(syncConflict: boolean, syncErrorMessage: string | null) {
    if (syncConflict) {
        return "Sync conflict detected. Resolve in Settings.";
    }

    if (syncErrorMessage) {
        return `Sync needs attention: ${syncErrorMessage}`;
    }

    return "Sync needs attention. Check Settings for details.";
}

function ConnectivityBanners({
    showOfflineBanner,
    lastLocalSaveLabel,
    setOfflineBannerDismissed,
    showSyncBanner,
    syncBannerMessage,
    setSyncBannerDismissed,
    showPaymentsBanner,
    setPaymentsBannerDismissed,
}: Readonly<{
    showOfflineBanner: boolean;
    lastLocalSaveLabel: string | null;
    setOfflineBannerDismissed: (v: boolean) => void;
    showSyncBanner: boolean;
    syncBannerMessage: string;
    setSyncBannerDismissed: (v: boolean) => void;
    showPaymentsBanner: boolean;
    setPaymentsBannerDismissed: (v: boolean) => void;
}>) {
    return (
        <>
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
                            <span>{syncBannerMessage}</span>
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
        </>
    );
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <AppModeProvider>
            <AppBootstrapProvider>
                <AppShellFrame>{children}</AppShellFrame>
            </AppBootstrapProvider>
        </AppModeProvider>
    );
}

function getNewHouseholdError(households: Household[], newHouseholdName: string) {
    const trimmed = newHouseholdName.trim();
    if (!trimmed) {
        return "Enter a household name before you continue.";
    }

    const duplicateName = households.some((household) => household.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicateName) {
        return "That household name already exists. Choose a different label so the workspaces stay clear.";
    }

    return null;
}

function buildHousehold(name: string): Household {
    return {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
    };
}

function AppShellFrame({ children }: Readonly<{ children: React.ReactNode }>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { network, sync, syncErrorMessage, payments } = useAppConnectivity();
    const {
        households,
        effectiveSettings,
        localSnapshotReady,
        isReadyForPlanUI,
        resolvedPlanId,
        resolvedPlanLabel,
        subscriptionStatus,
        unlockStatus,
    } = useAppBootstrap();
    const [offlineBannerDismissed, setOfflineBannerDismissed] = React.useState(false);
    const [syncBannerDismissed, setSyncBannerDismissed] = React.useState(false);
    const [syncConflict] = React.useState(false);
    const [paymentsBannerDismissed, setPaymentsBannerDismissed] = React.useState(false);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [addHouseholdOpen, setAddHouseholdOpen] = React.useState(false);
    const [newHouseholdName, setNewHouseholdName] = React.useState("");
    const [addHouseholdError, setAddHouseholdError] = React.useState("");
    const [addingHousehold, setAddingHousehold] = React.useState(false);
    const [lastLocalSaveAt, setLastLocalSaveAt] = React.useState<number | null>(null);
    const previousNetworkRef = React.useRef(network);
    const settings = effectiveSettings;
    const activeHouseholdId = settings?.activeHouseholdId || "default";
    const multiHouseholdEnabled = resolvedPlanId ? canUseMultipleHouseholds(getPlanById(resolvedPlanId)) : false;

    React.useEffect(() => {
        if (network === "offline" && previousNetworkRef.current !== "offline") {
            setOfflineBannerDismissed(false);
        }
        previousNetworkRef.current = network;
    }, [network]);

    const paidFlowRequested = isPaidDashboardFlow({
        pathname,
        paidLoginParam: searchParams.get("paidLogin"),
        activationParam: searchParams.get("activation"),
        syncParam: searchParams.get("sync"),
    });

    React.useEffect(() => {
        if (!resolvedPlanId) {
            return;
        }

        if (!shouldRedirectFreeUserFromApp({
            pathname,
            planId: resolvedPlanId,
            settingsReady: localSnapshotReady && isReadyForPlanUI,
            paidFlowRequested,
            subscriptionStatus,
            unlockStatus,
            hasPendingReference: Boolean(readPendingBillingReference()),
        })) {
            return;
        }

        router.replace("/pricing");
    }, [isReadyForPlanUI, localSnapshotReady, paidFlowRequested, pathname, resolvedPlanId, router, subscriptionStatus, unlockStatus]);

    const showOfflineBanner = network === "offline" && !offlineBannerDismissed;
    const showSyncBanner = network === "online" && (sync === "error" || syncConflict) && !syncBannerDismissed;
    const showPaymentsBanner = network === "online" && payments === "unavailable" && !paymentsBannerDismissed;
    const syncBannerMessage = getSyncBannerMessage(syncConflict, syncErrorMessage);
    const lastLocalSaveLabel = lastLocalSaveAt
        ? new Intl.DateTimeFormat("en-ZA", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(lastLocalSaveAt)
        : null;
    const isDashboardShell = pathname === "/dashboard";
    const handleSwitchHousehold = async (householdId: string) => {
        setLastLocalSaveAt(Date.now());
        await setActiveHouseholdId(householdId);
        globalThis.location.reload();
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
        const nextError = getNewHouseholdError(households, newHouseholdName);
        if (nextError) {
            setAddHouseholdError(nextError);
            return;
        }

        const trimmed = newHouseholdName.trim();
        setAddingHousehold(true);
        setAddHouseholdError("");

        try {
            const household = buildHousehold(trimmed);
            await saveHousehold(household);
            await setActiveHouseholdId(household.id);
            setLastLocalSaveAt(Date.now());
            setAddHouseholdOpen(false);
            globalThis.location.reload();
        } catch (error) {
            console.error("Failed to add household", error);
            setAddHouseholdError("The household could not be created just now. Please try again.");
            setAddingHousehold(false);
        }
    };

    return (
        <div
            className="flex min-h-screen flex-col lg:grid lg:grid-cols-[var(--app-shell-width)_minmax(0,1fr)]"
            style={{ backgroundColor: "var(--bg)" }}
        >
            <div className="hidden lg:block">
                <SideDrawer
                    open={moreOpen}
                    onOpenChange={setMoreOpen}
                    showButton={false}
                    variant={isDashboardShell ? "dashboard" : "default"}
                    households={households}
                    activeHouseholdId={activeHouseholdId}
                    multiHouseholdEnabled={multiHouseholdEnabled}
                    onSwitchHousehold={handleSwitchHousehold}
                    onAddHousehold={handleAddHousehold}
                    employerName={settings?.employerName?.trim() || ""}
                    planLabel={isReadyForPlanUI ? resolvedPlanLabel : null}
                />
            </div>

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <header
                    className={`sticky top-0 z-50 border-b border-[var(--border)] safe-area-pt ${isDashboardShell
                        ? "bg-[color:var(--surface-sidebar)]/92 backdrop-blur-xl shadow-[0_10px_24px_rgba(16,24,40,0.06)]"
                        : "glass-panel shadow-[var(--shadow-sm)]"
                        }`}
                >
                    <div className={`content-container-wide flex w-full items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 ${isDashboardShell ? "py-2.5 sm:py-3" : "py-2 sm:py-3 lg:py-3"}`}>
                        <div className="flex items-center gap-2 sm:gap-3 lg:min-w-0">
                            <div className="lg:hidden">
                                <SideDrawer
                                    open={moreOpen}
                                    onOpenChange={setMoreOpen}
                                    showButton={true}
                                    variant={isDashboardShell ? "dashboard" : "default"}
                                    households={households}
                                    activeHouseholdId={activeHouseholdId}
                                    multiHouseholdEnabled={multiHouseholdEnabled}
                                    onSwitchHousehold={handleSwitchHousehold}
                                    onAddHousehold={handleAddHousehold}
                                    employerName={settings?.employerName?.trim() || ""}
                                    planLabel={isReadyForPlanUI ? resolvedPlanLabel : null}
                                />
                            </div>
                            <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-1.5 sm:px-2.5 py-1.5 sm:py-2 outline-none shadow-[0_6px_18px_rgba(16,24,40,0.05)] transition-all hover:border-[var(--primary)]/20 lg:hidden">
                                <Logo
                                    iconClassName="h-6 sm:h-9 w-6 sm:w-9"
                                    textClassName="text-[0.85rem] sm:text-[1.12rem]"
                                    className="gap-1.5 sm:gap-2.5"
                                />
                            </Link>
                            {isDashboardShell ? (
                                <div className="hidden min-w-0 items-center gap-3 lg:flex">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-raised)] text-[var(--primary)] shadow-[var(--shadow-sm)]">
                                        <LayoutDashboard className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Workspace</p>
                                        <h1 className="truncate text-xl font-black tracking-tight text-[var(--text)]">Dashboard</h1>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                            {network === "offline" && (
                                <span className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--focus)]/20 bg-[var(--primary)]/10 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-[var(--focus)]">
                                    <CloudOff className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> <span className="hidden sm:inline">Offline</span>
                                </span>
                            )}

                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                                <AccountMenu
                                    sync={sync}
                                    syncErrorMessage={syncErrorMessage}
                                    compact={isDashboardShell}
                                    planLabel={isReadyForPlanUI ? resolvedPlanLabel : null}
                                />
                                {isDashboardShell ? null : (
                                    <HouseholdSwitcher
                                        households={households}
                                        activeId={activeHouseholdId}
                                        isPro={multiHouseholdEnabled}
                                        onSwitch={handleSwitchHousehold}
                                        onAddHousehold={handleAddHousehold}
                                        variant="account"
                                        className="hidden lg:block"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <ConnectivityBanners
                    showOfflineBanner={showOfflineBanner}
                    lastLocalSaveLabel={lastLocalSaveLabel}
                    setOfflineBannerDismissed={setOfflineBannerDismissed}
                    showSyncBanner={showSyncBanner}
                    syncBannerMessage={syncBannerMessage}
                    setSyncBannerDismissed={setSyncBannerDismissed}
                    showPaymentsBanner={showPaymentsBanner}
                    setPaymentsBannerDismissed={setPaymentsBannerDismissed}
                />
                <RecoveryNoticeBanner />

                <main
                    id="main-content"
                    className={`app-cq-root mobile-app-main flex w-full flex-1 flex-col ${isDashboardShell
                        ? "content-container-wide min-w-0 gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:gap-6 lg:px-6 lg:py-6 xl:px-8"
                        : "content-container-wide min-w-0 gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:gap-8 lg:px-8 lg:py-8"
                        }`}
                >
                    <RecoveryGate>
                        {children}
                    </RecoveryGate>
                </main>
            </div>

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
                onSubmit={() => handleConfirmAddHousehold()}
            />
            <BottomNav onMore={() => setMoreOpen(true)} />
        </div>
    );
}

function RecoveryNoticeBanner() {
    const [noticeMode, setNoticeMode] = React.useState<EncryptionMode | null>(null);

    React.useEffect(() => {
        const notice = consumeRecoveryNotice();
        if (!notice) {
            return;
        }

        setNoticeMode(notice.mode);
    }, []);

    if (!noticeMode) {
        return null;
    }

    return (
        <div className="content-container-wide px-3 pt-3 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-3 text-sm text-[var(--text)] shadow-[var(--shadow-sm)]">
                <p className="font-semibold text-[var(--primary)]">{getEncryptionModeLabel(noticeMode)}</p>
                <p className="mt-1 text-[var(--text-muted)]">{getRecoveryCompletedText(noticeMode)}</p>
            </div>
        </div>
    );
}

function getAccountSyncStatus(mode: string, encryptionMode: EncryptionMode | null, sync: string, syncErrorMessage: string | null) {
    if (mode === "account_locked") {
        return {
            state: "Account Locked",
            summary: getLockedSummary(encryptionMode),
            toneClass: "text-[var(--warning)]",
        };
    }
    
    if (mode === "account_unlocked") {
        if (sync === "error") {
            return {
                state: "Sync needs attention",
                summary: syncErrorMessage ?? "Your account is connected, but the latest cloud backup hit a problem. Open Settings > Storage & backup.",
                toneClass: "text-[var(--danger)]",
            };
        }
        if (sync === "reconnecting") {
            return {
                state: "Sync reconnecting",
                summary: "Your account is connected. Cloud backup will resume once this device is back online.",
                toneClass: "text-[var(--primary)]",
            };
        }
        return {
            state: encryptionMode ? getEncryptionModeLabel(encryptionMode) : "Cloud Sync Active",
            summary: encryptionMode ? getSettingsSummary(encryptionMode) : "Your data is securely encrypted and synced to the cloud.",
            toneClass: "text-[var(--primary)]",
        };
    }

    return {
        state: "Local mode",
        summary: "Your data is stored securely on this device. No cloud sync.",
        toneClass: "text-[var(--text)]",
    };
}

function AccountMenu({
    sync,
    syncErrorMessage,
    compact = false,
    planLabel,
}: Readonly<{
    sync: "disabled" | "enabled" | "error" | "reconnecting";
    syncErrorMessage: string | null;
    compact?: boolean;
    planLabel: string | null;
}>) {
    const [open, setOpen] = React.useState(false);
    const [signingOut, setSigningOut] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    const supabase = React.useMemo(() => createClient(), []);
    const { user } = useAuthState();
    const { theme, resolvedTheme, setTheme } = useUI();
    const themeOptions = [
        { value: "system" as const, label: "System", icon: Monitor },
        { value: "light" as const, label: "Light", icon: Sun },
        { value: "dark" as const, label: "Dark", icon: Moon },
    ];

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

    const { mode, encryptionMode, lockAccount } = useAppMode();
    const accountEmail = user?.email ?? "";

    const { state: accountState, summary: accountSummary, toneClass: accountToneClass } = getAccountSyncStatus(mode, encryptionMode, sync, syncErrorMessage);
    let compactDesktopSummary = accountSummary;
    if (encryptionMode === "maximum_privacy") {
        compactDesktopSummary = "Recovery key required for restore.";
    } else if (encryptionMode === "recoverable") {
        compactDesktopSummary = "Encrypted and recoverable.";
    }

    const handleSignOut = React.useCallback(async () => {
        if (signingOut) return;
        setSigningOut(true);

        try {
            clearVerifiedEntitlementsCache();
            lockAccount();

            await supabase.auth.signOut().catch((e) =>
                console.warn("Supabase signOut call failed; proceeding with local cleanup.", e),
            );

            // Clear all locally persisted user data — paid users' data is
            // cloud-secured and must not remain on the device.
            await clearAllUserDataOnSignOut().catch((e) =>
                console.warn("Could not clear local data during sign-out.", e),
            );
        } catch (error) {
            console.error("Sign out failed", error);
        } finally {
            // Always navigate to login — sign-out must never leave the user stranded.
            setOpen(false);
            setSigningOut(false);
            router.push("/login");
            router.refresh();
        }
    }, [lockAccount, router, signingOut, supabase.auth]);

    return (
        <>
            <div className="relative" ref={menuRef}>
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    data-testid="account-menu-toggle"
                    className={`flex items-center gap-2 rounded-xl border border-[var(--border)]/80 bg-[var(--surface-raised)] shadow-[var(--shadow-sm)] active-scale transition-all hover:border-[var(--primary)]/25 ${compact
                        ? "min-h-[60px] px-2.5 py-2 sm:rounded-xl"
                        : "min-h-[52px] px-2.5 py-2 sm:rounded-2xl sm:px-3.5"
                        }`}
                >
                    <div className={`flex items-center justify-center bg-[var(--surface-2)] text-[var(--primary)] shrink-0 ${compact ? "h-8 w-8 rounded-xl" : "h-7 w-7 rounded-lg sm:h-8 sm:w-8 sm:rounded-xl"}`}>
                        <CircleUserRound className="h-4 w-4" />
                    </div>
                    <div className={`text-left min-w-0 ${compact ? "hidden xl:block max-w-[180px]" : "hidden sm:block max-w-[200px]"}`}>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] leading-none mb-0.5">Account</p>
                        <p className={`text-xs font-semibold truncate ${accountToneClass}`}>{accountState}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)] truncate">
                            {accountEmail || "Signed in"}
                        </p>
                        {planLabel ? (
                            <p className="mt-0.5 text-[11px] font-semibold text-[var(--text-muted)] truncate">
                                {planLabel} plan
                            </p>
                        ) : (
                            <div className="mt-1 h-3 w-20 animate-pulse rounded-full bg-[var(--surface-2)]" />
                        )}
                    </div>
                    <ChevronDown className={`h-3 w-3 text-[var(--text-muted)] shrink-0 ${compact ? "hidden xl:block" : "hidden sm:block"}`} />
                </button>

                {open && (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 flex max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[0_18px_48px_rgba(16,24,40,0.14)] lg:w-[min(34rem,calc(100vw-2rem))]">
                        <div className="-mr-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)]">
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Current setup</p>
                                    <p className={`mt-1 text-sm font-semibold ${accountToneClass}`}>{accountState}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                                        {accountEmail ? `Signed in as ${accountEmail}` : "Signed-in account email unavailable on this device."}
                                    </p>
                                    {planLabel ? (
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--text-muted)]">{planLabel} plan</p>
                                    ) : (
                                        <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-[var(--surface-1)]" />
                                    )}
                                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)] lg:hidden">{accountSummary}</p>
                                    <p className="mt-1 hidden text-xs leading-relaxed text-[var(--text-muted)] lg:block">{compactDesktopSummary}</p>
                                </div>

                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/45 p-3">
                                    {encryptionMode ? (
                                        <div className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-xs leading-6 text-[var(--text-muted)]">
                                            <span className="font-semibold text-[var(--text)]">{getEncryptionModeLabel(encryptionMode)}</span>
                                            <span className="lg:hidden">{` - ${getSettingsSummary(encryptionMode)}`}</span>
                                            <p className="hidden lg:block">{getSettingsSummary(encryptionMode)}</p>
                                        </div>
                                    ) : null}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Theme</p>
                                            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                                                {theme === "system" ? `Following system (${resolvedTheme} now)` : `Using ${theme} mode`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1 rounded-2xl bg-[var(--surface-1)] p-1">
                                        {themeOptions.map(({ value, label, icon: Icon }) => {
                                            const active = theme === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    aria-pressed={active}
                                                    onClick={() => setTheme(value)}
                                                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all"
                                                    style={{
                                                        backgroundColor: active ? "var(--surface-raised)" : "transparent",
                                                        color: active ? "var(--primary)" : "var(--text-muted)",
                                                        boxShadow: active ? "var(--shadow-sm)" : "none",
                                                    }}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    <span>{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid gap-1 lg:grid-cols-2">
                                {ACCOUNT_MENU_LINKS.map((link, index) => (
                                    <MenuLink
                                        key={link.href}
                                        href={link.href}
                                        icon={link.icon}
                                        label={link.label}
                                        sublabel={link.sublabel || ""}
                                        className={index === ACCOUNT_MENU_LINKS.length - 1 ? "lg:col-span-2" : ""}
                                        onNavigate={() => setOpen(false)}
                                    />
                                ))}
                            </div>

                            <div className="mt-3 border-t border-[var(--border)] pt-3">
                                <button
                                    type="button"
                                    disabled={signingOut}
                                    onClick={() => { handleSignOut().catch(console.error); }}
                                    className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
                                >
                                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--danger-soft)] text-[var(--danger)]">
                                        {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text)]">Sign out</p>
                                        <p className="text-xs leading-relaxed text-[var(--text-muted)]">Ends your session and clears local data. Your records are safe in the cloud.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </>
    );
}

function MenuLink({
    href,
    icon: Icon,
    label,
    sublabel,
    className = "",
    onNavigate,
}: Readonly<{
    href: string;
    icon: React.ElementType;
    label: string;
    sublabel: string;
    className?: string;
    onNavigate: () => void;
}>) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-[var(--surface-2)] ${className}`}
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
