import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

        fireEvent.click(screen.getByRole("button", { name: /generate recovery key/i }));

        await waitFor(() => {
            expect(screen.getByText(/cannot create the secure recovery key/i)).toBeTruthy();
        });

        expect(screen.queryByRole("button", { name: /continue securely/i })).toBeNull();
    });
});
