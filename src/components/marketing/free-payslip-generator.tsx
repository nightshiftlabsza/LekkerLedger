"use client";

import * as React from "react";
import { format } from "date-fns";
import {
    AlertTriangle,
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
import { createClient } from "@/lib/supabase/client";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";
import {
    buildFreePayslipVerificationHref,
    parseFreePayslipVerificationState,
} from "@/lib/free-payslip-verification";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";
import { getMonthBounds, getMonthKey, normalizePayslipDraftToInput } from "@/lib/payslip-draft";
import { downloadPdf } from "@/lib/share";
import type { Employee, EmployerSettings, PayslipInput } from "@/lib/schema";
import {
    buildEmptyOrdinaryWorkPattern,
    normalizeOrdinaryWorkPattern,
    type OrdinaryWorkPattern,
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
    verificationEmail: string;
};

type OrdinaryWorkPreset = "monday-to-friday" | "monday-to-saturday" | "custom";

const ORDINARY_HOURS_PER_DAY = 8;
const FREE_PAYSLIP_DRAFT_STORAGE_KEY = "free-payslip-simple-draft-v1";
const FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE = "The free payslip service is temporarily unavailable. Please try again in a moment.";
const FREE_PAYSLIP_RULE_MESSAGE = "One free PDF per verified email each calendar month.";
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

function isValidMonthKey(monthKey: string) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return false;
    const { start, end } = getMonthBounds(monthKey);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
}

function buildPatternFromPreset(preset: OrdinaryWorkPreset, sunday: boolean): OrdinaryWorkPattern {
    return {
        monday: preset === "monday-to-friday" || preset === "monday-to-saturday",
        tuesday: preset === "monday-to-friday" || preset === "monday-to-saturday",
        wednesday: preset === "monday-to-friday" || preset === "monday-to-saturday",
        thursday: preset === "monday-to-friday" || preset === "monday-to-saturday",
        friday: preset === "monday-to-friday" || preset === "monday-to-saturday",
        saturday: preset === "monday-to-saturday",
        sunday,
    };
}

function getPresetFromPattern(pattern: OrdinaryWorkPattern | null | undefined): OrdinaryWorkPreset {
    if (!pattern) return "custom";

    const mondayToFriday = pattern.monday
        && pattern.tuesday
        && pattern.wednesday
        && pattern.thursday
        && pattern.friday
        && !pattern.saturday;
    if (mondayToFriday) return "monday-to-friday";

    const mondayToSaturday = pattern.monday
        && pattern.tuesday
        && pattern.wednesday
        && pattern.thursday
        && pattern.friday
        && pattern.saturday;
    if (mondayToSaturday) return "monday-to-saturday";

    return "custom";
}

function buildDefaultFormState(): FreePayslipFormState {
    return {
        employerName: "",
        employerAddress: "",
        employeeName: "",
        employeeId: "",
        employeeRole: "Domestic Worker",
        hourlyRate: NMW_RATE.toFixed(2),
        monthKey: getMonthKey(new Date()),
        ordinaryWorkPattern: buildPatternFromPreset("monday-to-friday", false),
        ordinaryDaysWorked: "0",
        ordinaryHoursOverride: "",
        overtimeHours: "0",
        sundayHours: "0",
        publicHolidayHours: "0",
        shortShiftCount: "0",
        shortShiftWorkedHours: "0",
        otherDeductions: "0",
    };
}

