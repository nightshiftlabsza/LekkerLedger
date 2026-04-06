import { z } from "zod";
import { NMW_RATE } from "./calculator";
import { type OrdinaryWorkPattern, normalizeOrdinaryWorkPattern } from "./ordinary-work-pattern";
import { describeOrdinaryWorkCalendar } from "./payroll-calendar";
import { getMonthBounds, getMonthKey, normalizePayslipDraftToInput } from "./payslip-draft";
import type { Employee, EmployerSettings, PayslipInput } from "./schema";

export type FreePayslipFormState = {
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

export type FreePayslipFieldErrors = Partial<Record<keyof FreePayslipFormState, string>>;

export type SavedFreePayslipDraft = {
    form: FreePayslipFormState;
    email: string;
    marketingConsent: boolean;
};

export type OrdinaryWorkPreset = "monday-to-friday" | "monday-to-saturday" | "custom";

export const ORDINARY_HOURS_PER_DAY = 8;
export const FREE_PAYSLIP_DRAFT_STORAGE_KEY = "free-payslip-simple-draft-v1";
export const FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE = "The free payslip service is temporarily unavailable. Please try again in a moment.";
export const FREE_PAYSLIP_RULE_MESSAGE = "One free payslip email per email address each calendar month.";

const StringFormSchema = z.object({
    employerName: z.string(),
    employerAddress: z.string(),
    employeeName: z.string(),
    employeeId: z.string(),
    employeeRole: z.string(),
    hourlyRate: z.string(),
    monthKey: z.string(),
    ordinaryDaysWorked: z.string(),
    ordinaryHoursOverride: z.string(),
    overtimeHours: z.string(),
    sundayHours: z.string(),
    publicHolidayHours: z.string(),
    shortShiftCount: z.string(),
    shortShiftWorkedHours: z.string(),
    otherDeductions: z.string(),
});

export const FreePayslipRequestSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    marketingConsent: z.boolean().optional(),
    form: z.object({
        employerName: z.string(),
        employerAddress: z.string(),
        employeeName: z.string(),
        employeeId: z.string(),
        employeeRole: z.string(),
        hourlyRate: z.string(),
        monthKey: z.string(),
        ordinaryDaysWorked: z.string(),
        ordinaryHoursOverride: z.string(),
        overtimeHours: z.string(),
        sundayHours: z.string(),
        publicHolidayHours: z.string(),
        shortShiftCount: z.string(),
        shortShiftWorkedHours: z.string(),
        otherDeductions: z.string(),
        ordinaryWorkPattern: z.record(z.string(), z.unknown()),
    }),
});

function parseNumber(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function isValidMonthKey(monthKey: string) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return false;
    const { start, end } = getMonthBounds(monthKey);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
}

export function buildPatternFromPreset(preset: OrdinaryWorkPreset, sunday: boolean): OrdinaryWorkPattern {
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

export function getPresetFromPattern(pattern: OrdinaryWorkPattern | null | undefined): OrdinaryWorkPreset {
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

export function buildDefaultFreePayslipFormState(): FreePayslipFormState {
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

export function sanitizeSavedFreePayslipDraft(rawDraft: unknown): SavedFreePayslipDraft {
    const defaults = buildDefaultFreePayslipFormState();
    const raw = rawDraft && typeof rawDraft === "object"
        ? rawDraft as {
            form?: Partial<Record<keyof FreePayslipFormState, unknown>>;
            email?: unknown;
            marketingConsent?: unknown;
            verificationEmail?: unknown;
        }
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
                (nextForm as Record<string, string | OrdinaryWorkPattern>)[key] = value;
            }
        }
    }

    if (!isValidMonthKey(nextForm.monthKey)) {
        nextForm.monthKey = defaults.monthKey;
    }

    const savedEmail = typeof raw.email === "string"
        ? raw.email
        : typeof raw.verificationEmail === "string"
            ? raw.verificationEmail
            : "";

    return {
        form: nextForm,
        email: savedEmail,
        marketingConsent: raw.marketingConsent === true,
    };
}

export function normalizeFreePayslipFormState(rawForm: unknown): FreePayslipFormState {
    const defaults = buildDefaultFreePayslipFormState();
    const parsedStrings = StringFormSchema.safeParse(rawForm);
    const normalizedPattern = rawForm && typeof rawForm === "object"
        ? normalizeOrdinaryWorkPattern((rawForm as { ordinaryWorkPattern?: Partial<OrdinaryWorkPattern> }).ordinaryWorkPattern)
        : undefined;

    if (!parsedStrings.success) {
        return {
            ...defaults,
            ordinaryWorkPattern: normalizedPattern ?? defaults.ordinaryWorkPattern,
        };
    }

    return {
        ...defaults,
        ...parsedStrings.data,
        ordinaryWorkPattern: normalizedPattern ?? defaults.ordinaryWorkPattern,
    };
}

export function buildFreePayslipCalculationInput(form: FreePayslipFormState): PayslipInput | null {
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

export function buildFreePayslipPayload(form: FreePayslipFormState): {
    employee: Employee;
    payslip: PayslipInput;
    settings: EmployerSettings;
} | null {
    const normalizedPattern = normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern);
    const payslip = buildFreePayslipCalculationInput(form);
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

export function validateFreePayslipForm(form: FreePayslipFormState): FreePayslipFieldErrors {
    const nextErrors: FreePayslipFieldErrors = {};
    const ordinaryDaysWorked = parseNumber(form.ordinaryDaysWorked);
    const ordinaryHoursOverride = form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null;
    const confirmedSchedule = normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern);
    const totalPremiumHours = parseNumber(form.overtimeHours) + parseNumber(form.sundayHours) + parseNumber(form.publicHolidayHours);
    const hasEnteredHours = totalPremiumHours > 0 || parseNumber(form.shortShiftWorkedHours) > 0 || ordinaryHoursOverride !== null;

    const monthKey = isValidMonthKey(form.monthKey) ? form.monthKey : getMonthKey(new Date());
    const { start, end } = getMonthBounds(monthKey);
    const ordinaryCalendar = describeOrdinaryWorkCalendar(
        start,
        end,
        confirmedSchedule ?? buildPatternFromPreset("monday-to-friday", false),
        ORDINARY_HOURS_PER_DAY,
    );

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

    return nextErrors;
}
