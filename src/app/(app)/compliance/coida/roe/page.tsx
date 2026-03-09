"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronRight,
    Download,
    ShieldCheck,
    Sparkles,
    Copy,
    Check,
    HelpCircle,
    Info,
    Calendar,
    Users,
    Banknote,
    ExternalLink,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateRoeData, type RoeData } from "@/lib/coida/roe";
import { generateRoePayrollPdfBytes, generateEmployerConfirmationPdfBytes } from "@/lib/coida/coida-pdf";
import { generateRoeCsv } from "@/lib/coida/coida-csv";
import { getSettings, getEmployees, getAllPayslips, logAuditEvent } from "@/lib/storage";
import { canDownloadRoePack, getUserPlan } from "@/lib/entitlements";
import { useToast } from "@/components/ui/toast";
import { Employee, EmployerSettings, PayslipInput } from "@/lib/schema";

/**
 * Simple browser side bytes download
 */
function downloadBlob(bytes: Uint8Array | string, filename: string, type: string) {
    const part = typeof bytes === "string" ? bytes : bytes.slice(0);
    const blob = new Blob([part], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function getCurrentCoidStartYear(now = new Date()) {
    return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
}

export default function RoePackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = React.useState(1);
    const [loading, setLoading] = React.useState(false);
    const currentCoidYear = React.useMemo(() => getCurrentCoidStartYear(), []);
    const availableYears = React.useMemo(() => [currentCoidYear, currentCoidYear - 1], [currentCoidYear]);
    const [selectedYear, setSelectedYear] = React.useState(() => getCurrentCoidStartYear());
    const [roeData, setRoeData] = React.useState<RoeData | null>(null);
    const [isPaid, setIsPaid] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [payslips, setPayslips] = React.useState<PayslipInput[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);

    React.useEffect(() => {
        async function load() {
            const [emps, pss, s] = await Promise.all([
                getEmployees(),
                getAllPayslips(),
                getSettings()
            ]);
            setEmployees(emps);
            setPayslips(pss);
            setSettings(s);
            const plan = getUserPlan(s);
            setIsPaid(!!s && canDownloadRoePack(plan));
        }
        load();
    }, []);

    const handleDownloadReport = async (type: "pdf" | "csv") => {
        if (!roeData || !settings) return;
        if (!isPaid) {
            toast("Upgrade required to download ROE documents.");
            return;
        }
        try {
            if (type === "pdf") {
                const bytes = await generateRoePayrollPdfBytes(roeData, employees, payslips, settings);
                downloadBlob(bytes, `LekkerLedger_ROE_Payroll_Report_${roeData.coidYear}.pdf`, "application/pdf");
            } else {
                const csv = generateRoeCsv(roeData, employees, payslips);
                downloadBlob(csv, `LekkerLedger_ROE_Raw_Data_${roeData.coidYear}.csv`, "text/csv");
            }
            await logAuditEvent("EXPORT_ROE", `Downloaded ROE Payroll Report (${type})`, { year: roeData.coidYear });
            toast("Download started!");
        } catch (err) {
            console.error(err);
            toast("Failed to generate document.");
        }
    };

    const handleDownloadConfirmation = async () => {
        if (!settings) return;
        if (!isPaid) {
            toast("Upgrade required to download ROE documents.");
            return;
        }
        try {
            const bytes = await generateEmployerConfirmationPdfBytes(settings);
            downloadBlob(bytes, `LekkerLedger_ROE_Employer_Confirmation.pdf`, "application/pdf");
            await logAuditEvent("EXPORT_ROE", "Downloaded ROE Employer Confirmation PDF");
            toast("Download started!");
        } catch (err) {
            console.error(err);
            toast("Failed to generate document.");
        }
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const data = await calculateRoeData(selectedYear);
            setRoeData(data);
            setStep(2);
        } catch (error) {
            console.error(error);
            toast("Failed to calculate ROE data.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast(`${label} copied!`);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <div className="max-w-xl mx-auto mb-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)]">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : router.push("/dashboard")}
                        aria-label="Back"
                        className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text)" }}>
                            {step === 1 ? "Return of Earnings (ROE) Pack" : `ROE Pack for ${selectedYear}/${selectedYear + 1}`}
                        </h1>
                        {step > 1 && <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Assessment Year</p>}
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full px-4 py-6">
                <div className="max-w-xl mx-auto space-y-6">

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between px-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <button
                                    onClick={() => (step > s || (step === 2 && s === 1) || (step === 3 && (s === 1 || s === 2))) && setStep(s)}
                                    disabled={step < s}
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === s ? "bg-[var(--primary)] text-white scale-110 shadow-lg shadow-[var(--primary)]/20" :
                                        step > s ? "bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/30 cursor-pointer" :
                                            "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-default"
                                        }`}
                                >
                                    {step > s ? <Check className="h-4 w-4" /> : s}
                                </button>
                                {s < 3 && (
                                    <div className={`w-12 h-0.5 mx-2 ${step > s ? "bg-[var(--primary)]/20" : "bg-[var(--surface-2)]"}`} />
                                )}
                            </div>
                        ))}
                        <span className="text-[10px] type-overline text-[var(--text-muted)] ml-auto font-bold">
                            Step {step} of 3
                        </span>
                    </div>

                    {step === 1 && (
                        <div className="animate-slide-up space-y-6">
                            <div className="space-y-2">
                                <h2 className="type-h3 text-[var(--text)]">Select Assessment Year</h2>
                                <p className="type-body text-[var(--text-muted)]">
                                    The Compensation Fund year runs from <strong>1 March</strong> to <strong>28 February</strong>.
                                </p>
                            </div>

                            <Card className="border-none glass-panel">
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        {availableYears.map((year) => {
                                            const endDay = ((year + 1) % 4 === 0 && ((year + 1) % 100 !== 0 || (year + 1) % 400 === 0)) ? 29 : 28;
                                            return (
                                                <div
                                                    key={year}
                                                    onClick={() => {
                                                        if (selectedYear !== year && step > 1) {
                                                            if (confirm("Changing the assessment year will reset your current ROE calculations. Continue?")) {
                                                                setSelectedYear(year);
                                                                setStep(1);
                                                                setRoeData(null);
                                                            }
                                                        } else {
                                                            setSelectedYear(year);
                                                        }
                                                    }}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedYear === year ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/30"}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-[var(--text)]">{year}/{year + 1} Year</p>
                                                            <p className="text-xs text-[var(--text-muted)]">1 Mar {year} – {endDay} Feb {year + 1}</p>
                                                        </div>
                                                        {selectedYear === year && <div className="h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        onClick={handleCalculate}
                                        disabled={loading}
                                        className="w-full h-12 gap-2 text-base"
                                    >
                                        {loading ? "Calculating..." : "Calculate My Numbers"}
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>

                            <Alert className="bg-[var(--surface-2)] border-none">
                                <Info className="h-4 w-4 text-[var(--primary)]" />
                                <AlertDescription className="text-xs text-[var(--text-muted)] ml-2">
                                    We use your saved payslips to calculate these totals. If you are missing months, your totals will be lower than reality.
                                </AlertDescription>
                            </Alert>

                            {/* ROE Explanation Section */}
                            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-[var(--primary)]" />
                                    <h3 className="text-sm font-bold text-[var(--text)]">What is Return of Earnings (ROE)?</h3>
                                </div>
                                <div className="prose prose-sm max-w-none text-[var(--text-muted)] space-y-3 text-xs leading-relaxed">
                                    <p>
                                        The <strong>Return of Earnings (ROE)</strong> is a mandatory annual declaration that every registered South African employer must submit to the <strong>Compensation Fund</strong>. It&apos;s how the government calculates how much your business owes to cover workers if they get injured or fall ill on the job.
                                    </p>
                                    <div className="bg-[var(--surface-2)] p-4 rounded-xl space-y-2 border border-[var(--border)]">
                                        <p className="font-bold text-[var(--text)]">What You&apos;re Declaring:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li><strong>Actual earnings:</strong> Total wages paid in the previous assessment year (1 March to 28 February).</li>
                                            <li><strong>Provisional earnings:</strong> Your estimate of what you&apos;ll pay in the coming year.</li>
                                        </ul>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/10">
                                        <ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
                                        <p>
                                            Submitting ROE is the gateway to getting a <strong>Letter of Good Standing (LOGS)</strong> — required for tenders, contracts, and government work.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-[var(--border)]">
                                                    <th className="py-2 font-bold text-[var(--text)]">Period</th>
                                                    <th className="py-2 font-bold text-[var(--text)]">Max Earnings Cap</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b border-[var(--border)]/50">
                                                    <td className="py-2">2024/2025 (actual)</td>
                                                    <td className="py-2 font-mono">R597,328</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2">2025/2026 (provisional)</td>
                                                    <td className="py-2 font-mono">R633,168</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="italic text-[10px]">
                                        *If an employee earns more than the cap, you only report up to the capped amount. LekkerLedger handles this calculation for you automatically.
                                    </p>
                                    <a 
                                        href="https://roe.labour.gov.za" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[var(--primary)] font-bold hover:underline"
                                    >
                                        Official ROE Online Portal <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && roeData && (
                        <div className="animate-slide-up space-y-6">
                            <div className="space-y-2">
                                <h2 className="type-h3 text-[var(--text)]">Your ROE Numbers</h2>
                                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-600">Next Step: Enter these into the CF Portal</p>
                                        <p className="text-[10px] text-amber-700 leading-relaxed">
                                            1. Visit <strong>roe.labour.gov.za</strong> · 2. Copy each value using the buttons below · 3. Paste into your ROE submission form.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {roeData.employeeCount === 0 && roeData.actualEarnings === 0 && (
                                <Alert className="bg-red-500/5 border border-red-500/10">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <AlertDescription className="text-xs text-red-700 ml-2">
                                        ⚠️ <strong>No payroll data found for {selectedYear}/{selectedYear + 1}</strong>. Add payroll records to generate your ROE numbers.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                <RoeValueCard
                                    label="Number of Employees"
                                    value={roeData.employeeCount.toString()}
                                    icon={Users}
                                    help="Total unique employees paid during this period."
                                    onCopy={() => copyToClipboard(roeData.employeeCount.toString(), "Employee count")}
                                />
                                <RoeValueCard
                                    label="Actual Earnings"
                                    value={`R ${roeData.actualEarnings.toLocaleString()}`}
                                    icon={Banknote}
                                    help={`Total gross pay (capped at R${(roeData.maxCapPerEmployee || 0).toLocaleString()} per worker annually).`}
                                    onCopy={() => copyToClipboard(roeData.actualEarnings.toString(), "Actual earnings")}
                                />
                                <RoeValueCard
                                    label="Provisional Earnings"
                                    value={`R ${roeData.provisionalEarnings.toLocaleString()}`}
                                    icon={Calendar}
                                    help="Estimate for next year. CF default is (Actual + 5%). We use Actual as a baseline."
                                    onCopy={() => copyToClipboard(roeData.provisionalEarnings.toString(), "Provisional earnings")}
                                />
                            </div>

                            <Button
                                onClick={() => setStep(3)}
                                className="w-full h-12 gap-2 text-base"
                            >
                                Next: Documents & Exports
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-slide-up space-y-6">
                            <div className="space-y-2">
                                <h2 className="type-h3 text-[var(--text)]">Final Step: Download & Archive</h2>
                                <p className="type-body text-[var(--text-muted)] text-sm">
                                    Keep these support records together with your yearly Compensation Fund paperwork.
                                </p>
                            </div>

                            {/* Summary Recap Card */}
                            <Card className="border border-[var(--border)] bg-[var(--surface-1)] shadow-sm">
                                <CardContent className="p-4 grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Employees</p>
                                        <p className="text-sm font-bold text-[var(--text)]">{roeData?.employeeCount || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Actual</p>
                                        <p className="text-sm font-bold text-[var(--text)]">R {(roeData?.actualEarnings || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Provisional</p>
                                        <p className="text-sm font-bold text-[var(--text)]">R {(roeData?.provisionalEarnings || 0).toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none glass-panel overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start gap-3 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                                            <ShieldCheck className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm text-[var(--text)]">Required Archive Documents</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                                    Download these files to your records archive for future reference.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <DocDownloadRow
                                                label="Detailed payroll record (PDF)"
                                                description="Yearly employee and wage summary. PDF (~250 KB)"
                                                isPaid={isPaid}
                                                onClick={() => handleDownloadReport("pdf")}
                                            />
                                            <DocDownloadRow
                                                label="Employer details record (PDF)"
                                                description="Official employer profile page. PDF (~150 KB)"
                                                isPaid={isPaid}
                                                onClick={handleDownloadConfirmation}
                                            />
                                            <DocDownloadRow
                                                label="Raw Data Export (CSV)"
                                                description="Excel-ready detailed ledger. CSV (~50 KB)"
                                                isPaid={isPaid}
                                                onClick={() => handleDownloadReport("csv")}
                                            />
                                        </div>
                                    </div>

                                    {!isPaid && (
                                        <div className="bg-[var(--primary)]/5 p-6 border-t border-[var(--primary)]/10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                                                <span className="text-sm font-bold text-[var(--text)]">Upgrade to unlock downloads</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] mb-4">
                                                Document exports and deeper archiving are available on Standard and Pro.
                                            </p>
                                            <Link href="/pricing">
                                                <Button className="w-full h-10 font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                                                    View Plans
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="pt-4 border-t border-[var(--border)]">
                                <Link href="/dashboard">
                                    <Button variant="ghost" className="w-full h-12 font-bold text-[var(--text-muted)]">
                                        Finish & Return Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Legal Footer */}
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] type-overline">
                            <ShieldCheck className="h-3 w-3" /> Compliance Support Tool
                        </div>
                        <p className="text-[10px] text-center text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                            LekkerLedger is a calculation aid. You are responsible for the truthfulness of your submission to the Compensation Fund.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}

function RoeValueCard({ label, value, icon: Icon, help, onCopy }: {
    label: string,
    value: string,
    icon: React.ElementType,
    help: string,
    onCopy: () => void
}) {
    return (
        <Card className="border border-[var(--border)] glass-panel hover:shadow-md transition-all group">
            <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--surface-2)] shrink-0 group-hover:bg-[var(--primary)]/10 transition-colors">
                        <Icon className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5 group/info relative">
                            <p className="type-overline text-[var(--text-muted)] truncate">{label}</p>
                            <div className="relative cursor-help">
                                <HelpCircle className="h-3 w-3 text-[var(--text-muted)]/40 hover:text-[var(--primary)] transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-10 text-[10px] text-[var(--text-muted)] leading-relaxed">
                                    {help}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--surface-1)]"></div>
                                </div>
                            </div>
                        </div>
                        <p className="type-h3 text-[var(--text)] truncate font-mono">{value}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCopy}
                    className="h-10 w-10 rounded-xl hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm active:scale-95"
                    title={`Copy ${label}`}
                >
                    <Copy className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}

function DocDownloadRow({ label, description, isPaid, onClick }: {
    label: string,
    description: string,
    isPaid: boolean,
    onClick: () => void
}) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isPaid ? "border-[var(--border)] hover:border-[var(--primary)]/30" : "border-[var(--border)] opacity-60"}`}>
            <div className="overflow-hidden mr-2">
                <p className="text-sm font-bold text-[var(--text)] truncate">{label}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{description}</p>
            </div>
            <Button
                variant={isPaid ? "outline" : "ghost"}
                size="sm"
                className={`shrink-0 ${isPaid ? "border-[var(--primary)]/20 text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
                disabled={!isPaid}
                onClick={onClick}
            >
                <Download className="h-4 w-4" />
            </Button>
        </div>
    );
}







