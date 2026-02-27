"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Loader2, CheckCircle2, RefreshCw, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getPayslipsForEmployee } from "@/lib/storage";
import { Employee, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { generatePayslipPdfBytes } from "@/lib/pdf";
import { shareViaWhatsApp } from "@/lib/share";

function Row({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) {
    return (
        <div className="flex justify-between items-center py-2.5 text-sm" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ color: bold ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: bold ? 600 : 400 }}>
                {label}
            </span>
            <span
                className="tabular-nums font-medium"
                style={{ color: red ? "var(--red-500)" : bold ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: bold ? 700 : 500 }}
            >
                {value}
            </span>
        </div>
    );
}

function PreviewContent() {
    const searchParams = useSearchParams();
    const payslipId = searchParams?.get("payslipId");
    const empId = searchParams?.get("empId");

    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [payslip, setPayslip] = React.useState<PayslipInput | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [downloading, setDownloading] = React.useState(false);
    const [sharing, setSharing] = React.useState(false);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        async function load() {
            if (!payslipId || !empId) { setError("Payslip not found."); setLoading(false); return; }

            try {
                const [empList, payslips] = await Promise.all([
                    getEmployees(),
                    getPayslipsForEmployee(empId),
                ]);
                const emp = empList.find((e) => e.id === empId);
                const ps = payslips.find((p) => p.id === payslipId);

                if (!emp || !ps) { setError("Payslip data not found."); }
                else { setEmployee(emp); setPayslip(ps); }
            } catch (e) {
                console.error(e);
                setError("Failed to load payslip data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [payslipId, empId]);

    const handleDownload = async () => {
        if (!employee || !payslip) return;
        setDownloading(true);
        try {
            const bytes = await generatePayslipPdfBytes(employee, payslip);
            // Create a proper copy of the buffer to avoid SharedArrayBuffer issues
            const copy = bytes.slice(0);
            const blob = new Blob([copy], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Payslip_${employee.name.replace(/\s+/g, "_")}_${format(payslip.payPeriodStart, "MMM_yyyy")}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("PDF generation failed:", e);
            setError("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--amber-500)" }} />
            </div>
        );
    }

    if (error || !employee || !payslip) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
                <div className="max-w-xl mx-auto w-full px-4 py-12">
                    <Alert variant="error">
                        <AlertDescription>{error || "Something went wrong."}</AlertDescription>
                    </Alert>
                    <Link href="/employees" className="mt-4 block">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Employees
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const breakdown = calculatePayslip(payslip);
    const periodStr = `${format(payslip.payPeriodStart, "d MMM")} – ${format(payslip.payPeriodEnd, "d MMM yyyy")}`;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-30 px-4 py-3"
                style={{
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/employees">
                            <button
                                aria-label="Back"
                                className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--bg-subtle)]"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        </Link>
                        <h1 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                            Payslip Preview
                        </h1>
                    </div>
                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="gap-2"
                        size="sm"
                    >
                        {downloading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                        ) : (
                            <><Download className="h-4 w-4" /> Download PDF</>
                        )}
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-5">
                {/* Success banner */}
                <Alert variant="success" className="animate-slide-down">
                    <AlertDescription>
                        Payslip generated successfully for <strong>{employee.name}</strong>. Download the PDF below.
                    </AlertDescription>
                </Alert>

                {/* Employee identity card */}
                <Card className="animate-slide-up">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div
                                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0"
                                style={{ backgroundColor: "var(--amber-500)" }}
                            >
                                {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-lg leading-tight truncate" style={{ color: "var(--text-primary)" }}>
                                    {employee.name}
                                </p>
                                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {employee.role}
                                </p>
                                {employee.idNumber && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                        ID: {employee.idNumber}
                                    </p>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>PAY PERIOD</p>
                                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{periodStr}</p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>R{employee.hourlyRate.toFixed(2)}/hr</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payslip breakdown */}
                <Card className="animate-slide-up delay-100">
                    <CardContent className="p-5">
                        <p
                            className="text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: "var(--amber-500)" }}
                        >
                            Earnings
                        </p>
                        <Row label={`Ordinary (${payslip.ordinaryHours}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                        {payslip.overtimeHours > 0 && <Row label={`Overtime (${payslip.overtimeHours}h × 1.5)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} />}
                        {payslip.sundayHours > 0 && <Row label={`Sunday (${payslip.sundayHours}h × 2)`} value={`R ${breakdown.sundayPay.toFixed(2)}`} />}
                        {payslip.publicHolidayHours > 0 && <Row label={`Public Holiday (${payslip.publicHolidayHours}h × 2)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} />}
                        <Row label="Gross Pay" value={`R ${breakdown.grossPay.toFixed(2)}`} bold />

                        <p
                            className="text-xs font-bold uppercase tracking-widest mt-5 mb-3"
                            style={{ color: "var(--amber-500)" }}
                        >
                            Deductions
                        </p>
                        <Row
                            label={`UIF ${breakdown.totalHours > 24 ? "(1%)" : "(not applicable ≤24hrs)"}`}
                            value={`-R ${breakdown.deductions.uifEmployee.toFixed(2)}`}
                            red
                        />
                        {payslip.includeAccommodation && breakdown.deductions.accommodation && (
                            <Row label="Accommodation (10%)" value={`-R ${breakdown.deductions.accommodation.toFixed(2)}`} red />
                        )}
                        <Row label="Total Deductions" value={`R ${breakdown.deductions.total.toFixed(2)}`} bold />
                    </CardContent>

                    {/* Net Pay */}
                    <div
                        className="flex items-center justify-between px-5 py-5 rounded-b-2xl"
                        style={{ backgroundColor: "var(--amber-500)" }}
                    >
                        <div>
                            <p className="text-white font-bold text-lg">Net Pay</p>
                            <p className="text-white/70 text-xs">Employee takes home</p>
                        </div>
                        <p className="text-white font-extrabold text-3xl tabular-nums">
                            R {breakdown.netPay.toFixed(2)}
                        </p>
                    </div>
                </Card>

                {/* Employer contribution note */}
                <Card className="animate-slide-up delay-200">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                            Employer Record (not deducted from worker)
                        </p>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: "var(--text-secondary)" }}>UIF — Employer contribution (1%)</span>
                            <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                                R {breakdown.employerContributions.uifEmployer.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col gap-3 animate-slide-up delay-300 pb-6">
                    <Button
                        size="lg"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full gap-2 h-12 text-base font-bold"
                    >
                        {downloading ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Generating PDF…</>
                        ) : (
                            <><Download className="h-5 w-5" /> Download PDF</>
                        )}
                    </Button>

                    {/* WhatsApp Share */}
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full gap-2 h-12 text-base"
                        disabled={sharing}
                        onClick={async () => {
                            if (!employee || !payslip) return;
                            setSharing(true);
                            try {
                                const bytes = await generatePayslipPdfBytes(employee, payslip);
                                const periodLabel = format(payslip.payPeriodStart, "MMM_yyyy");
                                await shareViaWhatsApp(bytes.slice(0), employee.name, employee.phone || "", periodLabel);
                            } catch (e) {
                                console.error("Share failed:", e);
                            }
                            setSharing(false);
                        }}
                        style={{ borderColor: "#25D366", color: "#25D366" }}
                    >
                        {sharing ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Sharing…</>
                        ) : (
                            <><MessageCircle className="h-5 w-5" /> Share via WhatsApp</>
                        )}
                    </Button>

                    <Link href={`/wizard?empId=${employee.id}`}>
                        <Button size="lg" variant="outline" className="w-full gap-2">
                            <RefreshCw className="h-4 w-4" /> New Payslip for {employee.name.split(" ")[0]}
                        </Button>
                    </Link>

                    <Link href="/employees">
                        <Button size="lg" variant="ghost" className="w-full gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Done
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <React.Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--amber-500)" }} />
                </div>
            }
        >
            <PreviewContent />
        </React.Suspense>
    );
}
