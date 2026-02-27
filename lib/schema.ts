import { z } from "zod";

export const NMW_DOMESTIC = 30.23; // SD7 NMW as of March 2025

export const EmployeeSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2, "Full name required (at least 2 characters)"),
    idNumber: z.string().optional().default(""),
    role: z.string().min(1, "Role is required").default("Domestic Worker"),
    hourlyRate: z
        .number()
        .min(NMW_DOMESTIC, `Hourly rate must be at least R${NMW_DOMESTIC} (National Minimum Wage)`),
    phone: z.string().optional().default(""),
    startDate: z.string().optional().default(""), // ISO date string — when employment began
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const PayslipInputSchema = z.object({
    id: z.string(),
    employeeId: z.string(),
    payPeriodStart: z.date(),
    payPeriodEnd: z.date(),
    ordinaryHours: z.number().min(0),
    overtimeHours: z.number().min(0).default(0),
    sundayHours: z.number().min(0).default(0),
    publicHolidayHours: z.number().min(0).default(0),
    daysWorked: z.number().min(1).default(1),
    hourlyRate: z
        .number()
        .min(NMW_DOMESTIC, `Hourly rate must be at least R${NMW_DOMESTIC} (National Minimum Wage)`),
    includeAccommodation: z.boolean().default(false),
    accommodationCost: z.number().min(0).optional(),
    otherDeductions: z.number().min(0).default(0),
    createdAt: z.date(),
    // Phase 1: Leave tracking per payslip
    annualLeaveTaken: z.number().min(0).default(0),
    sickLeaveTaken: z.number().min(0).default(0),
    familyLeaveTaken: z.number().min(0).default(0),
});

// Legacy alias kept for backward compat
export const PayslipSchema = PayslipInputSchema;

export type PayslipInput = z.infer<typeof PayslipInputSchema>;

// ─── Leave Record (Phase 1) ─────────────────────────────────────────────────
export type LeaveType = "annual" | "sick" | "family";

export const LeaveRecordSchema = z.object({
    id: z.string(),
    employeeId: z.string(),
    type: z.enum(["annual", "sick", "family"]),
    days: z.number().positive(),
    date: z.string(), // ISO date of leave taken
    payslipId: z.string().optional(), // link to payslip that logged it
    note: z.string().optional().default(""),
});

export type LeaveRecord = z.infer<typeof LeaveRecordSchema>;

// ─── Employer Settings (Phase 5) ─────────────────────────────────────────────
export const EmployerSettingsSchema = z.object({
    employerName: z.string().default(""),
    employerAddress: z.string().default(""),
    employerIdNumber: z.string().default(""),
    uifRefNumber: z.string().default(""), // uFiling reference number
    sdlNumber: z.string().default(""),
    proStatus: z.enum(["free", "annual", "pro", "trial"]).optional().default("free"),
    trialExpiry: z.string().optional(),
    logoData: z.string().optional(),
});

export type EmployerSettings = z.infer<typeof EmployerSettingsSchema>;
