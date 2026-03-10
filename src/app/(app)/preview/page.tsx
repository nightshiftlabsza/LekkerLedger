"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Loader2, CheckCircle2, MessageCircle, AlertCircle, Mail, ShieldCheck, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { getEmployees, getPayslipsForEmployee, getSettings } from "@/lib/storage";
import { Employee, EmployerSettings, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";
import { shareViaEmail, shareViaWhatsApp } from "@/lib/share";
import { getComplianceAudit } from "@/lib/compliance";
import { track } from "@/lib/analytics";

function Row({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) {
    return (
        <div className="flex items-center justify-between border-b border-[var(--border)] py-2.5 text-sm last:border-0">
            <span className={bold ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"}>{label}</span>
            <span className={`tabular-nums ${bold ? "font-bold text-[var(--text)]" : "font-medium"} ${red ? "text-[var(--danger)]" : ""}`}>
                {value}
            </span>
        </div>
    );
}

async function buildPayslipPdf(
    employee: Employee,
    payslip: PayslipInput,
    settings: EmployerSettings,
) {
    const normalisedPayslip = {
        ...payslip,
        payPeriodStart: new Date(payslip.payPeriodStart),
        payPeriodEnd: new Date(payslip.payPeriodEnd),
        createdAt: new Date(payslip.createdAt),
    };
    const bytes = await generatePayslipPdfBytes(employee, normalisedPayslip, settings, settings.defaultLanguage);
    const fileName = getPayslipFilename(employee, normalisedPayslip);
    const periodLabel = format(normalisedPayslip.payPeriodEnd, "MMM yyyy");
    return { bytes, fileName, periodLabel };
}

function PreviewContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const payslipId = searchParams?.get("payslipId");
    const empId = searchParams?.get("empId");

    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [payslip, setPayslip] = React.useState<PayslipInput | null>(null);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);

    const [loading, setLoading] = React.useState(true);
    const [action, setAction] = React.useState<"" | "download" | "whatsapp" | "email">("");
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        async function load() {
            if (!payslipId || !empId) {
                setError("Payslip not found.");
                setLoading(false);
                return;
            }

            try {
                const [employeeRows, payslips, loadedSettings] = await Promise.all([
                    getEmployees(),
                    getPayslipsForEmployee(empId),
                    getSettings(),
                ]);

                const foundEmployee = employeeRows.find((entry) => entry.id === empId);
                const foundPayslip = payslips.find((entry) => entry.id === payslipId);

                if (!foundEmployee || !foundPayslip) {
                    setError("Payslip data not found.");
                } else {
                    setEmployee(foundEmployee);
                    setPayslip(foundPayslip);
                    setSettings(loadedSettings);
                }
            } catch (loadError) {
                console.error(loadError);
                setError("Failed to load payslip data.");
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [empId, payslipId]);

    const runAction = async (nextAction: "download" | "whatsapp" | "email") => {
        if (!employee || !payslip || !settings) return;

        setAction(nextAction);
        try {
            const { bytes, fileName, periodLabel } = await buildPayslipPdf(employee, payslip, settings);

            if (nextAction === "download") {
                const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                track("payslip_export", { method: "download_pdf" });
                toast("Payslip downloaded.", "success");
                return;
            }

            if (nextAction === "whatsapp") {
                const result = await shareViaWhatsApp(bytes, employee.name, employee.phone ?? "", periodLabel);
                const hasEmployeePhone = Boolean(employee.phone?.trim());

                if (result === "shared") {
                    toast("Share sheet opened. Choose WhatsApp and then pick the chat.", "info");
                } else if (hasEmployeePhone) {
                    toast("WhatsApp opened for this employee. Attach the downloaded PDF before sending.", "info");
                } else {
                    toast("Payslip downloaded. Add a phone number on the employee record to open their WhatsApp chat automatically.", "info");
                }
                return;
            }

            const result = await shareViaEmail(bytes, employee.name, periodLabel);
            toast(result === "shared" ? "Email share opened." : "Payslip downloaded. Attach it from Downloads in your email app.", "info");
        } catch (actionError) {
            console.error(actionError);
            toast(actionError instanceof Error ? actionError.message : "Could not prepare the payslip.", "error");
        } finally {
            setAction("");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--focus)]" />
            </div>
        );
    }

    if (error || !employee || !payslip || !settings) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-[var(--bg)]">
                <Alert variant="error" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || "Something went wrong."}</AlertDescription>
                </Alert>
                <Link href="/employees">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                </Link>
            </div>
        );
    }

    const breakdown = calculatePayslip(payslip);
    const audit = getComplianceAudit(employee, breakdown, payslip.payPeriodEnd);
    const periodLabel = `${format(new Date(payslip.payPeriodStart), "d MMM")} - ${format(new Date(payslip.payPeriodEnd), "d MMM yyyy")}`;
    const employeeRole = employee.role || "Domestic Worker";
    const employerCost = breakdown.grossPay + breakdown.employerContributions.uifEmployer;

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href={`/employees/${employee.id}?tab=history`}>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                    <Link href="/employees" className="hover:underline">Employees</Link> {" › "}
                                    <Link href={`/employees/${employee.id}?tab=history`} className="hover:underline">Payslips</Link>
                                </p>
                                <h1 className="text-lg font-black text-[var(--text)]">Payslip record</h1>
                                <p className="text-sm text-[var(--text-muted)]">{employee.name} · {periodLabel}</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <Button variant="outline" className="gap-2" onClick={() => void runAction("email")} disabled={!!action}>
                                {action === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                Email
                            </Button>
                            <Button variant="outline" className="gap-2 border-green-600/30 text-green-700 hover:bg-green-50" onClick={() => void runAction("whatsapp")} disabled={!!action}>
                                {action === "whatsapp" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                                WhatsApp
                            </Button>
                            <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]" onClick={() => void runAction("download")} disabled={!!action}>
                                {action === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>

                <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>Payslip ready to review, download, and share.</AlertDescription>
                </Alert>

                <Card className="glass-panel border-none">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)] text-xl font-black text-white">
                                {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Worker</p>
                                <p className="text-lg font-black text-[var(--text)]">{employee.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Role</p>
                            <p className="text-sm font-semibold text-[var(--text)]">{employeeRole}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <Card className="glass-panel border-none overflow-hidden">
                        <CardContent className="p-5">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--focus)]">Earnings</p>
                            <Row label={`Ordinary (${payslip.ordinaryHours}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                            {payslip.overtimeHours > 0 && <Row label={`Overtime (${payslip.overtimeHours}h)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} />}
                            {payslip.sundayHours > 0 && <Row label={`Sunday (${payslip.sundayHours}h)`} value={`R ${breakdown.sundayPay.toFixed(2)}`} />}
                            {payslip.publicHolidayHours > 0 && <Row label={`Public holiday (${payslip.publicHolidayHours}h)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} />}
                            <Row label="Gross pay" value={`R ${breakdown.grossPay.toFixed(2)}`} bold />

                            <p className="mb-2 mt-6 text-[10px] font-black uppercase tracking-widest text-[var(--focus)]">Deductions</p>
                            <Row label="Employee UIF (1%)" value={`-R ${breakdown.deductions.uifEmployee.toFixed(2)}`} red />
                            {breakdown.deductions.accommodation ? <Row label="Accommodation" value={`-R ${breakdown.deductions.accommodation.toFixed(2)}`} red /> : null}
                            {breakdown.deductions.shortfall ? <Row label="Shortfall" value={`-R ${breakdown.deductions.shortfall.toFixed(2)}`} red /> : null}
                            {breakdown.deductions.advance ? <Row label="Advance" value={`-R ${breakdown.deductions.advance.toFixed(2)}`} red /> : null}
                            {breakdown.deductions.other ? <Row label="Other deductions" value={`-R ${breakdown.deductions.other.toFixed(2)}`} red /> : null}
                            <Row label="Total deductions" value={`R ${breakdown.deductions.total.toFixed(2)}`} bold />

                            <p className="mb-2 mt-6 text-[10px] font-black uppercase tracking-widest text-[var(--focus)]">Employer side</p>
                            <Row label="Employer UIF (1%)" value={`R ${breakdown.employerContributions.uifEmployer.toFixed(2)}`} />
                            <Row label="Employer cost this period" value={`R ${employerCost.toFixed(2)}`} bold />
                        </CardContent>
                        <div className="grid gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] p-5 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Employer cost</p>
                                <p className="mt-2 text-2xl font-black tabular-nums text-[var(--text)]">R {employerCost.toFixed(2)}</p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">Gross pay plus the employer UIF contribution.</p>
                            </div>
                            <div className="rounded-2xl bg-[var(--primary)] p-4 text-white shadow-[var(--shadow-sm)]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/75">Net transfer amount</p>
                                <p className="mt-2 text-2xl font-black tabular-nums">R {breakdown.netPay.toFixed(2)}</p>
                                <p className="mt-1 text-xs text-white/80">This is the amount to send to the employee.</p>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="glass-panel border-none">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text)]">Quick checks</h2>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-[var(--text)]">Pay level</p>
                                        <p className={`text-sm ${audit.wageCompliant ? "text-[var(--text-muted)]" : "text-[var(--danger)]"}`}>{audit.wageStatusText}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text)]">UIF</p>
                                        <p className={`text-sm ${audit.uifCompliant ? "text-[var(--text-muted)]" : "text-[var(--danger)]"}`}>{audit.uifStatusText}</p>
                                    </div>
                                </div>
                                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                                    This is a quick sense-check, not a legal verdict. If you need certificates, contracts, or other paperwork, keep them together in Documents.
                                </p>
                                <Link href="/documents">
                                    <Button variant="outline" className="w-full gap-2 font-bold">
                                        <FolderOpen className="h-4 w-4" /> Open Documents
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <div className="grid gap-3 sm:hidden">
                            <Button variant="outline" className="h-11 gap-2" onClick={() => void runAction("email")} disabled={!!action}>
                                {action === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                Email
                            </Button>
                            <Button variant="outline" className="h-11 gap-2 border-green-600/30 text-green-700 hover:bg-green-50" onClick={() => void runAction("whatsapp")} disabled={!!action}>
                                {action === "whatsapp" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                                WhatsApp
                            </Button>
                            <Button className="h-11 gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]" onClick={() => void runAction("download")} disabled={!!action}>
                                {action === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><Loader2 className="h-8 w-8 animate-spin text-[var(--focus)]" /></div>}>
            <PreviewContent />
        </React.Suspense>
    );
}

