import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployerSettings } from "@/lib/schema";

const mocks = vi.hoisted(() => ({
    useSearchParamsMock: vi.fn(() => new URLSearchParams("")),
    useAppBootstrapMock: vi.fn(),
    useAppConnectivityMock: vi.fn(() => ({
        network: "online",
        sync: "disabled",
    })),
    getEmployeesMock: vi.fn(async () => []),
    getCurrentPayPeriodMock: vi.fn(async () => null),
    getDocumentsMock: vi.fn(async () => []),
    getAllPayslipsMock: vi.fn(async () => []),
    getLatestPayslipMock: vi.fn(async () => null),
    getPayPeriodsMock: vi.fn(async () => []),
    purgeDocumentMetasMock: vi.fn(async () => 0),
    saveSettingsMock: vi.fn(async () => undefined),
    subscribeToDataChangesMock: vi.fn(() => () => undefined),
    getStandardRetentionStatusMock: vi.fn(() => ({
        isStandard: false,
        purgeCount: 0,
        purgeCandidates: [],
        showReminder: false,
        showElevenMonthWarning: false,
    })),
    filterRecordsForArchiveWindowMock: vi.fn((_docs: unknown) => ({ visible: [] })),
    computeDashboardAlertsMock: vi.fn(() => []),
    endAppMetricMock: vi.fn(),
    recordAppMetricMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useSearchParams: () => mocks.useSearchParamsMock(),
}));

vi.mock("@/components/app-bootstrap-provider", () => ({
    useAppBootstrap: () => mocks.useAppBootstrapMock(),
}));

vi.mock("@/app/hooks/use-app-connectivity", () => ({
    useAppConnectivity: () => mocks.useAppConnectivityMock(),
}));

vi.mock("@/lib/storage", () => ({
    getEmployees: () => mocks.getEmployeesMock(),
    getCurrentPayPeriod: () => mocks.getCurrentPayPeriodMock(),
    getDocuments: () => mocks.getDocumentsMock(),
    getAllPayslips: () => mocks.getAllPayslipsMock(),
    getLatestPayslip: (...args: unknown[]) => mocks.getLatestPayslipMock(...args),
    getPayPeriods: () => mocks.getPayPeriodsMock(),
    purgeDocumentMetas: (...args: unknown[]) => mocks.purgeDocumentMetasMock(...args),
    saveSettings: (...args: unknown[]) => mocks.saveSettingsMock(...args),
    subscribeToDataChanges: (callback: () => void) => mocks.subscribeToDataChangesMock(callback),
}));

vi.mock("@/lib/archive", () => ({
    filterRecordsForArchiveWindow: (...args: unknown[]) => mocks.filterRecordsForArchiveWindowMock(...args),
    getStandardRetentionStatus: (...args: unknown[]) => mocks.getStandardRetentionStatusMock(...args),
    isUploadedDocument: () => false,
}));

vi.mock("@/lib/alerts", () => ({
    computeDashboardAlerts: (...args: unknown[]) => mocks.computeDashboardAlertsMock(...args),
}));

vi.mock("@/lib/app-performance", () => ({
    endAppMetric: (...args: unknown[]) => mocks.endAppMetricMock(...args),
    recordAppMetric: (...args: unknown[]) => mocks.recordAppMetricMock(...args),
}));

vi.mock("next/dynamic", () => ({
    default: (loader: () => Promise<{ default: React.ComponentType }>) => {
        let Component: React.ComponentType | null = null;
        loader().then(mod => { Component = mod.default; });
        return function DynamicWrapper(props: Record<string, unknown>) {
            if (!Component) return null;
            return <Component {...props} />;
        };
    },
}));

vi.mock("@/components/dashboard/dashboard-overview", () => ({
    DashboardOverview: () => <div data-testid="dashboard-overview">Dashboard overview</div>,
}));

vi.mock("@/components/ui/loading-skeleton", () => ({
    CardSkeleton: () => <div data-testid="card-skeleton">Loading</div>,
}));

vi.mock("@/components/ui/sync-status-badge", () => ({
    SyncStatusBadge: ({ state }: { state: string }) => <div data-testid="sync-badge">{state}</div>,
}));

