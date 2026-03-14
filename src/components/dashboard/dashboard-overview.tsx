"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
    ArrowRight,
    Banknote,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    Clock3,
    FileText,
    FolderOpen,
    LifeBuoy,
    Palmtree,
    Settings,
    ShieldCheck,
    Sparkles,
    UserPlus,
    Users,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SyncStatusBadge, type SyncState as SyncBadgeState } from "@/components/ui/sync-status-badge";
import { InlinePlanCheckoutButton } from "@/components/billing/inline-paid-plan-checkout";
import { getUserPlan } from "@/lib/entitlements";
import type { DashboardAlert as DashboardAlertData } from "@/lib/alerts";
import { hasRequiredEmployerDetails } from "@/lib/employer-details";
import type { DocumentMeta, Employee, EmployerSettings, PayPeriod, PayslipInput } from "@/lib/schema";

export interface EmployeeSummary {
    employee: Employee;
    latestPayslip: PayslipInput | null;
    netPay: number | null;
}

interface DashboardOverviewProps {
    employees: Employee[];
    settings: EmployerSettings | null;
    currentPeriod: PayPeriod | null;
    recentDocs: DocumentMeta[];
    summaries: EmployeeSummary[];
    allPeriods: PayPeriod[];
    alerts: DashboardAlertData[];
    syncBadgeState: SyncBadgeState;
    syncSummary: string;
}

const moneyFormatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
});

export function DashboardOverview({
    employees,
    settings,
    currentPeriod,
    recentDocs,
    summaries,
    allPeriods,
    alerts,
    syncBadgeState,
    syncSummary,
}: DashboardOverviewProps) {
    const plan = getUserPlan(settings);
    const employeeCount = employees.length;
    const currentMonth = format(new Date(), "MMMM yyyy");
    const completedEntries = currentPeriod?.entries.filter((entry) => entry.status === "complete").length ?? 0;
    const totalEntries = currentPeriod?.entries.length ?? 0;
    const progressPercent = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
    const latestPayrollTotal = summaries.reduce((sum, summary) => sum + (summary.netPay ?? 0), 0);
    const setupIncomplete = employeeCount === 0;
    const latestPeriod = allPeriods[0];
    const latestPeriodLocked = latestPeriod?.status === "locked" && latestPeriod?.name === currentMonth;
    const pendingEntry = currentPeriod?.entries.find((entry) => entry.status !== "complete");
    const pendingEmployee = employees.find((employee) => employee.id === pendingEntry?.employeeId);
    const hero = getHeroContent({
        currentPeriod,
        currentMonth,
        setupIncomplete,
        latestPeriodLocked,
        progressPercent,
        completedEntries,
        totalEntries,
        pendingEmployeeName: pendingEmployee?.name ?? null,
    });

    return (
        <div className="flex w-full max-w-none flex-col gap-4 sm:gap-5 lg:gap-6">
            <PageHeader
                title="Dashboard"
                subtitle={hero.mobileSubtitle}
                className="mb-0 lg:hidden"
            />

            {alerts.length > 0 ? (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <DashboardAlertBanner key={alert.id} alert={alert} />
                    ))}
                </div>
            ) : null}

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:gap-7">
                <div className="space-y-5">
                    <HeroCard
                        eyebrow={hero.eyebrow}
                        title={hero.title}
                        subtitle={hero.subtitle}
                        primaryHref={hero.primaryHref}
                        primaryLabel={hero.primaryLabel}
                        secondaryHref={hero.secondaryHref}
                        secondaryLabel={hero.secondaryLabel}
                        progressPercent={currentPeriod ? progressPercent : null}
                        progressLabel={currentPeriod ? `${completedEntries} / ${totalEntries} employees` : null}
                    />

                    <div className="space-y-5 lg:hidden">
                        <SnapshotCard
                            employeeCount={employeeCount}
                            documentCount={recentDocs.length}
                            latestPayrollTotal={latestPayrollTotal}
                            syncBadgeState={syncBadgeState}
                            syncSummary={syncSummary}
                        />
                        <QuickActionsCard />
                    </div>

                    {employeeCount > 0 ? (
                        <EmployeeRunCard
                            employees={employees}
                            summaries={summaries}
                            currentPeriod={currentPeriod}
                            currentMonth={currentMonth}
                        />
                    ) : (
                        <OnboardingChecklist
                            employeeCount={employeeCount}
                            hasEmployerDetails={hasRequiredEmployerDetails(settings)}
                            hasCurrentPeriod={Boolean(currentPeriod)}
                        />
                    )}

                    {!setupIncomplete && !currentPeriod ? (
                        <OnboardingChecklist
                            employeeCount={employeeCount}
                            hasEmployerDetails={hasRequiredEmployerDetails(settings)}
                            hasCurrentPeriod={Boolean(currentPeriod)}
                        />
                    ) : null}

                    <RecentRecordsCard recentDocs={recentDocs} hasEmployees={employeeCount > 0} />
                </div>

                <aside className="hidden space-y-5 self-start lg:sticky lg:top-6 lg:block">
                    <SnapshotCard
                        employeeCount={employeeCount}
                        documentCount={recentDocs.length}
                        latestPayrollTotal={latestPayrollTotal}
                        syncBadgeState={syncBadgeState}
                        syncSummary={syncSummary}
                    />
                    <QuickActionsCard />
                    {plan.id === "free" ? (
                        <UpgradeCard />
                    ) : null}
                    <ComplianceCard />
                    <SupportCard />
                </aside>
            </div>

            <div className="space-y-5 lg:hidden">
                {plan.id === "free" ? <UpgradeCard /> : null}
                <ComplianceCard />
                <SupportCard />
            </div>
        </div>
    );
}

