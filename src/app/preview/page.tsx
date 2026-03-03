"use client";

// import "../../lib/pdf.worker.ts";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Loader2, CheckCircle2, MessageCircle, AlertCircle, CheckCircle, ChevronDown, ChevronUp, FileText, ShieldCheck, Copy } from "lucide-react";
import { triggerCelebration } from "@/components/ui/confetti-trigger";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getEmployees, getPayslipsForEmployee, getSettings, getUsageStats, incrementUsageCount } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { shareViaWhatsApp } from "@/lib/share";
import { getComplianceAudit, generateComplianceNoteText } from "@/lib/compliance";
import { generatePayslipPdfBytes } from "@/lib/pdf";

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

function ComplianceRow({ label, status, text }: { label: string; status: boolean; text: string }) {
    return (
        <div className="flex items-start gap-2.5">
            {status ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
            )}
            <div>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-xs sm:text-[11px] leading-tight mt-0.5" style={{ color: status ? "var(--text-secondary)" : "var(--rose-500)" }}>{text}</p>
            </div>
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
    const [downloading, setDownloading] = React.useState<string | boolean>("");
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [error, setError] = React.useState("");
    const [showFullAudit, setShowFullAudit] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [usageStats, setUsageStats] = React.useState({ count30Days: 0, isLimited: false });

    React.useEffect(() => {
        async function load() {
            if (!payslipId || !empId) { setError("Payslip not found."); setLoading(false); return; }
            try {
                const [empList, payslips, s, stats] = await Promise.all([
                    getEmployees(),
                    getPayslipsForEmployee(empId),
                    getSettings(),
                    getUsageStats(),
                ]);
                const emp = empList.find((e: Employee) => e.id === empId);
                const ps = payslips.find((p: PayslipInput) => p.id === payslipId);

                if (!emp || !ps) { setError("Payslip data not found."); }
                else {
                    setEmployee(emp);
                    setPayslip(ps);
                    setSettings(s);
                    setUsageStats(stats);
                    triggerCelebration();
                }
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
        if (!employee || !payslip || !settings) return;

        // GA4 conversion tracking
        try {
            if (typeof window !== 'undefined' && 'gtag' in window) {
                (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'payslip_export', {
                    method: 'download_pdf',
                });
            }
        } catch (e) {
            console.error('GA4 tracking failed:', e);
        }

        setDownloading(true);
        try {
            // Dates come from localStorage as ISO strings, not Date objects — coerce them
            const payslipWithDates = {
                ...payslip,
                payPeriodStart: new Date(payslip.payPeriodStart),
                payPeriodEnd: new Date(payslip.payPeriodEnd),
                createdAt: new Date(payslip.createdAt),
            };
            const bytes: Uint8Array = await generatePayslipPdfBytes(employee, payslipWithDates, settings, settings.defaultLanguage, usageStats.isLimited);


            await incrementUsageCount();
            const stats = await getUsageStats();
            setUsageStats(stats);

            const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Payslip_${employee.name.replace(/\s+/g, "_")}_${format(payslipWithDates.payPeriodStart, "MMM_yyyy")}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("PDF generation failed:", e);
            const msg = e instanceof Error ? e.message : String(e);
            setError(`Failed to generate PDF: ${msg}`);

        } finally {
            setDownloading(false);
        }
    };

    const handleWhatsApp = async () => {
        if (!employee || !payslip || !settings) return;
        setDownloading("whatsapp");
        try {
            const payslipWithDates = {
                ...payslip,
                payPeriodStart: new Date(payslip.payPeriodStart),
                payPeriodEnd: new Date(payslip.payPeriodEnd),
                createdAt: new Date(payslip.createdAt),
            };
            const bytes = await generatePayslipPdfBytes(employee, payslipWithDates, settings, settings.defaultLanguage, usageStats.isLimited);
            const periodLabel = format(payslipWithDates.payPeriodStart, "MMM yyyy");
            await shareViaWhatsApp(bytes, employee.name, employee.phone ?? "", periodLabel);
        } catch (e) {
            console.error("WhatsApp share failed:", e);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        );
    }

    if (error || !employee || !payslip) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: "var(--bg-base)" }}>
                <Alert variant="error" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || "Something went wrong."}</AlertDescription>
                </Alert>
                <Link href="/employees" className="mt-6">
                    <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                </Link>
            </div>
        );
    }

    const breakdown = calculatePayslip(payslip);
    const _periodStr = `${format(new Date(payslip.payPeriodStart), "d MMM")} – ${format(new Date(payslip.payPeriodEnd), "d MMM yyyy")}`;
    void _periodStr; // computed for potential future display

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel border-b border-[var(--border-subtle)]">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/employees">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <p className="text-[10px] leading-none mb-0.5" style={{ color: "var(--text-muted)" }}>
                                <Link href="/employees" className="hover:underline">Employees</Link> › {employee?.name ?? "Payslip"}
                            </p>
                            <h1 className="font-bold text-base text-[var(--text-primary)]">Payslip Preview</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleWhatsApp}
                            disabled={!!downloading}
                            size="sm"
                            variant="outline"
                            className="gap-2 border-green-600/40 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                        <Button onClick={handleDownload} disabled={!!downloading} size="sm" className="gap-2 bg-amber-500 text-white">
                            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            <span className="hidden sm:inline">Download</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full pb-24 lg:pb-8">
                {/* Usage Warning */}
                {usageStats.isLimited && (
                    <Alert variant="warning" className="animate-slide-down border-amber-500 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-900">
                            <strong>Free limit reached (2/month).</strong> This copy will be watermarked.
                            <Link href="/pricing" className="ml-2 underline font-bold">Upgrade to Pro</Link> to remove limits.
                        </AlertDescription>
                    </Alert>
                )}

                <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>Payslip generated for <strong>{employee.name}</strong>.</AlertDescription>
                </Alert>

                <Card className="border-none glass-panel shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-xl">
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg text-[var(--text-primary)] truncate">{employee.name}</p>
                            <p className="text-sm text-[var(--text-secondary)]">{employee.role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-muted uppercase">Period</p>
                            <p className="text-xs font-bold text-[var(--text-primary)]">{format(new Date(payslip.payPeriodEnd), "MMM yyyy")}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none glass-panel overflow-hidden">
                    <CardContent className="p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Earnings</p>
                        <Row label={`Ordinary (${payslip.ordinaryHours}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                        {payslip.overtimeHours > 0 && <Row label={`Overtime (${payslip.overtimeHours}h)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} />}
                        <Row label="Gross Pay" value={`R ${breakdown.grossPay.toFixed(2)}`} bold />

                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-5 mb-2">Deductions</p>
                        <Row label="UIF (1%)" value={`-R ${breakdown.deductions.uifEmployee.toFixed(2)}`} red />
                        {breakdown.deductions.accommodation && <Row label="Accommodation" value={`-R ${breakdown.deductions.accommodation.toFixed(2)}`} red />}
                        <Row label="Total Deductions" value={`R ${breakdown.deductions.total.toFixed(2)}`} bold />
                    </CardContent>
                    <div className="bg-amber-500 p-5 flex items-center justify-between text-white">
                        <div>
                            <p className="font-bold text-lg">Net Pay</p>
                            <p className="text-white/70 text-xs">Take home</p>
                        </div>
                        <p className="font-black text-3xl tabular-nums">R {breakdown.netPay.toFixed(2)}</p>
                    </div>
                </Card>

                <div className="flex flex-col gap-3">
                    <Button onClick={handleDownload} disabled={!!downloading} className="w-full h-12 text-base font-bold bg-amber-500 text-white">
                        {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
                        Download PDF
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-12 text-[#25D366] font-extrabold bg-[#25D366]/5 hover:bg-[#25D366]/10 border-[#25D366]/30 shadow-sm"
                        onClick={async () => {
                            if (!employee || !payslip || !settings) return;
                            setDownloading('wa');
                            try {
                                const bytes: Uint8Array = await new Promise((resolve, reject) => {
                                    const worker = new Worker(new URL('../pdf.worker.ts', import.meta.url));
                                    worker.onmessage = (e) => {
                                        const { bytes, error } = e.data;
                                        if (error) reject(new Error(error));
                                        else resolve(bytes);
                                        worker.terminate();
                                    };
                                    worker.onerror = (e) => { reject(new Error(e.message)); worker.terminate(); };
                                    worker.postMessage({ employee, payslip, settings, msgId: 'wa', isLimited: usageStats.isLimited });
                                });
                                await incrementUsageCount();
                                const stats = await getUsageStats();
                                setUsageStats(stats);
                                await shareViaWhatsApp(bytes, employee.name, employee.phone || "", format(payslip.payPeriodEnd, "MMM_yyyy"));
                            } catch (e) { console.error(e); }
                            setDownloading("");
                        }}
                    >
                        <MessageCircle className="h-5 w-5 mr-2" /> Share via WhatsApp
                    </Button>
                </div>

                {!settings?.simpleMode && (
                    <Card className="border-none glass-panel">
                        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setShowFullAudit(!showFullAudit)}>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-amber-500" />
                                <h3 className="font-bold text-sm uppercase">SD7 Compliance Audit</h3>
                            </div>
                            {showFullAudit ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        <div className="px-4 pb-4 space-y-3">
                            <ComplianceRow
                                label="Wage Status"
                                status={getComplianceAudit(employee, breakdown, payslip.payPeriodEnd).wageCompliant}
                                text={getComplianceAudit(employee, breakdown, payslip.payPeriodEnd).wageStatusText}
                            />
                            {showFullAudit && (
                                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-4">
                                    <ComplianceRow
                                        label="UIF Compliance"
                                        status={getComplianceAudit(employee, breakdown, payslip.payPeriodEnd).uifCompliant}
                                        text={getComplianceAudit(employee, breakdown, payslip.payPeriodEnd).uifStatusText}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 gap-2 text-[11px]"
                                            disabled={downloading === "audit"}
                                            onClick={async () => {
                                                setDownloading("audit");
                                                try {
                                                    const { generateBCEASummaryPdf } = await import('@/lib/compliance-pdf');
                                                    const bytes = await generateBCEASummaryPdf(employee, payslip, settings!);
                                                    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement("a");
                                                    link.href = url;
                                                    link.download = `Audit_${employee.name.replace(/\s+/g, "_")}.pdf`;
                                                    link.click();
                                                } catch (e) { console.error(e); } finally { setDownloading(""); }
                                            }}
                                        >
                                            {downloading === "audit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Audit PDF
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 gap-2 text-[11px]"
                                            disabled={downloading === "cert"}
                                            onClick={async () => {
                                                setDownloading("cert");
                                                try {
                                                    const { generateCertificateOfServicePdf } = await import('@/lib/compliance-pdf');
                                                    const bytes = await generateCertificateOfServicePdf(employee, settings!);
                                                    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement("a");
                                                    link.href = url;
                                                    link.download = `Certificate_${employee.name.replace(/\s+/g, "_")}.pdf`;
                                                    link.click();
                                                } catch (e) { console.error(e); } finally { setDownloading(""); }
                                            }}
                                        >
                                            {downloading === "cert" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Certificate
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs gap-2"
                                        onClick={() => {
                                            const text = generateComplianceNoteText(employee, breakdown, payslip.payPeriodEnd);
                                            navigator.clipboard.writeText(text).then(() => {
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            });
                                        }}
                                    >
                                        {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                        {copied ? "Copied!" : "Copy Legal Summary"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </main>
            <BottomNav />
        </div>
    );
}

export default function PreviewPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>}>
            <PreviewContent />
        </React.Suspense>
    );
}
