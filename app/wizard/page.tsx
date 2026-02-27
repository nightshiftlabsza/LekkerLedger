"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, savePayslip } from "@/lib/storage";
import { Employee, PayslipInput } from "@/lib/schema";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";

const STEPS = [
    { label: "Hours", description: "Ordinary & overtime" },
    { label: "Sundays & Holidays", description: "Special rates" },
    { label: "Deductions", description: "UIF & accommodation" },
    { label: "Review", description: "Final confirmation" },
];

const safeDate = (s: string): Date => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
};

function WizardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const empId = searchParams?.get("empId");

    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [loadingInitial, setLoadingInitial] = React.useState(true);
    const [currentStep, setCurrentStep] = React.useState(0);
    const [loading, setLoading] = React.useState(false);

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [hours, setHours] = React.useState({ ordinary: "", overtime: "", sunday: "", holiday: "" });
    const [dates, setDates] = React.useState({ start: defaultStart, end: defaultEnd });
    const [periodError, setPeriodError] = React.useState("");
    const [includeAccommodation, setIncludeAccommodation] = React.useState(false);
    const [accommodationCost, setAccommodationCost] = React.useState("");

    React.useEffect(() => {
        async function load() {
            if (!empId) { router.push("/employees"); return; }
            const employees = await getEmployees();
            const emp = employees.find((e) => e.id === empId);
            if (emp) { setEmployee(emp); } else { router.push("/employees"); }
            setLoadingInitial(false);
        }
        load();
    }, [empId, router]);

    const totalHours =
        (Number(hours.ordinary) || 0) +
        (Number(hours.overtime) || 0) +
        (Number(hours.sunday) || 0) +
        (Number(hours.holiday) || 0);

    const breakdown = employee
        ? calculatePayslip({
            id: "preview",
            employeeId: employee.id,
            payPeriodStart: safeDate(dates.start),
            payPeriodEnd: safeDate(dates.end),
            ordinaryHours: Number(hours.ordinary) || 0,
            overtimeHours: Number(hours.overtime) || 0,
            sundayHours: Number(hours.sunday) || 0,
            publicHolidayHours: Number(hours.holiday) || 0,
            hourlyRate: employee.hourlyRate,
            includeAccommodation,
            accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
            otherDeductions: 0,
            createdAt: new Date(),
        })
        : null;

    const handleNext = async () => {
        if (currentStep === 0) {
            if (!dates.start || !dates.end) { setPeriodError("Please select the pay period."); return; }
            if (!hours.ordinary && !hours.overtime && !hours.sunday && !hours.holiday) {
                setPeriodError("Please enter at least some hours worked.");
                return;
            }
            setPeriodError("");
        }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep((s) => s + 1);
            return;
        }

        // Save & navigate to preview
        if (!employee) return;
        setLoading(true);

        const payslipInput: PayslipInput = {
            id: crypto.randomUUID(),
            employeeId: employee.id,
            payPeriodStart: safeDate(dates.start),
            payPeriodEnd: safeDate(dates.end),
            ordinaryHours: Number(hours.ordinary) || 0,
            overtimeHours: Number(hours.overtime) || 0,
            sundayHours: Number(hours.sunday) || 0,
            publicHolidayHours: Number(hours.holiday) || 0,
            hourlyRate: employee.hourlyRate,
            includeAccommodation,
            accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
            otherDeductions: 0,
            createdAt: new Date(),
        };

        try {
            await savePayslip(payslipInput);
            router.push(`/preview?payslipId=${payslipInput.id}&empId=${employee.id}`);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loadingInitial) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--amber-500)" }} />
            </div>
        );
    }

    if (!employee) return null;

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
                        <div>
                            <h1 className="font-bold text-sm tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
                                Payslip Wizard
                            </h1>
                            <p className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
                                {employee.name}
                            </p>
                        </div>
                    </div>
                    <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{
                            backgroundColor: "rgba(196,122,28,0.10)",
                            color: "var(--amber-500)",
                        }}
                    >
                        Step {currentStep + 1}/{STEPS.length}
                    </span>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-5">
                {/* Stepper */}
                <div
                    className="p-5 rounded-2xl"
                    style={{
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    <Stepper steps={STEPS} currentStep={currentStep} />
                </div>

                {/* NMW notice */}
                {employee.hourlyRate <= NMW_RATE && (
                    <Alert variant="warning">
                        <AlertDescription>
                            Using National Minimum Wage (R{NMW_RATE}/hr).
                        </AlertDescription>
                    </Alert>
                )}

                {/* Step Card */}
                <Card key={currentStep} className="animate-slide-right">
                    <CardHeader>
                        <CardTitle>{STEPS[currentStep].label}</CardTitle>
                        <CardDescription>{STEPS[currentStep].description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        {/* STEP 0 — Hours & Period */}
                        {currentStep === 0 && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="start">Period Start</Label>
                                        <Input
                                            id="start"
                                            type="date"
                                            value={dates.start}
                                            onChange={(e) => setDates({ ...dates, start: e.target.value })}
                                            error={periodError || undefined}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end">Period End</Label>
                                        <Input
                                            id="end"
                                            type="date"
                                            value={dates.end}
                                            onChange={(e) => setDates({ ...dates, end: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div
                                    className="pt-4 space-y-4"
                                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="ordinary">Ordinary Hours Worked</Label>
                                        <Input
                                            id="ordinary"
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 160"
                                            value={hours.ordinary}
                                            onChange={(e) => setHours({ ...hours, ordinary: e.target.value })}
                                        />
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                            40hrs/week = ±160 hrs/month
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="overtime">Overtime Hours (1.5× rate)</Label>
                                        <Input
                                            id="overtime"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={hours.overtime}
                                            onChange={(e) => setHours({ ...hours, overtime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 1 — Sundays & Holidays */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <Alert variant="default">
                                    <AlertDescription>
                                        Sundays and Public Holidays are legally paid at{" "}
                                        <strong>2× the normal rate</strong> (BCEA).
                                    </AlertDescription>
                                </Alert>
                                <div className="space-y-2">
                                    <Label htmlFor="sunday">Sunday Hours (2× rate)</Label>
                                    <Input
                                        id="sunday"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={hours.sunday}
                                        onChange={(e) => setHours({ ...hours, sunday: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="holiday">Public Holiday Hours (2× rate)</Label>
                                    <Input
                                        id="holiday"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={hours.holiday}
                                        onChange={(e) => setHours({ ...hours, holiday: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 2 — Deductions */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <Alert variant={totalHours > 24 ? "success" : "warning"}>
                                    <AlertDescription>
                                        <strong>UIF</strong> (1% employee + 1% employer) is{" "}
                                        <strong>{totalHours > 24 ? "applicable" : "NOT applicable"}</strong>{" "}
                                        — worker has {totalHours > 24 ? "more than" : "24 or fewer"} hours per month.
                                    </AlertDescription>
                                </Alert>

                                <button
                                    type="button"
                                    onClick={() => setIncludeAccommodation((v) => !v)}
                                    className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.99] hover:bg-[var(--bg-subtle)]"
                                    style={{
                                        border: `1.5px solid ${includeAccommodation ? "var(--amber-500)" : "var(--border-default)"}`,
                                        backgroundColor: includeAccommodation ? "rgba(196,122,28,0.04)" : "transparent",
                                    }}
                                >
                                    <div
                                        className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200"
                                        style={{
                                            backgroundColor: includeAccommodation ? "var(--amber-500)" : "transparent",
                                            border: `1.5px solid ${includeAccommodation ? "var(--amber-500)" : "var(--border-strong)"}`,
                                        }}
                                    >
                                        {includeAccommodation && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                            Accommodation Deduction
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                            Deduct up to 10% of gross wage for accommodation provided (SD7 — legal max).
                                        </p>
                                    </div>
                                </button>

                                {includeAccommodation && (
                                    <div className="space-y-2 px-1 animate-fade-in">
                                        <Label htmlFor="accommodationCost">Cost of Accommodation (Optional)</Label>
                                        <Input
                                            id="accommodationCost"
                                            type="number"
                                            min="0"
                                            placeholder="Automatically capped at 10% of gross"
                                            value={accommodationCost}
                                            onChange={(e) => setAccommodationCost(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3 — Review */}
                        {currentStep === 3 && breakdown && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Earnings rows */}
                                <div
                                    className="rounded-xl overflow-hidden"
                                    style={{ border: "1px solid var(--border-subtle)" }}
                                >
                                    <div
                                        className="px-4 py-2.5 flex justify-between items-center text-xs font-bold uppercase tracking-widest"
                                        style={{
                                            backgroundColor: "var(--bg-subtle)",
                                            borderBottom: "1px solid var(--border-subtle)",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        <span>Payslip Summary</span>
                                        <span>R{employee.hourlyRate.toFixed(2)}/hr</span>
                                    </div>

                                    {/* Earnings */}
                                    <div className="px-4 pt-4 pb-2 space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--amber-500)" }}>Earnings</p>
                                        <Row label={`Ordinary (${Number(hours.ordinary) || 0}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                                        {(Number(hours.overtime) || 0) > 0 && <Row label={`Overtime (${Number(hours.overtime)}h)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} />}
                                        {(Number(hours.sunday) || 0) > 0 && <Row label={`Sunday (${Number(hours.sunday)}h)`} value={`R ${breakdown.sundayPay.toFixed(2)}`} />}
                                        {(Number(hours.holiday) || 0) > 0 && <Row label={`Public Holiday (${Number(hours.holiday)}h)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} />}
                                        <Row label="Gross Pay" value={`R ${breakdown.grossPay.toFixed(2)}`} bold />
                                    </div>

                                    <div style={{ borderTop: "1px solid var(--border-subtle)" }} />

                                    {/* Deductions */}
                                    <div className="px-4 pt-3 pb-2 space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--amber-500)" }}>Deductions</p>
                                        <Row label={`UIF ${totalHours > 24 ? "(1%)" : "(n/a)"}`} value={`-R ${breakdown.deductions.uifEmployee.toFixed(2)}`} red />
                                        {includeAccommodation && breakdown.deductions.accommodation && (
                                            <Row label="Accommodation (10%)" value={`-R ${breakdown.deductions.accommodation.toFixed(2)}`} red />
                                        )}
                                        <Row label="Total Deductions" value={`R ${breakdown.deductions.total.toFixed(2)}`} bold />
                                    </div>

                                    {/* Net Pay bar */}
                                    <div
                                        className="flex justify-between items-center px-5 py-5"
                                        style={{ backgroundColor: "var(--amber-500)" }}
                                    >
                                        <span className="font-bold text-lg text-white">Net Pay</span>
                                        <span className="font-extrabold text-2xl text-white tabular-nums">
                                            R {breakdown.netPay.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between gap-3">
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                            disabled={currentStep === 0 || loading}
                        >
                            Back
                        </Button>
                        <Button
                            size="lg"
                            onClick={handleNext}
                            disabled={loading}
                            className="flex-1 sm:flex-none sm:min-w-[160px]"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                            ) : currentStep === STEPS.length - 1 ? (
                                "Save & Preview"
                            ) : (
                                <>Next <ArrowRight className="h-4 w-4" /></>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}

function Row({
    label,
    value,
    bold,
    red,
}: {
    label: string;
    value: string;
    bold?: boolean;
    red?: boolean;
}) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span style={{ color: bold ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: bold ? 600 : 400 }}>
                {label}
            </span>
            <span
                className="tabular-nums"
                style={{
                    color: red ? "var(--red-500)" : bold ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: bold ? 700 : 400,
                }}
            >
                {value}
            </span>
        </div>
    );
}

export default function WizardPage() {
    return (
        <React.Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--amber-500)" }} />
                </div>
            }
        >
            <WizardContent />
        </React.Suspense>
    );
}
