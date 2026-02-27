import { test, expect } from "vitest";
import { calculatePayslip } from "../lib/calculator";
import { z } from "zod";

test("Calculates simple ordinary pay correctly", () => {
  const input = {
    id: "mock",
    employeeId: "emp",
    payPeriodStart: new Date(),
    payPeriodEnd: new Date(),
    ordinaryHours: 40,
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    hourlyRate: 50,
    includeAccommodation: false,
    otherDeductions: 0,
    createdAt: new Date(),
  };

  const result = calculatePayslip(input);
  expect(result.grossPay).toBe(2000); // 40 * 50
  expect(result.deductions.uifEmployee).toBe(20); // 1% of 2000
  expect(result.netPay).toBe(1980);
});

test("Applies National Minimum Wage guardrail during calculations", () => {
  const input = {
    id: "mock",
    employeeId: "emp",
    payPeriodStart: new Date(),
    payPeriodEnd: new Date(),
    ordinaryHours: 10,
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    hourlyRate: 20, // Less than NMW 30.23
    includeAccommodation: false,
    otherDeductions: 0,
    createdAt: new Date(),
  };

  const result = calculatePayslip(input);
  expect(result.grossPay).toBeCloseTo(302.3); // 10 * 30.23
  expect(result.deductions.uifEmployee).toBe(0); // < 24 hours
});

test("Overtime and Sunday pay rates are correct", () => {
  const input = {
    id: "mock",
    employeeId: "emp",
    payPeriodStart: new Date(),
    payPeriodEnd: new Date(),
    ordinaryHours: 40, // 40 * 50 = 2000
    overtimeHours: 10, // 10 * (50 * 1.5) = 750
    sundayHours: 5, // 5 * (50 * 2) = 500
    publicHolidayHours: 0,
    hourlyRate: 50,
    includeAccommodation: false,
    otherDeductions: 0,
    createdAt: new Date(),
  };

  const result = calculatePayslip(input);
  expect(result.grossPay).toBe(3250);
  expect(result.deductions.uifEmployee).toBe(32.5); // 1%
});

test("UIF is capped at R17712 monthly base", () => {
  const input = {
    id: "mock",
    employeeId: "emp",
    payPeriodStart: new Date(),
    payPeriodEnd: new Date(),
    ordinaryHours: 200, // 200 * 200 = 40000 Gross
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    hourlyRate: 200,
    includeAccommodation: false,
    otherDeductions: 0,
    createdAt: new Date(),
  };

  const result = calculatePayslip(input);
  expect(result.grossPay).toBe(40000);
  expect(result.deductions.uifEmployee).toBe(177.12); // Capped at 1% of 17712
});

test("No UIF charged if hours is 24 or less", () => {
  const input = {
    id: "mock",
    employeeId: "emp",
    payPeriodStart: new Date(),
    payPeriodEnd: new Date(),
    ordinaryHours: 24, // EXACTLY 24
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    hourlyRate: 50,
    includeAccommodation: false,
    otherDeductions: 0,
    createdAt: new Date(),
  };

  const result = calculatePayslip(input);
  expect(result.deductions.uifEmployee).toBe(0);
});

test("Accommodation deduction defaults to max 10% of gross", () => {
  const input = {
    id: "mock",
    employeeId: "emp",
    payPeriodStart: new Date(),
    payPeriodEnd: new Date(),
    ordinaryHours: 100, // 100 * 50 = 5000 Gross
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    hourlyRate: 50,
    includeAccommodation: true,
    otherDeductions: 0,
    createdAt: new Date(),
  };

  const result = calculatePayslip(input);
  expect(result.deductions.accommodation).toBe(500); // 10% of 5000
  expect(result.netPay).toBe(5000 - 500 - 50); // gross - accom - uif
});
