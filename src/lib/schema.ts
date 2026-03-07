import { z } from "zod";
import { getNMW } from "./calculator";
import { getNMWForDate } from "./legal/registry";
import { getEmployeeIdValidationMessage, normalizeEmployeeIdNumber } from "./employee-id";

export const NMW_DOMESTIC = getNMW(); // SD7 NMW as of current date

export const EmployeeSchema = z.object({
    id: z.string().uuid(),
    householdId: z.string().default("default"),
    name: z.string().min(2, "Full name required (at least 2 characters)"),
    idNumber: z.string().optional().default("").transform((value) => normalizeEmployeeIdNumber(value ?? "")),
    role: z.string().min(1, "Role is required").default("Domestic Worker"),
    hourlyRate: z.number().positive("Hourly rate must be greater than 0"),
    phone: z.string().optional().default(""),
    startDate: z.string().optional().default(""), // ISO date string - when employment began
    ordinarilyWorksSundays: z.boolean().default(false),
    ordinaryHoursPerDay: z.number().min(1).max(24).default(8),
    frequency: z.enum(["Weekly", "Fortnightly", "Monthly"]).default("Monthly"),
}).superRefine((employee, ctx) => {
    const referenceDate = employee.startDate ? new Date(employee.startDate) : new Date();
    const nmwDate = Number.isNaN(referenceDate.getTime()) ? new Date() : referenceDate;
    const minimumRate = getNMWForDate(nmwDate);

    if (employee.hourlyRate < minimumRate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hourlyRate"],
            message: "Hourly rate must be at least the National Minimum Wage for the employee start date.",
        });
    }

    const idNumberMessage = getEmployeeIdValidationMessage(employee.idNumber || "");
    if (idNumberMessage) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["idNumber"],
            message: idNumberMessage,
        });
    }
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const PayslipInputSchema = z.object({
    id: z.string(),
    householdId: z.string().default("default"),
    employeeId: z.string(),
    payPeriodStart: z.coerce.date(),
    payPeriodEnd: z.coerce.date(),
    ordinaryHours: z.number().min(0),
    overtimeHours: z.number().min(0).default(0),
    sundayHours: z.number().min(0).default(0),
    publicHolidayHours: z.number().min(0).default(0),
    daysWorked: z.number().min(0).default(0),
    shortFallHours: z.number().min(0).default(0),
    hourlyRate: z.number().positive("Hourly rate must be greater than 0"),
    includeAccommodation: z.boolean().default(false),
    accommodationCost: z.number().min(0).optional(),
    otherDeductions: z.number().min(0).default(0),
    createdAt: z.date(),
    ordinarilyWorksSundays: z.boolean().default(false),
    ordinaryHoursPerDay: z.number().min(1).max(24).default(8),
    // Phase 1: Leave tracking per payslip
    annualLeaveTaken: z.number().min(0).default(0),
    sickLeaveTaken: z.number().min(0).default(0),
    familyLeaveTaken: z.number().min(0).default(0),
}).superRefine((payslip, ctx) => {
    const referenceDate = new Date(payslip.payPeriodEnd);
    const nmwDate = Number.isNaN(referenceDate.getTime()) ? new Date() : referenceDate;
    const minimumRate = getNMWForDate(nmwDate);

    if (payslip.hourlyRate < minimumRate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hourlyRate"],
            message: "Hourly rate must be at least the National Minimum Wage for this pay period.",
        });
    }

    if (payslip.ordinaryHours > 0 && payslip.daysWorked === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["daysWorked"],
            message: "Days worked must be greater than 0 when ordinary hours are recorded.",
        });
    }
});

// Legacy alias kept for backward compat
export const PayslipSchema = PayslipInputSchema;

export type PayslipInput = z.infer<typeof PayslipInputSchema>;

export const DEFAULT_LEAVE_TYPE_IDS = ["annual", "sick", "family"] as const;

export type DefaultLeaveType = typeof DEFAULT_LEAVE_TYPE_IDS[number];
export type LeaveType = string;

export const LeaveAllocationSchema = z.object({
    source: z.enum(["carry-over", "current-cycle"]),
    days: z.number().positive(),
    fromCycleEnd: z.string().optional(),
    cycleStart: z.string().optional(),
    cycleEnd: z.string().optional(),
});

