"use client";

import Link from "next/link";
import * as React from "react";
import { format } from "date-fns";
import {
    AlertTriangle,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Info,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { track } from "@/lib/analytics";
import { calculatePayslip, getNMW } from "@/lib/calculator";
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

type DeliveryPhase = "idle" | "sending" | "already-used" | "service-unavailable" | "success";
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
    label: React.ReactNode;
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
            <span className={`whitespace-nowrap text-right tabular-nums leading-none ${strong ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--text)]"}`}>{value}</span>
        </div>
    );
}

function MajorSummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className={`mt-2 whitespace-nowrap font-[family:var(--font-serif)] text-[clamp(1.2rem,2.6vw,1.9rem)] font-semibold leading-none tabular-nums ${accent ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
                {value}
            </p>
        </div>
    );
}

function InfoTip({ text }: { text: string }) {
    const [visible, setVisible] = React.useState(false);
    return (
        <span className="relative inline-flex items-center align-middle">
            <button
                type="button"
                aria-label="More information"
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onFocus={() => setVisible(true)}
                onBlur={() => setVisible(false)}
                onClick={() => setVisible((v) => !v)}
                className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
            >
                <Info className="h-2.5 w-2.5" />
            </button>
            {visible ? (
                <span
                    role="tooltip"
                    className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-[0.75rem] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-xs leading-5 text-[var(--text-muted)] shadow-[var(--shadow-md)]"
                >
                    {text}
                </span>
            ) : null}
        </span>
    );
}

function InlineDisclosure({
    summary,
    buttonLabel,
    children,
}: {
    summary: string;
    buttonLabel: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = React.useState(false);
    const panelId = React.useId();

    return (
        <div className="space-y-2">
            {summary ? <p className="text-sm leading-6 text-[var(--text-muted)]">{summary}</p> : null}
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((current) => !current)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
            >
                {buttonLabel}
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {open ? (
                <div id={panelId} className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                    {children}
                </div>
            ) : null}
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
    const [showSummaryDetails, setShowSummaryDetails] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState<WizardStep>(0);
    const [stepperStep, setStepperStep] = React.useState<WizardStep>(0);
    const [furthestStepReached, setFurthestStepReached] = React.useState<WizardStep>(0);
    const [transitionPhase, setTransitionPhase] = React.useState<TransitionPhase>("idle");
    const [transitionDirection, setTransitionDirection] = React.useState<TransitionDirection>("forward");

    // Step 2 conversational questionnaire state
    const [adjustmentsNeeded, setAdjustmentsNeeded] = React.useState<boolean | null>(null);
    const [daysMissed, setDaysMissed] = React.useState("0");
    const [hasUnpaidLeave, setHasUnpaidLeave] = React.useState<boolean | null>(null);
    const [hasOvertime, setHasOvertime] = React.useState<boolean | null>(null);
    const [hasSundayWork, setHasSundayWork] = React.useState<boolean | null>(null);
    const [hasPublicHolidayWork, setHasPublicHolidayWork] = React.useState<boolean | null>(null);
    const [hasShortDays, setHasShortDays] = React.useState<boolean | null>(null);
    const [hasDeductions, setHasDeductions] = React.useState<boolean | null>(null);

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
    const selectedMonthLabel = React.useMemo(() => format(monthBounds.end, "MMMM yyyy"), [monthBounds.end]);
    const activeNmwRate = React.useMemo(() => getNMW(monthBounds.end), [monthBounds.end]);
    const publicHolidayHelperLabel = React.useMemo(() => `See ${selectedMonthLabel} public holidays`, [selectedMonthLabel]);
    const sundayRateSummary = "Sunday pay depends on the ordinary schedule entered above.";
    const sundayRateDetails = normalizedPattern.sunday
        ? "If Sunday is part of the worker’s ordinary schedule, Sunday hours are paid at 1.5x the normal hourly rate. The calculator applies the rule from the schedule entered above, and the existing Sunday minimum-pay rule stays unchanged."
        : "If Sunday is not part of the worker’s ordinary schedule, Sunday hours are paid at 2x the normal hourly rate. The calculator applies the rule from the schedule entered above, and the existing Sunday minimum-pay rule stays unchanged.";

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

    // Pre-fill Step 2 with smart defaults when first entering it.
    // The prevStepRef guard means this only fires on the transition into Step 1,
    // not while already on Step 1 if ordinaryDayCap changes (impossible in this UI anyway).
    const prevStepRef = React.useRef<WizardStep>(currentStep);
    React.useEffect(() => {
        const entering = currentStep === 1 && prevStepRef.current !== 1;
        prevStepRef.current = currentStep;
        if (!entering) return;

        setForm((f) => ({
            ...f,
            ordinaryDaysWorked: String(ordinaryCalendar.ordinaryDayCap),
            ordinaryHoursOverride: "",
            overtimeHours: "0",
            sundayHours: "0",
            publicHolidayHours: "0",
            shortShiftCount: "0",
            shortShiftWorkedHours: "0",
            otherDeductions: "0",
        }));
        setErrors((e) => {
            const next = { ...e };
            (STEP_FIELDS[1] as Array<keyof FreePayslipFormState>).forEach((k) => delete next[k]);
            return next;
        });
        setAdjustmentsNeeded(null);
        setDaysMissed("0");
        setHasUnpaidLeave(null);
        setHasOvertime(null);
        setHasSundayWork(null);
        setHasPublicHolidayWork(null);
        setHasShortDays(null);
        setHasDeductions(null);
    }, [currentStep, ordinaryCalendar.ordinaryDayCap]);

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
            ordinaryDaysWorked: "free-days-missed",
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

    // Validates full-month defaults synchronously and advances to Step 3.
    // Cannot chain two state-updating calls sequentially — React batches state
    // updates, so a second call would read stale form values from the first.
    const handleStandardMonth = React.useCallback(() => {
        const nextForm: FreePayslipFormState = {
            ...form,
            ordinaryDaysWorked: String(ordinaryCalendar.ordinaryDayCap),
            ordinaryHoursOverride: "",
            overtimeHours: "0",
            sundayHours: "0",
            publicHolidayHours: "0",
            shortShiftCount: "0",
            shortShiftWorkedHours: "0",
            otherDeductions: "0",
        };
        const allErrors = validateFreePayslipForm(nextForm);
        const stepErrors = STEP_FIELDS[1].filter((f) => Boolean(allErrors[f]));
        if (stepErrors.length > 0) {
            setErrors(allErrors);
            return;
        }
        setForm(nextForm);
        setAdjustmentsNeeded(false);
        setDaysMissed("0");
        setErrors((e) => {
            const next = { ...e };
            (STEP_FIELDS[1] as Array<keyof FreePayslipFormState>).forEach((k) => delete next[k]);
            return next;
        });
        startStepTransition(2);
    }, [form, ordinaryCalendar.ordinaryDayCap, startStepTransition]);

    const handleEmailPayslip = React.useCallback(async () => {
        const nextErrors = validateFreePayslipForm(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            const employerFieldsHaveErrors = Boolean(nextErrors.employerName || nextErrors.employerAddress);

            if (employerFieldsHaveErrors) setShowPayslipDetails(true);

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
            message: "Sending your first free payslip sample now.",
            email: normalizedEmail,
        });
        track("free_payslip_started", { source: "public_generator" });

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
                    track("free_payslip_blocked_already_used", { source: "public_generator" });
                    setDelivery({
                        phase: "already-used",
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
            track("free_payslip_sent", { source: "public_generator" });
            setDelivery({
                phase: "success",
                tone: "success",
                message: `Your first free payslip sample was emailed to ${sent.email}.`,
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
        ? "Sending your free sample"
        : delivery.phase === "already-used"
            ? "This sample has already been used"
            : delivery.phase === "service-unavailable"
                ? "We could not send it just now"
                : delivery.phase === "success"
                    ? "Free sample emailed"
                    : "Get your first payslip free";

    return (
        <section id="free-payslip-generator" data-testid="free-payslip-generator" className="mx-auto w-full">
            <div className="free-payslip-wizard-shell rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-8">
                <div className="space-y-3">
                    <h2 className="font-[family:var(--font-serif)] text-[clamp(2rem,5vw,2.8rem)] font-semibold tracking-[var(--h1-ls)] text-[var(--text)]">
                        Get your first payslip free
                    </h2>
                    <p className="max-w-[42rem] text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                        No account needed for your first sample. Enter the employer, worker, month, and hours to generate the payslip PDF we’ll email to you.
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
                                    title="Schedule and hourly rate"
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
                                        hint={`The hourly rate must be at least R${activeNmwRate.toFixed(2)} for ${selectedMonthLabel}.`}
                                        error={errors.hourlyRate}
                                    >
                                        <Input
                                            id="free-hourly-rate"
                                            type="number"
                                            min={activeNmwRate}
                                            step="0.01"
                                            inputMode="decimal"
                                            value={form.hourlyRate}
                                            onChange={(event) => updateField("hourlyRate", event.target.value)}
                                        />
                                    </TextField>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Which days does the worker normally work?</p>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <ScheduleOption
                                            id="free-schedule-preset-monday-to-friday"
                                            active={schedulePreset === "monday-to-friday"}
                                            label="Monday to Friday"
                                            detail="Normal week is weekdays."
                                            onClick={() => updateSchedulePreset("monday-to-friday")}
                                        />
                                        <ScheduleOption
                                            id="free-schedule-preset-monday-to-saturday"
                                            active={schedulePreset === "monday-to-saturday"}
                                            label="Monday to Saturday"
                                            detail="Normal week is six days."
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
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Normal work days</p>
                                        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Tap the days the worker normally works, including Sunday if it is part of the usual schedule.</p>
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
                                                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Default: Domestic Worker. Change this only if the worker has a specific role like Gardener or Cook.</p>
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
                                    title={`Normal month for ${selectedMonthLabel}`}
                                    description="Review the ordinary month first, then only add the exceptions below."
                                    headingRef={stepHeadingRef}
                                />

                                {/* Card 1: The baseline — always visible */}
                                <div className="space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <div className="space-y-2">
                                        <p className="text-sm leading-7 text-[var(--text-muted)]">
                                            Based on the usual schedule, this month has {ordinaryCalendar.ordinaryDayCap} normal workday{ordinaryCalendar.ordinaryDayCap === 1 ? "" : "s"}. Use the questions below only if something was different this month.
                                        </p>
                                        <p className="text-sm leading-7 text-[var(--text-muted)]">
                                            Public holiday work is entered separately if the worker actually worked on a public holiday.
                                        </p>
                                    </div>
                                    <InlineDisclosure
                                        summary="Public holiday work is entered separately if it happened this month."
                                        buttonLabel={publicHolidayHelperLabel}
                                    >
                                        <div className="space-y-3">
                                            {ordinaryCalendar.publicHolidaysInRange.length === 0 ? (
                                                <p className="text-sm leading-6 text-[var(--text-muted)]">No South African public holidays fall in this month.</p>
                                            ) : (
                                                <ul className="space-y-2 text-sm leading-6 text-[var(--text)]">
                                                    {ordinaryCalendar.publicHolidaysInRange.map((holiday) => (
                                                        <li key={holiday.date}>
                                                            {format(new Date(`${holiday.date}T00:00:00`), "EEE d MMM yyyy")} · {holiday.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </InlineDisclosure>
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Did anything change this month?</p>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <Button type="button" onClick={handleStandardMonth} className="w-full sm:flex-1">
                                                No, standard month
                                            </Button>
                                            <Button type="button" variant="secondary" onClick={() => setAdjustmentsNeeded(true)} className="w-full sm:flex-1">
                                                Yes, I need to make adjustments
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Questionnaire — revealed when adjustments are needed */}
                                {adjustmentsNeeded === true ? (
                                    <div className="space-y-6 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">

                                        {/* Question A — Unpaid absence */}
                                        <div className="space-y-3" role="group" aria-labelledby="q-unpaid-label">
                                            <p id="q-unpaid-label" className="text-sm font-semibold text-[var(--text)]">Did the worker miss any days without pay?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    aria-pressed={hasUnpaidLeave === true}
                                                    onClick={() => setHasUnpaidLeave(true)}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasUnpaidLeave === true ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    Yes, they did
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={hasUnpaidLeave === false}
                                                    onClick={() => {
                                                        setHasUnpaidLeave(false);
                                                        setDaysMissed("0");
                                                        updateField("ordinaryDaysWorked", String(ordinaryCalendar.ordinaryDayCap));
                                                    }}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasUnpaidLeave === false ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    No, they worked all month
                                                </button>
                                            </div>
                                            {hasUnpaidLeave === true ? (
                                                <div className="space-y-2 pt-1">
                                                    <TextField id="free-days-missed" label="Days they missed" error={errors.ordinaryDaysWorked}>
                                                        <Input
                                                            id="free-days-missed"
                                                            type="number"
                                                            min="0"
                                                            max={ordinaryCalendar.ordinaryDayCap}
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={daysMissed}
                                                            onChange={(event) => {
                                                                const val = event.target.value;
                                                                setDaysMissed(val);
                                                                updateField("ordinaryDaysWorked", String(Math.max(0, ordinaryCalendar.ordinaryDayCap - (Number(val) || 0))));
                                                            }}
                                                        />
                                                    </TextField>
                                                    {Number(daysMissed) > 0 && ordinaryCalendar.ordinaryDayCap - Number(daysMissed) >= 0 ? (
                                                        <p className="text-sm leading-6 text-[var(--text-muted)]">
                                                            That means they worked {ordinaryCalendar.ordinaryDayCap - Number(daysMissed)} {ordinaryCalendar.ordinaryDayCap - Number(daysMissed) === 1 ? "day" : "days"} this month.
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="border-t border-[var(--border)]" />

                                        {/* Question B — Public holiday work */}
                                        <div className="space-y-3" role="group" aria-labelledby="q-holiday-label">
                                            <p id="q-holiday-label" className="text-sm font-semibold text-[var(--text)]">Did the worker work on any South African public holidays this month?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    aria-pressed={hasPublicHolidayWork === false}
                                                    onClick={() => {
                                                        setHasPublicHolidayWork(false);
                                                        updateField("publicHolidayHours", "0");
                                                    }}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasPublicHolidayWork === false ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    No
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={hasPublicHolidayWork === true}
                                                    onClick={() => setHasPublicHolidayWork(true)}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasPublicHolidayWork === true ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    Yes
                                                </button>
                                            </div>
                                            {hasPublicHolidayWork === true ? (
                                                <div className="pt-1">
                                                    <TextField
                                                        id="free-public-holiday-hours"
                                                        label={<>Hours worked on public holidays <InfoTip text="Public holiday hours are paid at double the normal rate (2×)." /></>}
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
                                            ) : null}
                                        </div>

                                        <div className="border-t border-[var(--border)]" />

                                        {/* Question C — Overtime */}
                                        <div className="space-y-3" role="group" aria-labelledby="q-overtime-label">
                                            <p id="q-overtime-label" className="text-sm font-semibold text-[var(--text)]">Did the worker do any overtime?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    aria-pressed={hasOvertime === false}
                                                    onClick={() => {
                                                        setHasOvertime(false);
                                                        updateField("overtimeHours", "0");
                                                    }}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasOvertime === false ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    No
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={hasOvertime === true}
                                                    onClick={() => setHasOvertime(true)}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasOvertime === true ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    Yes
                                                </button>
                                            </div>
                                            {hasOvertime === true ? (
                                                <div className="pt-1">
                                                    <TextField
                                                        id="free-overtime-hours"
                                                        label={<>Hours beyond the normal schedule (overtime) <InfoTip text="Enter only hours worked beyond the worker’s normal ordinary hours. Do not include Sunday or public-holiday hours here. These hours are paid at 1.5× the normal hourly rate." /></>}
                                                        error={errors.overtimeHours}
                                                    >
                                                        <Input
                                                            id="free-overtime-hours"
                                                            type="number"
                                                            min="0"
                                                            inputMode="decimal"
                                                            value={form.overtimeHours}
                                                            onChange={(event) => updateField("overtimeHours", event.target.value)}
                                                        />
                                                    </TextField>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="border-t border-[var(--border)]" />

                                        {/* Question D — Sunday work */}
                                        <div className="space-y-3" role="group" aria-labelledby="q-sunday-label">
                                            <p id="q-sunday-label" className="text-sm font-semibold text-[var(--text)]">Did the worker work on a Sunday?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    aria-pressed={hasSundayWork === false}
                                                    onClick={() => {
                                                        setHasSundayWork(false);
                                                        updateField("sundayHours", "0");
                                                    }}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasSundayWork === false ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    No
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={hasSundayWork === true}
                                                    onClick={() => setHasSundayWork(true)}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasSundayWork === true ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    Yes
                                                </button>
                                            </div>
                                            {hasSundayWork === true ? (
                                                <div className="pt-1">
                                                    <div className="mb-2 space-y-2">
                                                        <p className="text-sm leading-6 text-[var(--text-muted)]">{sundayRateSummary}</p>
                                                        <InlineDisclosure buttonLabel="Show Sunday pay rule" summary="">
                                                            <p className="text-sm leading-6 text-[var(--text-muted)]">{sundayRateDetails}</p>
                                                        </InlineDisclosure>
                                                    </div>
                                                    <TextField id="free-sunday-hours" label="Sunday hours" error={errors.sundayHours}>
                                                        <Input
                                                            id="free-sunday-hours"
                                                            type="number"
                                                            min="0"
                                                            inputMode="decimal"
                                                            value={form.sundayHours}
                                                            onChange={(event) => updateField("sundayHours", event.target.value)}
                                                        />
                                                    </TextField>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="border-t border-[var(--border)]" />

                                        {/* Question E — Short days under 4 hours (BCEA s9(1)) */}
                                        <div className="space-y-3" role="group" aria-labelledby="q-short-label">
                                            <p id="q-short-label" className="text-sm font-semibold text-[var(--text)]">
                                                Did the worker do any very short days — under 4 hours?{" "}
                                                <InfoTip text="South African employment rules require at least 4 hours’ pay for any day on which the worker worked. If a shorter shift is entered, the required top-up is applied automatically." />
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    aria-pressed={hasShortDays === true}
                                                    onClick={() => setHasShortDays(true)}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasShortDays === true ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    Yes, they did
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={hasShortDays === false}
                                                    onClick={() => {
                                                        setHasShortDays(false);
                                                        updateField("shortShiftCount", "0");
                                                        updateField("shortShiftWorkedHours", "0");
                                                    }}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasShortDays === false ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    No, all full days
                                                </button>
                                            </div>
                                            {hasShortDays === true ? (
                                                <div className="grid gap-4 pt-1 sm:grid-cols-2">
                                                    <TextField id="free-short-shifts" label="How many short days?" error={errors.shortShiftCount}>
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
                                                    <TextField
                                                        id="free-short-shift-hours"
                                                        label={<>Total hours across those days <InfoTip text="The calculator will top up each short day to 4 hours’ pay automatically, as required by South African employment rules." /></>}
                                                        error={errors.shortShiftWorkedHours}
                                                    >
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
                                            ) : null}
                                        </div>

                                        <div className="border-t border-[var(--border)]" />

                                        {/* Question E — Deductions */}
                                        <div className="space-y-3" role="group" aria-labelledby="q-deductions-label">
                                            <p id="q-deductions-label" className="text-sm font-semibold text-[var(--text)]">Do you need to deduct anything from this month&apos;s pay?</p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    aria-pressed={hasDeductions === true}
                                                    onClick={() => setHasDeductions(true)}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasDeductions === true ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    Yes, deduct something
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-pressed={hasDeductions === false}
                                                    onClick={() => {
                                                        setHasDeductions(false);
                                                        updateField("otherDeductions", "0");
                                                    }}
                                                    className={`min-h-[var(--touch-target-min)] flex-1 rounded-[0.9rem] border px-4 text-sm font-semibold transition-colors ${hasDeductions === false ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    No deductions
                                                </button>
                                            </div>
                                            {hasDeductions === true ? (
                                                <div className="pt-1">
                                                    <TextField
                                                        id="free-other-deductions"
                                                        label={<>Amount to deduct (R) <InfoTip text="Only for deductions agreed in writing with the worker, such as a loan repayment." /></>}
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
                                                </div>
                                            ) : null}
                                        </div>

                                    </div>
                                ) : null}
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
                                        <MajorSummaryRow label="Amount to pay" value={`R ${payrollSummary.netPayToEmployee.toFixed(2)}`} accent />
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <MajorSummaryRow label="Total earnings" value={`R ${payrollSummary.grossPay.toFixed(2)}`} />
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
                                                <SummaryRow label="UIF deducted from pay" value={`R ${payrollSummary.employeeUifDeduction.toFixed(2)}`} />
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
                                                    {delivery.message || "We’ll email your first payslip sample now."}
                                                </p>
                                        </div>
                                    </div>

                                        {delivery.phase === "already-used" ? (
                                            <div className="space-y-4 rounded-[1rem] border border-[var(--warning-border)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--text)]">
                                                <p>This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose Standard.</p>
                                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                    <Link
                                                        href="/upgrade?plan=standard&billing=monthly&pay=1"
                                                        onClick={() => track("upgrade_cta_clicked_from_free_limit", { source: "public_generator" })}
                                                        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
                                                    >
                                                        Start Standard
                                                    </Link>
                                                    <Link href="/pricing" className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--primary)]/40">
                                                        View pricing
                                                    </Link>
                                                    <Link href="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline">
                                                        Sign in
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : null}

                                        {delivery.phase === "success" ? (
                                            <div className="rounded-[1rem] border border-[var(--success-border)] bg-[var(--surface-raised)] p-4">
                                                <p className="text-sm font-semibold text-[var(--success)]">✓ Your free sample was emailed to {delivery.email}</p>
                                                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                                    This was your first free payslip sample. Ongoing monthly payroll, leave tracking, stored records, and exports require a paid plan.
                                                </p>
                                                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                    <Link href="/pricing" className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]">
                                                        View pricing
                                                    </Link>
                                                    <Link href="/login" className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--primary)]/40">
                                                        Sign in
                                                    </Link>
                                                </div>
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
                                                        Send me household employer updates and tips. Unsubscribe anytime.
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
                                                            : "Email my first payslip free"}
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
                            {currentStep === 0 ? "Continue to this month's work" : "Review the payslip"}
                        </Button>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
