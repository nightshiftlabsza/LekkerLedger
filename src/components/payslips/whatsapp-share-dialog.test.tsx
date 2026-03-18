import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppShareDialog } from "./whatsapp-share-dialog";

describe("WhatsAppShareDialog", () => {
    it("renders a native dialog and closes from the overlay", () => {
        const onClose = vi.fn();

        render(
            <WhatsAppShareDialog
                open={true}
                hasPhone={true}
                submitting={false}
                onClose={onClose}
                onConfirm={vi.fn()}
            />,
        );

        expect(screen.getByRole("dialog", { name: "Send payslip on WhatsApp" })).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("whatsapp-share-overlay"));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