function sanitizeSavedDraft(rawDraft: unknown): SavedFreePayslipDraft {
    const defaults = buildDefaultFormState();
    const raw = rawDraft && typeof rawDraft === "object"
        ? rawDraft as { form?: Partial<Record<keyof FreePayslipFormState, unknown>>; verificationEmail?: unknown }
        : {};
    const nextForm = { ...defaults };

    if (raw.form && typeof raw.form === "object") {
        for (const key of Object.keys(defaults) as Array<keyof FreePayslipFormState>) {
            const value = raw.form[key];
            if (key === "ordinaryWorkPattern" && value && typeof value === "object") {
                nextForm.ordinaryWorkPattern = normalizeOrdinaryWorkPattern(value as Partial<OrdinaryWorkPattern>) ?? defaults.ordinaryWorkPattern;
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
        verificationEmail: typeof raw.verificationEmail === "string" ? raw.verificationEmail : "",
    };
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

function buildCalculationInput(form: FreePayslipFormState): PayslipInput | null {
    const normalizedPattern = normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern);
    if (!form.monthKey || !isValidMonthKey(form.monthKey) || !normalizedPattern) {
        return null;
    }

    return normalizePayslipDraftToInput({
        id: crypto.randomUUID(),
        householdId: "free-tool",
        employeeId: "free-tool-preview",
        monthKey: form.monthKey,
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
    });
}

function buildPayload(form: FreePayslipFormState): {
    employee: Employee;
    payslip: PayslipInput;
    settings: EmployerSettings;
} | null {
    const normalizedPattern = normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern);
    const payslip = buildCalculationInput(form);
    if (!payslip || !normalizedPattern) return null;
    if (!form.employerName.trim() || !form.employerAddress.trim() || !form.employeeName.trim()) {
        return null;
    }

    const monthBounds = getMonthBounds(form.monthKey);
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

function SectionCard({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{eyebrow}</p>
                <h3 className="font-serif text-2xl font-bold text-[var(--text)]">{title}</h3>
                <p className="max-w-3xl text-sm leading-7 text-[var(--text-muted)]">{description}</p>
            </div>
            <div className="mt-6 space-y-6">{children}</div>
        </section>
    );
}

export function FreePayslipGenerator() {
    const supabase = React.useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const callbackState = React.useMemo(
        () => parseFreePayslipVerificationState(searchParams ? searchParams.get("freePayslipVerification") : null),
        [searchParams],
    );
    const savedDraft = React.useMemo(() => loadSavedDraft(), []);

    const [form, setForm] = React.useState<FreePayslipFormState>(() => savedDraft?.form ?? buildDefaultFormState());
    const [errors, setErrors] = React.useState<FieldErrors>({});
    const [verificationEmail, setVerificationEmail] = React.useState(() => savedDraft?.verificationEmail ?? "");
    const [verification, dispatchVerification] = React.useReducer(verificationReducer, INITIAL_VERIFICATION_STATE);
    const [showIdentityField, setShowIdentityField] = React.useState(() => Boolean(savedDraft?.form.employeeId));
    const [showRoleOverride, setShowRoleOverride] = React.useState(() => (savedDraft?.form.employeeRole ?? "Domestic Worker") !== "Domestic Worker");
    const [showOrdinaryHoursOverride, setShowOrdinaryHoursOverride] = React.useState(() => Boolean(savedDraft?.form.ordinaryHoursOverride));
    const [showOptionalAdjustments, setShowOptionalAdjustments] = React.useState(() => {
        const savedForm = savedDraft?.form;
        return Boolean(
            savedForm
            && (
                savedForm.shortShiftCount !== "0"
                || savedForm.shortShiftWorkedHours !== "0"
                || savedForm.otherDeductions !== "0"
            ),
        );
    });
    const [showSummaryDetails, setShowSummaryDetails] = React.useState(false);
    const [checkingVerification, setCheckingVerification] = React.useState(false);
    const [downloading, setDownloading] = React.useState(false);

    const confirmedPattern = React.useMemo(() => normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern), [form.ordinaryWorkPattern]);
    const normalizedPattern = React.useMemo(() => confirmedPattern ?? buildEmptyOrdinaryWorkPattern(), [confirmedPattern]);
    const schedulePreset = React.useMemo(() => getPresetFromPattern(normalizedPattern), [normalizedPattern]);
    const monthBounds = React.useMemo(
        () => getMonthBounds(isValidMonthKey(form.monthKey) ? form.monthKey : getMonthKey(new Date())),
        [form.monthKey],
    );
    const ordinaryCalendar = React.useMemo(
        () => describeOrdinaryWorkCalendar(monthBounds.start, monthBounds.end, normalizedPattern, ORDINARY_HOURS_PER_DAY),
        [monthBounds.end, monthBounds.start, normalizedPattern],
    );
    const calculationInput = React.useMemo(() => buildCalculationInput(form), [form]);
    const breakdown = React.useMemo(() => calculationInput ? calculatePayslip(calculationInput) : null, [calculationInput]);
    const payrollSummary = React.useMemo(() => calculationInput ? buildPayrollSummary(calculationInput) : null, [calculationInput]);
    const payload = React.useMemo(() => buildPayload(form), [form]);
    const totalPremiumHours = parseNumber(form.overtimeHours) + parseNumber(form.sundayHours) + parseNumber(form.publicHolidayHours);
    const ordinaryDaysHint = `Maximum normal days this month: ${ordinaryCalendar.ordinaryDayCap}.`;
    const ordinaryHoursHint = `Only use this if normal hours differ from full days. Maximum normal hours this month: ${ordinaryCalendar.ordinaryHourCap}.`;
    const sundayWorkHelp = normalizedPattern.sunday
        ? "Sunday is treated as part of the worker's usual schedule."
        : "Sunday is treated as occasional Sunday work.";
    const reviewSundayBasis = normalizedPattern.sunday
        ? "Sunday is part of the usual schedule."
        : "Sunday is occasional work.";

    const updateField = React.useCallback((key: keyof FreePayslipFormState, value: FreePayslipFormState[keyof FreePayslipFormState]) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const nextErrors = { ...current };
            delete nextErrors[key];
            return nextErrors;
        });
    }, []);

    const updateSchedulePreset = React.useCallback((preset: OrdinaryWorkPreset) => {
        updateField("ordinaryWorkPattern", buildPatternFromPreset(preset, normalizedPattern.sunday));
    }, [normalizedPattern.sunday, updateField]);

    const updateSundayBasis = React.useCallback((ordinarilyWorksSundays: boolean) => {
        updateField("ordinaryWorkPattern", { ...normalizedPattern, sunday: ordinarilyWorksSundays });
    }, [normalizedPattern, updateField]);

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
                dispatchVerification({
                    type: "waiting",
                    message: reason === "callback"
                        ? `We could not confirm this email in this browser yet. ${SAME_BROWSER_RECOVERY_MESSAGE}`
                        : SAME_BROWSER_RECOVERY_MESSAGE,
                    tone: "warning",
                });
                return;
            }
            if (!response.ok) {
                throw new Error(response.status >= 500
                    ? FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE
                    : typeof data === "object" && data && "error" in data && typeof data.error === "string"
                        ? data.error
                        : "The free payslip verification status could not be checked.");
            }
            const quota = data as QuotaStatus;
            if (quota.usedThisMonth) {
                dispatchVerification({
                    type: "quota-used",
                    message: "This verified email has already used its free PDF for this calendar month.",
                    email: quota.email,
                    quota,
                });
                return;
            }
            dispatchVerification({
                type: "verified-ready",
                message: "This email is verified in this browser. The PDF is ready to download.",
                email: quota.email,
                quota,
            });
        } catch (error) {
            setSimpleVerificationError("service-unavailable", error instanceof Error ? error.message : "The free payslip verification status could not be checked.");
        } finally {
            setCheckingVerification(false);
        }
    }, [setSimpleVerificationError]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY, JSON.stringify({ form, verificationEmail }));
        } catch {
            // Best-effort draft persistence only.
        }
    }, [form, verificationEmail]);

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
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            if ("focus" in element && typeof element.focus === "function") {
                element.focus();
            }
        });
    }, []);

    const validateForm = React.useCallback((focusFirstError: boolean) => {
        const nextErrors: FieldErrors = {};
        const ordinaryDaysWorked = parseNumber(form.ordinaryDaysWorked);
        const ordinaryHoursOverride = form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null;
        const confirmedSchedule = normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern);
        const hasEnteredHours = totalPremiumHours > 0 || parseNumber(form.shortShiftWorkedHours) > 0 || ordinaryHoursOverride !== null;

        if (!form.employerName.trim()) nextErrors.employerName = "Add the employer name.";
        if (!form.employerAddress.trim()) nextErrors.employerAddress = "Add the employer address.";
        if (!form.employeeName.trim()) nextErrors.employeeName = "Add the worker name.";
        if (!form.monthKey) nextErrors.monthKey = "Choose the payslip month.";
        else if (!isValidMonthKey(form.monthKey)) nextErrors.monthKey = "Choose a valid payslip month.";
        if (parseNumber(form.hourlyRate) < NMW_RATE) nextErrors.hourlyRate = `The hourly rate must be at least R${NMW_RATE.toFixed(2)}.`;
        if (!confirmedSchedule) nextErrors.ordinaryWorkPattern = "Choose the usual work week before continuing.";
        if (ordinaryDaysWorked < 0) nextErrors.ordinaryDaysWorked = "Normal work days cannot be negative.";
        else if (confirmedSchedule && ordinaryDaysWorked > ordinaryCalendar.ordinaryDayCap) nextErrors.ordinaryDaysWorked = `Normal work days cannot be more than ${ordinaryCalendar.ordinaryDayCap} this month.`;
        if (ordinaryDaysWorked === 0 && !hasEnteredHours) nextErrors.ordinaryDaysWorked = "Add normal days or paid hours first.";
        if (ordinaryHoursOverride !== null && ordinaryHoursOverride < 0) nextErrors.ordinaryHoursOverride = "Normal hours cannot be negative.";
        else if (ordinaryHoursOverride !== null && confirmedSchedule && ordinaryHoursOverride > ordinaryCalendar.ordinaryHourCap) nextErrors.ordinaryHoursOverride = `Normal hours cannot be more than ${ordinaryCalendar.ordinaryHourCap} this month.`;
        if (parseNumber(form.overtimeHours) < 0) nextErrors.overtimeHours = "Hours cannot be negative.";
        if (parseNumber(form.sundayHours) < 0) nextErrors.sundayHours = "Hours cannot be negative.";
        if (parseNumber(form.publicHolidayHours) < 0) nextErrors.publicHolidayHours = "Hours cannot be negative.";
        if (parseNumber(form.shortShiftCount) < 0) nextErrors.shortShiftCount = "Short shifts cannot be negative.";
        if (parseNumber(form.shortShiftWorkedHours) < 0) nextErrors.shortShiftWorkedHours = "Hours cannot be negative.";
        if (parseNumber(form.otherDeductions) < 0) nextErrors.otherDeductions = "Deductions cannot be negative.";

        setErrors(nextErrors);

        if (focusFirstError) {
            const orderedFields = Object.keys(form) as Array<keyof FreePayslipFormState>;
            const firstErrorField = orderedFields.find((field) => Boolean(nextErrors[field]));
            if (firstErrorField) {
                focusField(firstErrorField);
            }
        }

        return Object.keys(nextErrors).length === 0;
    }, [focusField, form, ordinaryCalendar.ordinaryDayCap, ordinaryCalendar.ordinaryHourCap, totalPremiumHours]);

    const sendVerificationLink = React.useCallback(async () => {
        const email = verificationEmail.trim().toLowerCase();
        if (!email) {
            setSimpleVerificationError("service-unavailable", "Enter the email address that should receive the unlock link.");
            return;
        }
        dispatchVerification({ type: "sending-link" });
        try {
            if (typeof window === "undefined") throw new Error("This browser could not prepare the verification link.");
            const next = buildFreePayslipVerificationHref("success");
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` },
            });
            if (error) throw error;
            dispatchVerification({ type: "waiting", message: `Unlock link sent. ${SAME_BROWSER_RECOVERY_MESSAGE}` });
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
        const valid = validateForm(true);
        if (!valid) return;
        if (!payload || !breakdown || !payrollSummary) {
            setSimpleVerificationError("service-unavailable", "Complete the required details first so the PDF can be prepared.");
            return;
        }
        if (verification.phase !== "verified-ready") {
            dispatchVerification({ type: "waiting", message: "Verify the email in this browser before downloading the PDF.", tone: "warning" });
            return;
        }

        setDownloading(true);
        try {
            const pdfBytes = await generatePayslipPdfBytes(payload.employee, payload.payslip, payload.settings, "en");
            const quotaResponse = await fetch("/api/free-payslip/quota", { method: "POST", cache: "no-store" });
            const quotaData = await quotaResponse.json() as QuotaStatus | { error?: string };
            if (!quotaResponse.ok) {
                if (quotaResponse.status === 409) {
                    dispatchVerification({
                        type: "quota-used",
                        message: typeof quotaData === "object" && quotaData && "error" in quotaData && typeof quotaData.error === "string"
                            ? quotaData.error
                            : "This verified email has already used its free PDF for this calendar month.",
                        email: verification.verifiedEmail,
                        quota: null,
                    });
                    return;
                }
                if (quotaResponse.status === 401) {
                    dispatchVerification({
                        type: "waiting",
                        message: `The verified session expired before the PDF was downloaded. ${SAME_BROWSER_RECOVERY_MESSAGE}`,
                        tone: "warning",
                    });
                    return;
                }
                throw new Error(quotaResponse.status >= 500
                    ? FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE
                    : typeof quotaData === "object" && quotaData && "error" in quotaData && typeof quotaData.error === "string"
                        ? quotaData.error
                        : "The free monthly quota could not be updated.");
            }
            downloadPdf(pdfBytes, getPayslipFilename(payload.employee, payload.payslip));
            const consumedQuota = quotaData as QuotaStatus;
            dispatchVerification({
                type: "success",
                message: "Payslip PDF downloaded successfully. This verified email has now used its free PDF for this calendar month.",
                email: consumedQuota.email,
                quota: consumedQuota,
            });
        } catch (error) {
            setSimpleVerificationError("service-unavailable", error instanceof Error ? error.message : "The PDF could not be generated.");
        } finally {
            setDownloading(false);
        }
    }, [breakdown, payload, payrollSummary, setSimpleVerificationError, validateForm, verification.phase, verification.verifiedEmail]);

    const shouldPromoteRecoveryAction = verification.phase === "waiting-for-verification" || verification.phase === "missing-session";
    const canRefreshVerification = verification.phase !== "idle" && verification.phase !== "sending-link";
    const showVerificationEmailInput = verification.phase !== "verified-ready" && verification.phase !== "success";
    const showDownloadButton = verification.phase === "verified-ready";
    const gateCardTitle = verification.phase === "sending-link"
        ? "Sending unlock link"
        : verification.phase === "waiting-for-verification"
            ? "Finish email unlock"
            : verification.phase === "verified-ready"
                ? "Ready to download"
                : verification.phase === "quota-used"
                    ? "Free PDF already used this month"
                    : verification.phase === "invalid-link"
                        ? "Unlock link invalid"
                        : verification.phase === "missing-session"
                            ? "Unlock not complete in this browser"
                            : verification.phase === "service-unavailable"
                                ? "Unlock service unavailable"
                                : verification.phase === "success"
                                    ? "PDF downloaded"
                                    : "Unlock the free PDF";
    const idleGateMessage = "Enter an email address to send the unlock link.";

    return (
        <section id="free-payslip-generator" data-testid="free-payslip-generator" className="mx-auto max-w-[78rem] scroll-mt-24">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-8">
                <div className="max-w-3xl space-y-3">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Fill in a few obvious details.</h2>
                    <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                        Add the month, normal work, and any extra hours. LekkerLedger works out normal pay, UIF, Sunday pay, and public holiday pay quietly in the background.
                    </p>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
                    <div className="space-y-6">
                        <SectionCard
                            eyebrow="Who this payslip is for"
                            title="Start with the basic details"
                            description="These are the details that appear on the payslip."
                        >
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

                            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
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
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Change worker role</p>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">Leave this as Domestic Worker unless the payslip needs a different role name.</p>
                                    </div>
                                    {showRoleOverride ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                </button>
                                {showRoleOverride ? (
                                    <div className="mt-4">
                                        <TextField id="free-worker-role" label="Worker role" error={errors.employeeRole}>
                                            <Input
                                                id="free-worker-role"
                                                value={form.employeeRole}
                                                onChange={(event) => updateField("employeeRole", event.target.value)}
                                                placeholder="Domestic Worker"
                                            />
                                        </TextField>
                                    </div>
                                ) : null}
                            </div>

                            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                <button
                                    type="button"
                                    onClick={() => setShowIdentityField((current) => !current)}
                                    className="flex w-full items-center justify-between gap-3 text-left"
                                >
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Worker ID or passport</p>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">Optional for the free tool. Add it only if you want it shown on the payslip.</p>
                                    </div>
                                    {showIdentityField ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                </button>
                                {showIdentityField ? (
                                    <div className="mt-4">
                                        <TextField id="free-worker-id" label="ID or passport number" error={errors.employeeId}>
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
                        </SectionCard>

                        <SectionCard
                            eyebrow="Hours worked this month"
                            title="Tell us the normal work and extra hours"
                            description="Keep it simple: usual work week, normal days, and any overtime, Sunday, or public holiday hours."
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Usual work week</p>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {[
                                            { key: "monday-to-friday" as const, label: "Monday to Friday", detail: "Saturday is not part of the usual week." },
                                            { key: "monday-to-saturday" as const, label: "Monday to Saturday", detail: "Saturday is part of the usual week." },
                                            { key: "custom" as const, label: "Custom days", detail: "Choose the exact normal weekdays below." },
                                        ].map((preset) => {
                                            const selected = schedulePreset === preset.key;
                                            return (
                                                <button
                                                    key={preset.key}
                                                    id={`free-schedule-preset-${preset.key}`}
                                                    type="button"
                                                    onClick={() => updateSchedulePreset(preset.key)}
                                                    className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    <p className="text-sm font-bold">{preset.label}</p>
                                                    <p className={`mt-1 text-sm leading-6 ${selected ? "text-white/88" : "text-[var(--text-muted)]"}`}>{preset.detail}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.ordinaryWorkPattern ? <p className="text-sm font-medium text-[var(--danger)]">{errors.ordinaryWorkPattern}</p> : null}
                                </div>

                                {schedulePreset === "custom" ? (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Custom normal weekdays</p>
                                        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Select the weekdays and Saturday that count as the worker&apos;s normal schedule.</p>
                                        <div className="mt-4">
                                            <OrdinaryWorkPatternPicker
                                                value={form.ordinaryWorkPattern}
                                                onChange={(nextPattern) => updateField("ordinaryWorkPattern", nextPattern)}
                                                hiddenDayKeys={["sunday"]}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Usual Sunday work</p>
                                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Does the worker usually work Sundays?</p>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => updateSundayBasis(false)}
                                            className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${!normalizedPattern.sunday ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                        >
                                            <p className="text-sm font-bold">No</p>
                                            <p className={`mt-1 text-sm leading-6 ${!normalizedPattern.sunday ? "text-white/88" : "text-[var(--text-muted)]"}`}>Sunday is occasional work.</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateSundayBasis(true)}
                                            className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${normalizedPattern.sunday ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                        >
                                            <p className="text-sm font-bold">Yes</p>
                                            <p className={`mt-1 text-sm leading-6 ${normalizedPattern.sunday ? "text-white/88" : "text-[var(--text-muted)]"}`}>Sunday is part of the usual schedule.</p>
                                        </button>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{sundayWorkHelp}</p>
                                </div>

                                <OrdinaryWorkCalendarSummaryCard
                                    summary={ordinaryCalendar}
                                    ordinaryHoursPerDay={ORDINARY_HOURS_PER_DAY}
                                    title="How this month's normal-work maximum was worked out"
                                />
                                <div className="grid gap-5 lg:grid-cols-2">
                                    <TextField
                                        id="free-ordinary-days"
                                        label="Normal days worked"
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

                                    <div className="space-y-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
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
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Normal hours override</p>
                                                <p className="mt-1 text-sm text-[var(--text-muted)]">Enter total normal hours instead if the month was not made up of full normal days.</p>
                                            </div>
                                            {showOrdinaryHoursOverride ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                        </button>
                                        {showOrdinaryHoursOverride ? (
                                            <TextField
                                                id="free-ordinary-hours"
                                                label="Normal hours worked"
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
                                                />
                                            </TextField>
                                        ) : (
                                            <p className="text-sm leading-6 text-[var(--text-muted)]">We will calculate normal hours from the normal days unless you open this.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-5 lg:grid-cols-3">
                                    <TextField id="free-overtime-hours" label="Overtime hours" hint="Paid separately." error={errors.overtimeHours}>
                                        <Input
                                            id="free-overtime-hours"
                                            type="number"
                                            min="0"
                                            value={form.overtimeHours}
                                            onChange={(event) => updateField("overtimeHours", event.target.value)}
                                        />
                                    </TextField>
                                    <TextField id="free-sunday-hours" label="Sunday hours" hint={reviewSundayBasis} error={errors.sundayHours}>
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
                                        hint="Only enter hours actually worked on a South African public holiday."
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

                                <div data-testid="free-payslip-optional-adjustments" className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowOptionalAdjustments((current) => !current)}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Optional adjustments</p>
                                            <p className="mt-1 text-sm text-[var(--text-muted)]">Use this only for agreed deductions or short shifts under four hours.</p>
                                        </div>
                                        {showOptionalAdjustments ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                    </button>
                                    {showOptionalAdjustments ? (
                                        <div className="mt-4 grid gap-5 lg:grid-cols-2">
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
                                            <div className="space-y-4">
                                                <TextField id="free-short-shifts" label="Short shifts under four hours" error={errors.shortShiftCount}>
                                                    <Input
                                                        id="free-short-shifts"
                                                        type="number"
                                                        min="0"
                                                        value={form.shortShiftCount}
                                                        onChange={(event) => updateField("shortShiftCount", event.target.value)}
                                                    />
                                                </TextField>
                                                <TextField id="free-short-shift-hours" label="Hours worked across those short shifts" error={errors.shortShiftWorkedHours}>
                                                    <Input
                                                        id="free-short-shift-hours"
                                                        type="number"
                                                        min="0"
                                                        value={form.shortShiftWorkedHours}
                                                        onChange={(event) => updateField("shortShiftWorkedHours", event.target.value)}
                                                    />
                                                </TextField>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    <aside className="xl:sticky xl:top-24 xl:self-start">
                        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <div className="space-y-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Payslip summary and download</p>
                                <h3 className="font-serif text-2xl font-bold text-[var(--text)]">See the result without extra admin.</h3>
                                <p className="text-sm leading-7 text-[var(--text-muted)]">Outcomes first. The detailed breakdown stays secondary unless you want to open it.</p>
                            </div>

                            <div className="mt-6 space-y-5">
                                {breakdown && payrollSummary ? (
                                    <div className="space-y-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <SummaryRow label="Gross pay" value={`R ${payrollSummary.grossPay.toFixed(2)}`} accent />
                                        <SummaryRow label="Employee UIF deduction" value={`R ${payrollSummary.employeeUifDeduction.toFixed(2)}`} />
                                        <SummaryRow label="Net pay to worker" value={`R ${payrollSummary.netPayToEmployee.toFixed(2)}`} accent />
                                        <SummaryRow label="Employer UIF contribution" value={`R ${payrollSummary.employerUifContribution.toFixed(2)}`} />
                                        <SummaryRow label="Employer total cost" value={`R ${payrollSummary.employerTotalCost.toFixed(2)}`} accent />
                                    </div>
                                ) : (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-7 text-[var(--text-muted)]">
                                        Add the month, usual work week, rate, and hours to see the figures here.
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
                                                <p className="text-sm font-semibold text-[var(--text)]">Detailed pay breakdown</p>
                                                <p className="mt-1 text-sm text-[var(--text-muted)]">Open this only if you want to see how the totals were built.</p>
                                            </div>
                                            {showSummaryDetails ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                        </button>
                                        {showSummaryDetails ? (
                                            <div className="mt-4 space-y-4">
                                                <div className="space-y-2">
                                                    <SummaryRow label={`Normal pay (${breakdown.effectiveOrdinaryHours}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                                                    {breakdown.overtimePay > 0 ? <SummaryRow label={`Overtime (${calculationInput?.overtimeHours ?? 0}h)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} /> : null}
                                                    {breakdown.sundayPay > 0 ? <SummaryRow label={`Sunday (${calculationInput?.sundayHours ?? 0}h)`} value={`R ${breakdown.sundayPay.toFixed(2)}`} /> : null}
                                                    {breakdown.publicHolidayPay > 0 ? <SummaryRow label={`Public holiday (${calculationInput?.publicHolidayHours ?? 0}h)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} /> : null}
                                                    {breakdown.topUps.fourHourMinimumHours > 0 ? <SummaryRow label="Short-shift top-up already included" value={`${breakdown.topUps.fourHourMinimumHours}h`} /> : null}
                                                    <SummaryRow label="Other deductions" value={`R ${breakdown.deductions.other.toFixed(2)}`} />
                                                    <SummaryRow label="Sunday basis" value={reviewSundayBasis} />
                                                    <SummaryRow label="Payslip month" value={format(monthBounds.end, "MMMM yyyy")} />
                                                </div>
                                                <OrdinaryWorkCalendarSummaryCard
                                                    summary={ordinaryCalendar}
                                                    ordinaryHoursPerDay={ORDINARY_HOURS_PER_DAY}
                                                    title="How the normal-work maximum was checked"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div data-testid={`free-payslip-gate-${verification.phase}`} className={`rounded-[1.25rem] border p-4 ${getNoticeStyles(verification.tone)}`}>
                                    <div className="space-y-4">
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
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{gateCardTitle}</p>
                                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{FREE_PAYSLIP_RULE_MESSAGE}</p>
                                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{verification.message || idleGateMessage}</p>
                                            </div>
                                        </div>

                                        {showVerificationEmailInput ? (
                                            <TextField id="free-verification-email" label="Email for the unlock link">
                                                <Input
                                                    id="free-verification-email"
                                                    type="email"
                                                    value={verificationEmail}
                                                    onChange={(event) => setVerificationEmail(event.target.value)}
                                                    placeholder="name@example.com"
                                                />
                                            </TextField>
                                        ) : null}

                                        {showDownloadButton ? (
                                            <div className="space-y-3">
                                                <Button
                                                    type="button"
                                                    size="lg"
                                                    onClick={() => void handleDownload()}
                                                    disabled={downloading}
                                                    className="w-full gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                >
                                                    {downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                    Download PDF
                                                </Button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleUseDifferentEmail()}
                                                    className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                                                >
                                                    Use a different email
                                                </button>
                                            </div>
                                        ) : verification.phase === "success" ? (
                                            <button
                                                type="button"
                                                onClick={() => void handleUseDifferentEmail()}
                                                className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                                            >
                                                Use a different email
                                            </button>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                <Button
                                                    type="button"
                                                    onClick={() => void sendVerificationLink()}
                                                    disabled={verification.phase === "sending-link"}
                                                    className="w-full gap-2"
                                                >
                                                    {verification.phase === "sending-link" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                                    Send unlock link
                                                </Button>
                                                {shouldPromoteRecoveryAction ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => void refreshVerification("manual")}
                                                        disabled={checkingVerification || !canRefreshVerification}
                                                        className="w-full gap-2"
                                                    >
                                                        {checkingVerification ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                        I opened the link in this browser
                                                    </Button>
                                                ) : null}
                                                {(verification.phase === "service-unavailable" || verification.phase === "invalid-link") && verificationEmail ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleUseDifferentEmail()}
                                                        className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                                                    >
                                                        Use a different email
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}

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
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    );
}
