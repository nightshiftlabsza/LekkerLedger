"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Home, Mail, Menu, Plus, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { APP_NAV_GROUPS } from "@/src/config/app-nav";
import { HouseholdSwitcher } from "@/components/household-switcher";

interface SideDrawerProps {
    readonly showButton?: boolean;
    readonly open?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
    readonly variant?: "default" | "dashboard";
    readonly households?: ReadonlyArray<{ readonly id: string; readonly name: string }>;
    readonly activeHouseholdId?: string;
    readonly multiHouseholdEnabled?: boolean;
    readonly onSwitchHousehold?: (id: string) => void;
    readonly onAddHousehold?: () => void;
    readonly employerName?: string;
    readonly planLabel?: string | null;
}

interface DrawerContentProps {
    readonly mobile: boolean;
    readonly dashboardVariant: boolean;
    readonly activeHouseholdId?: string;
    readonly employerName: string;
    readonly households: ReadonlyArray<{ readonly id: string; readonly name: string }>;
    readonly isActive: (href: string) => boolean;
    readonly multiHouseholdEnabled: boolean;
    readonly onAddHousehold?: () => void;
    readonly onClose?: () => void;
    readonly onSwitchHousehold?: (id: string) => void;
    readonly planLabel?: string | null;
    readonly closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

function DrawerHeader({
    mobile,
    onClose,
    closeButtonRef,
}: Readonly<{
    mobile: boolean;
    onClose?: () => void;
    closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
}>) {
    return (
        <div
            className={`flex items-center justify-between border-b border-[var(--border)] px-4 ${mobile ? "safe-area-pt pb-4 pt-3" : "pb-4 pt-5"} shrink-0`}
        >
            <Link href="/dashboard" onClick={onClose} className="block rounded-lg py-1">
                <Logo />
            </Link>

            {mobile ? (
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close menu"
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all hover:bg-[var(--surface-2)] active-scale"
                >
                    <X className="h-4 w-4" />
                </button>
            ) : null}
        </div>
    );
}

function HouseholdSection({
    mobile,
    activeHouseholdId,
    households,
    multiHouseholdEnabled,
    onAddHousehold,
    onClose,
    onSwitchHousehold,
}: Readonly<{
    mobile: boolean;
    activeHouseholdId?: string;
    households: ReadonlyArray<{ readonly id: string; readonly name: string }>;
    multiHouseholdEnabled: boolean;
    onAddHousehold?: () => void;
    onClose?: () => void;
    onSwitchHousehold?: (id: string) => void;
}>) {
    if (!activeHouseholdId || households.length === 0 || !onSwitchHousehold) return null;

    if (!mobile) {
        return (
            <div className="px-4 pb-3 pt-3">
                <HouseholdSwitcher
                    households={households}
                    activeId={activeHouseholdId}
                    isPro={multiHouseholdEnabled}
                    onSwitch={onSwitchHousehold}
                    onAddHousehold={onAddHousehold}
                    variant="account"
                />
            </div>
        );
    }

    return (
        <section className="border-b border-[var(--border)] px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Households</p>
            <div className="mt-3 space-y-2">
                {households.map((household) => {
                    const active = household.id === activeHouseholdId;
                    return (
                        <button
                            key={household.id}
                            type="button"
                            onClick={() => {
                                onClose?.();
                                onSwitchHousehold(household.id);
                            }}
                            className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors"
                            style={{
                                borderColor: active ? "color-mix(in srgb, var(--primary) 26%, var(--border))" : "var(--border)",
                                backgroundColor: active ? "color-mix(in srgb, var(--primary) 8%, var(--surface-raised))" : "var(--surface-1)",
                            }}
                        >
                            <span className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
                                    <Home className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-[var(--text)]">{household.name}</span>
                                    <span className="block text-xs text-[var(--text-muted)]">
                                        {active ? "Current household" : "Switch household"}
                                    </span>
                                </span>
                            </span>
                            {active ? <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" /> : null}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => {
                        onClose?.();
                        onAddHousehold?.();
                    }}
                    className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: multiHouseholdEnabled ? "var(--primary)" : "var(--text-muted)" }}
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)]">
                        {multiHouseholdEnabled ? <Plus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </span>
                    <span>
                        <span className="block text-sm font-semibold">{multiHouseholdEnabled ? "Add household" : "Add household (Pro)"}</span>
                        <span className="block text-xs">
                            {multiHouseholdEnabled ? "Create another workspace from the menu." : "Upgrade to add more than one household."}
                        </span>
                    </span>
                </button>
            </div>
        </section>
    );
}

function NavigationLinks({
    dashboardVariant,
    isActive,
    mobile,
    onClose,
}: Readonly<{
    dashboardVariant: boolean;
    isActive: (href: string) => boolean;
    mobile: boolean;
    onClose?: () => void;
}>) {
    return (
        <nav className={`space-y-5 ${mobile ? "px-4 py-4" : "px-3 py-4"}`}>
            {APP_NAV_GROUPS.map((group) => (
                <div key={group.label}>
                    <p className="mb-2 px-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {group.label}
                    </p>

                    <div className="space-y-1">
                        {group.links.map(({ href, label, sublabel, icon: Icon }) => {
                            const active = isActive(href);
                            let backgroundColor = "transparent";
                            if (active) {
                                backgroundColor = dashboardVariant
                                    ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                                    : "var(--accent-subtle)";
                            }

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={onClose}
                                    className={`group relative flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-150 ${dashboardVariant ? "hover:bg-[var(--surface-raised)]/85" : "hover:bg-[var(--surface-2)]"}`}
                                    style={{
                                        color: active ? "var(--primary)" : "var(--text)",
                                        backgroundColor,
                                        fontWeight: active ? 700 : 500,
                                    }}
                                >
                                    {active ? (
                                        <span
                                            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full"
                                            style={{ backgroundColor: "var(--primary)" }}
                                        />
                                    ) : null}

                                    <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-[var(--shadow-sm)]"
                                        style={{
                                            backgroundColor: active ? "var(--primary)" : "var(--surface-raised)",
                                            color: active ? "#ffffff" : "var(--primary)",
                                        }}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block leading-snug">{label}</span>
                                        {sublabel ? (
                                            <span className="mt-0.5 block text-xs leading-5 text-[var(--text-muted)]">
                                                {sublabel}
                                            </span>
                                        ) : null}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}

function DrawerFooter({
    dashboardVariant,
    employerName,
    mobile,
    planLabel,
}: Readonly<{
    dashboardVariant: boolean;
    employerName: string;
    mobile: boolean;
    planLabel?: string | null;
}>) {
    return (
        <>
            <div className={`shrink-0 border-t border-[var(--border)] ${mobile ? "px-4 py-4" : "px-4 py-4"}`}>
                <a
                    href="mailto:support@lekkerledger.co.za?subject=LekkerLedger%20Support%20Request"
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: "var(--text-muted)" }}
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--primary)] text-white">
                        <Mail className="h-3.5 w-3.5" />
                    </div>
                    Email Support
                </a>
            </div>

            {dashboardVariant ? (
                <div className={`shrink-0 border-t border-[var(--border)] px-5 pt-3 ${mobile ? "safe-area-pb pb-5" : "pb-5"}`}>
                    <div className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Current workspace</p>
                        <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{employerName || "Household payroll"}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{planLabel || "Plan loading"}</p>
                    </div>
                </div>
            ) : mobile ? <div className="safe-area-pb" /> : null}
        </>
    );
}

function DrawerContent({
    mobile,
    dashboardVariant,
    activeHouseholdId,
    employerName,
    households,
    isActive,
    multiHouseholdEnabled,
    onAddHousehold,
    onClose,
    onSwitchHousehold,
    planLabel,
    closeButtonRef,
}: DrawerContentProps) {
    const shellClassName = dashboardVariant ? "" : "glass-panel";

    return (
        <div
            className={`flex h-full min-h-0 w-full flex-col ${shellClassName}`.trim()}
            style={{
                backgroundColor: dashboardVariant ? "var(--surface-sidebar)" : "var(--bg)",
                backdropFilter: dashboardVariant ? "blur(18px)" : "blur(12px)",
                WebkitBackdropFilter: dashboardVariant ? "blur(18px)" : "blur(12px)",
            }}
        >
            <DrawerHeader mobile={mobile} onClose={onClose} closeButtonRef={closeButtonRef} />

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {dashboardVariant ? (
                    <HouseholdSection
                        mobile={mobile}
                        activeHouseholdId={activeHouseholdId}
                        households={households}
                        multiHouseholdEnabled={multiHouseholdEnabled}
                        onAddHousehold={onAddHousehold}
                        onClose={onClose}
                        onSwitchHousehold={onSwitchHousehold}
                    />
                ) : null}

                <NavigationLinks
                    dashboardVariant={dashboardVariant}
                    isActive={isActive}
                    mobile={mobile}
                    onClose={onClose}
                />
            </div>

            <DrawerFooter
                dashboardVariant={dashboardVariant}
                employerName={employerName}
                mobile={mobile}
                planLabel={planLabel}
            />
        </div>
    );
}

export function SideDrawer({
    showButton = true,
    open: controlledOpen,
    onOpenChange,
    variant = "default",
    households = [],
    activeHouseholdId,
    multiHouseholdEnabled = false,
    onSwitchHousehold,
    onAddHousehold,
    employerName = "",
    planLabel = null,
}: SideDrawerProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const dashboardVariant = variant === "dashboard";
    const pathname = usePathname();
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const mobileDialogId = React.useId();

    const isActive = React.useCallback((href: string) => {
        const hrefPath = href.split("?")[0];
        if (hrefPath === "/") return pathname === "/";
        return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
    }, [pathname]);

    return (
        <>
            {showButton ? (
                <button
                    ref={triggerRef}
                    type="button"
                    aria-label="Open menu"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-controls={mobileDialogId}
                    onClick={() => setOpen(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--surface-2)] active-scale lg:hidden"
                >
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            ) : null}

            <aside className="app-shell-drawer hidden h-full flex-col border-r border-[var(--border)] shadow-none lg:flex">
                <DrawerContent
                    mobile={false}
                    dashboardVariant={dashboardVariant}
                    activeHouseholdId={activeHouseholdId}
                    employerName={employerName}
                    households={households}
                    isActive={isActive}
                    multiHouseholdEnabled={multiHouseholdEnabled}
                    onAddHousehold={onAddHousehold}
                    onSwitchHousehold={onSwitchHousehold}
                    planLabel={planLabel}
                />
            </aside>

            <MobileSheet
                open={open}
                onOpenChange={setOpen}
                ariaLabel="Navigation"
                position="left"
                panelClassName="app-shell-drawer"
                initialFocusRef={closeButtonRef}
                returnFocusRef={triggerRef}
                testId="mobile-side-drawer"
            >
                <div id={mobileDialogId} className="h-full min-h-0 w-full safe-area-pr">
                    <DrawerContent
                        mobile={true}
                        dashboardVariant={dashboardVariant}
                        activeHouseholdId={activeHouseholdId}
                        employerName={employerName}
                        households={households}
                        isActive={isActive}
                        multiHouseholdEnabled={multiHouseholdEnabled}
                        onAddHousehold={onAddHousehold}
                        onClose={() => setOpen(false)}
                        onSwitchHousehold={onSwitchHousehold}
                        planLabel={planLabel}
                        closeButtonRef={closeButtonRef}
                    />
                </div>
            </MobileSheet>
        </>
    );
}
