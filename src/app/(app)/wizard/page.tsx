/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";



import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Loader2, Check, Clock, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/money";
import { StickyBottomBar } from "@/components/layout/sticky-bottom-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { getEmployees, savePayslip, getSecureTime, getSettings, getAllPayslips, deletePayslip, saveDocumentMeta } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { format } from "date-fns";
import { calculatePayslip, getSundayRateMultiplier, isUifApplicable, NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";
import { getHolidaysInRange } from "@/lib/holidays";
import {
    derivePayslipDraft,
    getMonthBounds,
    getMonthKey,
    normalizePayslipDraftToInput,
} from "@/lib/payslip-draft";

import { canUseLeaveTracking, getUserPlan } from "@/lib/entitlements";
import { getEmployerDetailsSettingsHref, hasRequiredEmployerDetails } from "@/lib/employer-details";

const STEPS = [
    { label: "Hours", description: "Period & ordinary time" },
    { label: "Extra Pay", description: "Overtime, Sundays & holidays" },
    { label: "Deductions", description: "UIF & accommodation" },
    { label: "Review", description: "Final confirmation" },
];


const OVERTIME_TOOLTIP = "As at March 2026 in South Africa, overtime is usually paid at 1.5x. Double pay is generally for Sundays when the worker does not normally work Sundays, or for hours actually worked on a public holiday.";
const PUBLIC_HOLIDAY_TOOLTIP = "Only enter hours actually worked on a public holiday. These hours pay at 2x. Do not use this field for a paid day off on a holiday, and it does not add to overtime automatically.";

const safeDate = (s: string): Date => {
    if (!s) return new Date();
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? new Date() : d;
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
    const [monthKey, setMonthKey] = React.useState(getMonthKey(now));
    const [standardWorkingDaysThisMonth, setStandardWorkingDaysThisMonth] = React.useState("");
    const [ordinaryHoursOverride, setOrdinaryHoursOverride] = React.useState("");
    const [hours, setHours] = React.useState({ overtime: "", sunday: "", holiday: "" });
    const [shortShiftCount, setShortShiftCount] = React.useState(0);
    const [totalWorkedInShortShifts, setTotalWorkedInShortShifts] = React.useState(0);
    const [showShortShiftHelper, setShowShortShiftHelper] = React.useState(false);

    const monthBounds = React.useMemo(() => getMonthBounds(monthKey), [monthKey]);
    const payPeriodStartLabel = React.useMemo(() => format(monthBounds.start, "yyyy-MM-dd"), [monthBounds.start]);
    const payPeriodEndLabel = React.useMemo(() => format(monthBounds.end, "yyyy-MM-dd"), [monthBounds.end]);
    const detectedHolidays = React.useMemo(() => getHolidaysInRange(monthBounds.start, monthBounds.end), [monthBounds.end, monthBounds.start]);
    const [periodError, setPeriodError] = React.useState("");
    const [hoursError, setHoursError] = React.useState("");
    const [includeAccommodation, setIncludeAccommodation] = React.useState(false);
    const [accommodationCost, setAccommodationCost] = React.useState("");
    const leaveTrackingEnabled = settings ? canUseLeaveTracking(getUserPlan(settings)) : false;

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

    const redirectToEmployerSettings = React.useCallback(() => {
        const nextPath = empId ? `/wizard?empId=${encodeURIComponent(empId)}` : "/wizard";
        toast("Add your employer name and address in Settings before generating a payslip.", "info");
        router.push(getEmployerDetailsSettingsHref(nextPath));
    }, [empId, router, toast]);

    const [leave, setLeave] = React.useState({ annual: "", sick: "", family: "" });
    const enteredDaysWorked = Number(standardWorkingDaysThisMonth) || 0;
    const monthlyDraft = employee
        ? derivePayslipDraft({
            householdId: employee.householdId ?? "default",
            employeeId: employee.id,
            monthKey,
            standardWorkingDaysThisMonth: enteredDaysWorked,
            ordinaryHoursPerDay: employee.ordinaryHoursPerDay ?? 8,
            ordinaryHoursOverride: ordinaryHoursOverride.trim() ? Number(ordinaryHoursOverride) : null,
            overtimeHours: Number(hours.overtime) || 0,
            sundayHours: Number(hours.sunday) || 0,
            publicHolidayHours: Number(hours.holiday) || 0,
            shortShiftCount,
            shortShiftWorkedHours: totalWorkedInShortShifts,
            hourlyRate: employee.hourlyRate,
            ordinarilyWorksSundays: employee.ordinarilyWorksSundays ?? false,
            includeAccommodation,
            accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
            otherDeductions: 0,
            annualLeaveTaken: leaveTrackingEnabled ? Number(leave.annual) || 0 : 0,
            sickLeaveTaken: leaveTrackingEnabled ? Number(leave.sick) || 0 : 0,
            familyLeaveTaken: leaveTrackingEnabled ? Number(leave.family) || 0 : 0,
        })
        : null;
    const ordinaryHours = monthlyDraft?.ordinaryHours ?? 0;
    const totalHours =
        ordinaryHours +
        (Number(hours.overtime) || 0) +
        (Number(hours.sunday) || 0) +
        (Number(hours.holiday) || 0);
    const sundayRateLabel = employee ? `${getSundayRateMultiplier(employee.ordinarilyWorksSundays ?? false).toFixed(1)}x` : "2.0x";

    const breakdown = employee
        ? calculatePayslip(normalizePayslipDraftToInput({
            id: "preview",
            householdId: employee.householdId ?? "default",
            employeeId: employee.id,
            monthKey,
            standardWorkingDaysThisMonth: enteredDaysWorked,
            ordinaryHoursPerDay: employee.ordinaryHoursPerDay ?? 8,
            ordinaryHoursOverride: ordinaryHoursOverride.trim() ? Number(ordinaryHoursOverride) : null,
            overtimeHours: Number(hours.overtime) || 0,
            sundayHours: Number(hours.sunday) || 0,
            publicHolidayHours: Number(hours.holiday) || 0,
            shortShiftCount,
            shortShiftWorkedHours: totalWorkedInShortShifts,
            hourlyRate: employee.hourlyRate,
            ordinarilyWorksSundays: employee.ordinarilyWorksSundays ?? false,
            includeAccommodation,
            accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
            otherDeductions: 0,
            annualLeaveTaken: leaveTrackingEnabled ? Number(leave.annual) || 0 : 0,
            sickLeaveTaken: leaveTrackingEnabled ? Number(leave.sick) || 0 : 0,
            familyLeaveTaken: leaveTrackingEnabled ? Number(leave.family) || 0 : 0,
            createdAt: new Date(),
        }))
        : null;
    const uifApplicable = breakdown
        ? isUifApplicable(breakdown.totalHours, breakdown.periodStart, breakdown.periodEnd)
        : false;
    const ordinaryHoursInputValue = ordinaryHoursOverride !== ""
        ? ordinaryHoursOverride
        : monthlyDraft?.autoOrdinaryHours
            ? monthlyDraft.autoOrdinaryHours.toString()
            : "";
    const ordinaryHoursHelperText = monthlyDraft?.hasManualOrdinaryHoursOverride
        ? `Manual ordinary-hours override in use. Auto-calculated hours for this month would be ${monthlyDraft.autoOrdinaryHours}.`
        : `Auto-calculated as ${monthlyDraft?.autoOrdinaryHours ?? 0} hours from ${enteredDaysWorked} standard day${enteredDaysWorked === 1 ? "" : "s"} x ${employee?.ordinaryHoursPerDay ?? 8} hours.`;
    const hasFourHourTopUp = breakdown
        ? breakdown.topUps.fourHourMinimumHours > 0
        : false;
    const ordinaryTopUpLabel = hasFourHourTopUp && breakdown
        ? ` + ${breakdown.topUps.fourHourMinimumHours}h 4-hr top-up`
        : "";
    const ordinaryPayLabel = `Ordinary (${ordinaryHours}h${ordinaryTopUpLabel})`;
    const shouldShowAccommodationDeduction = Boolean(includeAccommodation && breakdown?.deductions.accommodation);
    let nextButtonContent: React.ReactNode = (
        <>
            Next <ArrowRight className="h-4 w-4" />
        </>
    );
    if (loading) {
        nextButtonContent = (
            <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
        );
    } else if (currentStep === STEPS.length - 1) {
        nextButtonContent = "Save & Preview";
    }
    const doSave = React.useCallback(async () => {
        if (!employee) return;
        setLoading(true);
        try {
            // Validate against secure time before save
            await Promise.all([getSettings(), getSecureTime()]);

            const payslipInput: PayslipInput = normalizePayslipDraftToInput({
                id: crypto.randomUUID(),
                householdId: employee.householdId ?? "default",
                employeeId: employee.id,
                monthKey,
                standardWorkingDaysThisMonth: enteredDaysWorked,
                ordinaryHoursPerDay: employee.ordinaryHoursPerDay ?? 8,
                ordinaryHoursOverride: ordinaryHoursOverride.trim() ? Number(ordinaryHoursOverride) : null,
                overtimeHours: Number(hours.overtime) || 0,
                sundayHours: Number(hours.sunday) || 0,
                publicHolidayHours: Number(hours.holiday) || 0,
                shortShiftCount,
                shortShiftWorkedHours: totalWorkedInShortShifts,
                hourlyRate: employee.hourlyRate,
                ordinarilyWorksSundays: employee.ordinarilyWorksSundays ?? false,
                includeAccommodation,
                accommodationCost: includeAccommodation && accommodationCost ? Number(accommodationCost) : undefined,
                otherDeductions: 0,
                annualLeaveTaken: leaveTrackingEnabled ? Number(leave.annual) || 0 : 0,
                sickLeaveTaken: leaveTrackingEnabled ? Number(leave.sick) || 0 : 0,
                familyLeaveTaken: leaveTrackingEnabled ? Number(leave.family) || 0 : 0,
                createdAt: new Date(),
            });

            await savePayslip(payslipInput);

            await saveDocumentMeta({
                id: payslipInput.id,
                householdId: employee.householdId ?? "default",
                type: "payslip",
                employeeId: employee.id,
                fileName: `${employee.name.split(' ')[0]}_Payslip_${format(monthBounds.start, "MMM_yyyy")}.pdf`,
                source: "generated",
                createdAt: new Date().toISOString(),
            });

            try {
                if (typeof globalThis !== 'undefined' && 'gtag' in globalThis) {
                    (globalThis as any).gtag?.('event', 'onboarding_complete');
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
    }, [employee, monthKey, enteredDaysWorked, ordinaryHoursOverride, hours, shortShiftCount, totalWorkedInShortShifts, includeAccommodation, accommodationCost, leave, leaveTrackingEnabled, router, toast, monthBounds.start]);

    const handleNext = async () => {
        if (currentStep === 0) {
            if (!monthKey) { setPeriodError("Please select the month for this payslip."); return; }
            if (enteredDaysWorked === 0 && !hours.overtime && !hours.sunday && !hours.holiday) {
                setHoursError("Enter the standard working days for this month, or add premium hours if this month had no ordinary schedule.");
                return;
            }
            if (enteredDaysWorked > 0 && ordinaryHours <= 0) {
                setHoursError("Ordinary hours must be greater than 0 when standard working days are entered.");
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
        if (!hasRequiredEmployerDetails(settings)) {
            redirectToEmployerSettings();
            return;
        }
        setLoading(true);

        try {
            const allPayslips = await getAllPayslips();
            const currentMonth = monthKey;
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
                    <div className="mx-auto w-full max-w-5xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[var(--surface-2)] animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-28 bg-[var(--surface-2)] animate-pulse rounded" />
                                <div className="h-3 w-20 bg-[var(--surface-2)] animate-pulse rounded" />
                            </div>
                        </div>
                    </div>
                </div>
                <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-5 px-4 py-6 pb-28">
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
                <div className="mx-auto w-full max-w-5xl flex items-center justify-between">
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

            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-5 px-4 py-6 pb-28">
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
                {!!employee && employee.hourlyRate <= NMW_RATE && (
                    <Alert variant="warning">
                        <AlertDescription>
                            Using National Minimum Wage ({formatCurrency(NMW_RATE)}/hr).
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
                                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="month">Payslip Month</Label>
                                            <Input
                                                id="month"
                                                type="month"
                                                value={monthKey}
                                                onChange={(e) => setMonthKey(e.target.value)}
                                                error={periodError || undefined}
                                            />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="start">Period Start</Label>
                                                <Input
                                                    id="start"
                                                    type="date"
                                                    value={payPeriodStartLabel}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="end">Period End</Label>
                                                <Input
                                                    id="end"
                                                    type="date"
                                                    value={payPeriodEndLabel}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Monthly setup</p>
                                        <p className="text-sm font-semibold text-[var(--text)]">Choose the month once.</p>
                                        <p className="text-sm leading-6 text-[var(--text-muted)]">
                                            LekkerLedger fills the first and last day of that month automatically so the main job here is just the work schedule and any extra pay.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-5" style={{ borderTop: "1px solid var(--border)" }}>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                            <Clock className="w-4 h-4 text-[var(--focus)]" />
                                            Standard Time
                                        </h3>
                                        <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                                            {employee.ordinaryHoursPerDay ?? 8} hours per standard day
                                        </div>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="standardWorkingDays" className="text-xs">Standard Working Days This Month</Label>
                                                    <InfoTooltip
                                                        label="Explain standard working days this month"
                                                        tooltip="Enter the normal number of workdays for this payslip month. LekkerLedger uses this to calculate ordinary hours automatically from the employee's standard hours per day."
                                                    />
                                                </div>
                                                <Input
                                                    id="standardWorkingDays"
                                                    type="number"
                                                    min="0"
                                                    placeholder="e.g. 20"
                                                    value={standardWorkingDaysThisMonth}
                                                    onChange={(e) => setStandardWorkingDaysThisMonth(e.target.value)}
                                                />
                                                <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                                                    Example: if the employee usually works Monday to Friday and worked 20 normal days this month, enter 20.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor="ordinary" className="text-xs">Ordinary Hours</Label>
                                                        <InfoTooltip
                                                            label="Explain ordinary hours"
                                                            tooltip="These are the normal paid hours for the month before overtime, Sundays, and public-holiday work. LekkerLedger calculates this automatically, but you can adjust it if the month was unusual."
                                                        />
                                                    </div>
                                                    {monthlyDraft?.hasManualOrdinaryHoursOverride && (
                                                        <button
                                                            type="button"
                                                            className="text-[11px] font-semibold text-[var(--primary)] hover:underline"
                                                            onClick={() => setOrdinaryHoursOverride("")}
                                                        >
                                                            Use auto hours
                                                        </button>
                                                    )}
                                                </div>
                                                <Input
                                                    id="ordinary"
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={ordinaryHoursInputValue}
                                                    onChange={(e) => setOrdinaryHoursOverride(e.target.value)}
                                                />
                                                <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                                                    {ordinaryHoursHelperText}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowShortShiftHelper((current) => !current)}
                                                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-left hover:bg-[var(--surface-raised)]"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Short Shifts (4-hour rule)</p>
                                                    <p className="text-sm font-semibold text-[var(--text)]">Had any shifts under 4 hours this month? Add them here.</p>
                                                </div>
                                                {showShortShiftHelper ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                            </button>

                                            {showShortShiftHelper && (
                                                <div className="space-y-4 animate-fade-in">
                                                    <div className="rounded-xl border border-[var(--focus)]/20 bg-[var(--primary)]/[0.03] p-3 text-sm leading-6 text-[var(--text-muted)]">
                                                        If someone worked on a day for less than 4 hours, South African law from March 2026 says they must still be paid for at least 4 hours for that day. Example: if they worked 2 hours on one Saturday, LekkerLedger adds 2 more paid hours.
                                                    </div>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">How many short shifts?</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                placeholder="e.g. 1"
                                                                value={shortShiftCount || ""}
                                                                onChange={(e) => setShortShiftCount(Number.parseInt(e.target.value, 10) || 0)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Hours actually worked across them</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                placeholder="e.g. 2"
                                                                value={totalWorkedInShortShifts || ""}
                                                                onChange={(e) => setTotalWorkedInShortShifts(Number.parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3">
                                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">4-hour top-up</p>
                                                        <p className="mt-1 text-base font-semibold text-[var(--text)]">
                                                            {monthlyDraft?.shortFallHours ?? 0} hour{(monthlyDraft?.shortFallHours ?? 0) === 1 ? "" : "s"} will be added
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">What happens next</p>
                                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                                            Overtime, Sunday hours, and public-holiday work are entered separately on the next step so the ordinary monthly hours stay clear.
                                        </p>
                                    </div>
                                    {hoursError && (
                                        <p className="text-xs font-medium text-[var(--danger)]">{hoursError}</p>
                                    )}
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
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="overtime">Overtime (1.5x)</Label>
                                        <InfoTooltip
                                            label="Explain overtime pay"
                                            tooltip={OVERTIME_TOOLTIP}
                                        />
                                    </div>
                                    <Input
                                        id="overtime"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={hours.overtime}
                                        onChange={(e) => setHours((prev) => ({ ...prev, overtime: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sunday">Sunday Hours ({sundayRateLabel} rate)</Label>
                                    <Input
                                        id="sunday"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={hours.sunday}
                                        onChange={(e) => setHours((prev) => ({ ...prev, sunday: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="holiday">Public Holiday Hours (2× rate)</Label>
                                        <InfoTooltip
                                            label="Explain public holiday hours"
                                            tooltip={PUBLIC_HOLIDAY_TOOLTIP}
                                        />
                                    </div>
                                    <Input
                                        id="holiday"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={hours.holiday}
                                        onChange={(e) => setHours((prev) => ({ ...prev, holiday: e.target.value }))}
                                    />
                                    {detectedHolidays.length > 0 && (
                                        <div className="rounded-xl border border-[var(--focus)]/15 bg-[var(--primary)]/[0.03] p-3 space-y-2">
                                            <p className="text-[11px] font-semibold" style={{ color: "var(--primary)" }}>
                                                Public holiday{detectedHolidays.length > 1 ? "s" : ""} in this period:
                                            </p>
                                            <ul className="space-y-1 text-[11px] text-[var(--text-muted)]">
                                                {detectedHolidays.map((holiday) => {
                                                    const holidayDate = safeDate(holiday.date);
                                                    return (
                                                        <li key={holiday.date}>
                                                            {format(holidayDate, "EEE d MMM yyyy")}: {holiday.name}
                                                            {holidayDate.getDay() === 6 ? " (falls on Saturday)" : ""}
                                                            {holidayDate.getDay() === 0 ? " (falls on Sunday)" : ""}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            <p className="text-[11px] text-[var(--text-muted)]">
                                                Enter hours here only if the employee actually worked on that public holiday. If they did not work, do not add hours here.
                                            </p>
                                        </div>
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
                                                    onChange={(e) => setLeave((prev) => ({ ...prev, annual: e.target.value }))}
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
                                                    onChange={(e) => setLeave((prev) => ({ ...prev, sick: e.target.value }))}
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
                                                    onChange={(e) => setLeave((prev) => ({ ...prev, family: e.target.value }))}
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
                                {/* Duplicate payslip warning */}
                                {!!duplicateId && (
                                    <div className="p-4 rounded-xl border border-[var(--focus)]/40 bg-[var(--primary)]/5 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--primary)" }}>
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <span>A payslip for {employee.name} already exists for {format(monthBounds.start, "MMMM yyyy")}.</span>
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
                                        pass={hasRequiredEmployerDetails(settings)}
                                        passText="Employer name and address set"
                                        failText="Employer details missing — complete Settings before you generate the payslip"
                                        failHref={getEmployerDetailsSettingsHref(empId ? `/wizard?empId=${encodeURIComponent(empId)}` : "/wizard")}
                                    />
                                    <ComplianceRow
                                        pass={employee.hourlyRate >= NMW_RATE}
                                        passText={`Rate meets NMW (${formatCurrency(NMW_RATE)}/hr)`}
                                        failText={`Rate below NMW — calculator auto-corrects to ${formatCurrency(NMW_RATE)}/hr`}
                                    />
                                    <ComplianceRow
                                        pass={uifApplicable}
                                        passText="UIF deducted (1% employee + 1% employer)"
                                        failText="UIF not deducted for this payslip"
                                        isInfo={!uifApplicable}
                                    />
                                    <ComplianceRow
                                        pass={!hasFourHourTopUp}
                                        passText="No 4-hour minimum top-up added"
                                        failText="This payslip includes a 4-hour minimum top-up"
                                        isInfo={hasFourHourTopUp}
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
                                        <span>{formatCurrency(employee.hourlyRate)}/hr</span>
                                    </div>

                                    {/* Earnings */}
                                    <div className="px-4 pt-4 pb-2 space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>Earnings</p>
                                        <Row
                                            label={ordinaryPayLabel}
                                            value={formatCurrency(breakdown.ordinaryPay)}
                                        />
                                        {hasFourHourTopUp && (
                                            <Row
                                                label="4-hour minimum top-up"
                                                value={`${breakdown.topUps.fourHourMinimumHours}h included`}
                                            />
                                        )}
                                        {(Number(hours.overtime) || 0) > 0 && <Row label={`Overtime (${Number(hours.overtime)}h @ 1.5x)`} value={formatCurrency(breakdown.overtimePay)} />}
                                        {(Number(hours.sunday) || 0) > 0 && <Row label={`Sunday (${Number(hours.sunday)}h @ ${sundayRateLabel})`} value={formatCurrency(breakdown.sundayPay)} />}
                                        {(Number(hours.holiday) || 0) > 0 && <Row label={`Public Holiday (${Number(hours.holiday)}h @ 2x)`} value={formatCurrency(breakdown.publicHolidayPay)} />}
                                        <Row label="Gross Pay" value={formatCurrency(breakdown.grossPay)} bold />
                                    </div>

                                    <div style={{ borderTop: "1px solid var(--border)" }} />

                                    {/* Deductions */}
                                    <div className="px-4 pt-3 pb-2 space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>Deductions</p>
                                        <Row label={`UIF ${uifApplicable ? "(1%)" : "(n/a)"}`} value={formatCurrency(breakdown.deductions.uifEmployee)} red />
                                        {shouldShowAccommodationDeduction && (
                                            <Row label="Accommodation (10%)" value={formatCurrency(breakdown.deductions.accommodation)} red />
                                        )}
                                        <Row label="Total Deductions" value={formatCurrency(breakdown.deductions.total)} bold />
                                    </div>

                                    {/* Net Pay bar */}
                                    <div
                                        className="flex justify-between items-center px-5 py-5"
                                        style={{ backgroundColor: "var(--primary)" }}
                                    >
                                        <span className="font-bold text-lg text-white">Net Pay</span>
                                        <span className="font-extrabold text-2xl text-white tabular-nums">
                                            {formatCurrency(breakdown.netPay)}
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
                    {nextButtonContent}
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
}: Readonly<{
    pass: boolean;
    passText: string;
    failText: string;
    failHref?: string;
    isInfo?: boolean;
}>) {
    let color = "var(--warning)";
    if (pass) color = "var(--success)";
    else if (isInfo) color = "var(--info)";
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
}: Readonly<{
    label: string;
    value: string;
    bold?: boolean;
    red?: boolean;
}>) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className={bold ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"}>
                {label}
            </span>
            <span
                className={`tabular-nums ${(() => {
                    if (red) return "text-[var(--danger)]";
                    if (bold) return "text-[var(--text)] font-bold";
                    return "text-[var(--text-muted)]";
                })()}`}
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
