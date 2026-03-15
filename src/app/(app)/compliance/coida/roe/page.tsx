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
            <div className="w-full max-w-[1580px] mx-auto mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3 sm:p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : router.push("/dashboard")}
                        aria-label="Back"
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                        <h1
                            data-page-title
                            className="font-bold text-sm sm:text-base tracking-tight truncate"
                            style={{ color: "var(--text)" }}
                        >
                            {step === 1 ? "Return of Earnings (ROE)" : `ROE — ${selectedYear}/${selectedYear + 1}`}
                        </h1>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                            {step === 1 ? "Annual Compensation Fund Return" : "Assessment Year"}
                        </p>
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="w-full max-w-[1580px] mx-auto space-y-6">

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
                        <div className="animate-slide-up space-y-5">

                            {/* Disclaimer — shown first so user sees it before acting */}
                            <div className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-[var(--text)]">ROE preparation tool — not a filing service</p>
                                    <p className="text-[11px] leading-relaxed text-[var(--warning)]">
                                        LekkerLedger calculates your figures and generates supporting documents. You are responsible for the accuracy of your submission to the Compensation Fund.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 2xl:gap-8 items-start">
                                <div className="xl:col-span-7 2xl:col-span-8 space-y-4">
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                                        <p className="type-overline text-[var(--text-muted)]">Annual Return</p>
                                        <h2 className="type-h3 mt-2 text-[var(--text)]">Choose the COIDA year</h2>
                                        <p className="mt-3 max-w-[65ch] text-sm leading-7 text-[var(--text-muted)]">
                                            ROE stands for Return of Earnings. It is the yearly return employers submit to the Compensation Fund so the Fund can work out your assessment for the year that ended and record your estimate for the year ahead.
                                        </p>
                                        <p className="mt-2 max-w-[65ch] text-sm leading-7 text-[var(--text-muted)]">
                                            The Compensation Fund year runs from <strong>1 March</strong> to the end of <strong>February</strong>.
                                        </p>
                                    </div>

                                    <Card className="border-none glass-panel">
                                        <CardContent className="p-6 space-y-6">
                                            <div className="space-y-4">
                                                {availableYears.map((year) => {
                                                    const endDay = ((year + 1) % 4 === 0 && ((year + 1) % 100 !== 0 || (year + 1) % 400 === 0)) ? 29 : 28;
                                                    return (
                                                        <button
                                                            type="button"
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
                                                            className={`block w-full text-left rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedYear === year ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/30"}`}
                                                        >
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-bold text-[var(--text)]">{year}/{year + 1} Year</p>
                                                                    <p className="text-xs leading-6 text-[var(--text-muted)]">1 Mar {year} to {endDay} Feb {year + 1}</p>
                                                                </div>
                                                                {selectedYear === year && <div className="h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                                                            </div>
                                                        </button>
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

                                    <Alert className="border border-[var(--border)] bg-[var(--surface-2)]">
                                        <AlertDescription className="text-xs leading-6 text-[var(--text-muted)] ml-2">
                                            We use your saved payslips to calculate these totals. If some months are missing, your ROE figures may be lower than they should be.
                                        </AlertDescription>
                                    </Alert>
                                </div>

                                <aside className="xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-6">
                                    <Card className="border-none glass-panel overflow-hidden shadow-[var(--shadow-sm)]">
                                        <CardContent className="p-0">
                                            <div className="border-b border-[var(--border)] p-5 sm:p-6">
                                                <div className="flex items-center gap-2">
                                                    <HelpCircle className="h-4 w-4 text-[var(--primary)]" />
                                                    <p className="type-overline text-[var(--text-muted)]">Guide</p>
                                                </div>
                                                <h3 className="type-h3 mt-3 text-[var(--text)]">What is the ROE?</h3>
                                                <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
                                                    <p className="max-w-[62ch]">
                                                        ROE stands for <strong>Return of Earnings</strong>. It is the yearly return employers submit to the <strong>Compensation Fund</strong> to show what they paid workers in the last COIDA year, and what they expect to pay in the next one.
                                                    </p>
                                                    <p className="max-w-[62ch]">
                                                        The Fund uses this information to calculate your assessment and keep your employer record up to date.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 p-5 sm:p-6">
                                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
                                                    <p className="type-overline text-[var(--text-muted)]">What you need to declare</p>
                                                    <div className="mt-3 grid gap-3">
                                                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
                                                            <p className="text-sm font-semibold text-[var(--text)]">Actual earnings</p>
                                                            <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">
                                                                What you really paid employees from 1 March to the end of February.
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
                                                            <p className="text-sm font-semibold text-[var(--text)]">Provisional earnings</p>
                                                            <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">
                                                                What you expect to pay employees in the next COIDA year.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className="rounded-2xl border p-4 sm:p-5"
                                                    style={{ borderColor: "var(--success-border)", backgroundColor: "var(--success-soft)" }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                                                        <p className="text-sm leading-7 text-[var(--text)]">
                                                            Keeping your ROE up to date also helps you stay ready to request a <strong>Letter of Good Standing</strong> when you need one.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div
                                                    className="rounded-2xl border p-4 sm:p-5"
                                                    style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-semibold text-[var(--text)]">Submit carefully and on time</p>
                                                            <p className="text-xs leading-6 text-[var(--text-muted)]">
                                                                If an ROE is late, missing, or incorrect, the Compensation Fund may estimate the assessment and may charge a penalty. A 30 January 2026 Compensation Fund notice also reminded employers that the penalty can be up to 10% of the final assessment.
                                                            </p>
                                                            <p className="text-xs leading-6 text-[var(--text-muted)]">
                                                                This matters more in 2026 because the COIDA amendments started taking effect on <strong>23 January 2026</strong>, with further compliance and penalty changes from <strong>1 April 2026</strong>.
                                                            </p>
                                                            <a
                                                                href="https://www.polity.org.za/article/coida-amendments-take-effect-what-employers-need-to-know-2026-01-27"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                                                            >
                                                                Read the 2026 summary article <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
                                                    <div className="flex items-center gap-2">
                                                        <Info className="h-4 w-4 text-[var(--primary)]" />
                                                        <p className="type-overline text-[var(--text-muted)]">Helpful links</p>
                                                    </div>
                                                    <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                                                        Annual earnings caps can change. LekkerLedger applies the cap automatically in your ROE calculation where it is relevant.
                                                    </p>
                                                    <a
                                                        href="https://roe.labour.gov.za"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:underline"
                                                    >
                                                        Official ROE Online Portal <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </aside>
                            </div>
                        </div>
                    )}

                    {step === 2 && roeData && (
                        <div className="animate-slide-up space-y-6">
                            <div className="space-y-2">
                                <h2 className="type-h3 text-[var(--text)]">Your ROE Numbers</h2>
                                <div className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-[var(--text)]">Next Step: Enter these into the CF Portal</p>
                                        <p className="text-[10px] leading-relaxed text-[var(--warning)]">
                                            1. Visit <strong>roe.labour.gov.za</strong> · 2. Copy each value using the buttons below · 3. Paste into your ROE submission form.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {roeData.employeeCount === 0 && roeData.actualEarnings === 0 && (
                                <Alert variant="error">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="ml-2 text-xs">
                                        ⚠️ <strong>No payroll data found for {selectedYear}/{selectedYear + 1}</strong>. Add payroll records to generate your ROE numbers.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
                                    <div className="p-4 sm:p-6 space-y-4">
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

                    {/* Subtle compliance footer — disclaimer now lives at step 1 top */}
                    <div className="flex items-center justify-center gap-1.5 py-4 text-[10px] text-[var(--text-muted)] type-overline">
                        <ShieldCheck className="h-3 w-3" /> ROE Preparation Tool
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







