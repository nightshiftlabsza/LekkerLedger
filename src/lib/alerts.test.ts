import { describe, expect, it } from "vitest";
import { computeDashboardAlerts } from "./alerts";
import type { Employee, EmployerSettings } from "./schema";

const employee: Employee = {
    id: "00000000-0000-4000-8000-000000000001",
    householdId: "default",
    name: "Test Employee",
    idNumber: "1234567890123",
    role: "Domestic Worker",
    hourlyRate: 30.23,
    phone: "0821234567",
    email: "",
    address: "",
    startDate: "2026-03-01",
    startDateIsApproximate: false,
    leaveCycleStartDate: "",
    leaveCycleEndDate: "",
    annualLeaveBalanceAsOfDate: "",
    ordinarilyWorksSundays: false,
    ordinaryHoursPerDay: 8,
    frequency: "Monthly",
};

const settings: EmployerSettings = {
    employerName: "",
    employerAddress: "",
    employerIdNumber: "",
    uifRefNumber: "",
    cfNumber: "",
    sdlNumber: "",
    phone: "",
    employerEmail: undefined,
    proStatus: "free",
    paidUntil: undefined,
    billingCycle: "monthly",
    activeHouseholdId: "default",
    logoData: undefined,
    defaultLanguage: "en",
    density: "comfortable",
    piiObfuscationEnabled: true,
    installationId: "",
    usageHistory: [],
    customLeaveTypes: [],
};

describe("computeDashboardAlerts", () => {
    it("warns that employer details must be completed before generating payslips", () => {
        const alerts = computeDashboardAlerts({
            employees: [employee],
            summaries: [{ employee, latestPayslip: null }],
            settings,
            now: new Date("2026-03-14T00:00:00.000Z"),
        });

        expect(alerts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: "employer-missing",
                    message: "Employer details missing — complete Settings before generating payslips",
                    action: {
                        label: "Open settings →",
                        href: "/settings?tab=general",
                    },
                }),
            ]),
        );
    });
});
