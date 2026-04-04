"use client";

import * as React from "react";
import { format } from "date-fns";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Download,
    Mail,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { createClient } from "@/lib/supabase/client";
import { calculatePayslip, getSundayRateMultiplier, NMW_RATE } from "@/lib/calculator";
import {
    buildFreePayslipVerificationHref,
    parseFreePayslipVerificationState,
} from "@/lib/free-payslip-verification";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";
import { derivePayslipDraft, getMonthBounds, getMonthKey, normalizePayslipDraftToInput } from "@/lib/payslip-draft";
import { downloadPdf } from "@/lib/share";
import type { Employee, EmployerSettings, PayslipInput } from "@/lib/schema";
import {
    buildEmptyOrdinaryWorkPattern,
    type OrdinaryWorkPattern,
    normalizeOrdinaryWorkPattern,
} from "@/lib/ordinary-work-pattern";
import { OrdinaryWorkPatternPicker } from "@/components/payroll/ordinary-work-pattern-picker";
import { OrdinaryWorkCalendarSummaryCard } from "@/components/payroll/ordinary-work-calendar-summary";
import { describeOrdinaryWorkCalendar } from "@/lib/payroll-calendar";
import { buildPayrollSummary } from "@/lib/payroll-summary";

type FreePayslipFormState = {
    employerName: string;
    employerAddress: string;
    employeeName: string;
    employeeId: string;
    employeeRole: string;
    hourlyRate: string;
    monthKey: string;
    ordinaryWorkPattern: OrdinaryWorkPattern;
    ordinaryDaysWorked: string;
    ordinaryHoursOverride: string;
    overtimeHours: string;
    sundayHours: string;
    publicHolidayHours: string;
    shortShiftCount: string;
    shortShiftWorkedHours: string;
    otherDeductions: string;
};

type QuotaStatus = {
    email: string;
    monthKey: string;
    downloadsUsed: number;
    remainingDownloads: number;
    usedThisMonth: boolean;
};

type FieldErrors = Partial<Record<keyof FreePayslipFormState, string>>;

type VerificationPhase =
    | "idle"
    | "sending-link"
    | "waiting-for-verification"
    | "verified-ready"
    | "quota-used"
    | "invalid-link"
    | "missing-session"
    | "service-unavailable"
    | "success";

type NoticeTone = "info" | "warning" | "danger" | "success";

type VerificationMachineState = {
    phase: VerificationPhase;
    tone: NoticeTone;
    message: string;
    verifiedEmail: string;
    quota: QuotaStatus | null;
};

type VerificationAction =
    | { type: "reset" }
    | { type: "sending-link" }
    | { type: "waiting"; message: string; tone?: NoticeTone }
    | { type: "verified-ready"; message: string; email: string; quota: QuotaStatus }
    | { type: "quota-used"; message: string; email: string; quota: QuotaStatus | null }
    | { type: "invalid-link"; message: string }
    | { type: "missing-session"; message: string }
    | { type: "service-unavailable"; message: string }
    | { type: "success"; message: string; email: string; quota: QuotaStatus };

type SavedFreePayslipDraft = {
    form: FreePayslipFormState;
    currentStep: number;
    furthestStepReached: number;
    verificationEmail: string;
};

type WizardStep = {
    label: string;
    title: string;
    summary: string;
};

const STEPS: WizardStep[] = [
    { label: "Details", title: "Employer and worker details", summary: "Add the employer and worker details that must appear on the payslip." },
    { label: "Month", title: "Month and ordinary hours", summary: "Choose the month, set the normal work pattern, and confirm how Sunday work should be treated." },
    { label: "Extra pay", title: "Overtime, Sunday, and public holiday hours", summary: "Keep overtime, Sunday work, and public holiday work separate from ordinary time." },
    { label: "Deductions", title: "Deductions", summary: "Add any agreed deductions and preview UIF before you reach the review step." },
    { label: "Review", title: "Review and generate PDF", summary: "Check the figures, fix anything quickly, then verify an email in this browser to unlock the PDF." },
];

const DEFAULT_FORM: FreePayslipFormState = {
    employerName: "",
    employerAddress: "",
    employeeName: "",
    employeeId: "",
    employeeRole: "Domestic Worker",
    hourlyRate: NMW_RATE.toFixed(2),
    monthKey: "",
    ordinaryWorkPattern: buildEmptyOrdinaryWorkPattern(),
    ordinaryDaysWorked: "0",
    ordinaryHoursOverride: "",
    overtimeHours: "0",
    sundayHours: "0",
    publicHolidayHours: "0",
    shortShiftCount: "0",
    shortShiftWorkedHours: "0",
    otherDeductions: "0",
};

const FREE_PAYSLIP_DRAFT_STORAGE_KEY = "free-payslip-wizard-draft";
const ORDINARY_HOURS_PER_DAY = 8;
const FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE = "The free payslip service is temporarily unavailable. Please try again in a moment.";
const FREE_PAYSLIP_RULE_MESSAGE = "One successful free payslip PDF per verified email per calendar month.";
const SAME_BROWSER_RECOVERY_MESSAGE = "Open the email link in the same browser where this form is open, then click “I opened the link in this browser”.";

const INITIAL_VERIFICATION_STATE: VerificationMachineState = {
    phase: "idle",
    tone: "info",
    message: "",
    verifiedEmail: "",
    quota: null,
};

