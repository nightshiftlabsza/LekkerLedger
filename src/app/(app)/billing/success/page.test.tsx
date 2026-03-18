import * as React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BillingSuccessPage from "@/app/billing/success/page";

const mocks = vi.hoisted(() => ({
    replaceMock: vi.fn(),
    pendingReference: "",
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: mocks.replaceMock,
    }),
    useSearchParams: () => new URLSearchParams("reference=ref_456"),
}));

vi.mock("@/lib/billing-handoff", () => ({
    readPendingBillingReference: () => mocks.pendingReference,
    writePendingBillingReference: (reference: string) => {
        mocks.pendingReference = reference;
    },
}));

describe("BillingSuccessPage route-group coverage", () => {
    beforeEach(() => {
        mocks.replaceMock.mockReset();
        mocks.pendingReference = "";
    });

    it("forwards the compatibility route into billing activation", async () => {
        render(<BillingSuccessPage />);

        await waitFor(() => {
            expect(mocks.replaceMock).toHaveBeenCalledWith("/billing/activate?reference=ref_456");
        });

        expect(mocks.pendingReference).toBe("ref_456");
    });
});
