import { z } from "zod";

export const EmployeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  idNumber: z.string().optional(),
  hourlyRate: z
    .number()
    .min(30.23, "Hourly rate cannot be below National Minimum Wage (R30.23)"),
  role: z.string().default("Domestic Worker"),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const PayslipSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  payPeriodStart: z.date(),
  payPeriodEnd: z.date(),

  // Hours
  ordinaryHours: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).default(0),
  sundayHours: z.number().min(0).default(0),
  publicHolidayHours: z.number().min(0).default(0),

  // Rates (snapshot at time of payslip)
  hourlyRate: z.number().min(30.23),

  // Deductions
  includeAccommodation: z.boolean().default(false),
  otherDeductions: z.number().min(0).default(0),

  createdAt: z.date(),
});

export type PayslipInput = z.infer<typeof PayslipSchema>;