function HeroCard({
    eyebrow,
    title,
    subtitle,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    progressPercent,
    progressLabel,
}: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string | null;
    secondaryLabel: string | null;
    progressPercent: number | null;
    progressLabel: string | null;
}) {
    return (
        <Card
            className="overflow-hidden border-none text-white hover:translate-y-0"
            style={{
                backgroundImage: "var(--dashboard-hero-gradient)",
                boxShadow: "var(--shadow-xl)",
            }}
        >
            <CardContent className="relative overflow-hidden p-5 sm:p-6 lg:p-7">
                <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_58%)] sm:block" />
                <div className="relative space-y-5">
                    <div className="space-y-2">
                        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
                            <span className="h-2 w-2 rounded-full bg-white/80" />
                            {eyebrow}
                        </p>
                        <div className="max-w-2xl space-y-2">
                            <h2 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">{title}</h2>
                            <p className="max-w-[60ch] text-sm leading-6 text-white/82 sm:text-[15px]">{subtitle}</p>
                        </div>
                    </div>

                    {progressPercent !== null && progressLabel ? (
                        <div className="max-w-xl space-y-2">
                            <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.14em] text-white/72">
                                <span>Progress</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-white transition-all duration-700"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <p className="text-xs font-semibold text-white/76">{progressLabel}</p>
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link href={primaryHref} className="sm:w-auto">
                            <Button
                                className="w-full border-none font-bold"
                                style={{
                                    backgroundColor: "#ffffff",
                                    color: "var(--primary)",
                                }}
                            >
                                {primaryLabel}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        {secondaryHref && secondaryLabel ? (
                            <Link href={secondaryHref} className="sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="w-full border-white/24 hover:bg-white/16"
                                    style={{
                                        borderColor: "rgba(255,255,255,0.24)",
                                        backgroundColor: "rgba(255,255,255,0.1)",
                                        color: "#ffffff",
                                    }}
                                >
                                    {secondaryLabel}
                                </Button>
                            </Link>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function EmployeeRunCard({
    employees,
    summaries,
    currentPeriod,
    currentMonth,
}: {
    employees: Employee[];
    summaries: EmployeeSummary[];
    currentPeriod: PayPeriod | null;
    currentMonth: string;
}) {
    const summaryMap = new Map(summaries.map((summary) => [summary.employee.id, summary]));

    return (
        <Card className="border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-sm)]">
            <CardContent className="p-0">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {currentPeriod ? currentMonth : "Household"}
                        </p>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-[var(--text)]">
                            {currentPeriod ? "Employee payroll status" : "Employees"}
                        </h3>
                    </div>
                    <Link href="/employees/new">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 rounded-xl font-bold"
                            style={{ color: "var(--primary)" }}
                        >
                            <UserPlus className="h-4 w-4" />
                            Add employee
                        </Button>
                    </Link>
                </div>

                <div className="divide-y divide-[var(--border)]">
                    {employees.map((employee) => {
                        const summary = summaryMap.get(employee.id);
                        const entry = currentPeriod?.entries.find((item) => item.employeeId === employee.id);
                        const status = entry?.status ?? (summary?.latestPayslip ? "complete" : "empty");
                        const rowHref = currentPeriod ? `/payroll/${currentPeriod.id}` : `/employees/${employee.id}`;
                        const actionLabel = currentPeriod
                            ? status === "complete"
                                ? "Review"
                                : status === "blocked"
                                    ? "Fix entry"
                                    : "Enter hours"
                            : summary?.latestPayslip
                                ? "Open profile"
                                : "Finish setup";

                        return (
                            <div key={employee.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                                        style={{ backgroundImage: "var(--dashboard-hero-gradient)" }}
                                    >
                                        {getInitials(employee.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-[var(--text)]">{employee.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{employee.role}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                    {summary?.netPay ? (
                                        <div className="sm:text-right">
                                            <p className="text-sm font-black text-[var(--text)]">{moneyFormatter.format(summary.netPay)}</p>
                                            <p className="text-[11px] text-[var(--text-muted)]">Latest net pay</p>
                                        </div>
                                    ) : (
                                        <div className="sm:text-right">
                                            <p className="text-sm font-bold text-[var(--text)]">No payslip yet</p>
                                            <p className="text-[11px] text-[var(--text-muted)]">Complete setup to calculate pay</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <StatusBadge status={status} />
                                        <Link href={rowHref}>
                                            <Button
                                                variant={status === "complete" ? "secondary" : "default"}
                                                size="sm"
                                                style={status === "complete"
                                                    ? {
                                                        backgroundColor: "var(--surface-muted)",
                                                        color: "var(--primary)",
                                                        borderColor: "var(--border)",
                                                    }
                                                    : undefined}
                                            >
                                                {actionLabel}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function OnboardingChecklist({
    employeeCount,
    hasEmployerDetails,
    hasCurrentPeriod,
}: {
    employeeCount: number;
    hasEmployerDetails: boolean;
    hasCurrentPeriod: boolean;
}) {
    const steps = [
        {
            title: "Add employer details",
            description: "Your name, address, and contact details for payslips.",
            completed: hasEmployerDetails,
            href: "/settings?tab=general",
        },
        {
            title: "Add your first employee",
            description: "Create the worker profile before the first pay run.",
            completed: employeeCount > 0,
            href: "/employees/new",
        },
        {
            title: "Check hourly rates and schedule",
            description: "Make sure the employee profile reflects the current arrangement.",
            completed: employeeCount > 0,
            href: "/employees",
        },
        {
            title: "Start this month's pay period",
            description: "Capture actual hours worked and finalise the payslip.",
            completed: hasCurrentPeriod,
            href: "/payroll/new",
        },
    ];

    return (
        <Card className="border-[var(--border)] bg-[var(--surface-1)]">
            <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Next steps</p>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-[var(--text)]">Finish your household setup</h3>
                    </div>
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-bold text-[var(--text-muted)]">
                        {steps.filter((step) => step.completed).length} / {steps.length}
                    </span>
                </div>

                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <Link
                            key={step.title}
                            href={step.completed ? "#" : step.href}
                            className={`flex items-center gap-4 rounded-2xl border px-4 py-4 transition-colors ${step.completed
                                ? "border-transparent bg-[var(--surface-muted)]/70 opacity-70"
                                : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--primary)]/25 hover:bg-[var(--surface-muted)]/60"
                                }`}
                        >
                            <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${step.completed
                                    ? "border-transparent bg-[var(--success)] text-white"
                                    : "border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text-muted)]"
                                    }`}
                            >
                                {step.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[var(--text)]">{step.title}</p>
                                <p className="text-xs leading-5 text-[var(--text-muted)]">{step.description}</p>
                            </div>
                            {!step.completed ? <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" /> : null}
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function SnapshotCard({
    employeeCount,
    documentCount,
    latestPayrollTotal,
    syncBadgeState,
    syncSummary,
}: {
    employeeCount: number;
    documentCount: number;
    latestPayrollTotal: number;
    syncBadgeState: SyncBadgeState;
    syncSummary: string;
}) {
    const metrics = [
        {
            label: "Employees",
            value: String(employeeCount),
            helper: "Active workers",
            icon: Users,
            iconClassName: "bg-[var(--success-soft)] text-[var(--success)]",
        },
        {
            label: "Documents",
            value: String(documentCount),
            helper: "Recent records",
            icon: FileText,
            iconClassName: "bg-[var(--info-soft)] text-[var(--info)]",
        },
        {
            label: "Latest payroll",
            value: latestPayrollTotal > 0 ? moneyFormatter.format(latestPayrollTotal) : "R0",
            helper: "Most recent net total",
            icon: Wallet,
            iconClassName: "bg-[var(--surface-muted)] text-[var(--primary)]",
            wide: true,
        },
    ];

    return (
        <Card className="border-[var(--border)] bg-[var(--surface-1)]">
            <CardContent className="space-y-4 p-5">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Snapshot</p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-[var(--text)]">Household metrics</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className={`rounded-2xl bg-[var(--surface-muted)] p-4 ${metric.wide ? "col-span-2" : ""}`}
                        >
                            <div className="mb-3 flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${metric.iconClassName}`}>
                                    <metric.icon className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{metric.label}</p>
                            </div>
                            <p className="text-2xl font-black tracking-tight text-[var(--text)]">{metric.value}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">{metric.helper}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Storage &amp; sync</p>
                        <SyncStatusBadge state={syncBadgeState} />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{syncSummary}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickActionsCard() {
    const actions = [
        { label: "Add employee", href: "/employees/new", icon: UserPlus },
        { label: "Monthly payroll", href: "/payroll", icon: Banknote },
        { label: "Documents hub", href: "/documents", icon: FolderOpen },
        { label: "Leave tracker", href: "/leave", icon: Palmtree },
        { label: "Wage calculator", href: "/tools/wage-calculator", icon: Sparkles },
        { label: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <Card className="border-[var(--border)] bg-[var(--surface-1)]">
            <CardContent className="space-y-4 p-5">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Quick access</p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-[var(--text)]">Jump back into work</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {actions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="flex min-h-[92px] flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition-colors hover:border-[var(--primary)]/25 hover:bg-[var(--surface-sidebar)]"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-1)] text-[var(--primary)]">
                                <action.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--text)]">{action.label}</p>
                                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Open</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function RecentRecordsCard({ recentDocs, hasEmployees }: { recentDocs: DocumentMeta[]; hasEmployees: boolean }) {
    if (!hasEmployees) {
        return null;
    }

    return (
        <Card className="border-[var(--border)] bg-[var(--surface-1)]">
            <CardContent className="p-0">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Recent activity</p>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-[var(--text)]">Recent records</h3>
                    </div>
                    {recentDocs.length > 0 ? (
                        <Link href="/documents">
                            <Button variant="ghost" size="sm" className="rounded-xl font-bold" style={{ color: "var(--primary)" }}>
                                View all
                            </Button>
                        </Link>
                    ) : null}
                </div>

                {recentDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)]">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-[var(--text)]">No records yet</p>
                            <p className="max-w-sm text-xs leading-5 text-[var(--text-muted)]">
                                Finalise a pay period to generate payslips and saved records here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {recentDocs.slice(0, 4).map((doc) => (
                            <Link
                                key={doc.id}
                                href="/documents"
                                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-muted)]/55"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--primary)]">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-[var(--text)]">{doc.fileName}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{format(new Date(doc.createdAt), "d MMM yyyy")}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function UpgradeCard() {
    return (
        <Card className="border-[var(--primary)]/15 bg-[var(--surface-muted)]">
            <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--primary)]">Standard plan</p>
                    <h3 className="text-lg font-black tracking-tight text-[var(--text)]">Unlock sync, leave tracking, and more workers</h3>
                    <p className="text-sm leading-6 text-[var(--text-muted)]">
                        Standard adds encrypted backup, leave tracking, and support for up to 3 workers for R29/month.
                    </p>
                </div>

                <InlinePlanCheckoutButton
                    planId="standard"
                    billingCycle="monthly"
                    className="w-full font-bold text-white"
                >
                    Upgrade to Standard
                </InlinePlanCheckoutButton>
            </CardContent>
        </Card>
    );
}

function ComplianceCard() {
    return (
        <Card className="border-[var(--border)] bg-[var(--surface-1)]">
            <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Annual admin</p>
                </div>
                <div>
                    <h3 className="text-lg font-black tracking-tight text-[var(--text)]">Compensation Fund ROE</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                        Gather yearly wage totals and supporting records for the annual Return of Earnings submission.
                    </p>
                </div>
                <Link href="/compliance/coida/roe">
                    <Button variant="outline" className="w-full font-bold" style={{ color: "var(--primary)" }}>
                        Ready in 2 minutes
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

function SupportCard() {
    return (
        <Link href="/resources/checklists">
            <Card className="border-[var(--border)] bg-[var(--surface-1)] transition-colors hover:border-[var(--primary)]/20">
                <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--primary)]">
                        <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--text)]">Help &amp; support</p>
                        <p className="text-xs text-[var(--text-muted)]">Check guides, monthly checklists, and support resources.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                </CardContent>
            </Card>
        </Link>
    );
}

function DashboardAlertBanner({ alert }: { alert: DashboardAlertData }) {
    const tone = getAlertTone(alert.severity);

    return (
        <div
            className="flex flex-col gap-3 rounded-2xl border px-4 py-4 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between"
            style={{
                backgroundColor: tone.background,
                borderColor: tone.border,
                color: tone.text,
            }}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: tone.iconBackground }}>
                    <CircleAlert className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-bold">{alert.message}</p>
                </div>
            </div>
            {alert.action ? (
                <Link href={alert.action.href} className="shrink-0 text-xs font-black uppercase tracking-[0.14em] underline-offset-4 hover:underline">
                    {alert.action.label}
                </Link>
            ) : null}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "complete") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-3 py-1 text-[11px] font-bold text-[var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-soft)] px-3 py-1 text-[11px] font-bold text-[var(--warning)]">
            <Clock3 className="h-3.5 w-3.5" />
            {status === "blocked" ? "Blocked" : "Pending"}
        </span>
    );
}

function getHeroContent({
    currentPeriod,
    currentMonth,
    setupIncomplete,
    latestPeriodLocked,
    progressPercent,
    completedEntries,
    totalEntries,
    pendingEmployeeName,
}: {
    currentPeriod: PayPeriod | null;
    currentMonth: string;
    setupIncomplete: boolean;
    latestPeriodLocked: boolean;
    progressPercent: number;
    completedEntries: number;
    totalEntries: number;
    pendingEmployeeName: string | null;
}) {
    if (currentPeriod) {
        const reviewMode = currentPeriod.status === "review" || progressPercent === 100;

        return {
            eyebrow: "Current pay period",
            title: reviewMode ? `${currentPeriod.name} is ready to finalise` : `${currentPeriod.name} is in progress`,
            subtitle: reviewMode
                ? "All available entries are complete. Review the pay run, finalise it, and generate payslips."
                : pendingEmployeeName
                    ? `${pendingEmployeeName} still needs hours captured before you can finalise this month.`
                    : `You have completed ${completedEntries} of ${totalEntries} employee entries so far.`,
            mobileSubtitle: "Manage this month's payroll and follow the next actions below.",
            primaryHref: `/payroll/${currentPeriod.id}`,
            primaryLabel: reviewMode ? "Review & Finalise" : "Continue Payroll",
            secondaryHref: "/payroll",
            secondaryLabel: "Open payroll list",
        };
    }

    if (latestPeriodLocked) {
        return {
            eyebrow: "Payroll complete",
            title: `${currentMonth} has been finalised`,
            subtitle: "This month's pay run is locked. Open the documents hub to view the generated payslips and saved records.",
            mobileSubtitle: "This month is complete. Open the documents hub for the generated records.",
            primaryHref: "/documents",
            primaryLabel: "View Documents",
            secondaryHref: "/payroll",
            secondaryLabel: "Open payroll history",
        };
    }

    if (setupIncomplete) {
        return {
            eyebrow: "Getting started",
            title: "Welcome to LekkerLedger",
            subtitle: "Set up your employer details, add your first worker, and then start the first monthly pay period.",
            mobileSubtitle: "Start with your details, first employee, and first pay run.",
            primaryHref: "/settings?tab=general",
            primaryLabel: "Start Setup",
            secondaryHref: null,
            secondaryLabel: null,
        };
    }

    return {
        eyebrow: "Next pay run",
        title: `Start ${currentMonth}`,
        subtitle: "Create the new pay period to capture actual hours worked and prepare this month's payslips.",
        mobileSubtitle: "You are set up. Start the next pay period when you are ready.",
        primaryHref: "/payroll/new",
        primaryLabel: `Start ${currentMonth}`,
        secondaryHref: "/employees",
        secondaryLabel: "View employees",
    };
}

function getAlertTone(severity: DashboardAlertData["severity"]) {
    if (severity === "urgent") {
        return {
            background: "var(--danger-soft)",
            border: "var(--danger-border)",
            text: "var(--danger)",
            iconBackground: "rgba(180,35,24,0.14)",
        };
    }

    if (severity === "info") {
        return {
            background: "var(--info-soft)",
            border: "var(--info-border)",
            text: "var(--info)",
            iconBackground: "rgba(21,94,239,0.14)",
        };
    }

    return {
        background: "var(--warning-soft)",
        border: "var(--warning-border)",
        text: "var(--warning)",
        iconBackground: "rgba(181,71,8,0.14)",
    };
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}