export type LeaveAllocation = z.infer<typeof LeaveAllocationSchema>;

export const CustomLeaveTypeSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(40),
    annualAllowance: z.number().min(0).optional(),
    isPaid: z.boolean().default(true),
    note: z.string().max(200).default(""),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CustomLeaveType = z.infer<typeof CustomLeaveTypeSchema>;

export const LeaveRecordSchema = z.object({
    id: z.string(),
    householdId: z.string().default("default"),
    employeeId: z.string(),
    type: z.string().min(1),
    days: z.number().positive(),
    date: z.string(), // ISO date of leave taken (legacy start date alias)
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    exceedsAllowance: z.boolean().optional(),
    payslipId: z.string().optional(), // link to payslip that logged it
    typeLabel: z.string().optional(),
    isCustomType: z.boolean().optional(),
    paid: z.boolean().optional(),
    allocations: z.array(LeaveAllocationSchema).optional(),
    note: z.string().optional().default(""),
});

export type LeaveRecord = z.infer<typeof LeaveRecordSchema>;

export const LeaveCarryOverSchema = z.object({
    id: z.string(),
    householdId: z.string().default("default"),
    employeeId: z.string(),
    fromCycleEnd: z.string(),
    daysCarried: z.number().min(0),
    daysUsedFromCarry: z.number().min(0).default(0),
});

export type LeaveCarryOver = z.infer<typeof LeaveCarryOverSchema>;

// Employer Settings (Phase 5)
export const EmployerSettingsSchema = z.object({
    employerName: z.string().default(""),
    employerAddress: z.string().default(""),
    employerIdNumber: z.string().default(""),
    uifRefNumber: z.string().default(""), // uFiling reference number
    cfNumber: z.string().default(""), // COIDA reference number
    sdlNumber: z.string().default(""),
    phone: z.string().default(""), // Employer contact phone
    proStatus: z.enum(["free", "standard", "pro", "trial", "annual", "lifetime"]).optional().default("free"),
    paidUntil: z.string().optional(),
    trialExpiry: z.string().optional(),
    billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
    activeHouseholdId: z.string().default("default"),
    logoData: z.string().optional(),
    defaultLanguage: z.enum(["en", "zu", "xh"]).optional().default("en"),
    simpleMode: z.boolean().default(false),
    advancedMode: z.boolean().default(false),
    density: z.enum(["comfortable", "compact"]).default("comfortable"),
    googleSyncEnabled: z.boolean().default(false),
    autoBackupEnabled: z.boolean().default(false),
    lastBackupTimestamp: z.string().optional(),
    googleAuthToken: z.string().optional(),
    piiObfuscationEnabled: z.boolean().default(true),
    installationId: z.string().default(""),
    usageHistory: z.array(z.string()).default([]),
    customLeaveTypes: z.array(CustomLeaveTypeSchema).default([]),
});

export type EmployerSettings = z.infer<typeof EmployerSettingsSchema>;

// Household
export const HouseholdSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Household name required"),
    createdAt: z.string(), // ISO date
});

export type Household = z.infer<typeof HouseholdSchema>;

// Employee Entry (per-employee within a pay period)
export type EmployeeEntryStatus = "empty" | "partial" | "complete" | "blocked";

export const EmployeeEntrySchema = z.object({
    employeeId: z.string(),
    ordinaryHours: z.number().min(0).default(0),
    overtimeHours: z.number().min(0).default(0),
    sundayHours: z.number().min(0).default(0),
    publicHolidayHours: z.number().min(0).default(0),
    leaveDays: z.number().min(0).default(0),
    advanceAmount: z.number().min(0).default(0),
    otherDeductions: z.number().min(0).default(0),
    rateOverride: z.number().optional(),
    note: z.string().optional().default(""),
    status: z.enum(["empty", "partial", "complete", "blocked"]).default("empty"),
});

export type EmployeeEntry = z.infer<typeof EmployeeEntrySchema>;

// Pay Period
export type PayPeriodStatus = "draft" | "review" | "locked";

