"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft, User, Clock, FileText, Palmtree,
    Pencil, Trash2, Loader2, Lock,
    CalendarDays, Banknote, Phone, Briefcase, CheckCircle2, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    getContractsForEmployee, getEmployee, getLeaveCarryOversForEmployee, getPayslipsForEmployee, getLeaveForEmployee, getSettings,
    deletePayslip
} from "@/lib/storage";
import { Employee, LeaveCarryOver, PayslipInput, LeaveRecord, Contract, CustomLeaveType } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format } from "date-fns";
import { calculateAnnualLeaveForecast, calculateAnnualLeaveSummary, formatLeaveRange, formatLeaveValue, getCarryOverNudge, getLeaveTypeLabel } from "@/lib/leave";
import { filterRecordsForArchiveWindow, getArchiveUpgradeHref } from "@/lib/archive";
import { canBrowseLeaveHistory, canUseAdvancedLeaveFeatures, canUseDocumentsHub, canUseLeaveTracking, getUserPlan } from "@/lib/entitlements";
import { PLANS, type PlanConfig } from "@/config/plans";

type Tab = "profile" | "history" | "leave" | "documents";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "history", label: "Pay History", icon: Clock },
    { id: "leave", label: "Leave", icon: Palmtree },
    { id: "documents", label: "Documents", icon: FileText },
];

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
    const [customLeaveTypes, setCustomLeaveTypes] = React.useState<CustomLeaveType[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentPlan, setCurrentPlan] = React.useState<PlanConfig>(PLANS.free);
    const [showLeaveTab, setShowLeaveTab] = React.useState(false);
    const [showDocumentsTab, setShowDocumentsTab] = React.useState(false);
    const [advancedLeaveEnabled, setAdvancedLeaveEnabled] = React.useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

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
            const [emp, ps, leave, carryOvers, employeeContracts, settings] = await Promise.all([
                getEmployee(id),
                getPayslipsForEmployee(id),
                getLeaveForEmployee(id),
                getLeaveCarryOversForEmployee(id),
                getContractsForEmployee(id),
                getSettings(),
            ]);
            if (!emp) { router.push("/employees"); return; }
            setEmployee(emp);
            setPayslips([...ps].sort(
                (a, b) => new Date(b.payPeriodStart).getTime() - new Date(a.payPeriodStart).getTime()
            ));
            setLeaveRecords(leave);
            setLeaveCarryOvers(carryOvers);
            setContracts(employeeContracts);
            setCustomLeaveTypes(settings.customLeaveTypes ?? []);
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
    const payslipArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(payslips, currentPlan, (record) => record.payPeriodEnd),
        [currentPlan, payslips],
    );
    const leaveArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(leaveRecords, currentPlan, (record) => record.endDate || record.startDate || record.date),
        [currentPlan, leaveRecords],
    );
    const visiblePayslips = payslipArchiveResult.visible;
    const visibleLeaveRecords = leaveArchiveResult.visible;
    const archiveUpgradeHref = getArchiveUpgradeHref(currentPlan.id);
    const archiveUpgradeLabel = currentPlan.id === "free" ? "Upgrade to Standard" : "Upgrade to Pro";
    const annualLeaveDays = visibleLeaveRecords.filter(r => r.type === "annual").reduce((s, r) => s + r.days, 0);
    const sickLeaveDays = visibleLeaveRecords.filter(r => r.type === "sick").reduce((s, r) => s + r.days, 0);
    const annualSummary = employee?.startDate
        ? calculateAnnualLeaveSummary(employee.startDate, visibleLeaveRecords, contracts, new Date())
        : null;
    const forecast = employee?.startDate
        ? calculateAnnualLeaveForecast(employee.startDate, visibleLeaveRecords, contracts, new Date())
        : null;
    const carryOverNudge = getCarryOverNudge(leaveCarryOvers, new Date());

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)]">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/employees">
                            <button
                                aria-label="Back to employees"
                                className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        </Link>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                <Link href="/employees" className="hover:underline">Employees</Link>
                                {" › "}
                                <span style={{ color: "var(--text-muted)" }}>{employee.name}</span>
                            </p>
                            <h1 className="font-extrabold text-sm tracking-tight" style={{ color: "var(--text)" }}>
                                {employee.name}
                            </h1>
                        </div>
                    </div>
                    <Link href={`/employees/${id}/edit`}>
                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-bold">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                    </Link>
                </div>
            </div>

            <main className="flex-1 px-4 py-6 pb-8 max-w-4xl mx-auto w-full space-y-5">
                {/* Hero */}
                <div className="flex items-center gap-4 animate-fade-in">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0"
                        style={{ backgroundColor: "var(--primary)" }}>
                        {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>{employee.name}</h2>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            {employee.role} · R{employee.hourlyRate.toFixed(2)}/hr
                        </p>
                    </div>
                </div>

                {/* Tab bar — pill style matching settings page */}
                <div className="flex gap-1 p-1.5 rounded-2xl border border-[var(--border)]"
                    style={{ backgroundColor: "var(--surface-1)" }}>
                    {visibleTabs.map(({ id: tabId, label, icon: Icon }) => {
                        const active = activeTab === tabId;
                        return (
                            <button
                                key={tabId}
                                onClick={() => setActiveTab(tabId)}
                                aria-pressed={active}
                                className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200"
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

                {/* Tab content */}
                <div className="animate-fade-in">
                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                        <Card className="glass-panel border-none">
                            <CardContent className="p-5 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                                    Employment Details
                                </h3>
                                <div className="grid gap-3">
                                    <ProfileRow icon={Briefcase} label="Role" value={employee.role} />
                                    <ProfileRow icon={Banknote} label="Hourly Rate" value={`R${employee.hourlyRate.toFixed(2)}/hr`} />
                                    <ProfileRow icon={CalendarDays} label="Start Date" value={employee.startDate ? format(new Date(employee.startDate), "dd MMM yyyy") : "Not set"} />
                                    <ProfileRow icon={Clock} label="Hours / Day" value={`${employee.ordinaryHoursPerDay}h`} />
                                    <ProfileRow icon={CalendarDays} label="Pay Frequency" value={employee.frequency} />
                                    {employee.phone && <ProfileRow icon={Phone} label="Phone" value={employee.phone} />}
                                    {employee.idNumber && <ProfileRow icon={User} label="ID Number" value={employee.idNumber} />}
                                    <ProfileRow
                                        icon={CheckCircle2}
                                        label="Works Sundays ordinarily"
                                        value={employee.ordinarilyWorksSundays ? "Yes (1.5× rate)" : "No (2× rate)"}
                                    />
                                </div>
                                <div className="pt-4 border-t border-[var(--border)] space-y-2">
                                    <Link href={`/employees/${id}/edit`}>
                                        <Button className="w-full bg-[var(--primary)] text-white font-bold hover:brightness-95 h-11">
                                            <Pencil className="h-4 w-4 mr-2" /> Edit Employee
                                        </Button>
                                    </Link>

                                    {!showDeleteConfirm ? (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full rounded-2xl border border-red-200 bg-red-50 text-red-700 hover:text-red-800 hover:bg-red-100 font-bold h-11"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete employee
                                        </Button>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-red-200 bg-red-50 space-y-3 mt-4">
                                            <p className="text-sm font-bold text-red-800 text-center">Are you sure? This will delete all payslips and leave records for this employee.</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="flex-1 font-bold"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleDeleteEmployee}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                                                >
                                                    Yes, Delete
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* PAY HISTORY TAB */}
                    {activeTab === "history" && (
                        <div className="space-y-3">
                            {visiblePayslips.length === 0 ? (
                                <Card className="glass-panel border-dashed border-2 p-10 text-center">
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
                                </Card>
                            ) : (
                                visiblePayslips.map((ps, i) => {
                                    const calc = calculatePayslip(ps);
                                    return (
                                        <Card key={ps.id} className="glass-panel border-none animate-slide-up hover-lift cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
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
                                                                <span className="text-xs font-bold text-red-500">Delete?</span>
                                                                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold text-red-500 hover:bg-red-50"
                                                                    onClick={(event) => { event.stopPropagation(); handleDeletePayslip(ps.id); }}>Yes</Button>
                                                                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold"
                                                                    onClick={(event) => { event.stopPropagation(); setDeleteConfirmId(null); }}>No</Button>
                                                            </>
                                                        ) : (
                                                            <Button variant="outline" size="sm" className="h-10 px-3 text-xs font-bold text-red-700 border-red-200 hover:text-red-800 hover:bg-red-50"
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
                                            <p className="text-sm font-bold text-[var(--text)]">You have {payslipArchiveResult.hiddenCount} older payslip{payslipArchiveResult.hiddenCount === 1 ? "" : "s"}.</p>
                                            <p className="text-sm text-[var(--text-muted)]">Upgrade to browse your full history here.</p>
                                        </div>
                                        <Link href={archiveUpgradeHref}>
                                            <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{archiveUpgradeLabel}</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* LEAVE TAB */}
                    {activeTab === "leave" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <Card className="glass-panel border-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{annualLeaveDays}</p>
                                        <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Annual Days Taken</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-panel border-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{sickLeaveDays}</p>
                                        <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Sick Days Taken</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-panel border-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{formatLeaveValue(annualSummary?.currentCycleAllowance ?? 0)}</p>
                                        <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Current Cycle Entitlement</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-panel border-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{formatLeaveValue(annualSummary?.totalRemainingAvailable ?? 0)}</p>
                                        <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Annual Balance Available</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="glass-panel border-none">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Annual Leave Detail</p>
                                            <h3 className="mt-2 text-lg font-black text-[var(--text)]">Current cycle and carry-over</h3>
                                        </div>
                                        {annualSummary?.currentCycle ? (
                                            <p className="text-xs font-semibold text-[var(--text-muted)]">
                                                {format(annualSummary.currentCycle.start, "dd MMM yyyy")} to {format(annualSummary.currentCycle.end, "dd MMM yyyy")}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <InfoMetric label="Entitlement this cycle" value={formatLeaveValue(annualSummary?.currentCycleAllowance ?? 0)} />
                                        <InfoMetric label="Used from this cycle" value={formatLeaveValue(annualSummary?.usedInCurrentCycle ?? 0)} />
                                        <InfoMetric label="Still available now" value={formatLeaveValue(annualSummary?.totalRemainingAvailable ?? 0)} />
                                    </div>

                                    {advancedLeaveEnabled ? (
                                        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                            {(leaveCarryOvers.length > 0 ? leaveCarryOvers : annualSummary?.carryOvers ?? []).map((carryOver) => {
                                                const remaining = Math.max(carryOver.daysCarried - carryOver.daysUsedFromCarry, 0);
                                                if (remaining <= 0) return null;
                                                return (
                                                    <div key={carryOver.fromCycleEnd} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/55 px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-bold text-[var(--text)]">
                                                                Carried over from cycle ending {format(new Date(carryOver.fromCycleEnd), "dd MMM yyyy")}
                                                            </p>
                                                            <p className="text-xs text-[var(--text-muted)]">Used first when annual leave is recorded later on.</p>
                                                        </div>
                                                        <p className="text-lg font-black text-[var(--text)]">{formatLeaveValue(remaining)} days</p>
                                                    </div>
                                                );
                                            })}
                                            {!((leaveCarryOvers.length > 0 ? leaveCarryOvers : annualSummary?.carryOvers ?? []).some((carryOver) => Math.max(carryOver.daysCarried - carryOver.daysUsedFromCarry, 0) > 0)) && (
                                                <p className="text-sm text-[var(--text-muted)]">No carried-over annual leave is being tracked right now.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <LockedLeaveFeature
                                            title="Carry-over tracking"
                                            description="See unused annual leave from earlier cycles in a separate line, with a gentle note when it may be worth reviewing."
                                        />
                                    )}

                                    {advancedLeaveEnabled && carryOverNudge ? (
                                        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                                            <p className="font-bold">There are {formatLeaveValue(carryOverNudge.remainingDays)} days of unused annual leave from the cycle ending {format(new Date(carryOverNudge.carryOver.fromCycleEnd), "dd MMM yyyy")}.</p>
                                            <p className="mt-2">
                                                You may want to review this. The BCEA provides guidance on when earned leave should be granted. See the{" "}
                                                <a href="https://www.labour.gov.za" target="_blank" rel="noreferrer" className="font-bold underline">
                                                    Department of Employment and Labour website
                                                </a>{" "}
                                                for details.
                                            </p>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>

                            <Card className="glass-panel border-none">
                                <CardContent className="p-5 space-y-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Annual Leave Forecast</p>
                                        <h3 className="mt-2 text-lg font-black text-[var(--text)]">Usage at the current rate</h3>
                                    </div>

                                    {advancedLeaveEnabled ? (
                                        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                                            {forecast?.status === "not-enough-data" && (
                                                <p>Leave forecast will appear after a few months of tracking.</p>
                                            )}
                                            {forecast?.status === "may-run-out" && forecast.projectedDate && (
                                                <p>At the current rate, {employee.name}&apos;s annual leave balance may run out around {format(forecast.projectedDate, "MMMM yyyy")}.</p>
                                            )}
                                            {forecast?.status === "on-track" && (
                                                <p>
                                                    At the current rate, {employee.name} is on track to have about {formatLeaveValue(forecast.projectedRemainingAtCycleEnd ?? 0)} days remaining at the end of this cycle ({forecast.currentCycle ? format(forecast.currentCycle.end, "MMMM yyyy") : "later this cycle"}).
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <LockedLeaveFeature
                                            title="Leave forecasting"
                                            description="See when leave balances are likely to run low. Available on Pro."
                                        />
                                    )}
                                </CardContent>
                            </Card>
                            {visibleLeaveRecords.length > 0 ? (
                                <div className="space-y-2">
                                    {visibleLeaveRecords.slice(0, 5).map(lr => (
                                        <Card key={lr.id} className="glass-panel border-none">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                                                        {getLeaveTypeLabel(lr.type, customLeaveTypes, lr.typeLabel)} — {lr.days} day{lr.days !== 1 ? "s" : ""}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                        {formatLeaveRange(lr)}
                                                        {lr.note ? ` · ${lr.note}` : ""}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="glass-panel border-dashed border-2 p-8 text-center">
                                    <Palmtree className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                                    <p className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>
                                        {leaveArchiveResult.hiddenCount > 0 ? "Older leave records are hidden on this plan" : "No leave records"}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {leaveArchiveResult.hiddenCount > 0 ? "Upgrade to browse the full leave history here." : "Track leave taken per pay period."}
                                    </p>
                                </Card>
                            )}
                            {canUseLeaveTracking(currentPlan) ? (
                                <Link href={`/leave?employeeId=${id}`}>
                                    <Button variant="outline" className="w-full font-bold gap-2">
                                        <Palmtree className="h-4 w-4" /> Manage Leave Records
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/upgrade?plan=standard">
                                    <Button variant="outline" className="w-full font-bold gap-2">
                                        <Lock className="h-4 w-4" /> Upgrade To Track Leave
                                    </Button>
                                </Link>
                            )}
                            {leaveArchiveResult.hiddenCount > 0 && (
                                <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)]">You have {leaveArchiveResult.hiddenCount} older leave record{leaveArchiveResult.hiddenCount === 1 ? "" : "s"}.</p>
                                            <p className="text-sm text-[var(--text-muted)]">Upgrade to browse your full history here.</p>
                                        </div>
                                        <Link href={archiveUpgradeHref}>
                                            <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{archiveUpgradeLabel}</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                            <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
                                LekkerLedger helps you keep track of leave. It does not provide legal advice. For questions about leave entitlements, contact the Department of Employment and Labour or a professional adviser.
                            </p>
                        </div>
                    )}

                    {/* DOCUMENTS TAB */}
                    {activeTab === "documents" && (
                        <Card className="glass-panel border-none">
                            <CardContent className="p-5 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                                    Employee documents
                                </h3>
                                <Link href={`/documents?tab=contracts`}>
                                    <Button className="w-full h-12 justify-start gap-3 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold">
                                        <FolderOpen className="h-4 w-4" />
                                        Open the documents hub
                                    </Button>
                                </Link>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Contracts, certificates, exports, and older records should live in one documents area instead of being scattered through employee pages.
                                </p>
                                <Link href={`/contracts/new?employeeId=${id}`}>
                                    <Button variant="outline" className="w-full h-11 font-bold">
                                        Start a contract draft
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
            <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[var(--focus)]" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
                <span className="text-sm font-semibold text-right" style={{ color: "var(--text)" }}>{value}</span>
            </div>
        </div>
    );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/55 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-xl font-black text-[var(--text)]">{value}</p>
        </div>
    );
}

function LockedLeaveFeature({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">Pro</p>
            <p className="mt-2 text-sm font-bold text-[var(--text)]">{title}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
            <Link href="/upgrade" className="mt-4 inline-flex">
                <Button size="sm" className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
                    Upgrade to Pro
                </Button>
            </Link>
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




