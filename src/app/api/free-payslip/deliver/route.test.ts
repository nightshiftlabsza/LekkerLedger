import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getStatusMock: vi.fn(),
    claimSampleMock: vi.fn(),
    errorResponseMock: vi.fn(),
    generatePdfMock: vi.fn(),
    getFileNameMock: vi.fn(),
    sendEmailMock: vi.fn(),
    addSubscriberMock: vi.fn(),
}));

vi.mock("@/lib/free-payslip-quota", () => ({
    getFreePayslipClaimStatus: (...args: unknown[]) => mocks.getStatusMock(...args),
    claimFreePayslipSample: (...args: unknown[]) => mocks.claimSampleMock(...args),
    toFreePayslipClaimErrorResponse: (...args: unknown[]) => mocks.errorResponseMock(...args),
    normalizeFreePayslipEmail: (email: string) => email.trim().toLowerCase(),
    FREE_PAYSLIP_ALREADY_USED_MESSAGE: "This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.",
}));

vi.mock("@/lib/pdf", () => ({
    generatePayslipPdfBytes: (...args: unknown[]) => mocks.generatePdfMock(...args),
    getPayslipFilename: (...args: unknown[]) => mocks.getFileNameMock(...args),
}));

vi.mock("@/lib/free-payslip-email", () => ({
    sendFreePayslipEmail: (...args: unknown[]) => mocks.sendEmailMock(...args),
}));

vi.mock("@/lib/newsletter", () => ({
    addNewsletterSubscriber: (...args: unknown[]) => mocks.addSubscriberMock(...args),
}));

import { POST } from "./route";

function buildRequestBody(email = "owner@example.com", marketingConsent = false) {
    return {
        email,
        marketingConsent,
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
        mocks.claimSampleMock.mockReset();
        mocks.errorResponseMock.mockReset();
        mocks.generatePdfMock.mockReset();
        mocks.getFileNameMock.mockReset();
        mocks.sendEmailMock.mockReset();
        mocks.addSubscriberMock.mockReset();
        mocks.errorResponseMock.mockImplementation((error: unknown) => {
            if (error instanceof Error && error.message.includes("already used")) {
                return { status: 409, message: error.message };
            }
            return { status: 503, message: "The free payslip service is temporarily unavailable. Please try again in a moment." };
        });
        mocks.getStatusMock.mockResolvedValue({
            email: "owner@example.com",
            isClaimed: false,
            claimedAt: null,
        });
        mocks.claimSampleMock.mockResolvedValue({
            email: "owner@example.com",
            isClaimed: true,
            claimedAt: Date.now(),
        });
        mocks.generatePdfMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
        mocks.getFileNameMock.mockReturnValue("LekkerLedger_Payslip_Thandi_2026-04_1234.pdf");
        mocks.sendEmailMock.mockResolvedValue(undefined);
        mocks.addSubscriberMock.mockResolvedValue(undefined);
    });

    it("sends successfully when the sample is unused", async () => {
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
        expect(mocks.claimSampleMock).toHaveBeenCalledTimes(1);
        expect(mocks.addSubscriberMock).not.toHaveBeenCalled();
    });

    it("adds newsletter subscriber after a successful send when marketing consent is true", async () => {
        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/deliver", {
            method: "POST",
            body: JSON.stringify(buildRequestBody("owner@example.com", true)),
            headers: {
                "Content-Type": "application/json",
            },
        }));

        expect(response.status).toBe(200);
        expect(mocks.sendEmailMock).toHaveBeenCalledTimes(1);
        expect(mocks.claimSampleMock).toHaveBeenCalledTimes(1);
        expect(mocks.addSubscriberMock).toHaveBeenCalledTimes(1);
        expect(mocks.addSubscriberMock).toHaveBeenCalledWith("owner@example.com");
    });

    it("rejects cleanly when the sample was already claimed", async () => {
        mocks.getStatusMock.mockResolvedValue({
            email: "owner@example.com",
            isClaimed: true,
            claimedAt: Date.now(),
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
            status: "already-used",
            error: "This email address has already used its free payslip sample. To keep generating monthly payslips and manage household payroll, create an account and choose a paid plan.",
        });
        expect(mocks.generatePdfMock).not.toHaveBeenCalled();
        expect(mocks.sendEmailMock).not.toHaveBeenCalled();
        expect(mocks.claimSampleMock).not.toHaveBeenCalled();
        expect(mocks.addSubscriberMock).not.toHaveBeenCalled();
    });

    it("returns the already-used state when the claim insert conflicts after email send", async () => {
        mocks.errorResponseMock.mockImplementation((error: unknown) => {
            if (error instanceof Error && error.message.includes("already used")) {
                return { status: 409, message: error.message };
            }
            return { status: 503, message: "The free payslip service is temporarily unavailable. Please try again in a moment." };
        });
        mocks.claimSampleMock.mockRejectedValue(new Error("already used conflict"));

        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/deliver", {
            method: "POST",
            body: JSON.stringify(buildRequestBody("owner@example.com", true)),
            headers: {
                "Content-Type": "application/json",
            },
        }));

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toMatchObject({
            status: "already-used",
            error: "already used conflict",
        });
        expect(mocks.generatePdfMock).toHaveBeenCalledTimes(1);
        expect(mocks.sendEmailMock).toHaveBeenCalledTimes(1);
        expect(mocks.claimSampleMock).toHaveBeenCalledTimes(1);
        expect(mocks.addSubscriberMock).toHaveBeenCalledTimes(1);
    });

    it("does not claim the sample when PDF generation fails", async () => {
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
        expect(mocks.claimSampleMock).not.toHaveBeenCalled();
        expect(mocks.addSubscriberMock).not.toHaveBeenCalled();
    });

    it("does not claim the sample when email delivery fails", async () => {
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
        expect(mocks.claimSampleMock).not.toHaveBeenCalled();
        expect(mocks.addSubscriberMock).not.toHaveBeenCalled();
    });

    it("does not add newsletter subscriber when the request body is invalid", async () => {
        const response = await POST(new Request("https://lekkerledger.co.za/api/free-payslip/deliver", {
            method: "POST",
            body: JSON.stringify({ email: "not-an-email", marketingConsent: true, form: {} }),
            headers: {
                "Content-Type": "application/json",
            },
        }));

        expect(response.status).toBe(400);
        expect(mocks.generatePdfMock).not.toHaveBeenCalled();
        expect(mocks.sendEmailMock).not.toHaveBeenCalled();
        expect(mocks.claimSampleMock).not.toHaveBeenCalled();
        expect(mocks.addSubscriberMock).not.toHaveBeenCalled();
    });
});
