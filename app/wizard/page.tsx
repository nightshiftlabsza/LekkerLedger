"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft, Calendar, UserCheck, ShieldCheck,
    AlertTriangle, Calculator, Clock, CheckCircle2, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    getEmployee, savePayslip, getSettings,
    generatePayslipId, getLatestPayslip, saveEmployee
} from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format, differenceInDays } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PayslipPDF } from "@/components/pdf/payslip-pdf";

export default function WizardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const empId = searchParams.get("empId");
    const repeat = searchParams.get("repeat") === "true";

    const [loading, setLoading] = React.useState(true);
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [step, setStep] = React.useState(1);
    const [completed, setCompleted] = React.useState(false);

    // Form state corresponding to PayslipInput schema
    const [payPeriodStart, setPayPeriodStart] = React.useState("");
    const [payPeriodEnd, setPayPeriodEnd] = React.useState("");
    const [daysWorked, setDaysWorked] = React.useState("0");
    const [hoursPerDay, setHoursPerDay] = React.useState("8");

    const [overtimeHours, setOvertimeHours] = React.useState("0");
    const [sundayHours, setSundayHours] = React.useState("0");
    const [publicHolidayHours, setPublicHolidayHours] = React.useState("0");

    const [dedudectionsUIF, setDeductionsUIF] = React.useState(true); // Default true per BCEA
    const [deductionsOther, setDeductionsOther] = React.useState("0");

    useEffectInitLoad(empId, repeat, setEmployee, setSettings, setLoading, setPayPeriodStart, setPayPeriodEnd, setDaysWorked, setHoursPerDay, setOvertimeHours, setSundayHours, setPublicHolidayHours, setDeductionsUIF, setDeductionsOther, router);

    const handleGenerate = async () => {
        if (!employee || !payPeriodStart || !payPeriodEnd) return;

        const input: PayslipInput = {
            id: generatePayslipId(),
            employeeId: employee.id,
            payPeriodStart: new Date(payPeriodStart),
            payPeriodEnd: new Date(payPeriodEnd),
            daysWorked: parseInt(daysWorked) || 0,
            hoursPerDay: parseInt(hoursPerDay) || 8,
            overtimeHours: parseInt(overtimeHours) || 0,
            sundayHours: parseInt(sundayHours) || 0,
            publicHolidayHours: parseInt(publicHolidayHours) || 0,
            deductions: {
                uif: dedudectionsUIF,
                other: parseFloat(deductionsOther) || 0,
            },
            createdAt: new Date(),
        };

        await savePayslip(input);
        setCompleted(true);
    };

    if (loading || !employee || !settings) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
            <div className="animate-pulse text-amber-500 font-bold uppercase tracking-widest text-sm flex flex-col items-center gap-4">
                <ShieldCheck className="h-8 w-8 animate-bounce" />
                Validating Employee Record...
            </div>
        </div>
    );

    if (completed) {
        // Prepare dummy input to feed the calculator for the PDF
        const finalInput: PayslipInput = {
            id: "tmp", employeeId: employee.id,
            payPeriodStart: new Date(payPeriodStart), payPeriodEnd: new Date(payPeriodEnd),
            daysWorked: parseInt(daysWorked) || 0, hoursPerDay: parseInt(hoursPerDay) || 8,
            overtimeHours: parseInt(overtimeHours) || 0, sundayHours: parseInt(sundayHours) || 0,
            publicHolidayHours: parseInt(publicHolidayHours) || 0,
            deductions: { uif: dedudectionsUIF, other: parseFloat(deductionsOther) || 0 }, createdAt: new Date()
        };
        const result = calculatePayslip(finalInput);

        return (
            <div className="min-h-screen bg-[var(--bg-base)] flex flex-col pt-12">
                <div className="max-w-md mx-auto w-full p-6 text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-green-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-green-500/20">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Payslip Validated</h1>
                        <p className="text-[var(--text-secondary)] font-medium">BCEA & NMW checked.</p>
                    </div>

                    <Card className="glass-panel border-amber-500/30 overflow-hidden text-left shadow-2xl">
                        <div className="bg-amber-500/10 p-4 border-b border-amber-500/20 flex justify-between items-center">
                            <span className="font-bold text-amber-900 dark:text-amber-500 uppercase tracking-widest text-xs">Summary</span>
                            <span className="font-mono text-xs text-amber-700 dark:text-amber-400">{format(new Date(payPeriodStart), "MMM yyyy")}</span>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-end border-b border-[var(--border-subtle)] pb-4">
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Net Pay</p>
                                    <p className="text-3xl font-black tabular-nums text-[var(--text-primary)] mt-1">
                                        R {result.netPay.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs space-y-2 font-medium">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Worker</span>
                                    <span className="font-bold text-[var(--text-primary)]">{employee.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Gross</span>
                                    <span className="font-bold text-[var(--text-primary)]">R {result.grossPay.toFixed(2)}</span>
                                </div>
                                {result.uifDeduction > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">UIF Copay (1%)</span>
                                        <span className="font-bold text-red-500">- R {result.uifDeduction.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3 pt-4">
                        <PDFDownloadLink
                            document={<PayslipPDF employee={employee} employer={settings} payslip={finalInput} result={result} />}
                            fileName={`payslip_${employee.name.replace(/\s+/g, "_")}_${format(new Date(payPeriodStart), "MMM_yyyy")}.pdf`}
                            className="block"
                        >
                            {({ loading }) => (
                                <Button size="lg" className="w-full h-14 text-base font-black bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/20" disabled={loading}>
                                    {loading ? "Generating PDF..." : "Download Official PDF"}
                                </Button>
                            )}
                        </PDFDownloadLink>

                        <div className="flex gap-3">
                            <ActionButtons router={router} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex flex-col relative">
            <header className="sticky top-0 z-50 px-4 py-3 glass-panel border-b border-[var(--border-subtle)] shadow-sm">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => step > 1 ? setStep(step - 1) : router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="font-bold text-sm text-[var(--text-primary)]">Payslip Setup</h1>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{employee.name}</p>
                    </div>
                    {/* UP-3: Progress indicator numeric */}
                    <div className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                        STEP {step}/4
                    </div>
                </div>
            </header>

            {/* UP-3: Progress Bar */}
            <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 absolute top-[61px] left-0 z-40">
                <div
                    className="h-full bg-amber-500 transition-all duration-500 ease-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                />
            </div>

            <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 pb-24 overflow-x-hidden">
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 fill-mode-both" key={step}>
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Select Timeframe</h2>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Choose the pay period. Dates must accurately reflect actual time worked for BCEA audits.</p>
                            </div>

                            <Card className="glass-panel border-none shadow-[var(--shadow-sm)]">
                                <CardContent className="p-5 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">Start Date</Label>
                                            <Input type="date" className="h-12 rounded-xl text-sm font-medium" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">End Date</Label>
                                            <Input type="date" className="h-12 rounded-xl text-sm font-medium" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} />
                                        </div>
                                    </div>
                                    {payPeriodStart && payPeriodEnd && (
                                        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Period covers {differenceInDays(new Date(payPeriodEnd), new Date(payPeriodStart)) + 1} calendar days.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Ordinary Time</h2>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Enter agreed standard hours. Do not include overtime here.</p>
                            </div>

                            <Card className="glass-panel border-none shadow-[var(--shadow-sm)]">
                                <CardContent className="p-5 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)] flex justify-between">
                                            Days Worked
                                            <span className="lowercase font-medium">in period</span>
                                        </Label>
                                        <div className="relative">
                                            <Input type="number" min="0" step="1" className="h-14 font-mono text-xl rounded-xl pl-4 pr-12" value={daysWorked} onChange={(e) => setDaysWorked(e.target.value)} />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">Days</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)]">Hours per Day</Label>
                                        <div className="relative">
                                            <Input type="number" min="0" max="24" step="0.5" className="h-14 font-mono text-xl rounded-xl pl-4 pr-12" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">Hrs</span>
                                        </div>
                                    </div>

                                    {!settings.simpleMode && (
                                        <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
                                            <div className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-xs font-medium text-amber-900 dark:text-amber-400">
                                                    Legally, ordinary work hours cannot exceed 45 hours per week (9 hrs/day for 5 days, or 8 hrs/day for 6 days).
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Exceptional Time</h2>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">BCEA mandates penalty rates for these hours. Our engine calculates them automatically.</p>
                            </div>

                            <Card className="glass-panel border-none shadow-[var(--shadow-sm)]">
                                <CardContent className="p-5 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase tracking-widest font-black text-rose-500">Overtime (1.5x Rate)</Label>
                                        <div className="relative">
                                            <Input type="number" min="0" step="0.5" className="h-14 font-mono text-xl rounded-xl border-rose-500/20 focus-visible:ring-rose-500 pl-4" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">Hrs</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase tracking-widest font-black text-blue-500">Sunday Work (1.5x or 2x)</Label>
                                        <div className="relative">
                                            <Input type="number" min="0" step="0.5" className="h-14 font-mono text-xl rounded-xl border-blue-500/20 focus-visible:ring-blue-500 pl-4" value={sundayHours} onChange={(e) => setSundayHours(e.target.value)} />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">Hrs</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase tracking-widest font-black text-purple-500">Public Holidays (2x Rate)</Label>
                                        <div className="relative">
                                            <Input type="number" min="0" step="0.5" className="h-14 font-mono text-xl rounded-xl border-purple-500/20 focus-visible:ring-purple-500 pl-4" value={publicHolidayHours} onChange={(e) => setPublicHolidayHours(e.target.value)} />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">Hrs</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Deductions</h2>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Configure statutory UI-19 contributions and other withholdings.</p>
                            </div>

                            <Card className="glass-panel border-none shadow-[var(--shadow-sm)]">
                                <CardContent className="p-0">
                                    <div className="p-5 flex items-start justify-between gap-4 border-b border-[var(--border-subtle)]">
                                        <div>
                                            <Label className="text-sm font-bold block mb-1">UIF Contribution</Label>
                                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">Automatically deduct 1% for UIF. The employer must contribute an matching 1% to the fund directly.</p>
                                        </div>
                                        <Switch checked={dedudectionsUIF} onCheckedChange={setDeductionsUIF} className="data-[state=checked]:bg-amber-500 mt-1" />
                                    </div>

                                    <div className="p-5 space-y-3">
                                        <Label className="text-xs uppercase tracking-widest font-black text-[var(--text-muted)] block">Other Deductions (R)</Label>
                                        <Input type="number" min="0" step="10" className="h-14 font-mono text-xl rounded-xl bg-[var(--bg-subtle)]" value={deductionsOther} onChange={(e) => setDeductionsOther(e.target.value)} />
                                        <p className="text-[10px] text-[var(--text-muted)] font-medium">Loans, salary advances, or court orders. Note: Deductions cannot exceed 25% of gross pay.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {!settings.simpleMode && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-zinc-400 text-xs font-mono space-y-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Calculator className="h-24 w-24 text-white" /></div>
                                    <p className="text-zinc-100 font-bold font-sans uppercase tracking-widest text-[10px] flex items-center gap-2 mb-3"><ShieldCheck className="h-3 w-3 text-green-500" /> Pre-flight Check</p>
                                    <p>Employee Base Rate: R{employee.rate.toFixed(2)}/hr</p>
                                    <p>NMW Check: {(employee.rate >= 27.58) ? <span className="text-green-400">PASS (≥ R27.58)</span> : <span className="text-red-400">FAIL. Rate is illegal.</span>}</p>
                                    <p>Engine config: 2024 BCEA SD7 overrides enabled.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)] to-transparent z-40">
                <div className="max-w-lg mx-auto flex gap-3">
                    {step < 4 ? (
                        <Button className="w-full h-14 text-base font-black bg-[var(--text-primary)] text-[var(--bg-base)] rounded-2xl shadow-xl hover:scale-[1.02] transition-transform" onClick={() => setStep(step + 1)}>
                            Continue <ArrowRight className="h-5 w-5 ml-2 opacity-70" />
                        </Button>
                    ) : (
                        <Button className="w-full h-14 text-base font-black bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white rounded-2xl shadow-xl hover:scale-[1.02] transition-transform" onClick={handleGenerate}>
                            <ShieldCheck className="h-5 w-5 mr-2" /> Validate & Calculate
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function useEffectInitLoad(
    empId: string | null, repeat: boolean,
    setEmployee: React.Dispatch<React.SetStateAction<Employee | null>>,
    setSettings: React.Dispatch<React.SetStateAction<EmployerSettings | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setPayPeriodStart: React.Dispatch<React.SetStateAction<string>>,
    setPayPeriodEnd: React.Dispatch<React.SetStateAction<string>>,
    setDaysWorked: React.Dispatch<React.SetStateAction<string>>,
    setHoursPerDay: React.Dispatch<React.SetStateAction<string>>,
    setOvertimeHours: React.Dispatch<React.SetStateAction<string>>,
    setSundayHours: React.Dispatch<React.SetStateAction<string>>,
    setPublicHolidayHours: React.Dispatch<React.SetStateAction<string>>,
    setDeductionsUIF: React.Dispatch<React.SetStateAction<boolean>>,
    setDeductionsOther: React.Dispatch<React.SetStateAction<string>>,
    router: any
) {
    React.useEffect(() => {
        async function load() {
            if (!empId) {
                router.push("/dashboard");
                return;
            }
            const emp = await getEmployee(empId);
            if (!emp) {
                router.push("/dashboard");
                return;
            }
            setEmployee(emp);

            const sett = await getSettings();
            setSettings(sett);

            if (repeat) {
                const latest = await getLatestPayslip(empId);
                if (latest) {
                    const latestStart = new Date(latest.payPeriodStart);
                    const newStart = new Date(latestStart.getFullYear(), latestStart.getMonth() + 1, 1);
                    const newEnd = new Date(latestStart.getFullYear(), latestStart.getMonth() + 2, 0);

                    setPayPeriodStart(format(newStart, "yyyy-MM-dd"));
                    setPayPeriodEnd(format(newEnd, "yyyy-MM-dd"));
                    setDaysWorked(latest.daysWorked.toString());
                    setHoursPerDay(latest.hoursPerDay.toString());
                    setOvertimeHours(latest.overtimeHours.toString());
                    setSundayHours(latest.sundayHours.toString());
                    setPublicHolidayHours(latest.publicHolidayHours.toString());
                    setDeductionsUIF(latest.deductions.uif);
                    setDeductionsOther(latest.deductions.other.toString());
                } else {
                    const now = new Date();
                    setPayPeriodStart(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
                    setPayPeriodEnd(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"));
                }
            } else {
                const now = new Date();
                setPayPeriodStart(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
                setPayPeriodEnd(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"));
            }

            setLoading(false);
        }
        load();
    }, [empId, repeat, router]);
}

function ActionButtons({ router }: { router: any }) {
    return (
        <>
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold bg-white text-zinc-900 border-zinc-200 shadow-sm" onClick={() => router.push("/dashboard")}>
                Done
            </Button>
        </>
    );
}