function verificationReducer(state: VerificationMachineState, action: VerificationAction): VerificationMachineState {
    switch (action.type) {
        case "reset":
            return INITIAL_VERIFICATION_STATE;
        case "sending-link":
            return { ...state, phase: "sending-link", tone: "info", message: "", quota: null, verifiedEmail: "" };
        case "waiting":
            return { ...state, phase: "waiting-for-verification", tone: action.tone ?? "info", message: action.message, quota: null };
        case "verified-ready":
            return { ...state, phase: "verified-ready", tone: "success", message: action.message, verifiedEmail: action.email, quota: action.quota };
        case "quota-used":
            return { ...state, phase: "quota-used", tone: "warning", message: action.message, verifiedEmail: action.email, quota: action.quota };
        case "invalid-link":
            return { ...state, phase: "invalid-link", tone: "danger", message: action.message, verifiedEmail: "", quota: null };
        case "missing-session":
            return { ...state, phase: "missing-session", tone: "warning", message: action.message, verifiedEmail: "", quota: null };
        case "service-unavailable":
            return { ...state, phase: "service-unavailable", tone: "danger", message: action.message, quota: null };
        case "success":
            return { ...state, phase: "success", tone: "success", message: action.message, verifiedEmail: action.email, quota: action.quota };
        default:
            return state;
    }
}

const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

function buildDefaultFormState(): FreePayslipFormState {
    return { ...DEFAULT_FORM, monthKey: getMonthKey(new Date()) };
}

function isValidMonthKey(monthKey: string) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return false;
    const { start, end } = getMonthBounds(monthKey);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
}

function clampStep(value: unknown) {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0;
    return Math.min(Math.max(Math.trunc(value), 0), STEPS.length - 1);
}

function sanitizeSavedDraft(rawDraft: unknown): SavedFreePayslipDraft {
    const defaults = buildDefaultFormState();
    const raw = rawDraft && typeof rawDraft === "object"
        ? rawDraft as { form?: Partial<Record<keyof FreePayslipFormState, unknown>>; currentStep?: unknown; furthestStepReached?: unknown; verificationEmail?: unknown }
        : {};
    const nextForm = { ...defaults };

    if (raw.form && typeof raw.form === "object") {
        for (const key of Object.keys(defaults) as Array<keyof FreePayslipFormState>) {
            const value = raw.form[key];
            if (key === "ordinaryWorkPattern" && value && typeof value === "object") {
                nextForm.ordinaryWorkPattern = normalizeOrdinaryWorkPattern(value as Partial<OrdinaryWorkPattern>) ?? buildEmptyOrdinaryWorkPattern();
                continue;
            }
            if (typeof value === "string") {
                (nextForm as Record<string, unknown>)[key] = value;
            }
        }
    }

    if (!isValidMonthKey(nextForm.monthKey)) {
        nextForm.monthKey = defaults.monthKey;
    }

    return {
        form: nextForm,
        currentStep: clampStep(raw.currentStep),
        furthestStepReached: clampStep(raw.furthestStepReached ?? raw.currentStep),
        verificationEmail: typeof raw.verificationEmail === "string" ? raw.verificationEmail : "",
    };
}

function buildPayload(form: FreePayslipFormState): {
    employee: Employee;
    payslip: PayslipInput;
    settings: EmployerSettings;
} | null {
    const normalizedPattern = normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern);
    if (!form.employerName.trim() || !form.employeeName.trim() || !form.monthKey || !isValidMonthKey(form.monthKey) || !normalizedPattern) {
        return null;
    }

    const monthBounds = getMonthBounds(form.monthKey);
    const ordinaryDaysWorked = parseNumber(form.ordinaryDaysWorked);
    const employee: Employee = {
        id: crypto.randomUUID(),
        householdId: "free-tool",
        name: form.employeeName.trim(),
        idNumber: form.employeeId.trim(),
        role: form.employeeRole.trim() || "Domestic Worker",
        hourlyRate: parseNumber(form.hourlyRate),
        phone: "",
        email: "",
        address: "",
        startDate: monthBounds.start.toISOString().slice(0, 10),
        startDateIsApproximate: false,
        leaveCycleStartDate: "",
        leaveCycleEndDate: "",
        annualLeaveBalanceAsOfDate: "",
        ordinarilyWorksSundays: normalizedPattern.sunday,
        ordinaryWorkPattern: normalizedPattern,
        ordinaryHoursPerDay: ORDINARY_HOURS_PER_DAY,
        frequency: "Monthly",
    };
    const payslip = normalizePayslipDraftToInput({
        id: crypto.randomUUID(),
        householdId: "free-tool",
        employeeId: employee.id,
        monthKey: form.monthKey,
        standardWorkingDaysThisMonth: ordinaryDaysWorked,
        ordinaryHoursPerDay: ORDINARY_HOURS_PER_DAY,
        ordinaryHoursOverride: form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null,
        overtimeHours: parseNumber(form.overtimeHours),
        sundayHours: parseNumber(form.sundayHours),
        publicHolidayHours: parseNumber(form.publicHolidayHours),
        shortShiftCount: parseNumber(form.shortShiftCount),
        shortShiftWorkedHours: parseNumber(form.shortShiftWorkedHours),
        hourlyRate: parseNumber(form.hourlyRate),
        ordinarilyWorksSundays: normalizedPattern.sunday,
        includeAccommodation: false,
        accommodationCost: undefined,
        otherDeductions: parseNumber(form.otherDeductions),
        createdAt: new Date(),
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
    });
    const settings: EmployerSettings = {
        employerName: form.employerName.trim(),
        employerAddress: form.employerAddress.trim(),
        employerIdNumber: "",
        uifRefNumber: "",
        cfNumber: "",
        sdlNumber: "",
        phone: "",
        employerEmail: "",
        proStatus: "free",
        paidUntil: undefined,
        billingCycle: "monthly",
        activeHouseholdId: "free-tool",
        logoData: undefined,
        defaultLanguage: "en",
        density: "comfortable",
        piiObfuscationEnabled: true,
        installationId: "free-tool",
        usageHistory: [],
        customLeaveTypes: [],
    };
    return { employee, payslip, settings };
}

function loadSavedDraft() {
    if (typeof window === "undefined") return null;
    try {
        const rawDraft = window.localStorage.getItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY);
        return rawDraft ? sanitizeSavedDraft(JSON.parse(rawDraft)) : null;
    } catch {
        return null;
    }
}

