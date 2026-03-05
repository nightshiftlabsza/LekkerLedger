"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus, ArrowRight, AlertTriangle, Users,
    Palmtree, Calendar, FileText, Cloud, CloudOff,
    BookOpen, ChevronRight, Loader2, Banknote,
    ShieldCheck, FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TaskList, type TaskItem } from "@/components/ui/task-list";
import { StatusChip, type ChipVariant } from "@/components/ui/status-chip";
import { CardSkeleton, StatSkeleton } from "@/components/ui/loading-skeleton";
import { SyncStatusBadge } from "@/components/ui/sync-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getEmployees, getSettings, getCurrentPayPeriod, getDocuments, getLatestPayslip, subscribeToDataChanges } from "@/lib/storage";
import { computeDashboardAlerts } from "@/lib/alerts";
import { Employee, PayPeriod, EmployerSettings, DocumentMeta, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";

interface EmployeeSummary {
    employee: Employee;
    latestPayslip: PayslipInput | null;
    netPay: number | null;
}

export default function DashboardPage() {
    const router = useRouter();
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
                <PageHeader title="Dashboard" />
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

    // Build next actions for task list
    const nextActions: TaskItem[] = [];
    if (currentPeriod) {
        const missing = currentPeriod.entries.filter(e => e.status === "empty" || e.status === "partial");
        missing.slice(0, 2).forEach(entry => {
            const emp = employees.find(e => e.id === entry.employeeId);
            nextActions.push({
                id: `hours-${entry.employeeId}`,
                label: `Add hours for ${emp?.name ?? "employee"}`,
                status: "needs-info",
                href: `/payroll/${currentPeriod.id}`,
            });
        });
        if (completedEntries === totalEntries && totalEntries > 0) {
            nextActions.push({
                id: "review",
                label: `Review & generate payslips (${totalEntries})`,
                status: "in-progress",
                href: `/payroll/${currentPeriod.id}`,
            });
        }
    } else if (employeeCount > 0) {
        nextActions.push({
            id: "start-period",
            label: `Start ${format(new Date(), "MMMM yyyy")} payroll`,
            status: "draft",
            href: "/payroll",
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

    return (
        <>
            <PageHeader title="Dashboard" />

            <div className="ultrawide-grid grid-cols-12-desktop gap-6 space-y-6 lg:space-y-0">
                {/* Main Content Area */}
                <div className="ultrawide-main col-span-8-desktop space-y-6">
                    {/* 1. Monthly Payroll Hero */}
                    <Card className={`glass-panel overflow-hidden ${currentPeriod ? "border-2 border-[var(--primary)]/25" : "border-none"}`}>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center shrink-0">
                                    <Banknote className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="type-h3 text-[var(--text)]">Monthly Payroll</h2>
                                    <p className="type-label text-[var(--text-muted)]">
                                        {currentPeriod
                                            ? currentPeriod.status === "review"
                                                ? `${currentPeriod.name} — Review & Generate`
                                                : completedEntries === totalEntries && totalEntries > 0
                                                    ? `${currentPeriod.name} — Ready to Review`
                                                    : `${currentPeriod.name} — ${completedEntries} of ${totalEntries} complete`
                                            : "No active pay period"}
                                    </p>
                                </div>
                            </div>

                            {currentPeriod && (
                                <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                        style={{ width: `${totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0}%` }}
                                    />
                                </div>
                            )}

                            <Link href={currentPeriod ? `/payroll/${currentPeriod.id}` : "/payroll"}>
                                <Button className="w-full gap-2 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] h-11 rounded-xl">
                                    {currentPeriod ? `Continue ${currentPeriod.name}` : employeeCount > 0 ? `Start ${format(new Date(), "MMMM yyyy")}` : "Get Started"}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

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

                    {/* 2. Next Actions or Empty State */}
                    {employeeCount === 0 ? (
                        <EmptyState
                            title="Welcome to LekkerLedger"
                            description="Add your first employee to start tracking leave, generating payslips, and managing compliance."
                            icon={Users}
                            actionLabel="Add Employee"
                            actionHref="/employees/new"
                            requirements={[
                                "Employee's full name",
                                "Their hourly rate (minimum R30.23/hr)",
                                "Expected weekly/monthly hours"
                            ]}
                        />
                    ) : (
                        nextActions.length > 0 && <TaskList title="Next Actions" items={nextActions} />
                    )}

                    {/* Mobile-only view for the side panels */}
                    <div className="lg:hidden space-y-6">
                        <EmployeeCard employeeCount={employeeCount} needsInfoCount={needsInfoCount} />
                        <DocumentCard recentDocs={recentDocs} />
                        <StorageCard settings={settings} />
                    </div>
                </div>

                {/* Desktop Side Panel / Ultrawide Context Area */}
                <div className="hidden lg:block col-span-4-desktop space-y-6">
                    <EmployeeCard employeeCount={employeeCount} needsInfoCount={needsInfoCount} />
                    <DocumentCard recentDocs={recentDocs} />
                    <StorageCard settings={settings} />

                    {/* Help & Compliance (small) */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[var(--text-muted)] px-1 gap-2">
                            <span className="type-overline">Updated Mar 2026</span>
                            <div className="flex gap-4 flex-wrap">
                                <Link href="/help/coida" className="font-bold hover:text-[var(--primary)] flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" /> COIDA 2026
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

function EmployeeCard({ employeeCount, needsInfoCount }: { employeeCount: number; needsInfoCount: number }) {
    if (employeeCount === 0) return null;
    return (
        <Card className="glass-panel border-none">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="type-overline text-[var(--text-muted)]">Employees</h3>
                    <Link href="/employees">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--primary)] gap-1">
                            View all <ChevronRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="type-h3 text-[var(--text)]">{employeeCount}</span>
                    <span className="type-body text-[var(--text-muted)]">active</span>
                    {needsInfoCount > 0 && (
                        <StatusChip variant="needs-info" label={`${needsInfoCount} needs info`} />
                    )}
                </div>
            </CardContent>
        </Card>
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
