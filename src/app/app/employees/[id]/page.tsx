"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    User, Clock, FileText, Palmtree,
    Pencil, Eye, Trash2, Loader2, FileBadge, ScrollText,
    CalendarDays, Banknote, Phone, Briefcase, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import {
    getEmployee, getPayslipsForEmployee, getLeaveForEmployee,
    getSettings, deletePayslip, getCurrentPayPeriod
} from "@/lib/storage";
import { Employee, PayslipInput, LeaveRecord, EmployerSettings, PayPeriod } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format } from "date-fns";
import { generateCertificateOfService } from "@/lib/certificate-pdf";

type Tab = "profile" | "history" | "leave" | "docs";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "history", label: "Pay History", icon: Clock },
    { id: "leave", label: "Leave", icon: Palmtree },
    { id: "docs", label: "Docs", icon: FileText },
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
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [currentPeriod, setCurrentPeriod] = React.useState<PayPeriod | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = React.useState(false);
    const [generatingContract, setGeneratingContract] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            if (!id) return;
            const [emp, ps, leave, s, cp] = await Promise.all([
                getEmployee(id), getPayslipsForEmployee(id), getLeaveForEmployee(id), getSettings(), getCurrentPayPeriod()
            ]);
            if (!emp) { router.push("/app/employees"); return; }
            setEmployee(emp);
            setPayslips([...ps].sort((a, b) => new Date(b.payPeriodStart).getTime() - new Date(a.payPeriodStart).getTime()));
            setLeaveRecords(leave);
            setSettings(s);
            setCurrentPeriod(cp);
            setLoading(false);
            const tabParam = searchParams?.get("tab") as Tab | null;
            if (tabParam && TABS.some(t => t.id === tabParam)) setActiveTab(tabParam);
        }
        load();
    }, [id, router, searchParams]);

    const handleDeletePayslip = async (psId: string) => {
        await deletePayslip(psId);
        setDeleteConfirmId(null);
        setPayslips(prev => prev.filter(p => p.id !== psId));
    };

    if (loading) {
        return <><PageHeader title="Employee" /><CardSkeleton /><CardSkeleton /></>;
    }

    if (!employee) return null;

    const annualLeaveDays = leaveRecords.filter(r => r.type === "annual").reduce((s, r) => s + r.days, 0);
    const sickLeaveDays = leaveRecords.filter(r => r.type === "sick").reduce((s, r) => s + r.days, 0);

    return (
        <>
            <PageHeader
                title="Employee Profile"
                actions={
                    <div className="flex gap-2">
                        {currentPeriod && (
                            <Link href={`/app/payroll/${currentPeriod.id}`}>
                                <Button size="sm" className="gap-1.5 h-8 text-xs font-bold bg-[var(--amber-500)] text-white hover:bg-[var(--amber-600)]">
                                    <Banknote className="h-3.5 w-3.5" /> Payroll
                                </Button>
                            </Link>
                        )}
                        <Link href={`/app/employees/${id}/edit`}>
                            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-bold">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Hero */}
            <div className="flex items-center gap-4 animate-fade-in">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0"
                    style={{ backgroundColor: "var(--amber-500)" }}>
                    {employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>{employee.name}</h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {employee.role} · R{employee.hourlyRate.toFixed(2)}/hr
                    </p>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1.5 rounded-2xl border border-[var(--border-subtle)]"
                style={{ backgroundColor: "var(--bg-surface)" }}>
                {TABS.map(({ id: tabId, label, icon: Icon }) => {
                    const active = activeTab === tabId;
                    return (
                        <button key={tabId} onClick={() => setActiveTab(tabId)} aria-pressed={active}
                            className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200"
                            style={{
                                backgroundColor: active ? "var(--amber-500)" : "transparent",
                                color: active ? "#ffffff" : "var(--text-muted)",
                                boxShadow: active ? "var(--shadow-sm)" : "none",
                            }}>
                            <Icon className="h-4 w-4" />{label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div className="animate-fade-in">
                {activeTab === "profile" && (
                    <div className="space-y-4">
                        {(!employee.startDate || !employee.idNumber || !employee.phone) && (
                            <Card className="glass-panel border-2 border-amber-500/30 bg-amber-500/5">
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                        <Briefcase className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Missing Information</h3>
                                        <p className="text-xs text-[var(--text-secondary)] mb-3">
                                            Please provide the following to ensure legally compliant payslips:
                                        </p>
                                        <ul className="text-xs space-y-1 mb-3 text-[var(--text-muted)] list-disc list-inside">
                                            {!employee.startDate && <li>Start date</li>}
                                            {!employee.idNumber && <li>ID Number</li>}
                                            {!employee.phone && <li>Phone number</li>}
                                        </ul>
                                        <Link href={`/app/employees/${id}/edit`}>
                                            <Button size="sm" className="bg-amber-500 text-white font-bold h-8 text-xs py-0">Complete Profile</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="glass-panel border-none">
                            <CardContent className="p-5 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Employment Details</h3>
                                <div className="grid gap-3">
                                    <ProfileRow icon={Briefcase} label="Role" value={employee.role} />
                                    <ProfileRow icon={Banknote} label="Hourly Rate" value={`R${employee.hourlyRate.toFixed(2)}/hr`} />
                                    <ProfileRow icon={CalendarDays} label="Start Date" value={employee.startDate ? format(new Date(employee.startDate), "dd MMM yyyy") : "Not set"} />
                                    <ProfileRow icon={Clock} label="Hours / Day" value={`${employee.ordinaryHoursPerDay}h`} />
                                    <ProfileRow icon={CalendarDays} label="Pay Frequency" value={employee.frequency} />
                                    {employee.phone && <ProfileRow icon={Phone} label="Phone" value={employee.phone} />}
                                    {employee.idNumber && <ProfileRow icon={User} label="ID Number" value={employee.idNumber} />}
                                    <ProfileRow icon={CheckCircle2} label="Works Sundays ordinarily" value={employee.ordinarilyWorksSundays ? "Yes (1.5× rate)" : "No (2× rate)"} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="space-y-3">
                        {payslips.length === 0 ? (
                            <Card className="glass-panel border-dashed border-2 p-10 text-center">
                                <Clock className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                                <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>No payslips yet</p>
                                <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>Generate the first payslip for {employee.name}.</p>
                                <Link href={`/wizard?empId=${id}`}>
                                    <Button className="bg-amber-500 text-white font-bold hover:bg-amber-600">Create Payslip</Button>
                                </Link>
                            </Card>
                        ) : (
                            payslips.map((ps, i) => {
                                const calc = calculatePayslip(ps);
                                return (
                                    <Card key={ps.id} className="glass-panel border-none animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                                                        {format(new Date(ps.payPeriodStart), "MMM d")} – {format(new Date(ps.payPeriodEnd), "MMM d, yyyy")}
                                                    </p>
                                                    <p className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                                                        Net: <strong>R{calc.netPay.toFixed(2)}</strong> · Gross: R{calc.grossPay.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {deleteConfirmId === ps.id ? (
                                                        <>
                                                            <span className="text-xs font-bold text-red-500">Delete?</span>
                                                            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold text-red-500 hover:bg-red-50"
                                                                onClick={() => handleDeletePayslip(ps.id)}>Yes</Button>
                                                            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold"
                                                                onClick={() => setDeleteConfirmId(null)}>No</Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link href={`/preview?payslipId=${ps.id}&empId=${id}`}>
                                                                <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/10 h-8">
                                                                    <Eye className="h-3.5 w-3.5" /> View
                                                                </Button>
                                                            </Link>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50"
                                                                onClick={() => setDeleteConfirmId(ps.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                        {payslips.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <Link href={`/wizard?empId=${id}`}>
                                    <Button className="w-full bg-amber-500 text-white font-bold hover:bg-amber-600">+ New Payslip</Button>
                                </Link>
                                <Link href={`/app/payroll?employeeId=${id}`}>
                                    <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--amber-500)]">
                                        View Full Payroll History
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )
                }

                {
                    activeTab === "leave" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Card className="glass-panel border-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{annualLeaveDays}</p>
                                        <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Annual Days Taken</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-panel border-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{sickLeaveDays}</p>
                                        <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Sick Days Taken</p>
                                    </CardContent>
                                </Card>
                            </div>
                            {leaveRecords.length > 0 ? (
                                <div className="space-y-2">
                                    {leaveRecords.slice(0, 5).map(lr => (
                                        <Card key={lr.id} className="glass-panel border-none">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                                                        {lr.type} leave — {lr.days} day{lr.days !== 1 ? "s" : ""}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                        {format(new Date(lr.date), "dd MMM yyyy")}{lr.note ? ` · ${lr.note}` : ""}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="glass-panel border-dashed border-2 p-8 text-center">
                                    <Palmtree className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                                    <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>No leave records</p>
                                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Track leave taken per pay period.</p>
                                </Card>
                            )}
                            <Link href={`/app/leave?employeeId=${id}`}>
                                <Button variant="outline" className="w-full font-bold gap-2">
                                    <Palmtree className="h-4 w-4" /> Manage Leave Records
                                </Button>
                            </Link>
                        </div>
                    )
                }

                {
                    activeTab === "docs" && (
                        <Card className="glass-panel border-none">
                            <CardContent className="p-5 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Generate Documents</h3>
                                <button
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                                    style={{ borderColor: "var(--border-subtle)" }}
                                    disabled={generatingPdf}
                                    onClick={async () => {
                                        if (!settings) return;
                                        setGeneratingPdf(true);
                                        try {
                                            const bytes = await generateCertificateOfService(employee, settings);
                                            const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a"); a.href = url;
                                            a.download = `${employee.name.replace(/\s+/g, "_")}_Certificate_of_Service.pdf`;
                                            a.click(); URL.revokeObjectURL(url);
                                        } catch { alert("Failed to generate PDF."); }
                                        finally { setGeneratingPdf(false); }
                                    }}>
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                        {generatingPdf ? <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> : <FileBadge className="h-5 w-5 text-amber-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Certificate of Service</p>
                                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>BCEA-compliant PDF for the employee</p>
                                    </div>
                                </button>

                                <button
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                                    style={{ borderColor: "var(--border-subtle)" }}
                                    disabled={generatingContract}
                                    onClick={async () => {
                                        if (!settings) return;
                                        setGeneratingContract(true);
                                        try {
                                            const { generateEmploymentContract } = await import("@/lib/contract-pdf");
                                            const bytes = await generateEmploymentContract(employee, settings);
                                            const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a"); a.href = url;
                                            a.download = `${employee.name.replace(/\s+/g, "_")}_Employment_Contract.pdf`;
                                            a.click(); URL.revokeObjectURL(url);
                                        } catch { alert("Failed to generate contract."); }
                                        finally { setGeneratingContract(false); }
                                    }}>
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                        {generatingContract ? <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> : <ScrollText className="h-5 w-5 text-amber-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Employment Contract</p>
                                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>BCEA-compliant contract PDF</p>
                                    </div>
                                </button>
                            </CardContent>
                        </Card>
                    )
                }
            </div >
        </>
    );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
                <span className="text-sm font-semibold text-right" style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
        </div>
    );
}

export default function EmployeeDetailPage() {
    return (
        <React.Suspense fallback={<><PageHeader title="Employee" /><CardSkeleton /><CardSkeleton /></>}>
            <EmployeeDetailContent />
        </React.Suspense>
    );
}
