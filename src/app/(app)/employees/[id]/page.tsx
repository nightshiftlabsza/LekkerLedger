"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft, User, Clock, FileText, Palmtree,
    Pencil, Trash2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeLeaveTab } from "@/components/employees/employee-leave-tab";
import { EmployeeDocumentsTab } from "@/components/employees/employee-documents-tab";
import {
    getContractsForEmployee, getEmployee, getLeaveCarryOversForEmployee, getPayslipsForEmployee, getLeaveForEmployee, getSettings,
    deletePayslip, getDocuments
} from "@/lib/storage";
import { Employee, LeaveCarryOver, PayslipInput, LeaveRecord, Contract, CustomLeaveType, EmployerSettings, DocumentMeta } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format } from "date-fns";
import { filterRecordsForArchiveWindow, getArchiveUpgradeHref, getArchiveUpgradeLabel, getArchiveUpgradeMessage } from "@/lib/archive";
import { canBrowseLeaveHistory, canUseAdvancedLeaveFeatures, canUseDocumentsHub, getUserPlan } from "@/lib/entitlements";
import { PLANS, type PlanConfig } from "@/config/plans";

type Tab = "profile" | "history" | "leave" | "documents";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "history", label: "Pay History", icon: Clock },
    { id: "leave", label: "Leave", icon: Palmtree },
    { id: "documents", label: "Documents", icon: FileText },
];

const PROFILE_FIGURE_GRID = "grid grid-cols-[minmax(0,1fr)_3.5rem_4.5rem_4.5rem] gap-x-2 sm:grid-cols-[minmax(0,1fr)_5rem_6.75rem_7rem] sm:gap-x-3";
const SHELL_PANEL_CLASS = "rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

function formatRand(value: number) {
    return `R ${value.toFixed(2)}`;
}

function formatIdNumber(idNumber: string) {
    if (idNumber.length !== 13) return idNumber;
    return `${idNumber.slice(0, 6)} ${idNumber.slice(6, 10)} ${idNumber.slice(10)}`;
}

function EmployeeDetailContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const id = params?.id ?? "";

    const [activeTab, setActiveTab] = React.useState<Tab>("profile");
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [payslips, setPayslips] = React.useState<PayslipInput[]>([]);
    const [leaveRecords, setLeaveRecords] = React.useState<LeaveRecord[]>([]);
    const [leaveCarryOvers, setLeaveCarryOvers] = React.useState<LeaveCarryOver[]>([]);
    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [documents, setDocuments] = React.useState<DocumentMeta[]>([]);
    const [customLeaveTypes, setCustomLeaveTypes] = React.useState<CustomLeaveType[]>([]);
    const [employerSettings, setEmployerSettings] = React.useState<EmployerSettings | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currentPlan, setCurrentPlan] = React.useState<PlanConfig>(PLANS.free);
    const [showLeaveTab, setShowLeaveTab] = React.useState(false);
    const [showDocumentsTab, setShowDocumentsTab] = React.useState(false);
    const [advancedLeaveEnabled, setAdvancedLeaveEnabled] = React.useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

    const handleDeleteEmployee = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { deleteEmployee } = await import('@/lib/storage');
            await deleteEmployee(id);
            router.push("/employees");
        } catch (e) {
            console.error(e);
            setLoading(false);
            alert("Failed to delete employee.");
        }
    };

    React.useEffect(() => {
        async function load() {
            if (!id) return;
            const [emp, ps, leave, carryOvers, employeeContracts, settings, docs] = await Promise.all([
                getEmployee(id),
                getPayslipsForEmployee(id),
                getLeaveForEmployee(id),
                getLeaveCarryOversForEmployee(id),
                getContractsForEmployee(id),
                getSettings(),
                getDocuments(),
            ]);
            if (!emp) { router.push("/employees"); return; }
            setEmployee(emp);
            setDocuments(docs);
            setPayslips([...ps].sort(
                (a, b) => new Date(b.payPeriodEnd).getTime() - new Date(a.payPeriodEnd).getTime()
            ));
            setLeaveRecords(leave);
            setLeaveCarryOvers(carryOvers);
            setContracts(employeeContracts);
            setCustomLeaveTypes(settings.customLeaveTypes ?? []);
            setEmployerSettings(settings);
            const plan = getUserPlan(settings);
            const allowLeave = canBrowseLeaveHistory(plan);
            const allowDocuments = canUseDocumentsHub(plan);
            setCurrentPlan(plan);
            setShowLeaveTab(allowLeave);
            setShowDocumentsTab(allowDocuments);
            setAdvancedLeaveEnabled(canUseAdvancedLeaveFeatures(plan));
            setLoading(false);

            const visibleTabs = TABS.filter((tab) => (tab.id !== "leave" || allowLeave) && (tab.id !== "documents" || allowDocuments));
            const tabParam = searchParams?.get("tab") as Tab | null;
            if (tabParam && visibleTabs.some((tab) => tab.id === tabParam)) {
                setActiveTab(tabParam);
            }
        }
        load();
    }, [id, router, searchParams]);



    const handleDeletePayslip = async (psId: string) => {
        await deletePayslip(psId);
        setDeleteConfirmId(null);
        setPayslips(prev => prev.filter(p => p.id !== psId));
    };

    const payslipArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(payslips, currentPlan, (record) => record.payPeriodEnd),
        [currentPlan, payslips],
    );
    const visiblePayslips = payslipArchiveResult.visible;
    const archiveUpgradeHref = getArchiveUpgradeHref(currentPlan.id);
    const archiveUpgradeLabel = getArchiveUpgradeLabel(currentPlan.id);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
                <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[var(--surface-2)] animate-pulse" />
                        <div className="h-9 w-9 rounded-xl bg-[var(--surface-2)] animate-pulse" />
                        <div className="h-4 w-32 bg-[var(--surface-2)] animate-pulse rounded" />
                    </div>
                </div>
                <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
                    <div className="h-16 w-full rounded-2xl bg-[var(--surface-1)] animate-pulse" />
                    <div className="h-48 w-full rounded-2xl bg-[var(--surface-1)] animate-pulse" />
                </main>
            </div>
        );
    }

    if (!employee) return null;

    const visibleTabs = TABS.filter((tab) => (tab.id !== "leave" || showLeaveTab) && (tab.id !== "documents" || showDocumentsTab));
    let formattedStartDate = "Not set";
    if (employee.startDate) {
        const dateStr = format(new Date(employee.startDate), "dd MMM yyyy");
        const suffix = employee.startDateIsApproximate ? " (estimate)" : "";
        formattedStartDate = `${dateStr}${suffix}`;
    }
    const manualLeaveBalance = typeof employee.annualLeaveDaysRemaining === "number"
        ? `${employee.annualLeaveDaysRemaining} days remaining`
        : "Not entered";
    const employeeRole = employee.role || "Domestic Worker";
    const latestPayslip = payslips[0] ?? null;
    const latestBreakdown = latestPayslip ? calculatePayslip(latestPayslip) : null;
    const now = new Date();
    const defaultPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const periodEnd = latestPayslip ? new Date(latestPayslip.payPeriodEnd) : defaultPeriodEnd;
    const monthLabel = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(periodEnd);
    const employerName = employerSettings?.employerName?.trim() || "Employer details not added";
    const employerAddress = employerSettings?.employerAddress?.trim() || "Add employer details in Settings";
    const employerPhone = employerSettings?.phone?.trim();
    const employeePhone = employee.phone?.trim() || "Phone not added";
    const employeeId = employee.idNumber?.trim() ? `ID ${formatIdNumber(employee.idNumber)}` : "ID not added";
    const monthPrimaryLine = latestPayslip ? `${latestPayslip.daysWorked} days worked` : "No payslip created yet";
    const monthSecondaryLine = latestPayslip ? `${latestPayslip.ordinaryHours} ordinary hours` : "Create a payslip to show totals";

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <div className="border-b border-[var(--border)] bg-[var(--surface-1)]/95 px-4 py-4 backdrop-blur-sm">
                <div className="mx-auto flex max-w-4xl items-start gap-3">
                    <Link href="/employees">
                        <button
                            aria-label="Back to employees"
                            className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            <Link href="/employees" className="hover:underline">Employees</Link>
                        </p>
                        <h1 className="mt-1 text-xl font-black tracking-tight" style={{ color: "var(--text)" }}>
                            {employee.name}
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                            Employment record
                        </p>
                    </div>
                </div>
            </div>

            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-5 px-4 py-6 pb-24">
                <section className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[0_20px_50px_rgba(16,24,40,0.10)]">
                    <div
                        className="border-b border-[var(--border)] px-5 py-4"
                        style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.06) 0%, rgba(0, 122, 77, 0.02) 100%)" }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                    Employee Record
                                </p>
                            </div>
                            {latestPayslip && (
                                <p className="rounded-full border border-[var(--focus)]/20 bg-[var(--surface-1)] px-3 py-1.5 text-xs font-semibold shadow-sm" style={{ color: "var(--text)" }}>
                                    Latest: {monthLabel}
                                </p>
                            )}
                        </div>

                        <div className="mt-4 flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-[var(--shadow-sm)]">
                            {visibleTabs.map(({ id: tabId, label, icon: Icon }) => {
                                const active = activeTab === tabId;
                                return (
                                    <button
                                        key={tabId}
                                        onClick={() => setActiveTab(tabId)}
                                        aria-pressed={active}
                                        className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 rounded-xl px-1 sm:px-3 py-2 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.08em] sm:tracking-[0.14em] transition-all duration-200 min-h-[44px]"
                                        style={{
                                            backgroundColor: active ? "var(--primary)" : "transparent",
                                            color: active ? "#ffffff" : "var(--text-muted)",
                                            boxShadow: active ? "var(--shadow-sm)" : "none",
                                        }}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="animate-fade-in p-4 sm:p-5">
                        {/* PROFILE TAB */}
                        {activeTab === "profile" && (
                            <section>
                                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--primary)] uppercase font-black text-xl border border-[var(--border)]">
                                            {employee.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h2 className="font-[family:var(--font-serif)] text-xl font-semibold" style={{ color: "var(--text)" }}>
                                                {employee.name}
                                            </h2>
                                            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                                                {employeeRole}
                                            </p>
                                        </div>
                                    </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                        {!showDeleteConfirm ? (
                                            <>
                                                <Link href={`/employees/${id}/edit`}>
                                                    <Button variant="outline" size="sm" className="w-[140px] h-9 gap-2 font-bold px-3 justify-start">
                                                        <Pencil className="h-3.5 w-3.5" /> Edit details
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="mt-1 h-6 gap-2 px-0 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-transparent justify-start"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Delete employee
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="w-[260px] rounded-[14px] border p-3 text-left" style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-soft)" }}>
                                                <p className="text-xs font-bold leading-tight text-[var(--text)]">This will delete all payslips and leave records.</p>
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--danger)]">Type DELETE to confirm:</p>
                                                    <Input
                                                        type="text"
                                                        value={deleteConfirmText}
                                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                        placeholder="DELETE"
                                                        className="h-8 border-[var(--danger-border)] bg-[var(--surface-1)] text-xs uppercase focus-visible:ring-[var(--danger)]"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowDeleteConfirm(false);
                                                            setDeleteConfirmText("");
                                                        }}
                                                        className="h-8 flex-1 text-xs font-bold"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={deleteConfirmText !== "DELETE"}
                                                        onClick={handleDeleteEmployee}
                                                        className="h-8 flex-1 bg-[var(--danger)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    <ProfileInfoBlock
                                        label="Employer"
                                        value={employerName}
                                        detail={
                                            <>
                                                <p>{employerAddress}</p>
                                                {employerPhone ? <p>{employerPhone}</p> : null}
                                            </>
                                        }
                                    />
                                    <ProfileInfoBlock
                                        label="Employee"
                                        value={employee.name}
                                        detail={
                                            <>
                                                <p>{employeeRole}</p>
                                                <p>{employeeId}</p>
                                                <p>{employeePhone}</p>
                                                <p>Started {formattedStartDate}</p>
                                                <p>Leave balance {manualLeaveBalance}</p>
                                                <p>{employee.frequency} pay schedule</p>
                                            </>
                                        }
                                    />
                                    <ProfileInfoBlock
                                        label="Month"
                                        value={monthLabel}
                                        detail={
                                            <>
                                                <p>{monthPrimaryLine}</p>
                                                <p>{monthSecondaryLine}</p>
                                                <p>{`${employee.ordinaryHoursPerDay} hours/day · R${employee.hourlyRate.toFixed(2)}/hr`}</p>
                                            </>
                                        }
                                    />
                                </div>

                                <div className="mt-4 rounded-[22px] border border-[var(--border)] p-4" style={{ background: "var(--surface-panel-gradient)" }}>
                                    <div className={`${PROFILE_FIGURE_GRID} border-b border-[var(--border)] pb-2 text-[10px] font-black uppercase tracking-[0.16em]`} style={{ color: "var(--text-muted)" }}>
                                        <span>Description</span>
                                        <span className="text-right">Hours</span>
                                        <span className="text-right">Rate</span>
                                        <span className="text-right">Total</span>
                                    </div>

                                    {latestPayslip && latestBreakdown ? (
                                        <div className="space-y-1 pt-2">
                                            <ProfileFigureRow
                                                label="Ordinary Hours"
                                                hours={`${latestPayslip.ordinaryHours}h`}
                                                rate={`${formatRand(latestBreakdown.hourlyRate)}/hr`}
                                                total={formatRand(latestBreakdown.ordinaryPay)}
                                            />
                                            <ProfileFigureRow label="Gross Earnings" hours="" rate="" total={formatRand(latestBreakdown.grossPay)} bold />
                                            <ProfileFigureRow label="UIF (Employee 1%)" hours="" rate="" total={`- ${formatRand(latestBreakdown.deductions.uifEmployee)}`} />
                                            <ProfileFigureRow label="Total Deductions" hours="" rate="" total={formatRand(latestBreakdown.deductions.total)} bold />
                                        </div>
                                    ) : (
                                        <div className="pt-3">
                                            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                                No payslip yet for this employee.
                                            </p>
                                            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                                Create the first payslip to show gross pay, UIF deductions, and net amount here.
                                            </p>
                                            <Link href={`/wizard?empId=${id}`} className="mt-3 inline-flex">
                                                <Button className="bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)]">
                                                    Create Payslip
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 rounded-[22px] border border-[var(--focus)]/20 p-4" style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.06) 0%, rgba(0, 122, 77, 0.02) 100%)" }}>
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                                Net amount paid
                                            </p>
                                            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                                {latestPayslip ? "Based on the latest payslip above." : "Will appear after the first payslip is created."}
                                            </p>
                                        </div>
                                        <p className="font-[family:var(--font-serif)] text-2xl font-semibold tabular-nums" style={{ color: "var(--primary-pressed)" }}>
                                            {latestBreakdown ? formatRand(latestBreakdown.netPay) : "R 0.00"}
                                        </p>
                                    </div>
                                </div>


                            </section>
                        )}

                        {/* PAY HISTORY TAB */}
                        {activeTab === "history" && (
                            <div className="space-y-3">
                                {visiblePayslips.length === 0 ? (
                                    <Card className={`${SHELL_PANEL_CLASS} border-dashed border-2`}>
                                        <CardContent className="p-10 text-center">
                                            <Clock className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                                            <p className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>
                                                {payslipArchiveResult.hiddenCount > 0 ? "Older payslips are hidden on this plan" : "No payslips yet"}
                                            </p>
                                            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                                                {payslipArchiveResult.hiddenCount > 0
                                                    ? "Upgrade to browse the full payslip history here."
                                                    : `Generate the first payslip for ${employee.name}.`}
                                            </p>
                                            <Link href={`/wizard?empId=${id}`}>
                                                <Button className="bg-[var(--primary)] text-white font-bold hover:brightness-95">Create Payslip</Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    visiblePayslips.map((ps, i) => {
                                        const calc = calculatePayslip(ps);
                                        return (
                                            <Card key={ps.id} className={`${SHELL_PANEL_CLASS} cursor-pointer animate-slide-up`} style={{ animationDelay: `${i * 50}ms` }}>
                                                <CardContent className="p-4" onClick={() => router.push(`/preview?payslipId=${ps.id}&empId=${id}`)}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                                                                {format(new Date(ps.payPeriodStart), "MMM d")} – {format(new Date(ps.payPeriodEnd), "MMM d, yyyy")}
                                                            </p>
                                                            <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                                                                Net: <strong>R{calc.netPay.toFixed(2)}</strong> · Gross: R{calc.grossPay.toFixed(2)}
                                                            </p>
                                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                                                                Open payslip
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {deleteConfirmId === ps.id ? (
                                                                <>
                                                                    <span className="text-xs font-bold text-[var(--danger)]">Delete?</span>
                                                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                                                        onClick={(event) => { event.stopPropagation(); handleDeletePayslip(ps.id); }}>Yes</Button>
                                                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold"
                                                                        onClick={(event) => { event.stopPropagation(); setDeleteConfirmId(null); }}>No</Button>
                                                                </>
                                                            ) : (
                                                                <Button variant="outline" size="sm" className="h-10 px-3 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                                                        style={{ borderColor: "var(--danger-border)" }}
                                                                        onClick={(event) => { event.stopPropagation(); setDeleteConfirmId(ps.id); }}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span className="ml-1">Delete</span>
                                                                    </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                                {visiblePayslips.length > 0 && (
                                    <Link href={`/wizard?empId=${id}`}>
                                        <Button className="w-full bg-[var(--primary)] text-white font-bold hover:brightness-95 mt-2">
                                            + New Payslip
                                        </Button>
                                    </Link>
                                )}
                                {payslipArchiveResult.hiddenCount > 0 && (
                                    <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text)]">{getArchiveUpgradeMessage(currentPlan.id, payslipArchiveResult.hiddenCount, "payslip")}</p>
                                            </div>
                                            <Link href={archiveUpgradeHref}>
                                                <Button className="w-full sm:w-auto bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{archiveUpgradeLabel}</Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* LEAVE TAB */}
                        {activeTab === "leave" && (
                            <EmployeeLeaveTab
                                employee={employee}
                                leaveRecords={leaveRecords}
                                leaveCarryOvers={leaveCarryOvers}
                                contracts={contracts}
                                customLeaveTypes={customLeaveTypes}
                                currentPlan={currentPlan}
                                advancedLeaveEnabled={advancedLeaveEnabled}
                                variant="embedded"
                            />
                        )}

                        {/* DOCUMENTS TAB */}
                        {activeTab === "documents" && employerSettings && (
                            <EmployeeDocumentsTab
                                employee={employee}
                                contracts={contracts}
                                documents={documents}
                                settings={employerSettings}
                                currentPlan={currentPlan}
                                onDocumentsChange={() => {
                                    getDocuments().then(setDocuments);
                                    getContractsForEmployee(id).then(setContracts);
                                }}
                            />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

function ProfileInfoBlock({ label, value, detail }: { label: string; value: string; detail?: React.ReactNode }) {
    return (
        <div
            className="rounded-[18px] border border-[var(--border)] px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            style={{ background: "var(--surface-panel-gradient)" }}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                {value}
            </p>
            {detail ? (
                <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {detail}
                </div>
            ) : null}
        </div>
    );
}

function ProfileFigureRow({ label, hours, rate, total, bold = false }: { label: string; hours: string; rate: string; total: string; bold?: boolean }) {
    return (
        <div className={`${PROFILE_FIGURE_GRID} items-baseline py-2 text-[13px] sm:text-sm`}>
            <span className={`pr-2 ${bold ? "font-semibold" : ""}`} style={{ color: bold ? "var(--text)" : "var(--text-muted)" }}>
                {label}
            </span>
            <span className="text-right tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {hours}
            </span>
            <span className="text-right tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {rate}
            </span>
            <span className={`text-right tabular-nums whitespace-nowrap ${bold ? "font-semibold" : ""}`} style={{ color: "var(--text)" }}>
                {total}
            </span>
        </div>
    );
}
export default function EmployeeDetailPage() {
    return (
        <React.Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
                </div>
            }
        >
            <EmployeeDetailContent />
        </React.Suspense>
    );
}



















