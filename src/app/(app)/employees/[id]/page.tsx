"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft, User, Clock, FileText, Palmtree,
    Pencil, Trash2, Loader2,
    CalendarDays, Banknote, Phone, Briefcase, CheckCircle2, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeLeaveTab } from "@/components/employees/employee-leave-tab";
import {
    getContractsForEmployee, getEmployee, getLeaveCarryOversForEmployee, getPayslipsForEmployee, getLeaveForEmployee, getSettings,
    deletePayslip
} from "@/lib/storage";
import { Employee, LeaveCarryOver, PayslipInput, LeaveRecord, Contract, CustomLeaveType } from "@/lib/schema";
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

function EmployeeDetailContent() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const id = params?.id ?? "";
    const profileSectionRef = React.useRef<HTMLDivElement | null>(null);

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
    const [showProfileEditCta, setShowProfileEditCta] = React.useState(false);

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

    React.useEffect(() => {
        if (activeTab !== "profile") {
            setShowProfileEditCta(false);
            return;
        }

        const node = profileSectionRef.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            setShowProfileEditCta(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowProfileEditCta(entry.isIntersecting);
            },
            {
                threshold: 0.35,
                rootMargin: "0px 0px -18% 0px",
            },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [activeTab]);

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
    const formattedStartDate = employee.startDate ? format(new Date(employee.startDate), "dd MMM yyyy") : "Not set";
    const employeeRole = employee.role || "Domestic Worker";

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
                {/* Summary */}
                <div className="animate-fade-in rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)]">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white"
                            style={{ backgroundColor: "var(--primary)" }}
                        >
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <SummaryPill>{employeeRole}</SummaryPill>
                                <SummaryPill>R{employee.hourlyRate.toFixed(2)}/hr</SummaryPill>
                                <SummaryPill>{employee.frequency}</SummaryPill>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <SummaryStat label="Started" value={formattedStartDate} />
                                <SummaryStat label="Hours / day" value={`${employee.ordinaryHoursPerDay}h`} />
                                <SummaryStat label="Phone" value={employee.phone || "Not added"} />
                            </div>
                        </div>
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
                        <div ref={profileSectionRef}>
                            <Card className="border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-sm)]">
                                <CardContent className="p-0">
                                    <div className="border-b border-[var(--border)] px-5 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                            Employment details
                                        </p>
                                        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-[var(--text-muted)]">
                                            Review the main employment details here. When this section is on screen, an edit action appears at the bottom so updates stay close to the information they change.
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid gap-3">
                                            <ProfileRow icon={Briefcase} label="Role" value={employeeRole} />
                                            <ProfileRow icon={Banknote} label="Hourly Rate" value={`R${employee.hourlyRate.toFixed(2)}/hr`} />
                                            <ProfileRow icon={CalendarDays} label="Start Date" value={formattedStartDate} />
                                            <ProfileRow icon={Clock} label="Hours / Day" value={`${employee.ordinaryHoursPerDay}h`} />
                                            <ProfileRow icon={CalendarDays} label="Pay Frequency" value={employee.frequency} />
                                            {employee.phone ? <ProfileRow icon={Phone} label="Phone" value={employee.phone} /> : null}
                                            {employee.idNumber ? <ProfileRow icon={User} label="ID Number" value={employee.idNumber} /> : null}
                                            <ProfileRow
                                                icon={CheckCircle2}
                                                label="Works Sundays ordinarily"
                                                value={employee.ordinarilyWorksSundays ? "Yes (1.5× rate)" : "No (2× rate)"}
                                            />
                                        </div>
                                    </div>
                                    <div className="border-t border-[var(--border)] px-5 py-4">
                                        {!showDeleteConfirm ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-700">Remove record</p>
                                                    <p className="mt-2 max-w-[62ch] text-sm leading-6 text-[var(--text-muted)]">
                                                        Delete this employee and remove related payslips and leave records from this device.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="w-full rounded-2xl border border-red-200 bg-red-50 font-bold text-red-700 hover:bg-red-100 hover:text-red-800 sm:w-auto"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete employee
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-1 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                                                <p className="text-sm font-bold text-red-800">Are you sure? This will delete all payslips and leave records for this employee.</p>
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
                                                        className="flex-1 bg-red-600 font-bold text-white hover:bg-red-700"
                                                    >
                                                        Yes, Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
                                            <p className="text-sm font-bold text-[var(--text)]">{getArchiveUpgradeMessage(currentPlan.id, payslipArchiveResult.hiddenCount, "payslip")}</p>
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
                        <EmployeeLeaveTab
                            employee={employee}
                            leaveRecords={leaveRecords}
                            leaveCarryOvers={leaveCarryOvers}
                            contracts={contracts}
                            customLeaveTypes={customLeaveTypes}
                            currentPlan={currentPlan}
                            advancedLeaveEnabled={advancedLeaveEnabled}
                        />
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

            {activeTab === "profile" && showProfileEditCta ? (
                <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4">
                    <div className="mx-auto flex max-w-4xl justify-end">
                        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/95 p-2 shadow-[var(--shadow-md)] backdrop-blur-sm sm:w-auto sm:max-w-none">
                            <p className="pl-2 text-xs font-medium text-[var(--text-muted)]">
                                Update role, pay, phone, or start date.
                            </p>
                            <Link href={`/employees/${id}/edit`}>
                                <Button className="h-11 rounded-xl bg-[var(--primary)] px-4 font-bold text-white hover:bg-[var(--primary-hover)]">
                                    <Pencil className="mr-2 h-4 w-4" /> Edit details
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SummaryPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text)]">
            {children}
        </span>
    );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/55 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-sm font-bold text-[var(--text)]">{value}</p>
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










