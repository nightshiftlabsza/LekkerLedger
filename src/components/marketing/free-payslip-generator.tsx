"use client";

import Link from "next/link";
import * as React from "react";
import { format } from "date-fns";
import {
    AlertTriangle,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";
import {
    buildEmptyOrdinaryWorkPattern,
    normalizeOrdinaryWorkPattern,
} from "@/lib/ordinary-work-pattern";
import {
    buildDefaultFreePayslipFormState,
    buildFreePayslipCalculationInput,
    buildFreePayslipPayload,
    buildPatternFromPreset,
    type FreePayslipFieldErrors,
    type FreePayslipFormState,
    FREE_PAYSLIP_DRAFT_STORAGE_KEY,
    FREE_PAYSLIP_RULE_MESSAGE,
    FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE,
    getPresetFromPattern,
    isValidMonthKey,
    sanitizeSavedFreePayslipDraft,
    validateFreePayslipForm,
} from "@/lib/free-payslip-form";
import { OrdinaryWorkPatternPicker } from "@/components/payroll/ordinary-work-pattern-picker";
import { describeOrdinaryWorkCalendar } from "@/lib/payroll-calendar";
import { buildPayrollSummary } from "@/lib/payroll-summary";
import { getMonthBounds, getMonthKey } from "@/lib/payslip-draft";

type DeliveryPhase = "idle" | "sending" | "quota-used" | "service-unavailable" | "success";
type NoticeTone = "info" | "warning" | "danger" | "success";
type DeliveryState = {
    phase: DeliveryPhase;
    tone: NoticeTone;
    message: string;
    email: string;
};
type DeliverResponse = {
    status: "sent";
    email: string;
    monthKey: string;
};
type OrdinaryWorkPreset = "monday-to-friday" | "monday-to-saturday" | "custom";
type WizardStep = 0 | 1 | 2;
type TransitionDirection = "forward" | "back";
type TransitionPhase = "idle" | "exit" | "enter";

const INITIAL_DELIVERY_STATE: DeliveryState = {
    phase: "idle",
    tone: "info",
    message: "",
    email: "",
};

const STEP_LABELS = [
    { label: "Schedule" },
    { label: "Work" },
    { label: "Review" },
] as const;

const STEP_FIELDS: Record<WizardStep, Array<keyof FreePayslipFormState>> = {
    0: ["employeeName", "monthKey", "hourlyRate", "ordinaryWorkPattern", "employerName", "employerAddress"],
    1: ["ordinaryDaysWorked", "ordinaryHoursOverride", "overtimeHours", "sundayHours", "publicHolidayHours", "shortShiftCount", "shortShiftWorkedHours", "otherDeductions"],
    2: [],
};

function loadSavedDraft() {
    if (typeof window === "undefined") return null;
    try {
        const rawDraft = window.localStorage.getItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY);
        return rawDraft ? sanitizeSavedFreePayslipDraft(JSON.parse(rawDraft)) : null;
    } catch {
        return null;
    }
}

function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setPrefersReducedMotion(mediaQuery.matches);
        update();

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", update);
            return () => mediaQuery.removeEventListener("change", update);
        }

        mediaQuery.addListener(update);
        return () => mediaQuery.removeListener(update);
    }, []);

    return prefersReducedMotion;
}

function getNoticeStyles(tone: NoticeTone) {
    if (tone === "danger") return "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--text)]";
    if (tone === "warning") return "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--text)]";
    if (tone === "success") return "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--text)]";
    return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]";
}

function getDeliveryIcon(tone: NoticeTone) {
    if (tone === "success") return <BadgeCheck className="mt-0.5 h-5 w-5 text-[var(--success)]" />;
    if (tone === "warning") return <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning)]" />;
    if (tone === "danger") return <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" />;
    return <Mail className="mt-0.5 h-5 w-5 text-[var(--primary)]" />;
}

function TextField({
    id,
    label,
    hint,
    warning,
    error,
    children,
}: {
    id: string;
    label: string;
    hint?: string;
    warning?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label htmlFor={id} className="block space-y-2">
            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
            {children}
            {hint ? <span className="block text-sm leading-6 text-[var(--text-muted)]">{hint}</span> : null}
            {warning ? <span className="block text-sm leading-6 text-[var(--warning)]">{warning}</span> : null}
            {error ? <span className="block text-sm font-medium text-[var(--danger)]">{error}</span> : null}
        </label>
    );
}

function SectionIntro({
    eyebrow,
    title,
    description,
    headingRef,
}: {
    eyebrow: string;
    title: string;
    description: string;
    headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
    return (
        <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">{eyebrow}</p>
            <h3 ref={headingRef} tabIndex={-1} className="font-[family:var(--font-serif)] text-[var(--h2-size)] font-semibold leading-[var(--h2-lh)] tracking-[var(--h2-ls)] text-[var(--text)] focus:outline-none">
                {title}
            </h3>
            <p className="text-sm leading-7 text-[var(--text-muted)]">{description}</p>
        </div>
    );
}

function ScheduleOption({
    active,
    label,
    detail,
    onClick,
    id,
}: {
    active: boolean;
    label: string;
    detail: string;
    onClick: () => void;
    id: string;
}) {
    return (
        <button
            id={id}
            type="button"
            onClick={onClick}
            className={`min-h-[var(--touch-target-min)] rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${
                active
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                    : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"
            }`}
        >
            <p className="text-sm font-semibold">{label}</p>
            <p className={`mt-1 text-sm leading-6 ${active ? "text-white/88" : "text-[var(--text-muted)]"}`}>{detail}</p>
        </button>
    );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
            <span className={`${strong ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"} leading-6`}>{label}</span>
            <span className={`text-right tabular-nums ${strong ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--text)]"}`}>{value}</span>
        </div>
    );
}

function MajorSummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className={`mt-2 font-[family:var(--font-serif)] text-[clamp(1.35rem,4vw,2rem)] font-semibold leading-tight tabular-nums ${accent ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
                {value}
            </p>
        </div>
    );
}

export function FreePayslipGenerator() {
    const savedDraft = React.useMemo(() => loadSavedDraft(), []);
    const prefersReducedMotion = usePrefersReducedMotion();
    const transitionDurationMs = prefersReducedMotion ? 150 : 220;
    const motionTimersRef = React.useRef<number[]>([]);
    const stepHeadingRef = React.useRef<HTMLHeadingElement | null>(null);

    const [form, setForm] = React.useState<FreePayslipFormState>(() => savedDraft?.form ?? buildDefaultFreePayslipFormState());
    const [errors, setErrors] = React.useState<FreePayslipFieldErrors>({});
    const [deliveryEmail, setDeliveryEmail] = React.useState(() => savedDraft?.email ?? "");
    const [marketingConsent, setMarketingConsent] = React.useState(() => savedDraft?.marketingConsent ?? false);
    const [delivery, setDelivery] = React.useState<DeliveryState>(INITIAL_DELIVERY_STATE);
    const [showPayslipDetails, setShowPayslipDetails] = React.useState(false);
    const [showRoleOverride, setShowRoleOverride] = React.useState(() => (savedDraft?.form.employeeRole ?? "Domestic Worker") !== "Domestic Worker");
    const [showIdentityField, setShowIdentityField] = React.useState(() => Boolean(savedDraft?.form.employeeId));
    const [showOrdinaryHoursOverride, setShowOrdinaryHoursOverride] = React.useState(() => Boolean(savedDraft?.form.ordinaryHoursOverride));
    const [showOptionalAdjustments, setShowOptionalAdjustments] = React.useState(() => {
        const savedForm = savedDraft?.form;
        return Boolean(
            savedForm
            && (
                savedForm.overtimeHours !== "0"
                || savedForm.sundayHours !== "0"
                || savedForm.publicHolidayHours !== "0"
                || savedForm.shortShiftCount !== "0"
                || savedForm.shortShiftWorkedHours !== "0"
                || savedForm.otherDeductions !== "0"
            ),
        );
    });
    const [showHolidayDetails, setShowHolidayDetails] = React.useState(false);
    const [showSummaryDetails, setShowSummaryDetails] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState<WizardStep>(0);
    const [stepperStep, setStepperStep] = React.useState<WizardStep>(0);
    const [furthestStepReached, setFurthestStepReached] = React.useState<WizardStep>(0);
    const [transitionPhase, setTransitionPhase] = React.useState<TransitionPhase>("idle");
    const [transitionDirection, setTransitionDirection] = React.useState<TransitionDirection>("forward");

    const confirmedPattern = React.useMemo(() => normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern), [form.ordinaryWorkPattern]);
    const normalizedPattern = React.useMemo(() => confirmedPattern ?? buildEmptyOrdinaryWorkPattern(), [confirmedPattern]);
    const schedulePreset = React.useMemo(() => getPresetFromPattern(normalizedPattern), [normalizedPattern]);
    const monthBounds = React.useMemo(
        () => getMonthBounds(isValidMonthKey(form.monthKey) ? form.monthKey : getMonthKey(new Date())),
        [form.monthKey],
    );
    const ordinaryCalendar = React.useMemo(
        () => describeOrdinaryWorkCalendar(monthBounds.start, monthBounds.end, normalizedPattern, 8),
        [monthBounds.end, monthBounds.start, normalizedPattern],
    );
    const calculationInput = React.useMemo(() => buildFreePayslipCalculationInput(form), [form]);
    const breakdown = React.useMemo(() => calculationInput ? calculatePayslip(calculationInput) : null, [calculationInput]);
    const payrollSummary = React.useMemo(() => calculationInput ? buildPayrollSummary(calculationInput) : null, [calculationInput]);
    const payload = React.useMemo(() => buildFreePayslipPayload(form), [form]);
    const ordinaryDaysWorked = Number(form.ordinaryDaysWorked || 0);
    const ordinaryHoursOverride = form.ordinaryHoursOverride.trim() ? Number(form.ordinaryHoursOverride) : null;

    const sundayRateHelper = normalizedPattern.sunday
        ? "Sunday hours are paid at 1.5x because Sunday is part of her normal schedule."
        : "Sunday hours are paid at 2x because Sunday is not part of her normal schedule.";
    const daysHint = `${format(monthBounds.end, "MMMM yyyy")} allows up to ${ordinaryCalendar.ordinaryDayCap} day${ordinaryCalendar.ordinaryDayCap === 1 ? "" : "s"} for her normal schedule.`;
    const hoursHint = `${format(monthBounds.end, "MMMM yyyy")} allows up to ${ordinaryCalendar.ordinaryHourCap} normal hour${ordinaryCalendar.ordinaryHourCap === 1 ? "" : "s"} for her schedule.`;
    const daysCapWarning = ordinaryDaysWorked > ordinaryCalendar.ordinaryDayCap
        ? `This schedule allows up to ${ordinaryCalendar.ordinaryDayCap} day${ordinaryCalendar.ordinaryDayCap === 1 ? "" : "s"} this month.`
        : undefined;
    const hoursCapWarning = ordinaryHoursOverride !== null && ordinaryHoursOverride > ordinaryCalendar.ordinaryHourCap
        ? `This schedule allows up to ${ordinaryCalendar.ordinaryHourCap} normal hour${ordinaryCalendar.ordinaryHourCap === 1 ? "" : "s"} this month.`
        : undefined;
    const holidaySummary = ordinaryCalendar.publicHolidaysOnOrdinaryWorkDays.length > 0
        ? `${ordinaryCalendar.publicHolidaysOnOrdinaryWorkDays.length} public holiday${ordinaryCalendar.publicHolidaysOnOrdinaryWorkDays.length === 1 ? "" : "s"} land on her normal work days this month. Do not count them in "Days she came in" unless she actually worked those hours.`
        : ordinaryCalendar.publicHolidaysInRange.length > 0
            ? "Public holidays fall this month, but none are on her normal work days."
            : "No South African public holidays fall in this month.";

    const clearTransitionTimers = React.useCallback(() => {
        motionTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
        motionTimersRef.current = [];
    }, []);

    React.useEffect(() => () => clearTransitionTimers(), [clearTransitionTimers]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY, JSON.stringify({
                form,
                email: deliveryEmail,
                marketingConsent,
            }));
        } catch {
            // Best-effort draft persistence only.
        }
    }, [deliveryEmail, form, marketingConsent]);

    const resetDeliveryState = React.useCallback(() => {
        setDelivery(INITIAL_DELIVERY_STATE);
    }, []);

    const updateField = React.useCallback((key: keyof FreePayslipFormState, value: FreePayslipFormState[keyof FreePayslipFormState]) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const nextErrors = { ...current };
            delete nextErrors[key];
            return nextErrors;
        });
    }, []);

    const focusField = React.useCallback((field: keyof FreePayslipFormState) => {
        if (typeof document === "undefined") return;

        const fieldIds: Partial<Record<keyof FreePayslipFormState, string>> = {
            employerName: "free-employer-name",
            employerAddress: "free-employer-address",
            employeeName: "free-worker-name",
            employeeId: "free-worker-id",
            employeeRole: "free-worker-role",
            hourlyRate: "free-hourly-rate",
            monthKey: "free-month",
            ordinaryDaysWorked: "free-ordinary-days",
            ordinaryHoursOverride: "free-ordinary-hours",
            overtimeHours: "free-overtime-hours",
            sundayHours: "free-sunday-hours",
            publicHolidayHours: "free-public-holiday-hours",
            shortShiftCount: "free-short-shifts",
            shortShiftWorkedHours: "free-short-shift-hours",
            otherDeductions: "free-other-deductions",
            ordinaryWorkPattern: "free-schedule-preset-monday-to-friday",
        };

        const targetId = fieldIds[field];
        if (!targetId) return;

        window.requestAnimationFrame(() => {
            const element = document.getElementById(targetId);
            if (!element) return;
            if ("scrollIntoView" in element && typeof element.scrollIntoView === "function") {
                element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
            }
            if ("focus" in element && typeof element.focus === "function") {
                element.focus();
            }
        });
    }, [prefersReducedMotion]);

    const focusStepHeading = React.useCallback(() => {
        if (!stepHeadingRef.current) return;
        if (typeof stepHeadingRef.current.scrollIntoView === "function") {
            stepHeadingRef.current.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        }
        stepHeadingRef.current.focus();
    }, [prefersReducedMotion]);

    const validateForStep = React.useCallback((step: WizardStep, focusFirstError: boolean) => {
        const nextErrors = validateFreePayslipForm(form);
        setErrors(nextErrors);

        const stepErrors = STEP_FIELDS[step].filter((field) => Boolean(nextErrors[field]));
        if (stepErrors.includes("employerName") || stepErrors.includes("employerAddress")) {
            setShowPayslipDetails(true);
        }
        if (stepErrors.includes("ordinaryHoursOverride")) {
            setShowOrdinaryHoursOverride(true);
        }
        if (
            stepErrors.includes("overtimeHours")
            || stepErrors.includes("sundayHours")
            || stepErrors.includes("publicHolidayHours")
            || stepErrors.includes("shortShiftCount")
            || stepErrors.includes("shortShiftWorkedHours")
            || stepErrors.includes("otherDeductions")
        ) {
            setShowOptionalAdjustments(true);
        }

        if (focusFirstError && stepErrors[0]) {
            focusField(stepErrors[0]);
        }

        return stepErrors.length === 0;
    }, [focusField, form]);

    const startStepTransition = React.useCallback((targetStep: WizardStep) => {
        if (targetStep === currentStep || transitionPhase === "exit") return;

        clearTransitionTimers();

        const direction: TransitionDirection = targetStep > currentStep ? "forward" : "back";
        setTransitionDirection(direction);
        setTransitionPhase("exit");

        const exitTimer = window.setTimeout(() => {
            setCurrentStep(targetStep);
            setFurthestStepReached((current) => targetStep > current ? targetStep : current);
            setTransitionPhase("enter");
        }, transitionDurationMs);

        const enterTimer = window.setTimeout(() => {
            setTransitionPhase("idle");
            setStepperStep(targetStep);
            focusStepHeading();
        }, transitionDurationMs * 2);

        motionTimersRef.current = [exitTimer, enterTimer];
    }, [clearTransitionTimers, currentStep, focusStepHeading, transitionDurationMs, transitionPhase]);

    const handleContinue = React.useCallback(() => {
        if (currentStep === 2) return;
        const valid = validateForStep(currentStep, true);
        if (!valid) return;
        startStepTransition((currentStep + 1) as WizardStep);
    }, [currentStep, startStepTransition, validateForStep]);

    const handleBack = React.useCallback(() => {
        if (currentStep === 0) return;
        startStepTransition((currentStep - 1) as WizardStep);
    }, [currentStep, startStepTransition]);

    const handleStepperClick = React.useCallback((target: number) => {
        const targetStep = target as WizardStep;
        if (targetStep === currentStep) return;
        if (targetStep > currentStep) {
            const valid = validateForStep(currentStep, true);
            if (!valid) return;
        }
        startStepTransition(targetStep);
    }, [currentStep, startStepTransition, validateForStep]);

    const updateSchedulePreset = React.useCallback((preset: OrdinaryWorkPreset) => {
        const sunday = preset === "custom" ? normalizedPattern.sunday : false;
        updateField("ordinaryWorkPattern", buildPatternFromPreset(preset, sunday));
    }, [normalizedPattern.sunday, updateField]);

    const handleFullMonth = React.useCallback(() => {
        setForm((current) => ({
            ...current,
            ordinaryDaysWorked: String(ordinaryCalendar.ordinaryDayCap),
            ordinaryHoursOverride: "",
            overtimeHours: "0",
            sundayHours: "0",
            publicHolidayHours: "0",
            shortShiftCount: "0",
            shortShiftWorkedHours: "0",
            otherDeductions: "0",
        }));
        setShowOrdinaryHoursOverride(false);
        setShowOptionalAdjustments(false);
        setErrors((current) => {
            const nextErrors = { ...current };
            delete nextErrors.ordinaryDaysWorked;
            delete nextErrors.ordinaryHoursOverride;
            delete nextErrors.overtimeHours;
            delete nextErrors.sundayHours;
            delete nextErrors.publicHolidayHours;
            delete nextErrors.shortShiftCount;
            delete nextErrors.shortShiftWorkedHours;
            delete nextErrors.otherDeductions;
            return nextErrors;
        });
    }, [ordinaryCalendar.ordinaryDayCap]);

    const handleEmailPayslip = React.useCallback(async () => {
        const nextErrors = validateFreePayslipForm(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            const employerFieldsHaveErrors = Boolean(nextErrors.employerName || nextErrors.employerAddress);
            const workFieldsHaveErrors = Boolean(
                nextErrors.ordinaryDaysWorked
                || nextErrors.ordinaryHoursOverride
                || nextErrors.overtimeHours
                || nextErrors.sundayHours
                || nextErrors.publicHolidayHours
                || nextErrors.shortShiftCount
                || nextErrors.shortShiftWorkedHours
                || nextErrors.otherDeductions,
            );

            if (employerFieldsHaveErrors) setShowPayslipDetails(true);
            if (nextErrors.ordinaryHoursOverride) setShowOrdinaryHoursOverride(true);
            if (workFieldsHaveErrors) setShowOptionalAdjustments(true);

            if (currentStep !== 2) {
                const targetStep: WizardStep = employerFieldsHaveErrors || nextErrors.employeeName || nextErrors.monthKey || nextErrors.hourlyRate || nextErrors.ordinaryWorkPattern ? 0 : 1;
                setCurrentStep(targetStep);
                setStepperStep(targetStep);
                setTransitionPhase("idle");
                window.setTimeout(() => {
                    const firstErrorField = Object.keys(form).find((field) => Boolean(nextErrors[field as keyof FreePayslipFormState])) as keyof FreePayslipFormState | undefined;
                    if (firstErrorField) focusField(firstErrorField);
                }, 0);
                return;
            }

            const firstErrorField = Object.keys(form).find((field) => Boolean(nextErrors[field as keyof FreePayslipFormState])) as keyof FreePayslipFormState | undefined;
            if (firstErrorField) focusField(firstErrorField);
            return;
        }

        const normalizedEmail = deliveryEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            setDelivery({
                phase: "service-unavailable",
                tone: "danger",
                message: "Enter the email address that should receive the payslip.",
                email: "",
            });
            return;
        }

        if (!payload || !breakdown || !payrollSummary) {
            setDelivery({
                phase: "service-unavailable",
                tone: "danger",
                message: "Complete the payslip details before sending.",
                email: normalizedEmail,
            });
            return;
        }

        setDelivery({
            phase: "sending",
            tone: "info",
            message: "Sending your payslip now.",
            email: normalizedEmail,
        });

        try {
            const response = await fetch("/api/free-payslip/deliver", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                body: JSON.stringify({
                    email: normalizedEmail,
                    marketingConsent,
                    form,
                }),
            });

            const data = await response.json() as DeliverResponse | { error?: string };
            if (!response.ok) {
                const message = typeof data === "object" && data && "error" in data && typeof data.error === "string"
                    ? data.error
                    : FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE;

                if (response.status === 409) {
                    setDelivery({
                        phase: "quota-used",
                        tone: "warning",
                        message,
                        email: normalizedEmail,
                    });
                    return;
                }

                setDelivery({
                    phase: "service-unavailable",
                    tone: "danger",
                    message,
                    email: normalizedEmail,
                });
                return;
            }

            const sent = data as DeliverResponse;
            setDelivery({
                phase: "success",
                tone: "success",
                message: `Payslip sent to ${sent.email}`,
                email: sent.email,
            });
        } catch {
            setDelivery({
                phase: "service-unavailable",
                tone: "danger",
                message: FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE,
                email: normalizedEmail,
            });
        }
    }, [breakdown, currentStep, deliveryEmail, focusField, form, marketingConsent, payload, payrollSummary]);

    const motionClassName = React.useMemo(() => {
        if (transitionPhase === "idle") return "";
        if (prefersReducedMotion) {
            return transitionPhase === "exit" ? "animate-fade-out" : "animate-fade-in";
        }
        if (transitionPhase === "exit") {
            return transitionDirection === "forward" ? "animate-wizard-step-exit-forward" : "animate-wizard-step-exit-back";
        }
        return transitionDirection === "forward" ? "animate-wizard-step-enter-forward" : "animate-wizard-step-enter-back";
    }, [prefersReducedMotion, transitionDirection, transitionPhase]);

    const gateCardTitle = delivery.phase === "sending"
        ? "Sending your payslip"
        : delivery.phase === "quota-used"
            ? "Free payslip already used this month"
            : delivery.phase === "service-unavailable"
                ? "We could not send it just now"
                : delivery.phase === "success"
                    ? "Payslip sent"
                    : "Email the PDF";

    return (
        <section id="free-payslip-generator" data-testid="free-payslip-generator" className="mx-auto w-full">
            <div className="free-payslip-wizard-shell rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-8">
                <div className="space-y-3">
                    <h2 className="font-[family:var(--font-serif)] text-[clamp(2rem,5vw,2.8rem)] font-semibold tracking-[var(--h1-ls)] text-[var(--text)]">
                        Create this month&apos;s payslip
                    </h2>
                    <p className="max-w-[42rem] text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                        Tell us her usual schedule, what she worked this month, and where to send the PDF. We&apos;ll calculate the pay and email the payslip.
                    </p>
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
                    <Stepper steps={STEP_LABELS.map((step) => ({ label: step.label }))} currentStep={stepperStep} furthestStepReached={furthestStepReached} onStepClick={handleStepperClick} />
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                    <div className={motionClassName} style={transitionPhase === "idle" ? undefined : { animationDuration: `${transitionDurationMs}ms` }}>
                        {currentStep === 0 ? (
                            <div className="space-y-6">
                                <SectionIntro
                                    eyebrow="Step 1 of 3"
                                    title="Her schedule and hourly rate"
                                    description="Start with the details most people know straight away. We’ll use these to work out the rest."
                                    headingRef={stepHeadingRef}
                                />

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <TextField id="free-worker-name" label="Worker name" error={errors.employeeName}>
                                        <Input
                                            id="free-worker-name"
                                            value={form.employeeName}
                                            onChange={(event) => updateField("employeeName", event.target.value)}
                                            placeholder="Worker name"
                                            autoComplete="off"
                                        />
                                    </TextField>

                                    <TextField id="free-month" label="Payslip month" error={errors.monthKey}>
                                        <Input
                                            id="free-month"
                                            type="month"
                                            value={form.monthKey}
                                            onChange={(event) => updateField("monthKey", event.target.value)}
                                        />
                                    </TextField>

                                    <TextField
                                        id="free-hourly-rate"
                                        label="Hourly rate"
                                        hint={`The hourly rate must be at least R${NMW_RATE.toFixed(2)}.`}
                                        error={errors.hourlyRate}
                                    >
                                        <Input
                                            id="free-hourly-rate"
                                            type="number"
                                            min={NMW_RATE}
                                            step="0.01"
                                            inputMode="decimal"
                                            value={form.hourlyRate}
                                            onChange={(event) => updateField("hourlyRate", event.target.value)}
                                        />
                                    </TextField>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Which days does she normally work?</p>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <ScheduleOption
                                            id="free-schedule-preset-monday-to-friday"
                                            active={schedulePreset === "monday-to-friday"}
                                            label="Monday to Friday"
                                            detail="Her normal week is weekdays."
                                            onClick={() => updateSchedulePreset("monday-to-friday")}
                                        />
                                        <ScheduleOption
                                            id="free-schedule-preset-monday-to-saturday"
                                            active={schedulePreset === "monday-to-saturday"}
                                            label="Monday to Saturday"
                                            detail="She normally works six days."
                                            onClick={() => updateSchedulePreset("monday-to-saturday")}
                                        />
                                        <ScheduleOption
                                            id="free-schedule-preset-custom"
                                            active={schedulePreset === "custom"}
                                            label="Other days"
                                            detail="Choose the exact days below."
                                            onClick={() => updateSchedulePreset("custom")}
                                        />
                                    </div>
                                    {errors.ordinaryWorkPattern ? <p className="text-sm font-medium text-[var(--danger)]">{errors.ordinaryWorkPattern}</p> : null}
                                </div>

                                {schedulePreset === "custom" ? (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Her normal work days</p>
                                        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Tap the days she normally works, including Sunday if it is part of her usual schedule.</p>
                                        <div className="mt-4">
                                            <OrdinaryWorkPatternPicker
                                                value={form.ordinaryWorkPattern}
                                                onChange={(nextPattern) => updateField("ordinaryWorkPattern", nextPattern)}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPayslipDetails((current) => !current)}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Payslip details</p>
                                            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">We need the employer details for the PDF, but you can fill them in after the worker’s basics.</p>
                                        </div>
                                        {showPayslipDetails ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                    </button>

                                    {showPayslipDetails ? (
                                        <div className="mt-4 space-y-4">
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <TextField id="free-employer-name" label="Employer name" error={errors.employerName}>
                                                    <Input
                                                        id="free-employer-name"
                                                        value={form.employerName}
                                                        onChange={(event) => updateField("employerName", event.target.value)}
                                                        placeholder="Employer name"
                                                        autoComplete="off"
                                                    />
                                                </TextField>

                                                <TextField id="free-employer-address" label="Employer address" error={errors.employerAddress}>
                                                    <Input
                                                        id="free-employer-address"
                                                        value={form.employerAddress}
                                                        onChange={(event) => updateField("employerAddress", event.target.value)}
                                                        placeholder="Employer address"
                                                        autoComplete="street-address"
                                                    />
                                                </TextField>
                                            </div>

                                            <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowRoleOverride((current) => {
                                                            const next = !current;
                                                            if (!next) updateField("employeeRole", "Domestic Worker");
                                                            return next;
                                                        });
                                                    }}
                                                    className="flex w-full items-center justify-between gap-3 text-left"
                                                >
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Different job title</p>
                                                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Default: Domestic Worker. Change this only if she has a specific role like Gardener or Cook.</p>
                                                    </div>
                                                    {showRoleOverride ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                                </button>
                                                {showRoleOverride ? (
                                                    <div className="mt-4">
                                                        <TextField id="free-worker-role" label="Job title">
                                                            <Input
                                                                id="free-worker-role"
                                                                value={form.employeeRole}
                                                                onChange={(event) => updateField("employeeRole", event.target.value)}
                                                                placeholder="Domestic Worker"
                                                                autoComplete="organization-title"
                                                            />
                                                        </TextField>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowIdentityField((current) => !current)}
                                                    className="flex w-full items-center justify-between gap-3 text-left"
                                                >
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Worker ID or passport</p>
                                                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Only add this if you want it to appear on the payslip.</p>
                                                    </div>
                                                    {showIdentityField ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                                </button>
                                                {showIdentityField ? (
                                                    <div className="mt-4">
                                                        <TextField id="free-worker-id" label="ID or passport number">
                                                            <Input
                                                                id="free-worker-id"
                                                                value={form.employeeId}
                                                                onChange={(event) => updateField("employeeId", event.target.value)}
                                                                placeholder="ID or passport number"
                                                                autoComplete="off"
                                                            />
                                                        </TextField>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {currentStep === 1 ? (
                            <div className="space-y-6">
                                <SectionIntro
                                    eyebrow="Step 2 of 3"
                                    title="How much did she work this month?"
                                    description="Fill in the usual case first. You only need the extra fields if something different happened this month."
                                    headingRef={stepHeadingRef}
                                />

                                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text)]">Quick option</p>
                                            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">If she worked her full normal month, we can fill that in for you.</p>
                                        </div>
                                        <Button type="button" variant="secondary" onClick={handleFullMonth} className="w-full sm:w-auto">
                                            She worked the full month
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <TextField
                                        id="free-ordinary-days"
                                        label="Days she came in"
                                        hint={daysHint}
                                        warning={daysCapWarning}
                                        error={errors.ordinaryDaysWorked}
                                    >
                                        <Input
                                            id="free-ordinary-days"
                                            type="number"
                                            min="0"
                                            max={ordinaryCalendar.ordinaryDayCap}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={form.ordinaryDaysWorked}
                                            onChange={(event) => updateField("ordinaryDaysWorked", event.target.value)}
                                        />
                                    </TextField>
                                </div>

                                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowOrdinaryHoursOverride((current) => {
                                                const next = !current;
                                                if (!next) updateField("ordinaryHoursOverride", "");
                                                return next;
                                            });
                                        }}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">She sometimes works partial days</p>
                                            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Turn this on if this month was not made up of full normal days.</p>
                                        </div>
                                        {showOrdinaryHoursOverride ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                    </button>
                                    {showOrdinaryHoursOverride ? (
                                        <div className="mt-4">
                                            <TextField
                                                id="free-ordinary-hours"
                                                label="Total normal hours worked"
                                                hint={hoursHint}
                                                warning={hoursCapWarning}
                                                error={errors.ordinaryHoursOverride}
                                            >
                                                <Input
                                                    id="free-ordinary-hours"
                                                    type="number"
                                                    min="0"
                                                    max={ordinaryCalendar.ordinaryHourCap}
                                                    inputMode="decimal"
                                                    value={form.ordinaryHoursOverride}
                                                    onChange={(event) => updateField("ordinaryHoursOverride", event.target.value)}
                                                />
                                            </TextField>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <div className="flex w-full items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Public holidays this month</p>
                                            <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{holidaySummary}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowHolidayDetails((current) => !current)}
                                            className="min-h-[var(--touch-target-min)] rounded-[0.9rem] px-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--surface-raised)]"
                                        >
                                            {showHolidayDetails ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    {showHolidayDetails ? (
                                        <div className="mt-4 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                            {ordinaryCalendar.publicHolidaysInRange.length === 0 ? (
                                                <p className="text-sm leading-6 text-[var(--text-muted)]">No South African public holidays fall in this month.</p>
                                            ) : (
                                                <ul className="space-y-2 text-sm leading-6 text-[var(--text)]">
                                                    {ordinaryCalendar.publicHolidaysInRange.map((holiday) => {
                                                        const onSchedule = ordinaryCalendar.excludedHolidayDates.includes(holiday.date);
                                                        return (
                                                            <li key={holiday.date}>
                                                                {format(new Date(`${holiday.date}T00:00:00`), "EEE d MMM yyyy")} · {holiday.name} · {onSchedule ? "on her normal work days" : "not on her normal work days"}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowOptionalAdjustments((current) => !current)}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Anything else?</p>
                                            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Add overtime, Sunday work, public holiday hours, deductions, or short shifts only if they happened this month.</p>
                                        </div>
                                        {showOptionalAdjustments ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                    </button>

                                    {showOptionalAdjustments ? (
                                        <div className="mt-4 space-y-5">
                                            <div className="grid gap-5 sm:grid-cols-3">
                                                <TextField id="free-overtime-hours" label="Overtime hours" hint="Hours worked outside her normal time." error={errors.overtimeHours}>
                                                    <Input
                                                        id="free-overtime-hours"
                                                        type="number"
                                                        min="0"
                                                        inputMode="decimal"
                                                        value={form.overtimeHours}
                                                        onChange={(event) => updateField("overtimeHours", event.target.value)}
                                                    />
                                                </TextField>

                                                <TextField id="free-sunday-hours" label="Sunday hours worked" hint={sundayRateHelper} error={errors.sundayHours}>
                                                    <Input
                                                        id="free-sunday-hours"
                                                        type="number"
                                                        min="0"
                                                        inputMode="decimal"
                                                        value={form.sundayHours}
                                                        onChange={(event) => updateField("sundayHours", event.target.value)}
                                                    />
                                                </TextField>

                                                <TextField
                                                    id="free-public-holiday-hours"
                                                    label="Public holiday hours"
                                                    hint="Only add hours she actually worked on a South African public holiday."
                                                    error={errors.publicHolidayHours}
                                                >
                                                    <Input
                                                        id="free-public-holiday-hours"
                                                        type="number"
                                                        min="0"
                                                        inputMode="decimal"
                                                        value={form.publicHolidayHours}
                                                        onChange={(event) => updateField("publicHolidayHours", event.target.value)}
                                                    />
                                                </TextField>
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <TextField
                                                    id="free-other-deductions"
                                                    label="Anything deducted from her pay"
                                                    hint="Only add agreed deductions that should appear on this payslip."
                                                    error={errors.otherDeductions}
                                                >
                                                    <Input
                                                        id="free-other-deductions"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        inputMode="decimal"
                                                        value={form.otherDeductions}
                                                        onChange={(event) => updateField("otherDeductions", event.target.value)}
                                                    />
                                                </TextField>

                                                <div className="grid gap-5 sm:grid-cols-2">
                                                    <TextField id="free-short-shifts" label="Short shifts" hint="How many shifts were under four hours?" error={errors.shortShiftCount}>
                                                        <Input
                                                            id="free-short-shifts"
                                                            type="number"
                                                            min="0"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={form.shortShiftCount}
                                                            onChange={(event) => updateField("shortShiftCount", event.target.value)}
                                                        />
                                                    </TextField>

                                                    <TextField id="free-short-shift-hours" label="Hours across those short shifts" error={errors.shortShiftWorkedHours}>
                                                        <Input
                                                            id="free-short-shift-hours"
                                                            type="number"
                                                            min="0"
                                                            inputMode="decimal"
                                                            value={form.shortShiftWorkedHours}
                                                            onChange={(event) => updateField("shortShiftWorkedHours", event.target.value)}
                                                        />
                                                    </TextField>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {currentStep === 2 ? (
                            <div className="space-y-6">
                                <SectionIntro
                                    eyebrow="Step 3 of 3"
                                    title="Review and email"
                                    description="Check the key figures first. You can still open the detailed breakdown if you want to see how each number was worked out."
                                    headingRef={stepHeadingRef}
                                />

                                {breakdown && payrollSummary ? (
                                    <div className="space-y-4">
                                        <MajorSummaryRow label="Amount to pay her" value={`R ${payrollSummary.netPayToEmployee.toFixed(2)}`} accent />
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <MajorSummaryRow label="Her total earnings" value={`R ${payrollSummary.grossPay.toFixed(2)}`} />
                                            <MajorSummaryRow label="UIF total" value={`R ${payrollSummary.totalUifDue.toFixed(2)}`} />
                                            <MajorSummaryRow label="Total this costs you" value={`R ${payrollSummary.employerTotalCost.toFixed(2)}`} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-7 text-[var(--text-muted)]">
                                        Fill in the earlier steps to see the figures here.
                                    </div>
                                )}

                                {breakdown && payrollSummary ? (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowSummaryDetails((current) => !current)}
                                            className="flex w-full items-center justify-between gap-3 text-left"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text)]">Show the detailed breakdown</p>
                                                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Open this if you want to see the UIF split and each pay line.</p>
                                            </div>
                                            {showSummaryDetails ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                        </button>

                                        {showSummaryDetails ? (
                                            <div className="mt-4 space-y-4 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                                <SummaryRow label={`Normal pay (${breakdown.effectiveOrdinaryHours}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                                                {breakdown.overtimePay > 0 ? <SummaryRow label={`Overtime (${calculationInput?.overtimeHours ?? 0}h)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} /> : null}
                                                {breakdown.sundayPay > 0 ? <SummaryRow label={`Sunday (${calculationInput?.sundayHours ?? 0}h)`} value={`R ${breakdown.sundayPay.toFixed(2)}`} /> : null}
                                                {breakdown.publicHolidayPay > 0 ? <SummaryRow label={`Public holiday (${calculationInput?.publicHolidayHours ?? 0}h)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} /> : null}
                                                {breakdown.topUps.fourHourMinimumHours > 0 ? <SummaryRow label="Extra hours added for short shifts" value={`${breakdown.topUps.fourHourMinimumHours}h`} /> : null}
                                                <SummaryRow label="UIF taken off her pay" value={`R ${payrollSummary.employeeUifDeduction.toFixed(2)}`} />
                                                <SummaryRow label="Your UIF contribution" value={`R ${payrollSummary.employerUifContribution.toFixed(2)}`} />
                                                <SummaryRow label="Other deductions" value={`R ${breakdown.deductions.other.toFixed(2)}`} />
                                                <SummaryRow label="Payslip month" value={format(monthBounds.end, "MMMM yyyy")} strong />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div data-testid={`free-payslip-gate-${delivery.phase}`} className={`rounded-[1.25rem] border p-4 ${getNoticeStyles(delivery.tone)}`}>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            {getDeliveryIcon(delivery.tone)}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{gateCardTitle}</p>
                                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{FREE_PAYSLIP_RULE_MESSAGE}</p>
                                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                                    {delivery.message || "We’ll email you the PDF now."}
                                                </p>
                                            </div>
                                        </div>

                                        {delivery.phase === "quota-used" ? (
                                            <div className="rounded-[1rem] border border-[var(--warning-border)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--text)]">
                                                Need more than one payslip this month? <Link href="/pricing" className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline">See the paid plans.</Link>
                                            </div>
                                        ) : null}

                                        {delivery.phase === "success" ? (
                                            <div className="rounded-[1rem] border border-[var(--success-border)] bg-[var(--surface-raised)] p-4">
                                                <p className="text-sm font-semibold text-[var(--success)]">✓ Payslip sent to {delivery.email}</p>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="mt-3 px-0"
                                                    onClick={() => {
                                                        setDeliveryEmail("");
                                                        resetDeliveryState();
                                                    }}
                                                >
                                                    Use another email
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <TextField id="free-delivery-email" label="Email address">
                                                    <Input
                                                        id="free-delivery-email"
                                                        type="email"
                                                        value={deliveryEmail}
                                                        onChange={(event) => {
                                                            setDeliveryEmail(event.target.value);
                                                            if (delivery.phase !== "idle") {
                                                                resetDeliveryState();
                                                            }
                                                        }}
                                                        placeholder="name@example.com"
                                                        autoComplete="email"
                                                    />
                                                </TextField>

                                                <label className="flex items-start gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={marketingConsent}
                                                        onChange={(event) => setMarketingConsent(event.target.checked)}
                                                        className="mt-1 h-4 w-4 rounded border-[var(--border)]"
                                                    />
                                                    <span className="text-sm leading-6 text-[var(--text)]">
                                                        Send me a free monthly household employer checklist and tips. Unsubscribe anytime.
                                                    </span>
                                                </label>

                                                <Button
                                                    type="button"
                                                    onClick={() => void handleEmailPayslip()}
                                                    loading={delivery.phase === "sending"}
                                                    disabled={delivery.phase === "sending"}
                                                    className="w-full"
                                                >
                                                    {delivery.phase === "sending"
                                                        ? "Sending..."
                                                        : delivery.phase === "service-unavailable"
                                                            ? "Try again"
                                                            : "Email my free payslip"}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="ghost" onClick={handleBack} className={currentStep === 0 ? "invisible" : ""}>
                        Back
                    </Button>
                    {currentStep < 2 ? (
                        <Button type="button" onClick={handleContinue} className="w-full sm:w-auto">
                            {currentStep === 0 ? "Continue to this month’s work" : "Review the payslip"}
                        </Button>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
