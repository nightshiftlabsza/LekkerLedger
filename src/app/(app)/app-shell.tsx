"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { GlobalCreateDesktop, GlobalCreateFAB } from "@/components/global-create";
import { CloudOff, X, AlertOctagon, CreditCard } from "lucide-react";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { ToastProvider } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";
import { getHouseholds, getSettings, saveHousehold, setActiveHouseholdId, subscribeToDataChanges } from "@/lib/storage";
import { Household } from "@/lib/schema";
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

    React.useEffect(() => {
        if (network === "online") setOfflineBannerDismissed(false);
    }, [network]);

    React.useEffect(() => {
        async function loadShellContext() {
            const [loadedHouseholds, settings] = await Promise.all([getHouseholds(), getSettings()]);
            setHouseholds(loadedHouseholds);
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
                            <Link href="/dashboard" className="lg:hidden flex items-center gap-2 outline-none hover:opacity-90 transition-opacity">
                                <Logo />
                            </Link>
                            <div className="hidden lg:flex items-center gap-4">
                                <div className="border-r border-[var(--border)] pr-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                        Workspace
                                    </p>
                                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                        Household payroll
                                    </p>
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
                                <span>Google Drive sync failed. Reconnect Drive in Settings.</span>
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
