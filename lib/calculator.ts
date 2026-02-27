import { Employee, PayslipInput } from "./schema";

export const NMW_RATE = 30.23;
export const UIF_THRESHOLD_HOURS = 24;
export const UIF_CAP_MONTHLY = 17712;
export const UIF_RATE = 0.01; // 1% employee, 1% employer

export interface PayslipBreakdown {
  grossPay: number;
  ordinaryPay: number;
  overtimePay: number;
  sundayPay: number;
  publicHolidayPay: number;

  deductions: {
    uifEmployee: number;
    accommodation?: number;
    other: number;
    total: number;
  };

  employerContributions: {
    uifEmployer: number;
  };

  netPay: number;
  totalHours: number;
}

/**
 * Ensures compliance with the 4-hour rule (BCEA)
 * If > 0 and < 4, counts as 4.
 */
function apply4HourRule(hours: number): number {
  if (hours > 0 && hours < 4) return 4;
  return hours;
}

export function calculatePayslip(input: PayslipInput): PayslipBreakdown {
  // 1. Calculate base hours (applying 4-hour rule where applicable is tricky because
  // the rule applies per *day*, not per month. We assume input hours are already adjusted per day
  // but let's leave the helper in case we build a daily timesheet later.)

  const ordinaryRate = Math.max(input.hourlyRate, NMW_RATE);

  // 2. Earnings
  const ordinaryPay = input.ordinaryHours * ordinaryRate;
  const overtimePay = input.overtimeHours * (ordinaryRate * 1.5);
  const sundayPay = input.sundayHours * (ordinaryRate * 2.0);
  const publicHolidayPay = input.publicHolidayHours * (ordinaryRate * 2.0);

  const grossPay = ordinaryPay + overtimePay + sundayPay + publicHolidayPay;
  const totalHours =
    input.ordinaryHours +
    input.overtimeHours +
    input.sundayHours +
    input.publicHolidayHours;

  // 3. UIF Calculation (Only if > 24 hours in month)
  let uifAmount = 0;
  if (totalHours > UIF_THRESHOLD_HOURS) {
    const uifBase = Math.min(grossPay, UIF_CAP_MONTHLY);
    uifAmount = uifBase * UIF_RATE;
  }

  // 4. Accommodation Deduction (Max 10% of gross)
  let calcAccommodation = 0;
  if (input.includeAccommodation) {
    calcAccommodation = grossPay * 0.1;
  }

  // 5. Totals
  const totalDeductions = uifAmount + calcAccommodation + input.otherDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    grossPay,
    ordinaryPay,
    overtimePay,
    sundayPay,
    publicHolidayPay,
    deductions: {
      uifEmployee: uifAmount,
      accommodation: calcAccommodation,
      other: input.otherDeductions,
      total: totalDeductions,
    },
    employerContributions: {
      uifEmployer: uifAmount,
    },
    netPay,
    totalHours,
  };
}
