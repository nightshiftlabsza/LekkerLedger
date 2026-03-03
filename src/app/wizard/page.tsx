"use client";

// import "../pdf.worker.ts";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Check, Clock, Sparkles, AlertCircle, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { SideDrawer } from "@/components/layout/side-drawer";
import { StickyBottomBar } from "@/components/layout/sticky-bottom-bar";
import { getEmployees, savePayslip, getSecureTime, getSettings, getUsageStats, getAllPayslips, deletePayslip } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { format } from "date-fns";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";
import { getHolidaysInRange } from "@/lib/holidays";
import { formatDateSafe } from "@/lib/utils";

const STEPS = [
    { label: "Hours", description: "Ordinary & overtime" },
    { label: "Sundays & Holidays", description: "Special rates" },
    { label: "Deductions", description: "UIF & accommodation" },
    { label: "Review", description: "Final confirmation" },
];

const safeDate = (s: string): Date => {
    if (!s) return new Date();
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
};

function WizardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const empId = searchParams?.get("empId");
    const { toast } = useToast();

    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [loadingInitial, setLoadingInitial] = React.useState(true);
    const [currentStep, setCurrentStep] = React.useState<number>(0);
    const [loading, setLoading] = React.useState(false);
    const [duplicateId, setDuplicateId] = React.useState<string | null>(null);

    const now = new Date();
    const defaultStart = formatDateSafe(new Date(now.getFullYear(), now.getMonth(), 1));
    const defaultEnd = formatDateSafe(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    const [hours, setHours] = React.useState({ ordinary: "", overtime: "", sunday: "", holiday: "" });
    const [shortFallHours, setShortFallHours] = React.useState("");
    const [daysWorked, setDaysWorked] = React.useState("0");
    const [dates, setDates] = React.useState({ start: defaultStart, end: defaultEnd });

    // Automation States
    const [showShortfallHelper, setShowShortfallHelper] = React.useState(false);
    const [shortShiftCount, setShortShiftCount] = React.useState(0);
    const [totalWorkedInShortShifts, setTotalWorkedInShortShifts] = React.useState(0);

    const detectedHolidays = getHolidaysInRange(dates.start, dates.end);

    const applyHolidays = () => {
        const total = (detectedHolidays.length * 8).toString();
        setHours(prev => ({ ...prev, holiday: total }));
        toast(`Applied ${total} hours for ${detectedHolidays.length} holidays.`);
    };

    // Auto-calculate ordinary days (excluding Sundays) when period changes
    React.useEffect(() => {
        if (dates.start && dates.end) {
            const start = safeDate(dates.start);
            const end = safeDate(dates.end);

            // Prevent runaway loops if dates are invalid or start > end
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                setDaysWorked("0");
                return;
            }

            let count = 0;
            const cur = new Date(start);
            // Limit loop to prevent potential infinite if date logic bad
            let safety = 0;
            while (cur <= end && safety < 100) {
                if (cur.getDay() !== 0) count++; // Exclude Sundays
                cur.setDate(cur.getDate() + 1);
                safety++;
            }
            setDaysWorked(count.toString());
        }
    }, [dates.start, dates.end]);
    const [periodError, setPeriodError] = React.useState("");
    const [hoursError, setHoursError] = React.useState("");
    const [includeAccommodation, setIncludeAccommodation] = React.useState(false);
    const [accommodationCost, setAccommodationCost] = React.useState("");
    const [usageLimited, setUsageLimited] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            const [employees, s, stats] = await Promise.all([getEmployees(), getSettings(), getUsageStats()]);
            const emp = employees.find((e) => e.id === empId);
            if (emp) { setEmployee(emp); } else { router.push("/employees"); }
            setSettings(s);
            setUsageLimited(stats.isLimited);
            setLoadingInitial(false);
        }
        load();
    }, [empId, router]);

    const totalHours =
        (Number(hours.ordinary) || 0) +
        (Number(hours.overtime) || 0) +
        (Number(hours.sunday) || 0) +
        (Number(hours.holiday) || 0);

    const [leave, setLeave] = React.useState({ annual: "", sick: "", family: "" });

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
            daysWorked: Number(daysWorked) || 1,
            shortFallHours: Number(shortFallHours) || 0,
            hourlyRate: employee.hourlyRate,
            ordinarilyWorksSundays: employee.ordinarilyWorksSundays ?? false,
            ordinaryHoursPerDay: employee.ordinaryHoursPerDay ?? 8,
            includeAccommodation,
            accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
            otherDeductions: 0,
            annualLeaveTaken: Number(leave.annual) || 0,
            sickLeaveTaken: Number(leave.sick) || 0,
            familyLeaveTaken: Number(leave.family) || 0,
            createdAt: new Date(),
        })
        : null;

    const doSave = React.useCallback(async () => {
        if (!employee) return;
        setLoading(true);
        try {
            // Trial Expiry Check
            const [_settingsCheck, nowSafe] = await Promise.all([getSettings(), getSecureTime()]);
            void _settingsCheck;
            void nowSafe;

            const payslipInput: PayslipInput = {
                id: crypto.randomUUID(),
                employeeId: employee.id,
                payPeriodStart: safeDate(dates.start),
                payPeriodEnd: safeDate(dates.end),
                ordinaryHours: Number(hours.ordinary) || 0,
                overtimeHours: Number(hours.overtime) || 0,
                sundayHours: Number(hours.sunday) || 0,
                publicHolidayHours: Number(hours.holiday) || 0,
                daysWorked: Number(daysWorked) || 1,
                shortFallHours: Number(shortFallHours) || 0,
                hourlyRate: employee.hourlyRate,
                ordinarilyWorksSundays: employee.ordinarilyWorksSundays ?? false,
                ordinaryHoursPerDay: employee.ordinaryHoursPerDay ?? 8,
                includeAccommodation,
                accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
                otherDeductions: 0,
                annualLeaveTaken: Number(leave.annual) || 0,
                sickLeaveTaken: Number(leave.sick) || 0,
                familyLeaveTaken: Number(leave.family) || 0,
                createdAt: new Date(),
            };

            await savePayslip(payslipInput);

            // GA4 conversion tracking
            try {
                if (typeof window !== 'undefined' && 'gtag' in window) {
                    (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'onboarding_complete');
                }
            } catch (e) {
                console.error('GA4 tracking failed:', e);
            }

            toast("Payslip generated successfully!");
            if (typeof window !== 'undefined') {
                import('canvas-confetti').then(confetti => {
                    confetti.default({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#f59e0b', '#fbbf24', '#ffffff']
                    });
                });
            }
            router.push(`/preview?payslipId=${payslipInput.id}&empId=${employee.id}`);
        } catch (err) {
            console.error(err);
            toast(`Failed to generate payslip. ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    }, [employee, dates, hours, daysWorked, shortFallHours, includeAccommodation, accommodationCost, leave, router, toast]);

    const handleNext = async () => {
        if (currentStep === 0) {
            if (!dates.start || !dates.end) { setPeriodError("Please select the pay period."); return; }
            if (!hours.ordinary && !hours.overtime && !hours.sunday && !hours.holiday) {
                setHoursError("Please enter at least some hours worked.");
                return;
            }
            setPeriodError("");
            setHoursError("");
        }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep((s) => s + 1);
            return;
        }

        // Save & navigate to preview — check for duplicates first
        if (!employee) return;
        setLoading(true);

        try {
            const allPayslips = await getAllPayslips();
            const currentMonth = format(safeDate(dates.start), "yyyy-MM");
            const dup = allPayslips.find(
                p => p.employeeId === empId &&
                     format(new Date(p.payPeriodStart), "yyyy-MM") === currentMonth
            );
            if (dup) {
                setDuplicateId(dup.id);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error("Duplicate check failed:", err);
        }

        await doSave();
    };

    if (loadingInitial) {
        return (
            <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
                <header className="sticky top-0 z-30 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
                    <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-28 bg-[var(--bg-subtle)] animate-pulse rounded" />
                                <div className="h-3 w-20 bg-[var(--bg-subtle)] animate-pulse rounded" />
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-5 flex flex-col">
                    <div className="h-24 w-full rounded-2xl bg-[var(--bg-surface)] animate-pulse border border-[var(--border-subtle)]" />
                    <div className="flex-1 w-full rounded-2xl bg-[var(--bg-surface)] animate-pulse border border-[var(--border-subtle)]" />
                </main>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Header */}
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
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
                        className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500"
                    >
                        Step {currentStep + 1}/{STEPS.length}
                    </span>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 pb-24 content-container">
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

                {usageLimited && (
                    <Alert variant="warning" className="border-amber-500 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-900">
                            <strong>Free limit reached (2/month).</strong> Next payslip will be watermarked.
                            <Link href="/pricing" className="ml-2 underline font-bold">Upgrade to Pro</Link>.
                        </AlertDescription>
                    </Alert>
                )}

                {/* National Minimum Wage notice */}
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
                            <div className="space-y-6">
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

                                <div className="pt-4 space-y-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            Work Schedule
                                        </h3>
                                        <div className="flex gap-2">
                                            {detectedHolidays.length > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-[10px] gap-1.5 px-2"
                                                    onClick={applyHolidays}
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    Apply Holidays
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ordinary" className="text-xs">Ordinary Hours</Label>
                                            <Input
                                                id="ordinary"
                                                type="number"
                                                min="0"
                                                placeholder="160"
                                                value={hours.ordinary}
                                                onChange={(e) => setHours({ ...hours, ordinary: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="daysWorked" className="text-xs">Days Worked</Label>
                                            <Input
                                                id="daysWorked"
                                                type="number"
                                                min="0"
                                                placeholder="20"
                                                value={daysWorked}
                                                onChange={(e) => setDaysWorked(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="overtime" className="text-xs">Overtime (1.5x)</Label>
                                            <Input
                                                id="overtime"
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={hours.overtime}
                                                onChange={(e) => setHours({ ...hours, overtime: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shortFallHours" className="text-xs">Shortfall (4-hr rule)</Label>
                                            <Input
                                                id="shortFallHours"
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={shortFallHours}
                                                onChange={(e) => setShortFallHours(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Hours error */}
                                    {hoursError && (
                                        <p className="text-xs text-red-500 font-medium">{hoursError}</p>
                                    )}

                                    {/* 4-Hour Rule Assistant */}
                                    <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3.5 h-3.5 text-amber-500" />
                                                <Label htmlFor="assistant-switch" className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight cursor-pointer">4-Hour Rule Assistant</Label>
                                            </div>
                                            <Switch
                                                id="assistant-switch"
                                                checked={showShortfallHelper}
                                                onCheckedChange={setShowShortfallHelper}
                                            />
                                        </div>
                                        {showShortfallHelper && (
                                            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-zinc-500 font-bold uppercase">Short Shifts</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-xs"
                                                            min="0"
                                                            placeholder="e.g. 2"
                                                            value={shortShiftCount || ""}
                                                            onChange={(e) => setShortShiftCount(parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-zinc-500 font-bold uppercase">Hrs Worked</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-xs"
                                                            min="0"
                                                            placeholder="e.g. 3"
                                                            value={totalWorkedInShortShifts || ""}
                                                            onChange={(e) => setTotalWorkedInShortShifts(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full text-xs h-11 font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                                    onClick={() => {
                                                        const shortfall = (shortShiftCount * 4) - totalWorkedInShortShifts;
                                                        if (shortfall > 0) {
                                                            setShortFallHours((prev) => (parseFloat(prev || "0") + shortfall).toString());
                                                            setShortShiftCount(0);
                                                            setTotalWorkedInShortShifts(0);
                                                            toast(`Added ${shortfall}h shortfall.`);
                                                        }
                                                    }}
                                                >
                                                    Calculate & Add
                                                </Button>
                                            </div>
                                        )}
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
                                    <Label htmlFor="sunday">Sunday Hours ({employee.ordinarilyWorksSundays ? '1.5× rate' : '2× rate'})</Label>
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
                                        placeholder={detectedHolidays.length > 0 ? `Suggested: ${detectedHolidays.length * 8}` : "0"}
                                        value={hours.holiday}
                                        onChange={(e) => setHours({ ...hours, holiday: e.target.value })}
                                    />
                                    {detectedHolidays.length > 0 && (
                                        <p className="text-[10px] font-medium animate-fade-in" style={{ color: "var(--amber-500)" }}>
                                            Found {detectedHolidays.length} holiday{detectedHolidays.length > 1 ? 's' : ''}: {detectedHolidays.map(h => h.name).join(", ")}.
                                        </p>
                                    )}
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

                                <div className="pt-4 space-y-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        Leave Taken (This Month)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 font-bold uppercase">Annual</Label>
                                            <Input
                                                type="number"
                                                className="h-11"
                                                min="0"
                                                placeholder="0"
                                                value={leave.annual}
                                                onChange={(e) => setLeave({ ...leave, annual: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 font-bold uppercase">Sick</Label>
                                            <Input
                                                type="number"
                                                className="h-11"
                                                min="0"
                                                placeholder="0"
                                                value={leave.sick}
                                                onChange={(e) => setLeave({ ...leave, sick: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-zinc-500 font-bold uppercase">Family</Label>
                                            <Input
                                                type="number"
                                                className="h-11"
                                                min="0"
                                                placeholder="0"
                                                value={leave.family}
                                                onChange={(e) => setLeave({ ...leave, family: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIncludeAccommodation((v) => !v)}
                                    className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.99] border-[1.5px] hover:bg-[var(--bg-subtle)] ${includeAccommodation ? "border-[var(--amber-500)] bg-amber-500/5" : "border-[var(--border-default)] bg-transparent"}`}
                                >
                                    <div
                                        className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 border-[1.5px] ${includeAccommodation ? "bg-[var(--amber-500)] border-[var(--amber-500)]" : "bg-transparent border-[var(--border-strong)]"}`}
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
                                {/* Duplicate payslip warning */}
                                {duplicateId && (
                                    <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--amber-500)" }}>
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <span>A payslip for {employee.name} already exists for {format(safeDate(dates.start), "MMMM yyyy")}.</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-amber-500 text-white font-bold hover:bg-amber-600"
                                                onClick={async () => {
                                                    await deletePayslip(duplicateId);
                                                    setDuplicateId(null);
                                                    await doSave();
                                                }}
                                            >
                                                Replace existing
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setDuplicateId(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {/* Compliance checklist */}
                                <div className="p-4 rounded-xl space-y-2.5" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Compliance Check</p>
                                    <ComplianceRow
                                        pass={!!settings?.employerName?.trim()}
                                        passText="Employer name set"
                                        failText="Employer name missing — payslip header will be blank"
                                        failHref="/settings"
                                    />
                                    <ComplianceRow
                                        pass={employee.hourlyRate >= NMW_RATE}
                                        passText={`Rate meets NMW (R${NMW_RATE.toFixed(2)}/hr)`}
                                        failText={`Rate below NMW — calculator auto-corrects to R${NMW_RATE.toFixed(2)}/hr`}
                                    />
                                    <ComplianceRow
                                        pass={totalHours > 24}
                                        passText="UIF deducted (1% employee + 1% employer)"
                                        failText="UIF not applicable — worker has ≤24 hrs this period"
                                        isInfo={totalHours <= 24}
                                    />
                                    <ComplianceRow
                                        pass={Number(daysWorked) === 0 || (Number(hours.ordinary) / Math.max(Number(daysWorked), 1)) >= 4}
                                        passText="Hours meet 4-hr minimum shift rule"
                                        failText="Some shifts may be below 4 hrs — calculator tops up automatically"
                                    />
                                </div>

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
                                        <Row
                                            label={`Ordinary (${breakdown.effectiveOrdinaryHours}h${Number(shortFallHours) > 0 ? " inc. 4-hr minimum top-up" : ""})`}
                                            value={`R ${breakdown.ordinaryPay.toFixed(2)}`}
                                        />
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

                </Card>
            </main>

            <StickyBottomBar>
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
                    className="flex-1 sm:flex-none sm:min-w-[160px] bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-bold"
                >
                    {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    ) : currentStep === STEPS.length - 1 ? (
                        "Save & Preview"
                    ) : (
                        <>Next <ArrowRight className="h-4 w-4" /></>
                    )}
                </Button>
            </StickyBottomBar>
        </div>
    );
}

function ComplianceRow({
    pass,
    passText,
    failText,
    failHref,
    isInfo,
}: {
    pass: boolean;
    passText: string;
    failText: string;
    failHref?: string;
    isInfo?: boolean;
}) {
    const color = pass ? "var(--color-success)" : isInfo ? "var(--blue-500)" : "var(--amber-500)";
    return (
        <div className="flex items-start gap-2.5 text-xs">
            {pass
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--color-success)" }} />
                : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
            }
            <span style={{ color: pass ? "var(--text-secondary)" : color }}>
                {pass ? passText : failText}
                {!pass && failHref && (
                    <Link href={failHref} className="ml-1 underline font-bold" style={{ color }}>Fix →</Link>
                )}
            </span>
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
            <span className={bold ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
                {label}
            </span>
            <span
                className={`tabular-nums ${red ? "text-[var(--red-500)]" : bold ? "text-[var(--text-primary)] font-bold" : "text-[var(--text-secondary)]"}`}
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
