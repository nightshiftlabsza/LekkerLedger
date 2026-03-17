import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PreviewPage from "@/app/(app)/preview/page";

const mocks = vi.hoisted(() => ({
    getEmployeesMock: vi.fn(),
    getPayslipsForEmployeeMock: vi.fn(),
    getSettingsMock: vi.fn(),
    generatePayslipPdfBytesMock: vi.fn(),
    getPayslipFilenameMock: vi.fn(),
    shareViaEmailMock: vi.fn(),
    shareViaWhatsAppMock: vi.fn(),
    toastMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams("payslipId=ps-1&empId=emp-1"),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock("@/components/ui/toast", () => ({
    useToast: () => ({ toast: mocks.toastMock }),
}));

vi.mock("@/components/ui/card", () => ({
    Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

vi.mock("@/components/ui/alert", () => ({
    Alert: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    AlertDescription: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

vi.mock("@/lib/storage", () => ({
    getEmployees: (...args: unknown[]) => mocks.getEmployeesMock(...args),
    getPayslipsForEmployee: (...args: unknown[]) => mocks.getPayslipsForEmployeeMock(...args),
    getSettings: (...args: unknown[]) => mocks.getSettingsMock(...args),
}));

vi.mock("@/lib/calculator", () => ({
    calculatePayslip: () => ({
        grossPay: 5600,
        ordinaryPay: 5600,
        overtimePay: 0,
        sundayPay: 0,
        publicHolidayPay: 0,
        totalHours: 160,
        netPay: 5488,
        topUps: { fourHourMinimumHours: 0 },
        deductions: {
            uifEmployee: 56,
            accommodation: 0,
            advance: 0,
            other: 0,
            total: 56,
        },
        employerContributions: {
            uifEmployer: 56,
        },
    }),
    getSundayRateMultiplier: () => 2,
    isUifApplicable: () => true,
}));

vi.mock("@/lib/compliance", () => ({
    getComplianceAudit: () => ({
        wageCompliant: true,
        wageStatusText: "Wage looks fine.",
        uifCompliant: true,
        uifStatusText: "UIF looks fine.",
    }),
}));

vi.mock("@/lib/pdf", () => ({
    generatePayslipPdfBytes: (...args: unknown[]) => mocks.generatePayslipPdfBytesMock(...args),
    getPayslipFilename: (...args: unknown[]) => mocks.getPayslipFilenameMock(...args),
}));

vi.mock("@/lib/share", () => ({
    shareViaEmail: (...args: unknown[]) => mocks.shareViaEmailMock(...args),
    shareViaWhatsApp: (...args: unknown[]) => mocks.shareViaWhatsAppMock(...args),
}));

vi.mock("@/lib/analytics", () => ({
    track: vi.fn(),
}));

function mockViewport(isMobile: boolean) {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
            matches: isMobile,
            media: "(max-width: 767px)",
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

function seedPreview({ phone = "0821111111" }: { phone?: string } = {}) {
    mocks.getEmployeesMock.mockResolvedValue([
        {
            id: "emp-1",
            name: "Thandi Dlamini",
            role: "Domestic Worker",
            phone,
        },
    ]);
    mocks.getPayslipsForEmployeeMock.mockResolvedValue([
        {
            id: "ps-1",
            ordinaryHours: 160,
            overtimeHours: 0,
            sundayHours: 0,
            publicHolidayHours: 0,
            ordinarilyWorksSundays: false,
            deductions: {},
            payPeriodStart: "2026-03-01T00:00:00.000Z",
            payPeriodEnd: "2026-03-31T00:00:00.000Z",
            createdAt: "2026-03-31T12:00:00.000Z",
        },
    ]);
    mocks.getSettingsMock.mockResolvedValue({
        defaultLanguage: "en",
    });
    mocks.generatePayslipPdfBytesMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.getPayslipFilenameMock.mockReturnValue("Payslip_Thandi_Dlamini_Mar_2026.pdf");
    mocks.shareViaEmailMock.mockResolvedValue("downloaded");
    mocks.shareViaWhatsAppMock.mockResolvedValue("opened");
}

async function clickWhatsAppButton() {
    const buttons = await screen.findAllByRole("button", { name: "WhatsApp" });
    fireEvent.click(buttons[0]);
}

describe("Payslip preview page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockViewport(false);
        seedPreview();
    });

    it("removes the passive success banner", async () => {
        render(<PreviewPage />);

        await screen.findAllByRole("button", { name: "WhatsApp" });
        expect(screen.queryByText("Payslip ready to review, download, and share.")).toBeNull();
    });

    it("opens the in-app WhatsApp instructions before sharing", async () => {
        render(<PreviewPage />);

        await clickWhatsAppButton();

        expect(await screen.findByRole("dialog", { name: "Send payslip on WhatsApp" })).toBeTruthy();
        expect(screen.getByTestId("whatsapp-share-modal")).toBeTruthy();
        expect(mocks.shareViaWhatsAppMock).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTestId("whatsapp-share-confirm"));

        await waitFor(() => {
            expect(mocks.shareViaWhatsAppMock).toHaveBeenCalledTimes(1);
        });
    });

    it("switches to the bottom-sheet layout on mobile", async () => {
        mockViewport(true);
        render(<PreviewPage />);

        await clickWhatsAppButton();

        expect(await screen.findByTestId("whatsapp-share-sheet")).toBeTruthy();
    });

    it("shows the truthful no-phone fallback copy", async () => {
        seedPreview({ phone: "" });
        mocks.shareViaWhatsAppMock.mockResolvedValue("missing-phone");
        render(<PreviewPage />);

        await clickWhatsAppButton();

        expect(await screen.findByText("This employee does not have a phone number saved, so we cannot open the chat for you.")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Save payslip" })).toBeTruthy();
    });
});
