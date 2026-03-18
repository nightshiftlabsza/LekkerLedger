import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PaidPlanCheckoutDialog } from "./paid-plan-checkout-dialog";

function PaidPlanCheckoutDialogHarness() {
    const [open, setOpen] = React.useState(true);

    return (
        <PaidPlanCheckoutDialog
            open={open}
            title="Choose your plan"
            description="Pick a paid plan for this workspace."
            onOpenChange={setOpen}
        >
            <button type="button">Dialog action</button>
        </PaidPlanCheckoutDialog>
    );
}

describe("PaidPlanCheckoutDialog", () => {
    beforeEach(() => {
        Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
            configurable: true,
            value() {
                this.setAttribute("open", "");
            },
        });

        Object.defineProperty(HTMLDialogElement.prototype, "close", {
            configurable: true,
            value() {
                this.removeAttribute("open");
            },
        });
    });

    it("closes when the backdrop button is clicked", async () => {
        render(<PaidPlanCheckoutDialogHarness />);

        const dialog = await screen.findByTestId("paid-plan-checkout-modal");
        expect(dialog).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Close Choose your plan"));

        await waitFor(() => {
            expect(dialog).not.toHaveAttribute("open");
        });
    });
});
