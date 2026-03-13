import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    generateRecoveryKeyMock: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
    generateRecoveryKey: mocks.generateRecoveryKeyMock,
}));

import { RecoveryKeySetup } from "./recovery-key-setup";

describe("RecoveryKeySetup", () => {
    it("shows a friendly message instead of crashing when crypto is unavailable", async () => {
        mocks.generateRecoveryKeyMock.mockImplementation(() => {
            throw new Error("Secure encryption is not available on this device.");
        });

        render(
            <RecoveryKeySetup
                onComplete={() => undefined}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/cannot create the secure recovery key/i)).toBeTruthy();
        });

        expect(screen.getByRole("button", { name: /continue to dashboard/i })).toBeDisabled();
    });
});
