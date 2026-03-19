import * as React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";

vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams("tab=plan"),
}));

vi.mock("@/lib/storage", () => ({
    getSettings: vi.fn().mockResolvedValue({
        billingCycle: "monthly",
        proStatus: "standard",
        paidUntil: "2099-04-01T00:00:00.000Z",
        customLeaveTypes: [],
        density: "comfortable",
        employerName: "Test Household",
        employerAddress: "",
        phone: "",
        employerEmail: "owner@example.com",
    }),
    getEmployees: vi.fn().mockResolvedValue([]),
    saveSettings: vi.fn(),
    resetAllData: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn(),
}));

vi.mock("@/lib/billing-client", () => ({
    fetchBillingAccount: vi.fn().mockResolvedValue({
        entitlements: {
            planId: "standard",
            billingCycle: "monthly",
            status: "active",
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            isActive: true,
            paidUntil: "2099-04-01T00:00:00.000Z",
        },
        account: {
            cancelAtPeriodEnd: false,
            availableReferralMonths: 0,
            pendingReferralMonths: 0,
            successfulReferralCount: 0,
            totalReferralMonthsEarned: 0,
            upcomingCharge: {
                dueAt: "2099-04-01T00:00:00.000Z",
                amountCents: 2900,
                currency: "ZAR",
                source: "plan",
            },
        },
    }),
    cancelSubscriptionRenewal: vi.fn(),
}));

vi.mock("@/components/theme-provider", () => ({
    useUI: () => ({
        theme: "system",
        setTheme: vi.fn(),
        setDensity: vi.fn(),
    }),
}));

vi.mock("@/lib/app-mode", () => ({
    useAppMode: () => ({
        mode: "account_unlocked",
        encryptionMode: "recoverable",
        setEncryptionMode: vi.fn(),
    }),
}));

vi.mock("@/app/hooks/use-app-connectivity", () => ({
    useAppConnectivity: () => ({
        network: "online",
        sync: "synced",
        syncErrorMessage: null,
    }),
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
    }),
}));

vi.mock("@/lib/recoverable-account", () => ({
    buildRecoverableSetupArtifacts: vi.fn(),
    sendRecoverableSetupRequest: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
    generateAccountMasterKey: vi.fn(),
}));

vi.mock("@/lib/recovery-profile-store", () => ({
    saveLocalRecoveryProfile: vi.fn(),
}));

vi.mock("@/lib/sync-engine", () => ({
    syncEngine: {
        setCryptoKey: vi.fn(),
        runMigration: vi.fn(),
    },
}));

vi.mock("@/lib/sync-service", () => ({
    syncService: {
        init: vi.fn(),
    },
}));

vi.mock("@/lib/encryption-mode", () => ({
    getActiveSyncSummary: vi.fn(() => "Synced"),
    getEncryptionModeLabel: vi.fn(() => "Recoverable"),
    getLockedDeviceSummary: vi.fn(() => "Unlocked"),
    getSettingsSummary: vi.fn(() => "Settings summary"),
}));

vi.mock("@/lib/recovery-notice", () => ({
    storeRecoveryNotice: vi.fn(),
}));

vi.mock("@/lib/archive", () => ({
    getArchiveCutoffDate: vi.fn(() => new Date("2025-01-01T00:00:00.000Z")),
    getArchiveUpgradeHref: vi.fn(() => "/upgrade"),
}));

vi.mock("@/components/billing/inline-paid-plan-checkout", () => ({
    InlinePlanCheckoutButton: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
}));

vi.mock("@/components/ui/toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

describe("SettingsPage billing plans", () => {
    it("renders the monthly/yearly toggle and updates yearly pricing", async () => {
        render(<SettingsPage />);

        const planTab = await screen.findByTestId("settings-tab-plan");
        fireEvent.click(planTab);

        const billingCycleFieldset = await screen.findByRole("group", { name: "Billing cycle" });
        expect(within(billingCycleFieldset).getByRole("button", { name: "Monthly" })).toBeInTheDocument();
        expect(within(billingCycleFieldset).getByRole("button", { name: /Yearly/ })).toBeInTheDocument();

        fireEvent.click(within(billingCycleFieldset).getByRole("button", { name: /Yearly/ }));

        await waitFor(() => {
            expect(screen.getAllByText("R299").length).toBeGreaterThan(0);
            expect(screen.getAllByText("/year").length).toBeGreaterThan(0);
            expect(screen.getAllByText(/R24\.92\/month/).length).toBeGreaterThan(0);
        });
    });
});
