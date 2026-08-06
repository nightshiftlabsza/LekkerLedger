import * as React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    replaceMock: vi.fn(),
    searchParams: new URLSearchParams("reference=paid_ref"),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mocks.replaceMock }),
    useSearchParams: () => mocks.searchParams,
}));

vi.mock("@/lib/billing-handoff", () => ({
    readPendingBillingReference: () => "",
}));

vi.mock("@/lib/paid-activation", () => ({
    buildPaidActivationHref: (reference: string) => `/billing/activate?reference=${encodeURIComponent(reference)}`,
}));

import { SignUpForm } from "./signup-form";

describe("legacy signup handoff", () => {
    beforeEach(() => {
        mocks.replaceMock.mockReset();
        mocks.searchParams = new URLSearchParams("reference=paid_ref");
    });

    it("routes paid legacy signup into authoritative activation", async () => {
        render(<SignUpForm />);

        await waitFor(() => {
            expect(mocks.replaceMock).toHaveBeenCalledWith("/billing/activate?reference=paid_ref");
        });
    });

    it("routes an unpaid legacy signup back to pricing", async () => {
        mocks.searchParams = new URLSearchParams();
        render(<SignUpForm />);

        await waitFor(() => {
            expect(mocks.replaceMock).toHaveBeenCalledWith("/pricing");
        });
    });
});