export const PayPeriodSchema = z.object({
    id: z.string(),
    householdId: z.string().default("default"),
    name: z.string(), // e.g. "March 2026"
    startDate: z.string(), // ISO date
    endDate: z.string(), // ISO date
    payDate: z.string().optional(), // ISO date
    status: z.enum(["draft", "review", "locked"]).default("draft"),
    entries: z.array(EmployeeEntrySchema).default([]),
    lockedAt: z.string().optional(), // ISO date
    createdAt: z.string(), // ISO date
    updatedAt: z.string(), // ISO date
});

export type PayPeriod = z.infer<typeof PayPeriodSchema>;

// Document Metadata
export const DocumentMetaSchema = z.object({
    id: z.string(),
    householdId: z.string().default("default"),
    type: z.enum(["payslip", "contract", "export", "archive"]),
    employeeId: z.string().optional(),
    periodId: z.string().optional(),
    fileName: z.string(),
    mimeType: z.string().optional(),
    source: z.enum(["generated", "uploaded"]).optional().default("generated"),
    vaultCategory: z.enum(["contracts", "employee-docs", "compliance", "other"]).optional(),
    sizeBytes: z.number().optional(),
    createdAt: z.string(), // ISO date
    driveFileId: z.string().optional(),
});

export type DocumentMeta = z.infer<typeof DocumentMetaSchema>;

// Contract (Phase 8)
export const ContractSchema = z.object({
    id: z.string().uuid(),
    householdId: z.string().default("default"),
    employeeId: z.string().uuid(),
    status: z.enum(["draft", "active", "replaced"]).default("draft"),
    version: z.number().default(1),
    signedAt: z.string().optional(), // ISO date
    effectiveDate: z.string(), // ISO date
    jobTitle: z.string(),
    placeOfWork: z.string().default(""),
    duties: z.array(z.string()).default([]),
    workingHours: z.object({
        daysPerWeek: z.number().default(5),
        startAt: z.string().default("08:00"),
        endAt: z.string().default("17:00"),
        breakDuration: z.number().default(60), // in minutes
    }),
    salary: z.object({
        amount: z.number(),
        frequency: z.enum(["Weekly", "Fortnightly", "Monthly"]),
    }),
    leave: z.object({
        annualDays: z.number().default(21),
        sickDays: z.number().default(30), // per 3-year cycle usually, but simplified
    }),
    terms: z.object({
        accommodationProvided: z.boolean().default(false),
        accommodationDetails: z.string().default(""),
        overtimeAgreement: z.string().default("Overtime must be agreed in advance and paid according to the BCEA."),
        sundayHolidayAgreement: z.string().default("Sunday and public-holiday work must be agreed and paid at the correct rate."),
        noticeClause: z.string().default("Notice periods follow the BCEA and should be given in writing."),
        lawyerReviewAcknowledged: z.boolean().default(false),
    }).default({
        accommodationProvided: false,
        accommodationDetails: "",
        overtimeAgreement: "Overtime must be agreed in advance and paid according to the BCEA.",
        sundayHolidayAgreement: "Sunday and public-holiday work must be agreed and paid at the correct rate.",
        noticeClause: "Notice periods follow the BCEA and should be given in writing.",
        lawyerReviewAcknowledged: false,
    }),
    createdAt: z.string(), // ISO date
    updatedAt: z.string(), // ISO date
});

export type Contract = z.infer<typeof ContractSchema>;

// Audit Log
export const AuditLogSchema = z.object({
    id: z.string().uuid(),
    timestamp: z.date(),
    action: z.enum([
        "CREATE_PAYSLIP", "DELETE_PAYSLIP",
        "CREATE_EMPLOYEE", "DELETE_EMPLOYEE",
        "CREATE_LEAVE_RECORD", "DELETE_LEAVE_RECORD",
        "UPDATE_SETTINGS", "SYNC_DRIVE",
        "CREATE_PAY_PERIOD", "LOCK_PAY_PERIOD", "DELETE_PAY_PERIOD",
        "EXPORT_UFILING", "EXPORT_ROE", "EXPORT_COIDA", "EXPORT_DATA", "IMPORT_DATA", "DELETE_ALL_DATA",
        "SWITCH_HOUSEHOLD",
        "CREATE_CONTRACT", "UPDATE_CONTRACT",
    ]),
    details: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;


