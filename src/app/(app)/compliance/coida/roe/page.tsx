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
    Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { calculateRoeData, type RoeData } from "@/lib/coida/roe";
import { generateRoePayrollPdfBytes, generateEmployerConfirmationPdfBytes } from "@/lib/coida/coida-pdf";
import { generateRoeCsv } from "@/lib/coida/coida-csv";
import { getSettings, getEmployees, getAllPayslips, logAuditEvent } from "@/lib/storage";
import { getUserPlan } from "@/lib/entitlements";
import { useToast } from "@/components/ui/toast";
import { Employee, EmployerSettings, PayslipInput } from "@/lib/schema";

/**
 * Simple browser side bytes download
 */
function downloadBlob(bytes: Uint8Array | string, filename: string, type: string) {
    // @ts-ignore - Uint8Array/string is a valid BlobPart in the browser
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

export default function RoePackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = React.useState(1);
    const [loading, setLoading] = React.useState(false);
    const [selectedYear, setSelectedYear] = React.useState(2025);
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
            setIsPaid(plan.id !== "free");
        }
        load();
    }, []);

    const handleDownloadReport = async (type: "pdf" | "csv") => {
        if (!roeData || !settings) return;
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
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <SideDrawer />
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : router.push("/dashboard")}
                        aria-label="Back"
                        className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text)" }}>
                        Return of Earnings (ROE) Pack
                    </h1>
                </div>
            </header>

            <main className="flex-1 w-full px-4 py-6">
                <div className="max-w-xl mx-auto space-y-6">

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between px-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === s ? "bg-[var(--primary)] text-white scale-110" :
                                        step > s ? "bg-[var(--primary)]/20 text-[var(--primary)]" :
                                            "bg-[var(--surface-2)] text-[var(--text-muted)]"
                                        }`}
                                >
                                    {step > s ? <Check className="h-4 w-4" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-12 h-0.5 mx-2 ${step > s ? "bg-[var(--primary)]/20" : "bg-[var(--surface-2)]"}`} />
                                )}
                            </div>
                        ))}
                        <span className="text-[10px] type-overline text-[var(--text-muted)] ml-auto">
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
                                        <div
                                            onClick={() => setSelectedYear(2025)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedYear === 2025 ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/30"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-[var(--text)]">2025/2026 Year</p>
                                                    <p className="text-xs text-[var(--text-muted)]">1 Mar 2025 – 28 Feb 2026</p>
                                                </div>
                                                {selectedYear === 2025 && <div className="h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setSelectedYear(2024)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedYear === 2024 ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/30"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-[var(--text)]">2024/2025 Year</p>
                                                    <p className="text-xs text-[var(--text-muted)]">1 Mar 2024 – 28 Feb 2025</p>
                                                </div>
                                                {selectedYear === 2024 && <div className="h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                                            </div>
                                        </div>
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
                                <AlertDescription className="text-xs text-[var(--text-muted)]">
                                    We use your saved payslips to calculate these totals. If you are missing months, your totals will be lower than reality.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {step === 2 && roeData && (
                        <div className="animate-slide-up space-y-6">
                            <div className="space-y-2">
                                <h2 className="type-h3 text-[var(--text)]">Your ROE Numbers</h2>
                                <p className="type-body text-[var(--text-muted)]">
                                    Copy these 3 numbers into the Compensation Fund (CF) portal.
                                </p>
                            </div>

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
                                    help="Total gross pay (capped at R177,000 per worker per year)."
                                    onCopy={() => copyToClipboard(roeData.actualEarnings.toString(), "Actual earnings")}
                                />
                                <RoeValueCard
                                    label="Provisional Earnings"
                                    value={`R ${roeData.provisionalEarnings.toLocaleString()}`}
                                    icon={Calendar}
                                    help="Estimate for next year. CF default is (Actual + 5%). We use Actual as a baseline."
                                    onCopy={() => copyToClipboard(roeData.provisionalEarnings.toString(), "Provisional earnings")}
                                    isEstimate
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
                                <h2 className="type-h3 text-[var(--text)]">Final Step: Documents</h2>
                                <p className="type-body text-[var(--text-muted)]">
                                    CF requires you to keep a detailed payroll report for 5 years.
                                </p>
                            </div>

                            <Card className="border-none glass-panel overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start gap-3 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                                            <ShieldCheck className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm text-[var(--text)]">Required Archive Documents</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                                    Download these files to your PC or Cloud storage for your records.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <DocDownloadRow
                                                label="Detailed Payroll Report (PDF)"
                                                description="List of all employees and wages for CF audit."
                                                isPaid={isPaid}
                                                onClick={() => handleDownloadReport("pdf")}
                                            />
                                            <DocDownloadRow
                                                label="Employer Details Scan (PDF)"
                                                description="Confirms your CF number and personal details."
                                                isPaid={isPaid}
                                                onClick={handleDownloadConfirmation}
                                            />
                                            <DocDownloadRow
                                                label="Raw Data Export (CSV)"
                                                description="For advanced record keeping or accountants."
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
                                                Document exports and historical archiving are available on Annual and Lifetime plans.
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

function RoeValueCard({ label, value, icon: Icon, help, onCopy, isEstimate }: {
    label: string,
    value: string,
    icon: React.ElementType,
    help: string,
    onCopy: () => void,
    isEstimate?: boolean
}) {
    // Suppress unused warning if actually needed for visual logic
    void isEstimate;
    void help;
    return (
        <Card className="border-none glass-panel hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--surface-2)] shrink-0">
                        <Icon className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-1">
                            <p className="type-overline text-[var(--text-muted)] truncate">{label}</p>
                            <HelpCircle className="h-3 w-3 text-[var(--text-muted)]/50 cursor-help" />
                        </div>
                        <p className="type-h3 text-[var(--text)] truncate">{value}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCopy}
                    className="h-10 w-10 rounded-xl hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
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
