"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowRight, AlertTriangle,
    FileText, FolderOpen,
    BookOpen, ChevronRight, Banknote,
    ShieldCheck, UserPlus, Settings,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton, StatSkeleton } from "@/components/ui/loading-skeleton";
import { SyncStatusBadge, type SyncState as SyncBadgeState } from "@/components/ui/sync-status-badge";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { getEmployees, getSettings, getCurrentPayPeriod, getDocuments, getLatestPayslip, subscribeToDataChanges, getPayPeriods } from "@/lib/storage";
import { filterRecordsForArchiveWindow, isUploadedDocument } from "@/lib/archive";
import { computeDashboardAlerts, type DashboardAlert as DashboardAlertData } from "@/lib/alerts";
import { confirmBillingTransaction } from "@/lib/billing-client";
import { getUserPlan } from "@/lib/entitlements";
import { clearPendingBillingHandoff, readPendingBillingReference, writePendingBillingReference } from "@/lib/billing-handoff";
import { buildPaidDashboardHref, PAID_LOGIN_SUCCESS_QUERY } from "@/lib/paid-activation";
import { Employee, PayPeriod, EmployerSettings, DocumentMeta, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { InlinePlanCheckoutButton } from "@/components/billing/inline-paid-plan-checkout";


interface EmployeeSummary {
    employee: Employee;
    latestPayslip: PayslipInput | null;
    netPay: number | null;
}

function DashboardContent() {
    const router = useRouter();
    const { network, sync } = useAppConnectivity();
    const [loading, setLoading] = React.useState(true);
    const [activationError, setActivationError] = React.useState<string | null>(null);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [currentPeriod, setCurrentPeriod] = React.useState<PayPeriod | null>(null);
    const [recentDocs, setRecentDocs] = React.useState<DocumentMeta[]>([]);
    const [summaries, setSummaries] = React.useState<EmployeeSummary[]>([]);
    const [allPeriods, setAllPeriods] = React.useState<PayPeriod[]>([]);
    const searchParams = useSearchParams();
    const paidLoginRequested = searchParams.get("paidLogin") === "1";
    const paymentReference = searchParams.get("reference")?.trim() || readPendingBillingReference() || "";


    const activationSuccess = searchParams.get("activation") === "paid-login-success";
    const activationSync = searchParams.get("sync");

    React.useEffect(() => {
        if (!paidLoginRequested) return;

        let active = true;

        async function completePaidLogin() {
            if (!paymentReference) {
                if (active) {
                    setActivationError("We could not find your payment reference. Please log in again from the payment handoff.");
                }
                return;
            }

            writePendingBillingReference(paymentReference);
            setActivationError(null);

            try {
                const account = await confirmBillingTransaction(paymentReference);
                const hasPaidAccess = account.entitlements.planId !== "free"
                    && account.entitlements.isActive;

                if (!hasPaidAccess) {
                    throw new Error(account.account.lastError || "Your payment was found, but paid access is not active yet.");
                }

                clearPendingBillingHandoff();
                window.location.replace(buildPaidDashboardHref({ activation: PAID_LOGIN_SUCCESS_QUERY }));
            } catch (error) {
                if (!active) return;
                setActivationError(error instanceof Error ? error.message : "Paid activation could not be completed.");
            }
        }

        void completePaidLogin();

        return () => {
            active = false;
        };
    }, [paidLoginRequested, paymentReference]);

    React.useEffect(() => {
        if (paidLoginRequested) return;

        let active = true;
        async function load() {
            if (active) {
                setLoading(true);
            }
            const [emps, s, period, docs, allP] = await Promise.all([
                getEmployees(),
                getSettings(),
                getCurrentPayPeriod(),
                getDocuments(),
                getPayPeriods(),
            ]);

            // Build employee summaries for alert engine
            const results: EmployeeSummary[] = [];
            for (const emp of emps) {
                const latest = await getLatestPayslip(emp.id);
                let netPay: number | null = null;
                if (latest) netPay = calculatePayslip(latest).netPay;
                results.push({ employee: emp, latestPayslip: latest, netPay });
            }

            if (!active) return;
            const plan = getUserPlan(s);
            const visibleRecentDocs = filterRecordsForArchiveWindow(docs, plan, (doc) => doc.createdAt, {
                alwaysVisible: isUploadedDocument,
            }).visible;
            setEmployees(emps);
            setSettings(s);
            setCurrentPeriod(period);
            setAllPeriods(allP);
            setRecentDocs(visibleRecentDocs.slice(0, 5));
            setSummaries(results);
            setLoading(false);
        }
        load();

        const unsubscribe = subscribeToDataChanges(load);
        return () => {
            active = false;
            unsubscribe();
        };
    }, [paidLoginRequested]);

    if (paidLoginRequested) {
        return (
            <>
                <PageHeader title="Dashboard" subtitle="Completing your setup." />
                {activationError ? (
                    <Card className="max-w-2xl border-[var(--danger-border)] bg-[var(--danger-soft)]">
                        <CardContent className="space-y-4 p-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
                                <div className="space-y-2">
                                    <p className="text-base font-bold text-[var(--text)]">Paid activation needs attention</p>
                                    <p className="text-sm leading-6 text-[var(--text-muted)]">{activationError}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button onClick={() => router.refresh()} className="sm:w-auto">
                                    Try again
                                </Button>
                                <Link href="/pricing" className="sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        View plans
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <p className="text-sm text-[var(--text-muted)]">Completing your setup...</p>
                )}
            </>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Dashboard" subtitle="Loading your household overview..." />
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8 space-y-6">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <StatSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    const employeeCount = employees.length;
    const completedEntries = currentPeriod?.entries.filter(e => e.status === "complete").length ?? 0;
    const totalEntries = currentPeriod?.entries.length ?? 0;
    const progressPercent = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
    const currentMonth = format(new Date(), "MMMM yyyy");

    // Alert engine
    const now = new Date();
    const alerts = computeDashboardAlerts({ employees, summaries, settings, now });

    const isSetupIncomplete = employeeCount === 0;
    const isPayrollStarted = !!currentPeriod;
    const isPayrollReady = completedEntries === totalEntries && totalEntries > 0 && currentPeriod?.status !== "review";
    const isPayrollInReview = currentPeriod?.status === "review";
    const syncBadgeState: SyncBadgeState = sync === "enabled"
        ? "synced"
        : sync === "error"
            ? "error"
            : sync === "reconnecting"
                ? "offline"
                : "disconnected";
    const syncSummary = sync === "enabled"
        ? "Cloud sync is active on this device."
        : sync === "error"
            ? "Sync needs attention in Settings."
            : network === "offline"
                ? "Offline. Sync will resume when the connection returns."
                : "Cloud sync is not active on this device yet.";

    return (
        <div className="pb-8 space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle={isSetupIncomplete ? "Let's get your household payroll set up." : "Manage your monthly payroll and records."}
            />

            {activationSuccess && <ActivationAlert syncState={activationSync} />}

            <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Left Column: Primary Focus */}
                <div className="lg:col-span-8 space-y-6">
                    {/* 1. Primary Task Hero */}
                    <PrimaryTaskHero
                        currentPeriod={currentPeriod}
                        isSetupIncomplete={isSetupIncomplete}
                        isPayrollReady={isPayrollReady}
                        isPayrollInReview={isPayrollInReview}
                        progressPercent={progressPercent}
                        completedEntries={completedEntries}
                        totalEntries={totalEntries}
                        currentMonth={currentMonth}
                        allPeriods={allPeriods}
                    />

                    {/* 3. Next-Steps Checklist (Only if setup is incomplete or no payroll) */}
                    {(isSetupIncomplete || !isPayrollStarted) && (
                        <OnboardingChecklist
                            employeeCount={employeeCount}
                            isPayrollStarted={isPayrollStarted}
                            settings={settings}
                        />
                    )}

                    {/* 2. Compact Household Snapshot (Mobile only, stacks below hero) */}
                    <div className="lg:hidden">
                        <HouseholdSnapshot
                            employeeCount={employeeCount}
                            documentCount={recentDocs.length}
                            syncBadgeState={syncBadgeState}
                            syncSummary={syncSummary}
                        />
                    </div>

                    {/* Quick Access — mobile only (appears early, before alerts) */}
                    <div className="lg:hidden">
                        <QuickActions />
                    </div>

                    {/* Alert banners */}
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <DashboardAlert key={alert.id} alert={alert} />
                        ))}
                    </div>

                    {/* 5. Recent Records Area */}
                    <RecentRecordsArea recentDocs={recentDocs} hasEmployees={employeeCount > 0} />
                </div>

                {/* Right Column: Supporting Info (desktop only) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* 2. Compact Household Snapshot (Desktop) */}
                    <div className="hidden lg:block">
                        <HouseholdSnapshot
                            employeeCount={employeeCount}
                            documentCount={recentDocs.length}
                            syncBadgeState={syncBadgeState}
                            syncSummary={syncSummary}
                        />
                    </div>

                    {/* 4. Quick Access Block (desktop only — mobile version is above) */}
                    <div className="hidden lg:block">
                        <QuickActions />
                    </div>

                    {/* Upgrade nudge for free users */}
                    {getUserPlan(settings).id === "free" && (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3 sm:p-4 space-y-2">
                            <p className="text-xs font-semibold text-[var(--text)]">Standard adds 2 more workers, encrypted sync, and leave tracking — R29/month.</p>
                            <InlinePlanCheckoutButton
                                planId="standard"
                                billingCycle="monthly"
                                variant="link"
                                className="h-auto min-h-0 px-0 py-0 text-xs font-bold"
                            >
                                <>
                                    Upgrade to Standard <ArrowRight className="h-3 w-3" />
                                </>
                            </InlinePlanCheckoutButton>
                        </div>
                    )}

                    {/* 6. Advanced/Annual (Quiet) */}
                    <div className="pt-2">
                        <ComplianceCard />
                    </div>

                    {/* Help & Support */}
                    <div className="pt-4 border-t border-[var(--border)]">
                        <Link href="/resources/checklists" className="group flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                            <div className="p-1.5 rounded-lg bg-[var(--surface-2)] group-hover:bg-[var(--primary)]/10 transition-colors">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            Help &amp; Support
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActivationAlert({ syncState }: { syncState: string | null }) {
    const backupLabel = "not yet";

    return (
        <Card className="overflow-hidden border-2 border-[var(--primary)] bg-[var(--surface-raised)] shadow-lg">
            <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-3 text-[var(--primary)]">
                    <div className="rounded-full bg-[var(--primary)]/10 p-2">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black italic tracking-tight">Paid login activated</h3>
                </div>
                <p className="text-sm font-medium leading-relaxed text-[var(--text-muted)]">
                    {syncState === "none"
                        ? "Paid login is complete. No data snapshot was required yet on this device."
                        : `Last backup: ${backupLabel}.`}
                </p>
            </CardContent>
        </Card>
    );
}

function PrimaryTaskHero({
    currentPeriod,
    isSetupIncomplete,
    isPayrollReady,
    isPayrollInReview,
    progressPercent,
    completedEntries,
    totalEntries,
    currentMonth,
    allPeriods,
}: {
    currentPeriod: PayPeriod | null;
    isSetupIncomplete: boolean;
    isPayrollReady: boolean;
    isPayrollInReview: boolean;
    progressPercent: number;
    completedEntries: number;
    totalEntries: number;
    currentMonth: string;
    allPeriods: PayPeriod[];
}) {
    const latestPeriod = allPeriods[0];
    const isLatestLocked = latestPeriod?.status === "locked";
    const isLatestCurrentMonth = latestPeriod?.name === currentMonth;

    const title = currentPeriod
        ? isPayrollInReview
            ? `${currentPeriod.name} — Review in progress`
            : isPayrollReady
                ? `${currentPeriod.name} is ready`
                : `${currentPeriod.name} in progress`
        : isLatestLocked && isLatestCurrentMonth
            ? `${currentMonth} finalised`
            : isSetupIncomplete
                ? "Welcome to LekkerLedger"
                : `Set up ${currentMonth}`;

    const subtitle = currentPeriod
        ? isPayrollInReview
            ? "This pay run is in the review stage. Open it to finalise and generate payslips."
            : isPayrollReady
                ? "All employee entries are complete. You can now finalise this month and generate payslips."
                : `You have completed ${completedEntries} of ${totalEntries} entries. Finish the rest to finalise payroll.`
        : isLatestLocked && isLatestCurrentMonth
            ? `Payroll for ${currentMonth} is complete and locked. You can view all generated records in the Documents Hub.`
            : isSetupIncomplete
                ? "Welcome to LekkerLedger. Let's get your household payroll set up—starting with your employer details and first employee."
                : `Start the ${currentMonth} pay period to track hours and generate payslips for your household.`;

    const primaryActionHref = currentPeriod
        ? `/payroll/${currentPeriod.id}`
        : isLatestLocked && isLatestCurrentMonth
            ? "/documents"
            : isSetupIncomplete
                ? "/settings"
                : "/payroll/new";

    const primaryActionLabel = currentPeriod
        ? isPayrollInReview ? "Review & Finalise" : isPayrollReady ? "Review & Finalise" : "Continue Payroll"
        : isLatestLocked && isLatestCurrentMonth
            ? "View Documents"
            : isSetupIncomplete ? "Start Setup" : `Start ${currentMonth}`;

    return (
        <Card className="relative overflow-hidden border-none shadow-premium bg-[var(--surface-raised)] group">
            {/* Subtle background pattern/gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent opacity-50" />

            <CardContent className="relative space-y-4 p-4 sm:p-6 md:p-8">
                <div className="space-y-2">
                    <p className="type-overline text-[var(--primary)] flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                        {currentPeriod ? "Current Pay Period" : "Getting Started"}
                    </p>
                    <div className="max-w-2xl">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[var(--text)] mb-1.5 leading-tight">
                            {title}
                        </h2>
                        <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-medium">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {currentPeriod && (
                    <div className="max-w-md space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            <span>Progress</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)] shadow-inner">
                            <div
                                className="h-full rounded-full bg-[var(--primary)] transition-all duration-700 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                    <Link href={primaryActionHref} className="sm:w-auto">
                        <Button className="w-full sm:w-auto h-11 px-5 gap-2 rounded-xl bg-[var(--primary)] font-bold text-white hover:bg-[var(--primary-hover)] shadow-lg shadow-[var(--primary)]/20 transition-all active:scale-[0.98]">
                            {primaryActionLabel}
                            <ArrowRight className="h-4 w-4 shrink-0" />
                        </Button>
                    </Link>
                    {!isSetupIncomplete && (
                        <Link href="/employees" className="sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-11 px-5 gap-2 rounded-xl border-[var(--border)] font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
                                View Employees
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function OnboardingChecklist({ employeeCount, isPayrollStarted, settings }: { employeeCount: number; isPayrollStarted: boolean; settings: EmployerSettings | null }) {
    const employerDetailsCompleted = !!settings?.employerName;
    
    const steps = [
        {
            label: "Add employer details",
            description: "Your name, address, and contact info for payslips.",
            completed: employerDetailsCompleted,
            href: "/settings?tab=general"
        },
        {
            label: "Add your first employee",
            description: "Full name and basic contact details.",
            completed: employeeCount > 0,
            href: "/employees/new"
        },
        {
            label: "Set hourly rates & schedule",
            description: "Required for accurate payslip calculations.",
            completed: employeeCount > 0, // Simplified check
            href: "/employees"
        },
        {
            label: "Start your first pay period",
            description: "Record actual hours worked this month.",
            completed: isPayrollStarted,
            href: "/payroll/new"
        }
    ];

    return (
        <Card className="glass-panel border-none">
            <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-[var(--text)]">Next Steps</h3>
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Setup Progress</p>
                </div>
                <div className="space-y-3">
                    {steps.map((step, i) => (
                        <Link key={i} href={step.completed ? "#" : step.href}>
                            <div className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${step.completed ? "bg-[var(--surface-2)]/30 border-transparent opacity-60" : "bg-[var(--surface-1)] border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-md cursor-pointer"}`}>
                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${step.completed ? "bg-[var(--success)] border-[var(--success)] text-white" : "border-[var(--border)] group-hover:border-[var(--primary)]"}`}>
                                    {step.completed ? <ShieldCheck className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--text)]">{step.label}</p>
                                    <p className="text-xs text-[var(--text-muted)] font-medium">{step.description}</p>
                                </div>
                                {!step.completed && <ChevronRight className="h-4 w-4 ml-auto text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />}
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function HouseholdSnapshot({
    employeeCount,
    documentCount,
    syncBadgeState,
    syncSummary,
}: {
    employeeCount: number;
    documentCount: number;
    syncBadgeState: SyncBadgeState;
    syncSummary: string;
}) {
    return (
        <Card className="glass-panel border-none shadow-sm outline outline-1 outline-[var(--border)]">
            <CardContent className="p-4 sm:p-6 space-y-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-0.5">Snapshot</p>
                    <h3 className="text-base sm:text-lg font-black text-[var(--text)]">Household Metrics</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Active Employees</p>
                        <p className="text-2xl font-black text-[var(--text)]">{employeeCount}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Documents</p>
                        <p className="text-2xl font-black text-[var(--text)]">{documentCount}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-[var(--text-muted)]">Storage & Sync</span>
                        <SyncStatusBadge state={syncBadgeState} />
                    </div>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--text-muted)]">{syncSummary}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickActions() {
    const actions = [
        { label: "Add Employee", icon: UserPlus, href: "/employees/new", primary: true },
        { label: "Monthly Payroll", icon: Banknote, href: "/payroll" },
        { label: "Documents Hub", icon: FolderOpen, href: "/documents" },
        { label: "Account Settings", icon: Settings, href: "/settings" }
    ];

    return (
        <div className="space-y-4">
            <h3 className="type-overline text-[var(--text-muted)] px-1">Quick Access</h3>
            <div className="grid gap-2">
                {actions.map((action, i) => (
                    <Link key={i} href={action.href}>
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start gap-4 px-4 rounded-xl font-bold bg-[var(--surface-1)] border border-[var(--border)] hover:bg-[var(--surface-2)] hover:border-[var(--primary)]/20 transition-all group"
                        >
                            <div className="p-1.5 rounded-lg bg-[var(--surface-2)] group-hover:bg-[var(--primary)]/10 transition-colors">
                                <action.icon className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                            </div>
                            <span className="text-[13px] text-[var(--text)]">{action.label}</span>
                        </Button>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function RecentRecordsArea({ recentDocs, hasEmployees }: { recentDocs: DocumentMeta[]; hasEmployees: boolean }) {
    if (!hasEmployees) return null;

    return (
        <Card className="glass-panel border-none">
            <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-0.5">Recent Activity</p>
                        <h3 className="text-base sm:text-lg font-black text-[var(--text)]">Recent Records</h3>
                    </div>
                    {recentDocs.length > 0 && (
                        <Link href="/documents">
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)]/5 h-8 rounded-lg">
                                View all
                            </Button>
                        </Link>
                    )}
                </div>

                {recentDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-[var(--surface-2)]/30 rounded-2xl border border-dashed border-[var(--border)]">
                        <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                            <FileText className="h-5 w-5 text-[var(--text-muted)]" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-[var(--text)]">No records yet</p>
                            <p className="text-xs text-[var(--text-muted)] max-w-[200px] font-medium leading-relaxed">
                                Complete a pay period to generate payslips and UI records.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {recentDocs.slice(0, 3).map(doc => (
                            <Link key={doc.id} href="/documents" className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0 transition-all">
                                <div className="p-2 rounded-xl bg-[var(--surface-2)] group-hover:bg-[var(--primary)]/10 transition-colors">
                                    <FileText className="h-5 w-5 text-[var(--primary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[var(--text)] truncate">{doc.fileName}</p>
                                    <p className="text-xs text-[var(--text-muted)] font-medium">
                                        {format(new Date(doc.createdAt), "d MMMM yyyy")}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DashboardAlert({ alert }: { alert: DashboardAlertData }) {
    const isUrgent = alert.severity === "urgent";
    const isInfo = alert.severity === "info";
    const bg = isUrgent ? "var(--danger-soft)" : isInfo ? "var(--info-soft)" : "var(--warning-soft)";
    const border = isUrgent ? "var(--danger-border)" : isInfo ? "var(--info-border)" : "var(--warning-border)";
    const color = isUrgent ? "var(--danger)" : isInfo ? "var(--info)" : "var(--warning)";

    return (
        <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
            style={{ backgroundColor: bg, borderColor: border, color }}>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: bg }}>
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                </div>
                <span>{alert.message}</span>
            </div>
            {alert.action && (
                <Link href={alert.action.href} className="text-xs font-black uppercase tracking-wider underline-offset-4 hover:underline whitespace-nowrap" style={{ color }}>
                    {alert.action.label}
                </Link>
            )}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <React.Suspense fallback={<CardSkeleton />}>
            <DashboardContent />
        </React.Suspense>
    );
}

function ComplianceCard() {
    return (
        <Card className="glass-panel border-none overflow-hidden group">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="type-overline text-[var(--text-muted)]">Annual Paperwork</h3>
                    <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div className="space-y-3">
                    <div>
                        <h4 className="type-body font-bold text-[var(--text)]">Compensation Fund ROE</h4>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            Gather your yearly wage totals and supporting records for the annual ROE submission.
                        </p>
                    </div>
                    <Link href="/compliance/coida/roe">
                        <Button variant="outline" size="sm" className="w-full text-xs font-bold border-[var(--primary)]/20 hover:bg-[var(--primary)]/5 hover:border-[var(--primary)] transition-all h-9 rounded-lg gap-2">
                            Ready in 2 minutes
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}