function getNoticeStyles(tone: NoticeTone) {
    if (tone === "danger") return "border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface-raised))] text-[var(--text)]";
    if (tone === "warning") return "border-[var(--warning)]/30 bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface-raised))] text-[var(--text)]";
    if (tone === "success") return "border-[var(--success)]/25 bg-[color:color-mix(in_srgb,var(--success)_10%,var(--surface-raised))] text-[var(--text)]";
    return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]";
}

function TextField({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
    return (
        <label htmlFor={id} className="block space-y-2">
            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
            {children}
            {hint ? <span className="block text-sm leading-6 text-[var(--text-muted)]">{hint}</span> : null}
            {error ? <span className="block text-sm font-medium text-[var(--danger)]">{error}</span> : null}
        </label>
    );
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
            <span className="min-w-0 leading-6 text-[var(--text-muted)]">{label}</span>
            <span className={`text-right tabular-nums ${accent ? "font-bold text-[var(--primary)]" : "font-semibold text-[var(--text)]"}`}>{value}</span>
        </div>
    );
}

function WizardActionBar({ currentStep, onBack, onNext }: { currentStep: number; onBack: () => void; onNext: () => void }) {
    return (
        <div className="sticky bottom-0 z-20 mt-8 border-t border-[var(--border)] bg-[var(--surface-raised)]/95 px-1 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={currentStep === 0}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button type="button" size="lg" className="flex-[1.2]" onClick={onNext}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function FreePayslipGenerator() {
    const supabase = React.useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const callbackState = React.useMemo(() => parseFreePayslipVerificationState(searchParams ? searchParams.get("freePayslipVerification") : null), [searchParams]);
    const savedDraft = React.useMemo(() => loadSavedDraft(), []);
    const [form, setForm] = React.useState<FreePayslipFormState>(() => savedDraft?.form ?? buildDefaultFormState());
    const [currentStep, setCurrentStep] = React.useState(() => savedDraft?.currentStep ?? 0);
    const [furthestStepReached, setFurthestStepReached] = React.useState(() => savedDraft?.furthestStepReached ?? savedDraft?.currentStep ?? 0);
    const [errors, setErrors] = React.useState<FieldErrors>({});
    const [verificationEmail, setVerificationEmail] = React.useState(() => savedDraft?.verificationEmail ?? "");
    const [verification, dispatchVerification] = React.useReducer(verificationReducer, INITIAL_VERIFICATION_STATE);
    const [showIdentityField, setShowIdentityField] = React.useState(() => Boolean(savedDraft?.form.employeeId));
    const [showShortShiftHelper, setShowShortShiftHelper] = React.useState(() => Boolean(savedDraft?.form.shortShiftCount && savedDraft.form.shortShiftCount !== "0"));
    const [checkingVerification, setCheckingVerification] = React.useState(false);
    const [downloading, setDownloading] = React.useState(false);

    const confirmedPattern = React.useMemo(() => normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern), [form.ordinaryWorkPattern]);
    const normalizedPattern = React.useMemo(() => confirmedPattern ?? buildEmptyOrdinaryWorkPattern(), [confirmedPattern]);
    const monthBounds = React.useMemo(() => getMonthBounds(isValidMonthKey(form.monthKey) ? form.monthKey : getMonthKey(new Date())), [form.monthKey]);
    const ordinaryCalendar = React.useMemo(() => describeOrdinaryWorkCalendar(monthBounds.start, monthBounds.end, normalizedPattern, ORDINARY_HOURS_PER_DAY), [monthBounds.end, monthBounds.start, normalizedPattern]);
    const derivedDraft = React.useMemo(() => derivePayslipDraft({
        householdId: "free-tool",
        employeeId: "preview",
        monthKey: isValidMonthKey(form.monthKey) ? form.monthKey : getMonthKey(new Date()),
        standardWorkingDaysThisMonth: parseNumber(form.ordinaryDaysWorked),
        ordinaryHoursPerDay: ORDINARY_HOURS_PER_DAY,
        ordinaryHoursOverride: form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null,
        overtimeHours: parseNumber(form.overtimeHours),
        sundayHours: parseNumber(form.sundayHours),
        publicHolidayHours: parseNumber(form.publicHolidayHours),
        shortShiftCount: parseNumber(form.shortShiftCount),
        shortShiftWorkedHours: parseNumber(form.shortShiftWorkedHours),
        hourlyRate: parseNumber(form.hourlyRate),
        ordinarilyWorksSundays: normalizedPattern.sunday,
        includeAccommodation: false,
        otherDeductions: parseNumber(form.otherDeductions),
    }), [form, normalizedPattern.sunday]);
    const payload = React.useMemo(() => buildPayload(form), [form]);
    const breakdown = React.useMemo(() => payload ? calculatePayslip(payload.payslip) : null, [payload]);
    const payrollSummary = React.useMemo(() => payload ? buildPayrollSummary(payload.payslip) : null, [payload]);
    const totalPremiumHours = parseNumber(form.overtimeHours) + parseNumber(form.sundayHours) + parseNumber(form.publicHolidayHours);
    const hasConfirmedPattern = Boolean(confirmedPattern);
    const ordinaryDaysHint = hasConfirmedPattern
        ? `Cap this month: ${ordinaryCalendar.ordinaryDayCap} ordinary day${ordinaryCalendar.ordinaryDayCap === 1 ? "" : "s"}.`
        : "Select the ordinary work pattern first to calculate the cap.";
    const ordinaryHoursHint = hasConfirmedPattern
        ? `Auto-calculated from ordinary days × ${ORDINARY_HOURS_PER_DAY} hours. Edit only if the worker's ordinary hours differ from full days.${ordinaryCalendar.ordinaryHourCap > 0 ? ` Cap this month: ${ordinaryCalendar.ordinaryHourCap} hours.` : ""}`
        : "Select the ordinary work pattern first to calculate the cap.";
    const sundayBasisHelp = normalizedPattern.sunday
        ? "Yes. Sunday hours will be paid at 1.5x."
        : "No. Sunday hours will be paid at 2.0x.";
    const reviewSundayBasis = normalizedPattern.sunday
        ? "Usually works Sundays, so Sunday hours pay at 1.5x."
        : "Does not usually work Sundays, so Sunday hours pay at 2.0x.";

    const updateField = React.useCallback((key: keyof FreePayslipFormState, value: FreePayslipFormState[keyof FreePayslipFormState]) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const nextErrors = { ...current };
            delete nextErrors[key];
            return nextErrors;
        });
    }, []);

    const updateSundayBasis = React.useCallback((ordinarilyWorksSundays: boolean) => {
        updateField("ordinaryWorkPattern", { ...form.ordinaryWorkPattern, sunday: ordinarilyWorksSundays });
    }, [form.ordinaryWorkPattern, updateField]);

    const jumpToStep = React.useCallback((stepIndex: number) => {
        setCurrentStep(stepIndex);
        setFurthestStepReached((current) => Math.max(current, stepIndex));
    }, []);

    const setSimpleVerificationError = React.useCallback((phase: "invalid-link" | "missing-session" | "service-unavailable", message: string) => {
        if (phase === "invalid-link") {
            dispatchVerification({ type: "invalid-link", message });
            return;
        }
        if (phase === "missing-session") {
            dispatchVerification({ type: "missing-session", message });
            return;
        }
        dispatchVerification({ type: "service-unavailable", message });
    }, []);

    const refreshVerification = React.useCallback(async (reason: "callback" | "manual") => {
        setCheckingVerification(true);
        try {
            const response = await fetch("/api/free-payslip/quota", { method: "GET", cache: "no-store" });
            const data = await response.json() as QuotaStatus | { error?: string };
            if (response.status === 401) {
                dispatchVerification({ type: "waiting", message: reason === "callback" ? `We could not confirm this email in this browser yet. ${SAME_BROWSER_RECOVERY_MESSAGE}` : SAME_BROWSER_RECOVERY_MESSAGE, tone: "warning" });
                return;
            }
            if (!response.ok) {
                throw new Error(response.status >= 500 ? FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE : typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "The free payslip verification status could not be checked.");
            }
            const quota = data as QuotaStatus;
            if (quota.usedThisMonth) {
                dispatchVerification({ type: "quota-used", message: "This verified email has already used its one successful free payslip PDF for this calendar month.", email: quota.email, quota });
                return;
            }
            dispatchVerification({ type: "verified-ready", message: "Email verified in this browser. The PDF can be generated now.", email: quota.email, quota });
        } catch (error) {
            setSimpleVerificationError("service-unavailable", error instanceof Error ? error.message : "The free payslip verification status could not be checked.");
        } finally {
            setCheckingVerification(false);
        }
    }, [setSimpleVerificationError]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY, JSON.stringify({ form, currentStep, furthestStepReached, verificationEmail }));
        } catch {
            // Best-effort draft persistence only.
        }
    }, [currentStep, form, furthestStepReached, verificationEmail]);

    React.useEffect(() => {
        if (!callbackState) return;
        if (callbackState === "invalid-link") {
            dispatchVerification({ type: "invalid-link", message: "That verification link is invalid or expired. Send a new link to continue." });
            return;
        }
        if (callbackState === "missing-session") {
            dispatchVerification({ type: "missing-session", message: `We could not confirm this email in this browser yet. ${SAME_BROWSER_RECOVERY_MESSAGE}` });
            return;
        }
        void refreshVerification("callback");
    }, [callbackState, refreshVerification]);

    const validateStep = React.useCallback((stepIndex: number) => {
        const nextErrors: FieldErrors = {};
        if (stepIndex === 0) {
            if (!form.employerName.trim()) nextErrors.employerName = "Add the employer name.";
            if (!form.employerAddress.trim()) nextErrors.employerAddress = "Add the employer address.";
            if (!form.employeeName.trim()) nextErrors.employeeName = "Add the worker name.";
            if (!form.employeeRole.trim()) nextErrors.employeeRole = "Add the worker role.";
        }
        if (stepIndex === 1) {
            if (!form.monthKey) nextErrors.monthKey = "Choose the payslip month.";
            else if (!isValidMonthKey(form.monthKey)) nextErrors.monthKey = "Choose a valid payslip month.";
            if (parseNumber(form.hourlyRate) < NMW_RATE) nextErrors.hourlyRate = `The hourly rate must be at least R${NMW_RATE.toFixed(2)}.`;
            if (!confirmedPattern) nextErrors.ordinaryWorkPattern = "Confirm the ordinary work pattern before continuing.";
            const ordinaryDaysWorked = parseNumber(form.ordinaryDaysWorked);
            if (ordinaryDaysWorked < 0) nextErrors.ordinaryDaysWorked = "Ordinary working days cannot be negative.";
            else if (confirmedPattern && ordinaryDaysWorked > ordinaryCalendar.ordinaryDayCap) nextErrors.ordinaryDaysWorked = `Ordinary working days cannot be more than ${ordinaryCalendar.ordinaryDayCap} for this month and work pattern.`;
            if (hasConfirmedPattern && ordinaryDaysWorked === 0 && totalPremiumHours <= 0 && parseNumber(form.shortShiftWorkedHours) <= 0) nextErrors.ordinaryDaysWorked = "Add ordinary working days or paid hours first.";
            const ordinaryHoursOverride = form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null;
            if (ordinaryHoursOverride !== null && confirmedPattern && ordinaryHoursOverride > ordinaryCalendar.ordinaryHourCap) nextErrors.ordinaryHoursOverride = `Ordinary hours cannot be more than ${ordinaryCalendar.ordinaryHourCap} for this month and work pattern.`;
        }
        if (stepIndex === 2) {
            if (parseNumber(form.overtimeHours) < 0) nextErrors.overtimeHours = "Hours cannot be negative.";
            if (parseNumber(form.sundayHours) < 0) nextErrors.sundayHours = "Hours cannot be negative.";
            if (parseNumber(form.publicHolidayHours) < 0) nextErrors.publicHolidayHours = "Hours cannot be negative.";
        }
        if (stepIndex === 3 && parseNumber(form.otherDeductions) < 0) nextErrors.otherDeductions = "Deductions cannot be negative.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [confirmedPattern, form, hasConfirmedPattern, ordinaryCalendar.ordinaryDayCap, ordinaryCalendar.ordinaryHourCap, totalPremiumHours]);

    const goNext = React.useCallback(() => {
        if (!validateStep(currentStep)) return;
        setCurrentStep((step) => {
            const nextStep = Math.min(step + 1, STEPS.length - 1);
            setFurthestStepReached((current) => Math.max(current, nextStep));
            return nextStep;
        });
    }, [currentStep, validateStep]);

    const goBack = React.useCallback(() => setCurrentStep((step) => Math.max(step - 1, 0)), []);

    const sendVerificationLink = React.useCallback(async () => {
        const email = verificationEmail.trim().toLowerCase();
        if (!email) {
            setSimpleVerificationError("service-unavailable", "Enter the email address that should receive the verification link.");
            return;
        }
        dispatchVerification({ type: "sending-link" });
        try {
            if (typeof window === "undefined") throw new Error("This browser could not prepare the verification link.");
            const next = buildFreePayslipVerificationHref("success");
            const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` } });
            if (error) throw error;
            dispatchVerification({ type: "waiting", message: `Verification link sent. ${SAME_BROWSER_RECOVERY_MESSAGE}` });
        } catch (error) {
            setSimpleVerificationError("service-unavailable", error instanceof Error ? error.message : "The verification email could not be sent.");
        }
    }, [setSimpleVerificationError, supabase.auth, verificationEmail]);

    const handleUseDifferentEmail = React.useCallback(async () => {
        await supabase.auth.signOut();
        await fetch("/api/free-payslip/session", { method: "DELETE", cache: "no-store" }).catch(() => undefined);
        if (typeof window !== "undefined") {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete("freePayslipVerification");
            window.history.replaceState({}, "", nextUrl.toString());
        }
        setVerificationEmail("");
        dispatchVerification({ type: "reset" });
    }, [supabase.auth]);

    const handleDownload = React.useCallback(async () => {
        if (!payload || !breakdown || !payrollSummary) {
            setSimpleVerificationError("service-unavailable", "Complete the payroll details first so the PDF can be prepared.");
            return;
        }
        if (verification.phase !== "verified-ready") {
            dispatchVerification({ type: "waiting", message: "Verify the email in this browser before generating the PDF.", tone: "warning" });
            return;
        }
        setDownloading(true);
        try {
            const pdfBytes = await generatePayslipPdfBytes(payload.employee, payload.payslip, payload.settings, "en");
            const quotaResponse = await fetch("/api/free-payslip/quota", { method: "POST", cache: "no-store" });
            const quotaData = await quotaResponse.json() as QuotaStatus | { error?: string };
            if (!quotaResponse.ok) {
                if (quotaResponse.status === 409) {
                    dispatchVerification({ type: "quota-used", message: typeof quotaData === "object" && quotaData && "error" in quotaData && typeof quotaData.error === "string" ? quotaData.error : "This verified email has already used its one successful free payslip PDF for this calendar month.", email: verification.verifiedEmail, quota: null });
                    return;
                }
                if (quotaResponse.status === 401) {
                    dispatchVerification({ type: "waiting", message: `The verified session expired before the PDF was generated. ${SAME_BROWSER_RECOVERY_MESSAGE}`, tone: "warning" });
                    return;
                }
                throw new Error(quotaResponse.status >= 500 ? FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE : typeof quotaData === "object" && quotaData && "error" in quotaData && typeof quotaData.error === "string" ? quotaData.error : "The free monthly quota could not be updated.");
            }
            downloadPdf(pdfBytes, getPayslipFilename(payload.employee, payload.payslip));
            const consumedQuota = quotaData as QuotaStatus;
            dispatchVerification({ type: "success", message: "Payslip PDF generated successfully. This verified email has now used its free PDF for this calendar month.", email: consumedQuota.email, quota: consumedQuota });
        } catch (error) {
            setSimpleVerificationError("service-unavailable", error instanceof Error ? error.message : "The PDF could not be generated.");
        } finally {
            setDownloading(false);
        }
    }, [breakdown, payload, payrollSummary, setSimpleVerificationError, verification.phase, verification.verifiedEmail]);

    const step = STEPS[currentStep];
    const sundayRateLabel = `${getSundayRateMultiplier(normalizedPattern.sunday).toFixed(1)}x`;
    const verificationIntroMessage = `${FREE_PAYSLIP_RULE_MESSAGE} Verify the same email in this browser to unlock the download.`;
    const shouldPromoteRecoveryAction = verification.phase === "waiting-for-verification" || verification.phase === "missing-session";
    const verificationLinkButtonLabel = shouldPromoteRecoveryAction ? "Resend verification link" : "Send verification link";
    const canRefreshVerification = verification.phase !== "idle" && verification.phase !== "sending-link";
    const generateLockedMessage = verification.phase === "verified-ready"
        ? ""
        : verification.phase === "quota-used" || verification.phase === "success"
            ? "This verified email has already used its free PDF for this calendar month."
            : "Generate PDF unlocks after this email is verified in this browser.";
    const gateCardTitle = verification.phase === "sending-link"
        ? "Sending verification link"
        : verification.phase === "waiting-for-verification"
            ? "Verify email in this browser"
            : verification.phase === "verified-ready"
                ? "Ready to generate"
                : verification.phase === "quota-used"
                    ? "Free PDF already used for this month"
                    : verification.phase === "invalid-link"
                        ? "Verification link invalid"
                        : verification.phase === "missing-session"
                            ? "Verification not complete in this browser"
                            : verification.phase === "service-unavailable"
                                ? "Verification service unavailable"
                                : verification.phase === "success"
                                    ? "PDF generated"
                                    : "Verify email";

    return (
        <section id="free-payslip-wizard" data-testid="free-payslip-wizard" className="mx-auto max-w-[72rem] scroll-mt-24">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-3xl space-y-3">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Build the payslip step by step.</h2>
                        <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                            We work out ordinary pay, UIF, Sunday treatment, and public holiday treatment as you go.
                            Verify an email in this browser to unlock one free PDF download for the month.
                        </p>
                    </div>
                </div>
                <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
                    <Stepper
                        steps={STEPS.map((wizardStep) => ({ label: wizardStep.label }))}
                        currentStep={currentStep}
                        furthestStepReached={furthestStepReached}
                        onStepClick={(index) => jumpToStep(index)}
                    />
                </div>
                <div className="mt-6 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{step.label}</p>
                        <h2 className="font-serif text-2xl font-bold text-[var(--text)] sm:text-[2rem]">{step.title}</h2>
                        <p className="max-w-3xl text-sm leading-7 text-[var(--text-muted)]">{step.summary}</p>
                    </div>
                    <div className="mt-8 space-y-6">
                        {currentStep === 0 ? (
                            <div className="grid gap-5 lg:grid-cols-2">
                                <TextField id="free-employer-name" label="Employer name" error={errors.employerName}>
                                    <Input
                                        id="free-employer-name"
                                        value={form.employerName}
                                        onChange={(event) => updateField("employerName", event.target.value)}
                                        placeholder="Employer name"
                                    />
                                </TextField>
                                <TextField id="free-employer-address" label="Employer address" error={errors.employerAddress}>
                                    <Input
                                        id="free-employer-address"
                                        value={form.employerAddress}
                                        onChange={(event) => updateField("employerAddress", event.target.value)}
                                        placeholder="Employer address"
                                    />
                                </TextField>
                                <TextField id="free-worker-name" label="Worker name" error={errors.employeeName}>
                                    <Input
                                        id="free-worker-name"
                                        value={form.employeeName}
                                        onChange={(event) => updateField("employeeName", event.target.value)}
                                        placeholder="Worker name"
                                    />
                                </TextField>
                                <TextField id="free-worker-role" label="Worker role" error={errors.employeeRole}>
                                    <Input
                                        id="free-worker-role"
                                        value={form.employeeRole}
                                        onChange={(event) => updateField("employeeRole", event.target.value)}
                                        placeholder="Domestic Worker"
                                    />
                                </TextField>
                                <div className="lg:col-span-2 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowIdentityField((current) => !current)}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Worker ID or passport</p>
                                            <p className="mt-1 text-sm text-[var(--text-muted)]">Optional for the free tool. Useful for UIF and record matching later.</p>
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
                                                />
                                            </TextField>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {currentStep === 1 ? (
                            <div className="space-y-6">
                                <div className="grid gap-5 lg:grid-cols-2">
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
                                            value={form.hourlyRate}
                                            onChange={(event) => updateField("hourlyRate", event.target.value)}
                                        />
                                    </TextField>
                                </div>
                                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Sunday treatment</p>
                                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Does the worker ordinarily work Sundays?</p>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => updateSundayBasis(false)}
                                            className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${!normalizedPattern.sunday ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                        >
                                            <p className="text-sm font-bold">No</p>
                                            <p className={`mt-1 text-sm leading-6 ${!normalizedPattern.sunday ? "text-white/88" : "text-[var(--text-muted)]"}`}>Sunday hours will be paid at 2.0x.</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateSundayBasis(true)}
                                            className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${normalizedPattern.sunday ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                        >
                                            <p className="text-sm font-bold">Yes</p>
                                            <p className={`mt-1 text-sm leading-6 ${normalizedPattern.sunday ? "text-white/88" : "text-[var(--text-muted)]"}`}>Sunday hours will be paid at 1.5x.</p>
                                        </button>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{sundayBasisHelp}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Ordinary weekday pattern</p>
                                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Select the regular weekdays and Saturday that count as ordinary work for this month&apos;s cap.</p>
                                    <div className="mt-4">
                                        <OrdinaryWorkPatternPicker
                                            value={form.ordinaryWorkPattern}
                                            onChange={(nextPattern) => updateField("ordinaryWorkPattern", nextPattern)}
                                            error={errors.ordinaryWorkPattern}
                                            helperText="Sunday is set separately above. This pattern controls the ordinary day and hour cap."
                                            hiddenDayKeys={["sunday"]}
                                        />
                                    </div>
                                </div>
                                <OrdinaryWorkCalendarSummaryCard summary={ordinaryCalendar} ordinaryHoursPerDay={ORDINARY_HOURS_PER_DAY} />
                                <div className="grid gap-5 lg:grid-cols-2">
                                    <TextField
                                        id="free-ordinary-days"
                                        label="Ordinary working days"
                                        hint={ordinaryDaysHint}
                                        error={errors.ordinaryDaysWorked}
                                    >
                                        <Input
                                            id="free-ordinary-days"
                                            type="number"
                                            min="0"
                                            max={ordinaryCalendar.ordinaryDayCap}
                                            value={form.ordinaryDaysWorked}
                                            onChange={(event) => updateField("ordinaryDaysWorked", event.target.value)}
                                        />
                                    </TextField>
                                    <TextField
                                        id="free-ordinary-hours"
                                        label="Ordinary hours"
                                        hint={ordinaryHoursHint}
                                        error={errors.ordinaryHoursOverride}
                                    >
                                        <Input
                                            id="free-ordinary-hours"
                                            type="number"
                                            min="0"
                                            max={ordinaryCalendar.ordinaryHourCap}
                                            value={form.ordinaryHoursOverride}
                                            onChange={(event) => updateField("ordinaryHoursOverride", event.target.value)}
                                            placeholder={hasConfirmedPattern ? `${derivedDraft.autoOrdinaryHours}` : ""}
                                        />
                                    </TextField>
                                </div>
                            </div>
                        ) : null}

                        {currentStep === 2 ? (
                            <div className="space-y-6">
                                <div className="grid gap-5 lg:grid-cols-3">
                                    <TextField id="free-overtime-hours" label="Overtime hours" hint="Paid at 1.5x." error={errors.overtimeHours}>
                                        <Input
                                            id="free-overtime-hours"
                                            type="number"
                                            min="0"
                                            value={form.overtimeHours}
                                            onChange={(event) => updateField("overtimeHours", event.target.value)}
                                        />
                                    </TextField>
                                    <TextField
                                        id="free-sunday-hours"
                                        label="Sunday hours"
                                        hint={`Paid at ${sundayRateLabel} because Sunday is ${normalizedPattern.sunday ? "" : "not "}part of the ordinary work pattern.`}
                                        error={errors.sundayHours}
                                    >
                                        <Input
                                            id="free-sunday-hours"
                                            type="number"
                                            min="0"
                                            value={form.sundayHours}
                                            onChange={(event) => updateField("sundayHours", event.target.value)}
                                        />
                                    </TextField>
                                    <TextField
                                        id="free-public-holiday-hours"
                                        label="Public holiday hours"
                                        hint="Only enter hours actually worked on a South African public holiday. These hours stay separate from ordinary hours."
                                        error={errors.publicHolidayHours}
                                    >
                                        <Input
                                            id="free-public-holiday-hours"
                                            type="number"
                                            min="0"
                                            value={form.publicHolidayHours}
                                            onChange={(event) => updateField("publicHolidayHours", event.target.value)}
                                        />
                                    </TextField>
                                </div>
                                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                    <button
                                        type="button"
                                        onClick={() => setShowShortShiftHelper((current) => !current)}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Short shifts under four hours</p>
                                            <p className="mt-1 text-sm text-[var(--text-muted)]">Use this only when the worker was booked for ordinary work but worked under four hours, so the minimum paid time must be topped up.</p>
                                        </div>
                                        {showShortShiftHelper ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                    </button>
                                    {showShortShiftHelper ? (
                                        <div className="mt-4 grid gap-5 lg:grid-cols-2">
                                            <TextField id="free-short-shifts" label="Number of short shifts">
                                                <Input
                                                    id="free-short-shifts"
                                                    type="number"
                                                    min="0"
                                                    value={form.shortShiftCount}
                                                    onChange={(event) => updateField("shortShiftCount", event.target.value)}
                                                />
                                            </TextField>
                                            <TextField id="free-short-shift-hours" label="Worked hours across those short shifts">
                                                <Input
                                                    id="free-short-shift-hours"
                                                    type="number"
                                                    min="0"
                                                    value={form.shortShiftWorkedHours}
                                                    onChange={(event) => updateField("shortShiftWorkedHours", event.target.value)}
                                                />
                                            </TextField>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {currentStep === 3 ? (
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.95fr)]">
                                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                    <TextField
                                        id="free-other-deductions"
                                        label="Other deductions"
                                        hint="Only enter agreed deductions that should appear on this payslip."
                                        error={errors.otherDeductions}
                                    >
                                        <Input
                                            id="free-other-deductions"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.otherDeductions}
                                            onChange={(event) => updateField("otherDeductions", event.target.value)}
                                        />
                                    </TextField>
                                </div>
                                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">UIF preview</p>
                                    {breakdown && payrollSummary ? (
                                        <div className="mt-3 space-y-3">
                                            <p className="text-sm leading-7 text-[var(--text-muted)]">
                                                {payrollSummary.totalUifDue > 0
                                                    ? "UIF applies on the current figures, so it will show on the payslip and employer summary."
                                                    : "UIF does not apply on the current figures, so it will stay at zero on the payslip."}
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                <SummaryRow label="Employee UIF (1%)" value={`R ${payrollSummary.employeeUifDeduction.toFixed(2)}`} />
                                                <SummaryRow label="Employer UIF (1%)" value={`R ${payrollSummary.employerUifContribution.toFixed(2)}`} />
                                                <SummaryRow label="Total UIF due" value={`R ${payrollSummary.totalUifDue.toFixed(2)}`} accent />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">Finish the month and hours first to preview UIF here.</p>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {currentStep === 4 ? (
                            payload && breakdown && payrollSummary ? (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-3">
                                        <Button type="button" variant="outline" onClick={() => jumpToStep(0)}>Edit details</Button>
                                        <Button type="button" variant="outline" onClick={() => jumpToStep(1)}>Edit month and hours</Button>
                                        <Button type="button" variant="outline" onClick={() => jumpToStep(2)}>Edit extra pay</Button>
                                        <Button type="button" variant="outline" onClick={() => jumpToStep(3)}>Edit deductions</Button>
                                    </div>
                                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)]">
                                        <div className="space-y-5">
                                            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Payroll summary</p>
                                                <div className="mt-4 space-y-3">
                                                    <SummaryRow label={`Ordinary pay (${breakdown.effectiveOrdinaryHours}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                                                    {breakdown.overtimePay > 0 ? <SummaryRow label={`Overtime (${payload.payslip.overtimeHours}h @ 1.5x)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} /> : null}
                                                    {breakdown.sundayPay > 0 ? <SummaryRow label={`Sunday (${payload.payslip.sundayHours}h @ ${sundayRateLabel})`} value={`R ${breakdown.sundayPay.toFixed(2)}`} /> : null}
                                                    {breakdown.publicHolidayPay > 0 ? <SummaryRow label={`Public holiday (${payload.payslip.publicHolidayHours}h @ 2x)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} /> : null}
                                                    {breakdown.topUps.fourHourMinimumHours > 0 ? <SummaryRow label="Short-shift top-up" value={`${breakdown.topUps.fourHourMinimumHours}h included`} /> : null}
                                                    <SummaryRow label="Gross pay" value={`R ${payrollSummary.grossPay.toFixed(2)}`} accent />
                                                    <SummaryRow label="Employee UIF deduction" value={`R ${payrollSummary.employeeUifDeduction.toFixed(2)}`} />
                                                    <SummaryRow label="Net pay to employee" value={`R ${payrollSummary.netPayToEmployee.toFixed(2)}`} accent />
                                                    <SummaryRow label="Employer UIF contribution" value={`R ${payrollSummary.employerUifContribution.toFixed(2)}`} />
                                                    <SummaryRow label="Total UIF due for the period" value={`R ${payrollSummary.totalUifDue.toFixed(2)}`} />
                                                    <SummaryRow label="Employer total cost" value={`R ${payrollSummary.employerTotalCost.toFixed(2)}`} accent />
                                                </div>
                                            </div>
                                            <OrdinaryWorkCalendarSummaryCard summary={ordinaryCalendar} ordinaryHoursPerDay={ORDINARY_HOURS_PER_DAY} title="Ordinary work cap used for this payslip" />
                                        </div>
                                        <div className="space-y-5">
                                            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Employer and worker details</p>
                                                <div className="mt-4 space-y-3 text-sm">
                                                    <SummaryRow label="Employer" value={payload.settings.employerName} />
                                                    <SummaryRow label="Worker" value={payload.employee.name} />
                                                    <SummaryRow label="Role" value={payload.employee.role} />
                                                    <SummaryRow label="Payslip month" value={format(payload.payslip.payPeriodEnd, "MMMM yyyy")} />
                                                    <SummaryRow label="Ordinary working days" value={`${payload.payslip.daysWorked}`} />
                                                    <SummaryRow label="Sunday treatment" value={reviewSundayBasis} />
                                                </div>
                                            </div>
                                            <div data-testid={`free-payslip-gate-${verification.phase}`} className={`rounded-[1.5rem] border p-5 ${getNoticeStyles(verification.tone)}`}>
                                                <div className="flex items-start gap-3">
                                                    {verification.tone === "success" ? (
                                                        <BadgeCheck className="mt-0.5 h-5 w-5 text-[var(--success)]" />
                                                    ) : verification.tone === "danger" ? (
                                                        <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
                                                    ) : verification.tone === "warning" ? (
                                                        <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
                                                    ) : (
                                                        <Mail className="mt-0.5 h-5 w-5 text-[var(--primary)]" />
                                                    )}
                                                    <div className="min-w-0 flex-1 space-y-4">
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{gateCardTitle}</p>
                                                            <p className="text-sm leading-7 text-[var(--text-muted)]">{verificationIntroMessage}</p>
                                                            {verification.message ? <p className="text-sm leading-7 text-[var(--text-muted)]">{verification.message}</p> : null}
                                                        </div>
                                                        <TextField id="free-verification-email" label="Verification email">
                                                            <Input
                                                                id="free-verification-email"
                                                                type="email"
                                                                value={verificationEmail}
                                                                onChange={(event) => setVerificationEmail(event.target.value)}
                                                                placeholder="name@example.com"
                                                            />
                                                        </TextField>
                                                        <div className="flex flex-col gap-3 sm:flex-row">
                                                            {shouldPromoteRecoveryAction ? (
                                                                <>
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => void refreshVerification("manual")}
                                                                        disabled={checkingVerification || !canRefreshVerification}
                                                                        className="gap-2"
                                                                    >
                                                                        {checkingVerification ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                                        I opened the link in this browser
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => void sendVerificationLink()}
                                                                        disabled={verification.phase === "sending-link"}
                                                                        className="gap-2"
                                                                    >
                                                                        {verification.phase === "sending-link" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                                                        {verificationLinkButtonLabel}
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => void sendVerificationLink()}
                                                                        disabled={verification.phase === "sending-link"}
                                                                        className="gap-2"
                                                                    >
                                                                        {verification.phase === "sending-link" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                                                        {verificationLinkButtonLabel}
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => void refreshVerification("manual")}
                                                                        disabled={checkingVerification || !canRefreshVerification}
                                                                        className="gap-2"
                                                                    >
                                                                        {checkingVerification ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                                        I opened the link in this browser
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-3 sm:flex-row">
                                                            <Button
                                                                type="button"
                                                                size="lg"
                                                                onClick={() => void handleDownload()}
                                                                disabled={verification.phase !== "verified-ready" || downloading}
                                                                className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                            >
                                                                {downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                                Generate PDF
                                                            </Button>
                                                            <Button type="button" variant="outline" onClick={() => void handleUseDifferentEmail()} disabled={verification.phase === "sending-link"}>
                                                                Use different email
                                                            </Button>
                                                        </div>
                                                        {generateLockedMessage ? <p className="text-sm leading-6 text-[var(--text-muted)]">{generateLockedMessage}</p> : null}
                                                        {verification.quota ? (
                                                            <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-muted)]">
                                                                Verified email: <strong className="text-[var(--text)]">{verification.quota.email}</strong><br />
                                                                Month: <strong className="text-[var(--text)]">{verification.quota.monthKey}</strong><br />
                                                                Free PDFs used this month: <strong className="text-[var(--text)]">{verification.quota.downloadsUsed}</strong>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5 text-sm leading-7 text-[var(--text-muted)]">
                                    Finish the payroll details first so the review figures can be prepared.
                                </div>
                            )
                        ) : null}
                    </div>
                </div>
                {currentStep < STEPS.length - 1 ? <WizardActionBar currentStep={currentStep} onBack={goBack} onNext={goNext} /> : null}
                {currentStep === STEPS.length - 1 ? (
                    <div className="mt-6 flex items-center justify-start">
                        <Button type="button" variant="outline" onClick={goBack}>
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
