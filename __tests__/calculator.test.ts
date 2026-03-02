import { describe, it, expect } from "vitest";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";
import { PayslipInput } from "@/lib/schema";

describe("Calculation Logic (lib/calculator.ts)", () => {
    const defaultPayslip: PayslipInput = {
        id: "test",
        employeeId: "emp-1",
        payPeriodStart: new Date(),
        payPeriodEnd: new Date(),
        ordinaryHours: 160,
        overtimeHours: 0,
        sundayHours: 0,
        publicHolidayHours: 0,
        daysWorked: 20,
        hourlyRate: NMW_RATE,
        includeAccommodation: false,
        accommodationCost: 0,
        otherDeductions: 0,
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
        shortFallHours: 0,
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        createdAt: new Date(),
    };

    it("calculates basic ordinary pay correctly based on NMW", () => {
        const bd = calculatePayslip(defaultPayslip);
        expect(bd.ordinaryPay).toBeCloseTo(160 * NMW_RATE);
        expect(bd.totalHours).toBe(160);
    });

    it("applies the 4-hour minimum shift rule", () => {
        // Worked 5 days, but only 10 ordinary hours entered (average 2h/day). 
        // Rule: must pay a minimum of 4 hours for each day worked
        const hourlyRate = 100;
        const slip = {
            ...defaultPayslip,
            ordinaryHours: 10,
            daysWorked: 5,
            hourlyRate: hourlyRate,
        };
        const bd = calculatePayslip(slip);
        // Should pay 5 days * 4 hours = 20 effective hours
        expect(bd.ordinaryPay).toBe(20 * hourlyRate);
        // Total reported hours should reflect effective minimum (20h) for UIF etc
        expect(bd.totalHours).toBe(20);
    });

    it("calculates overtime, sunday, and public holiday pay correctly", () => {
        const slip = {
            ...defaultPayslip,
            ordinaryHours: 40,
            overtimeHours: 5, // 1.5x
            sundayHours: 3, // 2x
            publicHolidayHours: 2, // 2x
            daysWorked: 10,  // minimum hours rule would be 40... equal to ordinaryHours, so it's fine.
            hourlyRate: 100,
        };
        const bd = calculatePayslip(slip);

        expect(bd.ordinaryPay).toBe(4000);
        expect(bd.overtimePay).toBe(5 * 100 * 1.5);
        expect(bd.sundayPay).toBe(800); // 3 * 100 * 2 = 600, bumped to daily wage 8 * 100 = 800
        expect(bd.publicHolidayPay).toBe(2 * 100 * 2.0);

        expect(bd.grossPay).toBe(
            4000 + 750 + 800 + 400
        );
        expect(bd.totalHours).toBe(50);
    });

    it("UIF applies only if hours > 24 and calculated properly", () => {
        // Under 24 hours
        const slipUnder = {
            ...defaultPayslip,
            ordinaryHours: 20,
            daysWorked: 5, // implies min 20 hours anyway
            hourlyRate: 100,
            overtimeHours: 2,
        };
        const bdUnder = calculatePayslip(slipUnder);
        expect(bdUnder.totalHours).toBe(22);
        expect(bdUnder.deductions.uifEmployee).toBe(0);

        // Over 24 hours
        const slipOver = {
            ...defaultPayslip,
            ordinaryHours: 25,
            daysWorked: 5,
            hourlyRate: 100,
        };
        const bdOver = calculatePayslip(slipOver);
        expect(bdOver.totalHours).toBe(25);
        expect(bdOver.grossPay).toBe(2500);
        expect(bdOver.deductions.uifEmployee).toBeCloseTo(25); // 1% of 2500
        expect(bdOver.employerContributions.uifEmployer).toBeCloseTo(25); // 1%
    });

    it("UIF is capped at R17712 a month", () => {
        const slip = {
            ...defaultPayslip,
            ordinaryHours: 200,
            daysWorked: 25,
            hourlyRate: 200, // 40,000 > 17,712
        };
        const bd = calculatePayslip(slip);
        expect(bd.grossPay).toBe(40000);

        // Capped at 1% of 17712 = 177.12
        expect(bd.deductions.uifEmployee).toBe(177.12);
        expect(bd.employerContributions.uifEmployer).toBe(177.12);
    });

    it("prevents net pay from going negative when deductions exceed gross", () => {
        const slip = {
            ...defaultPayslip,
            ordinaryHours: 10,
            daysWorked: 1, // min 4 hours, so ordinary pay = 10 * NMW_RATE (because input rate 40 > NMW_RATE 30.23)
            hourlyRate: 40,
            otherDeductions: 5000, // Massive deduction
        };
        const bd = calculatePayslip(slip);

        expect(bd.grossPay).toBe(10 * 40);
        expect(bd.deductions.total).toBe(5000); // Because uif is 0 (< 24 hrs)

        // Instead of negative, should be 0
        expect(bd.netPay).toBe(0);
    });
});
