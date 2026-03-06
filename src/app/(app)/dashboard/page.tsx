"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowRight, AlertTriangle, Users,
    FileText, FolderOpen,
    BookOpen, ChevronRight, Banknote,
    ShieldCheck, UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TaskList, type TaskItem } from "@/components/ui/task-list";
import { CardSkeleton, StatSkeleton } from "@/components/ui/loading-skeleton";
import { SyncStatusBadge } from "@/components/ui/sync-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getEmployees, getSettings, getCurrentPayPeriod, getDocuments, getLatestPayslip, subscribeToDataChanges } from "@/lib/storage";
import { computeDashboardAlerts } from "@/lib/alerts";
import { Employee, PayPeriod, EmployerSettings, DocumentMeta, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { COMPLIANCE } from "@/lib/compliance-constants";

interface EmployeeSummary {
    employee: Employee;
    latestPayslip: PayslipInput | null;
    netPay: number | null;
}

export default function DashboardPage() {
    const [loading, setLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [currentPeriod, setCurrentPeriod] = React.useState<PayPeriod | null>(null);
    const [recentDocs, setRecentDocs] = React.useState<DocumentMeta[]>([]);
    const [summaries, setSummaries] = React.useState<EmployeeSummary[]>([]);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const [emps, s, period, docs] = await Promise.all([
                getEmployees(),
                getSettings(),
                getCurrentPayPeriod(),
                getDocuments(),
            ]);

            // Build employee summaries for alert engine
            const results: EmployeeSummary[] = [];
            for (const emp of emps) {
                const latest = await getLatestPayslip(emp.id);
                let netPay: number | null = null;
                if (latest) netPay = calculatePayslip(latest).netPay;
                results.push({ employee: emp, latestPayslip: latest, netPay });
            }

            setEmployees(emps);
            setSettings(s);
            setCurrentPeriod(period);
            setRecentDocs(docs.slice(0, 5));
            setSummaries(results);
            setLoading(false);
        }
        load();

        return subscribeToDataChanges(load);
    }, []);

    if (loading) {
        return (
            <>
                <PageHeader title="Dashboard" subtitle="See this month's payroll status and what to do next." />
                <CardSkeleton />
                <div className="grid grid-cols-2 gap-3"><StatSkeleton /><StatSkeleton /></div>
                <CardSkeleton />
            </>
        );
    }

    const employeeCount = employees.length;
    const completedEntries = currentPeriod?.entries.filter(e => e.status === "complete").length ?? 0;
    const totalEntries = currentPeriod?.entries.length ?? 0;
    const needsInfoCount = employees.filter(e => !e.idNumber || !e.startDate).length;
    const currentMonth = format(new Date(), "MMMM yyyy");
    const monthlyPayrollHref = currentPeriod
        ? `/payroll/${currentPeriod.id}`
        : employeeCount > 0
            ? "/payroll/new"
            : "/employees/new";
    const progressPercent = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
    const payrollHeadline = currentPeriod
        ? currentPeriod.status === "review"
            ? `${currentPeriod.name} is ready for review.`
            : completedEntries === totalEntries && totalEntries > 0
                ? `${currentPeriod.name} is ready to finalise.`
                : `${completedEntries} of ${totalEntries} employees complete for ${currentPeriod.name}.`
        : employeeCount > 0
            ? `${currentMonth} has not been started yet.`
            : "Add your first employee to begin monthly payroll.";
    const payrollBody = currentPeriod
        ? "Open this month, finish any remaining entries, check the totals, and then generate the payslips."
        : employeeCount > 0
            ? "Start this month's pay period and work through each employee one by one."
            : "Add one employee to unlock payroll, documents, and leave tracking.";

    // Build next actions for task list
    const nextActions: TaskItem[] = [];
    if (currentPeriod) {
        const missing = currentPeriod.entries.filter(e => e.status === "empty" || e.status === "partial");
        missing.slice(0, 2).forEach(entry => {
            const emp = employees.find(e => e.id === entry.employeeId);
            nextActions.push({
                id: `hours-${entry.employeeId}`,
                label: `Add this month's hours for ${emp?.name ?? "employee"}`,
                status: "needs-info",
                href: `/payroll/${currentPeriod.id}`,
            });
        });
        if (completedEntries === totalEntries && totalEntries > 0) {
            nextActions.push({
                id: "review",
                label: `Check ${currentPeriod.name} before finalising`,
                status: "in-progress",
                href: `/payroll/${currentPeriod.id}`,
            });
        }
    } else if (employeeCount > 0) {
        nextActions.push({
            id: "start-period",
            label: `Add ${format(new Date(), "MMMM yyyy")} payroll`,
            status: "draft",
            href: "/payroll/new",
        });
    }
    if (needsInfoCount > 0) {
        nextActions.push({
            id: "needs-info",
            label: `${needsInfoCount} employee${needsInfoCount > 1 ? "s" : ""} missing info`,
            status: "needs-info",
            href: "/employees",
        });
    }

    // Alert engine
    const now = new Date();
    const alerts = computeDashboardAlerts({ employees, summaries, settings, now });

    const SummaryCell = ({ label, value }: { label: string; value: string }) => (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value}</p>
        </div>
    );

    const DocumentCard = ({ recentDocs }: { recentDocs: DocumentMeta[] }) => (
        <Card className="glass-panel border-none">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="type-overline text-[var(--text-muted)]">Recent Documents</h3>
                    <Link href="/documents">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--primary)] gap-1">
                            View all <ChevronRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
                {recentDocs.length === 0 ? (
                    <p className="type-body text-[var(--text-muted)]">No documents yet. Generate payslips from a pay period.</p>
                ) : (
                    <div className="space-y-2">
                        {recentDocs.slice(0, 3).map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                                <FileText className="h-4 w-4 text-[var(--primary)] shrink-0" />
                                <span className="type-body text-[var(--text)] truncate">{doc.fileName}</span>
                                <span className="type-overline text-[var(--text-muted)] ml-auto shrink-0">
                                    {format(new Date(doc.createdAt), "d MMM")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const StorageCard = ({ settings }: { settings: EmployerSettings | null }) => (
        <Card className="glass-panel border-none">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="type-overline text-[var(--text-muted)]">Storage & Sync</h3>
                    <Link href="/settings?tab=sync">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--primary)] gap-1">
                            Manage <ChevronRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--text-muted)] shrink-0">Storage:</span>
                        <span className="font-bold text-[var(--text)] truncate">This device</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--text-muted)] shrink-0">Backup:</span>
                        <span className="font-bold text-[var(--text)] truncate">{settings?.googleSyncEnabled ? "Google connected" : "Local only"}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <>
            <PageHeader title="Dashboard" subtitle="See this month's payroll status and what to do next." />

            <div className="ultrawide-grid grid-cols-12-desktop gap-6 space-y-6 lg:space-y-0">
                {/* Main Content Area */}
                <div className="ultrawide-main col-span-8-desktop space-y-6">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
                        <Card className={`glass-panel overflow-hidden ${currentPeriod ? "border-2 border-[var(--primary)]/20" : "border-none"}`}>
                            <CardContent className="space-y-5 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
                                        <Banknote className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Monthly payroll</p>
                                        <div>
                                            <h2 className="type-h3 text-[var(--text)]">{payrollHeadline}</h2>
                                            <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{payrollBody}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <SummaryCell label="This month" value={currentPeriod?.name ?? currentMonth} />
                                    <SummaryCell label="Employees" value={employeeCount === 0 ? "None yet" : `${employeeCount} active`} />
                                    <SummaryCell label="Needs info" value={needsInfoCount === 0 ? "All set" : `${needsInfoCount} to fix`} />
                                </div>

                                {currentPeriod && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
                                            <span>Progress</span>
                                            <span>{completedEntries} of {totalEntries} complete</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link href={monthlyPayrollHref} className="flex-1">
                                        <Button className="h-11 w-full gap-2 rounded-xl bg-[var(--primary)] font-bold text-white hover:bg-[var(--primary-hover)]">
                                            {currentPeriod ? `Open ${currentPeriod.name}` : employeeCount > 0 ? `Add ${currentMonth} Payroll` : "Add First Employee"}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href={employeeCount > 0 ? "/employees/new" : "/help/compliance"} className="sm:w-auto">
                                        <Button variant="outline" className="h-11 w-full gap-2 rounded-xl border-[var(--border)] font-bold text-[var(--text)] hover:bg-[var(--surface-2)] sm:w-auto">
                                            {employeeCount > 0 ? "Add employee" : "See compliance guide"}
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-panel border-none">
                            <CardContent className="space-y-4 p-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">At a glance</p>
                                    <h2 className="type-h3 text-[var(--text)]">Household snapshot</h2>
                                </div>

                                <div className="space-y-3">
                                    <OverviewRow label="Active employees" value={employeeCount === 0 ? "None yet" : `${employeeCount}`} />
                                    <OverviewRow label="Recent documents" value={recentDocs.length === 0 ? "None yet" : `${recentDocs.length}`} />
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text)]">Backup status</p>
                                                <p className="text-xs text-[var(--text-muted)]">Google backup or local-only storage</p>
                                            </div>
                                            <SyncStatusBadge state={settings?.googleSyncEnabled ? "synced" : "disconnected"} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                                    <Link href="/employees/new">
                                        <Button variant="outline" className="h-11 w-full gap-2 rounded-xl border-[var(--border)] font-bold hover:bg-[var(--surface-2)]">
                                            <UserPlus className="h-4 w-4" /> Add employee
                                        </Button>
                                    </Link>
                                    <Link href="/documents">
                                        <Button variant="ghost" className="h-11 w-full gap-2 rounded-xl font-bold text-[var(--primary)] hover:bg-[var(--surface-2)]">
                                            <FolderOpen className="h-4 w-4" /> Open documents
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Alert banners */}
                    {alerts.map(alert => {
                        const isUrgent = alert.severity === "urgent";
                        const isInfo = alert.severity === "info";
                        const bg = isUrgent ? "rgba(239,68,68,0.08)" : isInfo ? "rgba(59,130,246,0.08)" : "rgba(217,119,6,0.08)";
                        const border = isUrgent ? "rgba(239,68,68,0.30)" : isInfo ? "rgba(59,130,246,0.30)" : "rgba(217,119,6,0.25)";
                        const color = isUrgent ? "var(--danger)" : isInfo ? "var(--blue-500)" : "var(--primary)";
                        return (
                            <div key={alert.id}
                                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-semibold"
                                style={{ backgroundColor: bg, borderColor: border, color }}>
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>{alert.message}</span>
                                </div>
                                {alert.action && (
                                    <Link href={alert.action.href} className="text-xs font-bold underline whitespace-nowrap" style={{ color }}>
                                        {alert.action.label}
                                    </Link>
                                )}
                            </div>
                        );
                    })}

                    {employeeCount === 0 ? (
                        <EmptyState
                            title="Welcome to LekkerLedger"
                            description="Add your first employee to start tracking leave, generating payslips, and managing compliance."
                            icon={Users}
                            actionLabel="Add Employee"
                            actionHref="/employees/new"
                            requirements={[
                                "Employee's full name",
                                `Their hourly rate (minimum R${COMPLIANCE.NMW.RATE_PER_HOUR.toFixed(2)}/hr)`,
                                "Expected weekly or monthly hours",
                            ]}
                        />
                    ) : nextActions.length > 0 ? (
                        <TaskList title="What to do next" items={nextActions} />
                    ) : (
                        <Card className="glass-panel border-none">
                            <CardContent className="space-y-3 p-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">What to do next</p>
                                <h2 className="type-h3 text-[var(--text)]">Everything urgent is up to date.</h2>
                                <p className="text-sm leading-relaxed text-[var(--text-muted)]">Use Documents to review recent files, or open Monthly Payroll when you are ready for the next cycle.</p>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link href="/payroll" className="flex-1">
                                        <Button className="h-11 w-full gap-2 rounded-xl bg-[var(--primary)] font-bold text-white hover:bg-[var(--primary-hover)]">
                                            Open Monthly Payroll <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href="/documents" className="flex-1">
                                        <Button variant="outline" className="h-11 w-full gap-2 rounded-xl border-[var(--border)] font-bold hover:bg-[var(--surface-2)]">
                                            View Documents <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Mobile-only view for the side panels */}
                    <div className="lg:hidden space-y-6">
                        <DocumentCard recentDocs={recentDocs} />
                        <StorageCard settings={settings} />
                        <ComplianceCard />
                    </div>
                </div>

                {/* Desktop Side Panel / Ultrawide Context Area */}
                <div className="hidden lg:block col-span-4-desktop space-y-6">
                    <DocumentCard recentDocs={recentDocs} />
                    <StorageCard settings={settings} />
                    <ComplianceCard />

                    {/* Help & Compliance (small) */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[var(--text-muted)] px-1 gap-2">
                            <span className="type-overline">Reference Guides</span>
                            <div className="flex gap-4 flex-wrap">
                                <Link href="/help/coida" prefetch={false} className="font-bold hover:text-[var(--primary)] flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" /> Compensation Fund guide
                                </Link>
                                <Link href="/help/compliance" className="font-bold hover:text-[var(--primary)] flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" /> Compliance Guide
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function ComplianceCard() {
    return (
        <Card className="glass-panel border-none overflow-hidden group">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="type-overline text-[var(--text-muted)]">Annual Compliance</h3>
                    <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div className="space-y-3">
                    <div>
                        <h4 className="type-body font-bold text-[var(--text)]">COIDA ROE Pack</h4>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Gather the yearly totals and supporting records you usually need for the Compensation Fund return.
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

function SummaryCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value}</p>
        </div>
    );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3">
            <span className="text-sm text-[var(--text-muted)]">{label}</span>
            <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
        </div>
    );
}
function DocumentCard({ recentDocs }: { recentDocs: DocumentMeta[] }) {
    return (
        <Card className="glass-panel border-none">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="type-overline text-[var(--text-muted)]">Recent Documents</h3>
                    <Link href="/documents">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--primary)] gap-1">
                            View all <ChevronRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
                {recentDocs.length === 0 ? (
                    <p className="type-body text-[var(--text-muted)]">No documents yet. Generate payslips from a pay period.</p>
                ) : (
                    <div className="space-y-2">
                        {recentDocs.slice(0, 3).map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                                <FileText className="h-4 w-4 text-[var(--primary)] shrink-0" />
                                <span className="type-body text-[var(--text)] truncate">{doc.fileName}</span>
                                <span className="type-overline text-[var(--text-muted)] ml-auto shrink-0">
                                    {format(new Date(doc.createdAt), "d MMM")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StorageCard({ settings }: { settings: EmployerSettings | null }) {
    return (
        <Card className="glass-panel border-none">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="type-overline text-[var(--text-muted)]">Storage & Sync</h3>
                    <Link href="/settings?tab=sync">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--primary)] gap-1">
                            Manage <ChevronRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--text-muted)] shrink-0">Storage:</span>
                        <span className="font-bold text-[var(--text)] truncate">This device</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--text-muted)] shrink-0">Backup:</span>
                        <SyncStatusBadge state={settings?.googleSyncEnabled ? "synced" : "disconnected"} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}





