"use client";

// import "../pdf.worker.ts";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Check, Clock, Sparkles, AlertCircle, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { StickyBottomBar } from "@/components/layout/sticky-bottom-bar";
import { getEmployees, savePayslip, getSecureTime, getSettings, getAllPayslips, deletePayslip, saveDocumentMeta } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { format } from "date-fns";
import { calculatePayslip, getSundayRateMultiplier, isUifApplicable, NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";
import { getHolidaysInRange } from "@/lib/holidays";
import { formatDateSafe } from "@/lib/utils";
import { canUseLeaveTracking, getUserPlan } from "@/lib/entitlements";

const STEPS = [
    { label: "Hours", description: "Ordinary & overtime" },
    { label: "Sundays & Holidays", description: "Special rates" },
    { label: "Deductions", description: "UIF & accommodation" },
    { label: "Review", description: "Final confirmation" },
];

const safeDate = (s: string): Date => {
    if (!s) return new Date();
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? new Date() : d;
};

const FOUR_HOUR_RULE_TOOLTIP = "From 1 March 2026, if someone works for you on a day, they must be paid for at least 4 hours for that day, even if they worked less.";

const getWeekdayEstimate = (startValue: string, endValue: string): number => {
    if (!startValue || !endValue) return 0;

    const start = safeDate(startValue);
    const end = safeDate(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0;

    let count = 0;
    const cur = new Date(start);
    let safety = 0;

    while (cur <= end && safety < 100) {
        if (cur.getDay() !== 0) count++;
        cur.setDate(cur.getDate() + 1);
        safety++;
    }

    return count;
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
    const [employerDetailsGate, setEmployerDetailsGate] = React.useState(false);

    const now = new Date();
    const defaultStart = formatDateSafe(new Date(now.getFullYear(), now.getMonth(), 1));
    const defaultEnd = formatDateSafe(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    const [hours, setHours] = React.useState({ ordinary: "", overtime: "", sunday: "", holiday: "" });
    const [shortFallHours, setShortFallHours] = React.useState("");
    const [daysWorked, setDaysWorked] = React.useState("");
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
    const [periodError, setPeriodError] = React.useState("");
    const [hoursError, setHoursError] = React.useState("");
    const [includeAccommodation, setIncludeAccommodation] = React.useState(false);
    const [accommodationCost, setAccommodationCost] = React.useState("");
    const leaveTrackingEnabled = settings ? canUseLeaveTracking(getUserPlan(settings)) : false;
    const weekdayEstimate = React.useMemo(() => getWeekdayEstimate(dates.start, dates.end), [dates.start, dates.end]);

    React.useEffect(() => {
        let active = true;
        async function load() {
            const [employees, s] = await Promise.all([getEmployees(), getSettings()]);
            if (!active) return;
            const emp = employees.find((e) => e.id === empId);
            if (emp) {
                setEmployee(emp);
            } else {
                router.push("/employees");
            }
            setSettings(s);
            setLoadingInitial(false);
        }
        load();
        return () => {
            active = false;
        };
    }, [empId, router]);

    const enteredDaysWorked = Number(daysWorked) || 0;
    const totalHours =
        (Number(hours.ordinary) || 0) +
        (Number(hours.overtime) || 0) +
        (Number(hours.sunday) || 0) +
        (Number(hours.holiday) || 0);
    const sundayRateLabel = employee ? `${getSundayRateMultiplier(employee.ordinarilyWorksSundays ?? false).toFixed(1)}x` : "2.0x";

    const [leave, setLeave] = React.useState({ annual: "", sick: "", family: "" });

    const breakdown = employee
        ? calculatePayslip({
            id: "preview",
            householdId: employee.householdId ?? "default",
            employeeId: employee.id,
            payPeriodStart: safeDate(dates.start),
            payPeriodEnd: safeDate(dates.end),
            ordinaryHours: Number(hours.ordinary) || 0,
            overtimeHours: Number(hours.overtime) || 0,
            sundayHours: Number(hours.sunday) || 0,
            publicHolidayHours: Number(hours.holiday) || 0,
            daysWorked: enteredDaysWorked,
            shortFallHours: Number(shortFallHours) || 0,
            hourlyRate: employee.hourlyRate,
            ordinarilyWorksSundays: employee.ordinarilyWorksSundays ?? false,
            ordinaryHoursPerDay: employee.ordinaryHoursPerDay ?? 8,
            includeAccommodation,
            accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
            otherDeductions: 0,
            annualLeaveTaken: leaveTrackingEnabled ? Number(leave.annual) || 0 : 0,
            sickLeaveTaken: leaveTrackingEnabled ? Number(leave.sick) || 0 : 0,
            familyLeaveTaken: leaveTrackingEnabled ? Number(leave.family) || 0 : 0,
            createdAt: new Date(),
        })
        : null;
    const uifApplicable = breakdown
        ? isUifApplicable(breakdown.totalHours, breakdown.periodStart, breakdown.periodEnd)
        : false;

    const doSave = React.useCallback(async () => {
        if (!employee) return;
        setLoading(true);
        try {
            // Validate against secure time before save
            const [_settingsCheck, nowSafe] = await Promise.all([getSettings(), getSecureTime()]);
            void _settingsCheck;
            void nowSafe;

            const payslipInput: PayslipInput = {
                id: crypto.randomUUID(),
                householdId: employee.householdId ?? "default",
                employeeId: employee.id,
                payPeriodStart: safeDate(dates.start),
                payPeriodEnd: safeDate(dates.end),
                ordinaryHours: Number(hours.ordinary) || 0,
                overtimeHours: Number(hours.overtime) || 0,
                sundayHours: Number(hours.sunday) || 0,
                publicHolidayHours: Number(hours.holiday) || 0,
                daysWorked: enteredDaysWorked,
                shortFallHours: Number(shortFallHours) || 0,
                hourlyRate: employee.hourlyRate,
                advanceAmount: 0,
                ordinarilyWorksSundays: employee.ordinarilyWorksSundays ?? false,
                ordinaryHoursPerDay: employee.ordinaryHoursPerDay ?? 8,
                includeAccommodation,
                accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
                otherDeductions: 0,
                annualLeaveTaken: leaveTrackingEnabled ? Number(leave.annual) || 0 : 0,
                sickLeaveTaken: leaveTrackingEnabled ? Number(leave.sick) || 0 : 0,
                familyLeaveTaken: leaveTrackingEnabled ? Number(leave.family) || 0 : 0,
                createdAt: new Date(),
            };

            await savePayslip(payslipInput);

            await saveDocumentMeta({
                id: payslipInput.id,
                householdId: employee.householdId ?? "default",
                type: "payslip",
                employeeId: employee.id,
                fileName: `${employee.name.split(' ')[0]}_Payslip_${format(safeDate(dates.start), "MMM_yyyy")}.pdf`,
                source: "generated",
                createdAt: new Date().toISOString(),
            });

            // GA4 conversion tracking
            try {
                if (typeof window !== 'undefined' && 'gtag' in window) {
                    (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'onboarding_complete');
                }
            } catch (e) {
                console.error('GA4 tracking failed:', e);
            }

            toast("Payslip generated successfully!");
            router.push(`/preview?payslipId=${payslipInput.id}&empId=${employee.id}`);
        } catch (err) {
            console.error(err);
            toast(`Failed to generate payslip. ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    }, [employee, dates, hours, enteredDaysWorked, shortFallHours, includeAccommodation, accommodationCost, leave, leaveTrackingEnabled, router, toast]);

    const handleNext = async () => {
        if (currentStep === 0) {
            if (!dates.start || !dates.end) { setPeriodError("Please select the pay period."); return; }
            if (!hours.ordinary && !hours.overtime && !hours.sunday && !hours.holiday) {
                setHoursError("Please enter at least some hours worked.");
                return;
            }
            if ((Number(hours.ordinary) || 0) > 0 && enteredDaysWorked === 0) {
                setHoursError("Enter the actual days worked. This should not be auto-guessed because it affects the 4-hour minimum rule.");
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
        if (!settings?.employerName?.trim() || !settings?.employerAddress?.trim()) {
            setEmployerDetailsGate(true);
            return;
        }
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
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
                <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[var(--surface-2)] animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-28 bg-[var(--surface-2)] animate-pulse rounded" />
                                <div className="h-3 w-20 bg-[var(--surface-2)] animate-pulse rounded" />
                            </div>
                        </div>
                    </div>
                </div>
                <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-5 flex flex-col">
                    <div className="h-24 w-full rounded-2xl bg-[var(--surface-1)] animate-pulse border border-[var(--border)]" />
                    <div className="flex-1 w-full rounded-2xl bg-[var(--surface-1)] animate-pulse border border-[var(--border)]" />
                </main>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)]">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/employees">
                            <button
                                aria-label="Back"
                                className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="font-bold text-sm tracking-tight leading-tight" style={{ color: "var(--text)" }}>
                                Payslip Wizard
                            </h1>
                            <p className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
                                {employee.name}
                            </p>
                        </div>
                    </div>
                    <span
                        className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--focus)]"
                    >
                        Step {currentStep + 1}/{STEPS.length}
                    </span>
                </div>
            </div>

            <main className="flex-1 content-container">
                {/* Stepper */}
                <div
                    className="p-5 rounded-2xl"
                    style={{
                        backgroundColor: "var(--surface-1)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    <Stepper steps={STEPS} currentStep={currentStep} />
                </div>
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

                                <div className="pt-4 space-y-5" style={{ borderTop: "1px solid var(--border)" }}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                            <Clock className="w-4 h-4 text-[var(--focus)]" />
                                            Work Schedule
                                        </h3>
                                        <div className="flex gap-2">
                                            {detectedHolidays.length > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-[var(--focus)]/30 text-[var(--focus)] bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[10px] gap-1.5 px-2"
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
                                            <div className="flex items-center justify-between gap-2">
                                                <Label htmlFor="daysWorked" className="text-xs">Actual Days Worked</Label>
                                                {weekdayEstimate > 0 && (
                                                    <button
                                                        type="button"
                                                        className="text-[10px] font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                                                        onClick={() => setDaysWorked(weekdayEstimate.toString())}
                                                    >
                                                        Use weekday estimate ({weekdayEstimate})
                                                    </button>
                                                )}
                                            </div>
                                            <Input
                                                id="daysWorked"
                                                type="number"
                                                min="0"
                                                placeholder={weekdayEstimate > 0 ? weekdayEstimate.toString() : "20"}
                                                value={daysWorked}
                                                onChange={(e) => setDaysWorked(e.target.value)}
                                            />
                                            <p className="text-[10px] text-[var(--text-muted)]">
                                                Enter the real number of days worked in this period. We do not auto-fill this because it affects the 4-hour minimum rule.
                                            </p>
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
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="shortFallHours" className="text-xs">Shortfall (4-hr rule)</Label>
                                                <InfoTooltip
                                                    label="Explain the 4-hour minimum rule"
                                                    tooltip={FOUR_HOUR_RULE_TOOLTIP}
                                                />
                                            </div>
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
                                        <p className="text-xs font-medium text-[var(--danger)]">{hoursError}</p>
                                    )}

                                    {/* 4-Hour Rule Assistant */}
                                    <div className="p-4 rounded-xl border border-[var(--focus)]/10 bg-[var(--primary)]/[0.02] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3.5 h-3.5 text-[var(--focus)]" />
                                                <Label htmlFor="assistant-switch" className="cursor-pointer text-[11px] font-bold uppercase tracking-tight text-[var(--text-secondary)]">4-Hour Rule Assistant</Label>
                                                <InfoTooltip
                                                    label="Explain the 4-hour minimum rule assistant"
                                                    tooltip={FOUR_HOUR_RULE_TOOLTIP}
                                                />
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
                                                        <Label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Short Shifts</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-xs"
                                                            min="0"
                                                            placeholder="e.g. 2"
                                                            value={shortShiftCount || ""}
                                                            onChange={(e) => setShortShiftCount(Number.parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Hrs Worked</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-11 text-xs"
                                                            min="0"
                                                            placeholder="e.g. 3"
                                                            value={totalWorkedInShortShifts || ""}
                                                            onChange={(e) => setTotalWorkedInShortShifts(Number.parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full text-xs h-11 font-bold bg-[var(--primary)]/10 text-[var(--focus)] hover:bg-[var(--primary)]/20"
                                                    onClick={() => {
                                                        const shortfall = (shortShiftCount * 4) - totalWorkedInShortShifts;
                                                        if (shortfall > 0) {
                                                            setShortFallHours((prev) => (Number.parseFloat(prev || "0") + shortfall).toString());
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
                                        Sunday pay depends on the worker&apos;s normal schedule. This employee is set to{" "}
                                        <strong>{employee.ordinarilyWorksSundays ? "normally work Sundays" : "not normally work Sundays"}</strong>,
                                        {" "}so Sunday hours here pay at <strong>{sundayRateLabel}</strong>. Public holiday hours stay at <strong>2.0x</strong>.
                                    </AlertDescription>
                                </Alert>
                                <div className="space-y-2">
                                    <Label htmlFor="sunday">Sunday Hours ({sundayRateLabel} rate)</Label>
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
                                        <p className="text-[10px] font-medium animate-fade-in" style={{ color: "var(--primary)" }}>
                                            Found {detectedHolidays.length} holiday{detectedHolidays.length > 1 ? 's' : ''}: {detectedHolidays.map(h => h.name).join(", ")}.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 2 — Deductions */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <Alert variant={uifApplicable ? "success" : "warning"}>
                                    <AlertDescription>
                                        <strong>UIF</strong> (1% employee + 1% employer) is{" "}
                                        <strong>{uifApplicable ? "applicable" : "not applicable"}</strong>{" "}
                                        for this payslip, based on <strong>{breakdown?.totalHours ?? totalHours} counted hours</strong>.
                                    </AlertDescription>
                                </Alert>
                                {leaveTrackingEnabled && (
                                    <div className="pt-4 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
                                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                            <AlertCircle className="w-4 h-4 text-[var(--focus)]" />
                                            Leave Taken (This Month)
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Annual</Label>
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
                                                <Label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Sick</Label>
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
                                                <Label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Family</Label>
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
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIncludeAccommodation((v) => !v)}
                                    className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.99] border-[1.5px] hover:bg-[var(--surface-2)] ${includeAccommodation ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] bg-transparent"}`}
                                >
                                    <div
                                        className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 border-[1.5px] ${includeAccommodation ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-transparent border-[var(--border)]"}`}
                                    >
                                        {includeAccommodation && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                                            Accommodation Deduction
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
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
                                {employerDetailsGate && (
                                    <Alert variant="warning">
                                        <AlertDescription>
                                            Add your employer name and address before saving the first final payslip.
                                            {" "}
                                            <Link href="/settings" className="font-bold underline">
                                                Open Settings
                                            </Link>
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {/* Duplicate payslip warning */}
                                {duplicateId && (
                                    <div className="p-4 rounded-xl border border-[var(--focus)]/40 bg-[var(--primary)]/5 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--primary)" }}>
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <span>A payslip for {employee.name} already exists for {format(safeDate(dates.start), "MMMM yyyy")}.</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-[var(--primary)] text-white font-bold hover:brightness-95"
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
                                <div className="p-4 rounded-xl space-y-2.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface-2)" }}>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Payroll Check</p>
                                    <ComplianceRow
                                        pass={!!settings?.employerName?.trim() && !!settings?.employerAddress?.trim()}
                                        passText="Employer name and address set"
                                        failText="Employer details missing — add them before you save the final payslip"
                                        failHref="/settings"
                                    />
                                    <ComplianceRow
                                        pass={employee.hourlyRate >= NMW_RATE}
                                        passText={`Rate meets NMW (R${NMW_RATE.toFixed(2)}/hr)`}
                                        failText={`Rate below NMW — calculator auto-corrects to R${NMW_RATE.toFixed(2)}/hr`}
                                    />
                                    <ComplianceRow
                                        pass={uifApplicable}
                                        passText="UIF deducted (1% employee + 1% employer)"
                                        failText="UIF not deducted for this payslip"
                                        isInfo={!uifApplicable}
                                    />
                                    <ComplianceRow
                                        pass={enteredDaysWorked === 0 || (Number(hours.ordinary) / Math.max(enteredDaysWorked, 1)) >= 4}
                                        passText="Hours meet 4-hr minimum shift rule"
                                        failText="Some shifts may be below 4 hrs — calculator tops up automatically"
                                    />
                                </div>

                                {/* Earnings rows */}
                                <div
                                    className="rounded-xl overflow-hidden"
                                    style={{ border: "1px solid var(--border)" }}
                                >
                                    <div
                                        className="px-4 py-2.5 flex justify-between items-center text-xs font-bold uppercase tracking-widest"
                                        style={{
                                            backgroundColor: "var(--surface-2)",
                                            borderBottom: "1px solid var(--border)",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        <span>Payslip Summary</span>
                                        <span>R{employee.hourlyRate.toFixed(2)}/hr</span>
                                    </div>

                                    {/* Earnings */}
                                    <div className="px-4 pt-4 pb-2 space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>Earnings</p>
                                        <Row
                                            label={`Ordinary (${breakdown.effectiveOrdinaryHours}h${Number(shortFallHours) > 0 ? " inc. 4-hr minimum top-up" : ""})`}
                                            value={`R ${breakdown.ordinaryPay.toFixed(2)}`}
                                        />
                                        {(Number(hours.overtime) || 0) > 0 && <Row label={`Overtime (${Number(hours.overtime)}h @ 1.5x)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} />}
                                        {(Number(hours.sunday) || 0) > 0 && <Row label={`Sunday (${Number(hours.sunday)}h @ ${sundayRateLabel})`} value={`R ${breakdown.sundayPay.toFixed(2)}`} />}
                                        {(Number(hours.holiday) || 0) > 0 && <Row label={`Public Holiday (${Number(hours.holiday)}h @ 2x)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} />}
                                        <Row label="Gross Pay" value={`R ${breakdown.grossPay.toFixed(2)}`} bold />
                                    </div>

                                    <div style={{ borderTop: "1px solid var(--border)" }} />

                                    {/* Deductions */}
                                    <div className="px-4 pt-3 pb-2 space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>Deductions</p>
                                        <Row label={`UIF ${uifApplicable ? "(1%)" : "(n/a)"}`} value={`-R ${breakdown.deductions.uifEmployee.toFixed(2)}`} red />
                                        {includeAccommodation && breakdown.deductions.accommodation && (
                                            <Row label="Accommodation (10%)" value={`-R ${breakdown.deductions.accommodation.toFixed(2)}`} red />
                                        )}
                                        <Row label="Total Deductions" value={`R ${breakdown.deductions.total.toFixed(2)}`} bold />
                                    </div>

                                    {/* Net Pay bar */}
                                    <div
                                        className="flex justify-between items-center px-5 py-5"
                                        style={{ backgroundColor: "var(--primary)" }}
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
                    className="flex-1 sm:flex-none sm:min-w-[160px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold"
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
    const color = pass ? "var(--success)" : isInfo ? "var(--info)" : "var(--warning)";
    return (
        <div className="flex items-start gap-2.5 text-xs">
            {pass
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
                : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
            }
            <span style={{ color: pass ? "var(--text-muted)" : color }}>
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
            <span className={bold ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"}>
                {label}
            </span>
            <span
                className={`tabular-nums ${red ? "text-[var(--danger)]" : bold ? "text-[var(--text)] font-bold" : "text-[var(--text-muted)]"}`}
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
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
                </div>
            }
        >
            <WizardContent />
        </React.Suspense>
    );
}











