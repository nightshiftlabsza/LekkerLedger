import * as React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    let pendingReference = "";

    return {
        replaceMock: vi.fn(),
        readPendingReference: () => pendingReference,
        writePendingReference(reference: string) {
            pendingReference = reference;
        },
        reset() {
            pendingReference = "";
        },
    };
});

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: mocks.replaceMock,
    }),
    useSearchParams: () => new URLSearchParams("reference=ref_123"),
}));

vi.mock("@/lib/billing-handoff", () => ({
    readPendingBillingReference: () => mocks.readPendingReference(),
    writePendingBillingReference: (reference: string) => mocks.writePendingReference(reference),
}));

import BillingSuccessPage from "./page";

describe("BillingSuccessPage", () => {
    beforeEach(() => {
        mocks.reset();
        mocks.replaceMock.mockReset();
    });

    it("redirects legacy success links into the activation flow", async () => {
        render(<BillingSuccessPage />);

        await waitFor(() => {
            expect(mocks.replaceMock).toHaveBeenCalledWith("/billing/activate?reference=ref_123");
        });

        expect(mocks.readPendingReference()).toBe("ref_123");
    });
});
