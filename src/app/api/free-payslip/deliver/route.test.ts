import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getStatusMock: vi.fn(),
    consumeQuotaMock: vi.fn(),
    errorResponseMock: vi.fn(),
    generatePdfMock: vi.fn(),
    getFileNameMock: vi.fn(),
    sendEmailMock: vi.fn(),
}));

vi.mock("@/lib/free-payslip-quota", () => ({
    getFreePayslipQuotaStatus: (...args: unknown[]) => mocks.getStatusMock(...args),
    consumeFreePayslipQuota: (...args: unknown[]) => mocks.consumeQuotaMock(...args),
    toFreePayslipQuotaErrorResponse: (...args: unknown[]) => mocks.errorResponseMock(...args),
    FREE_PAYSLIP_MONTHLY_LIMIT_MESSAGE: "This verified email has already used its one successful free payslip PDF for this calendar month.",
}));

vi.mock("@/lib/pdf", () => ({
    generatePayslipPdfBytes: (...args: unknown[]) => mocks.generatePdfMock(...args),
    getPayslipFilename: (...args: unknown[]) => mocks.getFileNameMock(...args),
}));

vi.mock("@/lib/free-payslip-email", () => ({
    sendFreePayslipEmail: (...args: unknown[]) => mocks.sendEmailMock(...args),
}));

import { POST } from "./route";

function buildRequestBody(email = "owner@example.com") {
    return {
        email,
        form: {
            employerName: "Nomsa Dlamini",
            employerAddress: "18 Acacia Avenue",
            employeeName: "Thandi Maseko",
            employeeId: "",
            employeeRole: "Domestic Worker",
            hourlyRate: "35.00",
            monthKey: "2026-04",
            ordinaryWorkPattern: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false,
            },
            ordinaryDaysWorked: "19",
            ordinaryHoursOverride: "",
            overtimeHours: "0",
            sundayHours: "0",
            publicHolidayHours: "0",
            shortShiftCount: "0",
            shortShiftWorkedHours: "0",
            otherDeductions: "0",
        },
    };
}

describe("free payslip deliver route", () => {
    beforeEach(() => {
        mocks.getStatusMock.mockReset();
        mocks.consumeQuotaMock.mockReset();
        mocks.errorResponseMock.mockReset();
        mocks.generatePdfMock.mockReset();
        mocks.getFileNameMock.mockReset();
        mocks.sendEmailMock.mockReset();
        mocks.errorResponseMock.mockImplementation((error: unknown) => {
            if (error instanceof Error && error.message.includes("already used")) {
                return { status: 409, message: error.message };
            }
            return { status: 503, message: "The free payslip service is temporarily unavailable. Please try again in a moment." };
        });
        mocks.getStatusMock.mockResolvedValue({
            email: "owner@example.com",
            monthKey: "2026-04",
            downloadsUsed: 0,
            remainingDownloads: 1,
            usedThisMonth: false,
        });
        mocks.generatePdfMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
        mocks.getFileNameMock.mockReturnValue("LekkerLedger_Payslip_Thandi_2026-04_1234.pdf");
        mocks.sendEmailMock.mockResolvedValue(undefined);
        mocks.consumeQuotaMock.mockResolvedValue({
            email: "owner@example.com",
            monthKey: "2026-04",
            downloadsUsed: 1,
            remainingDownloads: 0,
            usedThisMonth: true,
        });
    });

    it("sends successfully when the quota is unused", async () => {
        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/deliver", {
            method: "POST",
            body: JSON.stringify(buildRequestBody()),
            headers: {
                "Content-Type": "application/json",
            },
        }));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            status: "sent",
            email: "owner@example.com",
            monthKey: "2026-04",
        });
        expect(mocks.sendEmailMock).toHaveBeenCalledTimes(1);
        expect(mocks.consumeQuotaMock).toHaveBeenCalledTimes(1);
    });

    it("rejects cleanly when the monthly quota is already used", async () => {
        mocks.getStatusMock.mockResolvedValue({
            email: "owner@example.com",
            monthKey: "2026-04",
            downloadsUsed: 1,
            remainingDownloads: 0,
            usedThisMonth: true,
        });

        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/deliver", {
            method: "POST",
            body: JSON.stringify(buildRequestBody()),
            headers: {
                "Content-Type": "application/json",
            },
        }));

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toMatchObject({
            error: "This verified email has already used its one successful free payslip PDF for this calendar month.",
        });
        expect(mocks.generatePdfMock).not.toHaveBeenCalled();
        expect(mocks.sendEmailMock).not.toHaveBeenCalled();
        expect(mocks.consumeQuotaMock).not.toHaveBeenCalled();
    });

    it("does not consume quota when PDF generation fails", async () => {
        mocks.generatePdfMock.mockRejectedValue(new Error("pdf failed"));

        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/deliver", {
            method: "POST",
            body: JSON.stringify(buildRequestBody()),
            headers: {
                "Content-Type": "application/json",
            },
        }));

        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toMatchObject({
            error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
        });
        expect(mocks.sendEmailMock).not.toHaveBeenCalled();
        expect(mocks.consumeQuotaMock).not.toHaveBeenCalled();
    });

    it("does not consume quota when email delivery fails", async () => {
        mocks.sendEmailMock.mockRejectedValue(new Error("email failed"));

        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/deliver", {
            method: "POST",
            body: JSON.stringify(buildRequestBody()),
            headers: {
                "Content-Type": "application/json",
            },
        }));

        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toMatchObject({
            error: "The free payslip service is temporarily unavailable. Please try again in a moment.",
        });
        expect(mocks.consumeQuotaMock).not.toHaveBeenCalled();
    });
});
