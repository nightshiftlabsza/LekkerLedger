/**
 * Payslip schemas — define the "shape" of your data here.
 *
 * Zod validates data at runtime so you catch bad inputs early,
 * for example when reading form data or API responses.
 *
 * Usage:
 *   import { PayslipSchema } from "@/lib/schemas/payslip";
 *   const result = PayslipSchema.safeParse(someData);
 *   if (!result.success) console.error(result.error);
 */

import { z } from "zod";

/** Schema for a single payslip entry */
export const PayslipSchema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  idNumber: z
    .string()
    .length(13, "SA ID number must be 13 digits")
    .regex(/^\d+$/, "ID number must contain only digits"),
  grossSalary: z.number().positive("Gross salary must be positive"),
  taxPeriod: z.enum(["monthly", "weekly", "fortnightly"]),
});

/** TypeScript type inferred from the schema — keeps types & validation in sync */
export type Payslip = z.infer<typeof PayslipSchema>;