import DashboardPage from "./page";

function buildSettings(overrides: Partial<EmployerSettings> = {}): EmployerSettings {
    return {
        employerName: "Nomsa Dlamini",
        employerAddress: "18 Acacia Avenue",
        employerIdNumber: "",
        uifRefNumber: "U123456789",
        cfNumber: "9900012345",
        sdlNumber: "",
        phone: "082 555 0101",
        employerEmail: undefined,
        proStatus: "standard",
        paidUntil: "2026-04-30T12:00:00.000Z",
        billingCycle: "monthly",
        activeHouseholdId: "default",
        standardRetentionNoticeDismissedAt: undefined,
        paidDashboardFeedbackNoticeDismissedAt: undefined,
        logoData: "",
        defaultLanguage: "en",
        density: "comfortable",
        piiObfuscationEnabled: true,
        installationId: "test-installation",
        usageHistory: [],
        customLeaveTypes: [],
        ...overrides,
    };
}

function renderDashboard(settings: EmployerSettings) {
    mocks.useAppBootstrapMock.mockReturnValue({
        activationError: null,
        activationStatus: "idle",
        effectiveSettings: settings,
        isReadyForDashboard: true,
        subscriptionStatus: "resolved",
    });

    return render(<DashboardPage />);
}

describe("Dashboard paid feedback notice", () => {
    beforeEach(() => {
        mocks.useSearchParamsMock.mockReturnValue(new URLSearchParams(""));
        mocks.useAppConnectivityMock.mockReturnValue({
            network: "online",
            sync: "disabled",
        });
        mocks.useAppBootstrapMock.mockReset();
        mocks.getEmployeesMock.mockClear();
        mocks.getCurrentPayPeriodMock.mockClear();
        mocks.getDocumentsMock.mockClear();
        mocks.getAllPayslipsMock.mockClear();
        mocks.getLatestPayslipMock.mockClear();
        mocks.getPayPeriodsMock.mockClear();
        mocks.purgeDocumentMetasMock.mockClear();
        mocks.saveSettingsMock.mockReset();
        mocks.saveSettingsMock.mockResolvedValue(undefined);
        mocks.subscribeToDataChangesMock.mockClear();
        mocks.getStandardRetentionStatusMock.mockClear();
        mocks.filterRecordsForArchiveWindowMock.mockClear();
        mocks.computeDashboardAlertsMock.mockClear();
        mocks.endAppMetricMock.mockClear();
        mocks.recordAppMetricMock.mockClear();
    });

    it("shows the notice for paid users with clear dismiss controls", async () => {
        renderDashboard(buildSettings());

        expect(await screen.findByText("Help us keep LekkerLedger polished")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Dismiss paid dashboard feedback notice" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "support@lekkerledger.co.za" })).toHaveAttribute(
            "href",
            "mailto:support@lekkerledger.co.za",
        );
    });

    it("does not show the notice for free users", async () => {
        renderDashboard(buildSettings({
            proStatus: "free",
            paidUntil: undefined,
            billingCycle: "monthly",
        }));

        await screen.findByTestId("dashboard-overview");
        expect(screen.queryByText("Help us keep LekkerLedger polished")).not.toBeInTheDocument();
    });

    it("does not show the notice when the dismissal is already stored", async () => {
        renderDashboard(buildSettings({
            paidDashboardFeedbackNoticeDismissedAt: "2026-03-16T09:00:00.000Z",
        }));

        await screen.findByTestId("dashboard-overview");
        expect(screen.queryByText("Help us keep LekkerLedger polished")).not.toBeInTheDocument();
    });

    it("saves dismissal and hides the notice after clicking Dismiss", async () => {
        renderDashboard(buildSettings());

        fireEvent.click(await screen.findByRole("button", { name: "Dismiss" }));

        await waitFor(() => {
            expect(mocks.saveSettingsMock).toHaveBeenCalledWith(expect.objectContaining({
                paidDashboardFeedbackNoticeDismissedAt: expect.any(String),
            }));
        });

        await waitFor(() => {
            expect(screen.queryByText("Help us keep LekkerLedger polished")).not.toBeInTheDocument();
        });
    });
});
