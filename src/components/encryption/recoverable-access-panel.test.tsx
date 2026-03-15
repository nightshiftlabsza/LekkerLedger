import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecoverableAccessPanel } from "./recoverable-access-panel";

describe("RecoverableAccessPanel", () => {
    it("submits the saved-password handoff during setup without asking for another password", async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <RecoverableAccessPanel
                purpose="setup"
                hasSavedPassword={true}
                onSubmit={onSubmit}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Finish setup" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                password: null,
                useSavedPassword: true,
            });
        });

        expect(screen.queryByLabelText("Confirm your password")).toBeNull();
    });

    it("asks for a password when no handoff exists", async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <RecoverableAccessPanel
                purpose="unlock"
                hasSavedPassword={false}
                onSubmit={onSubmit}
            />,
        );

        expect(screen.getByRole("heading", { name: "Finish opening this device" })).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Confirm your password"), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Open records on this device" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                password: "Password123!",
                useSavedPassword: false,
            });
        });
    });
});
