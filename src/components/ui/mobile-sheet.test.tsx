import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileSheet } from "@/components/ui/mobile-sheet";

function MobileSheetHarness() {
    const [open, setOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const closeRef = React.useRef<HTMLButtonElement | null>(null);

    return (
        <>
            <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
                Open sheet
            </button>

            <MobileSheet
                open={open}
                onOpenChange={setOpen}
                ariaLabel="Test sheet"
                position="bottom"
                initialFocusRef={closeRef}
                returnFocusRef={triggerRef}
            >
                <div className="flex w-full flex-col">
                    <button ref={closeRef} type="button" onClick={() => setOpen(false)}>
                        Close sheet
                    </button>
                    <button type="button">Second action</button>
                </div>
            </MobileSheet>
        </>
    );
}

describe("MobileSheet", () => {
    it("moves focus into the sheet, traps tabbing, and returns focus on close", async () => {
        render(<MobileSheetHarness />);

        const trigger = screen.getByRole("button", { name: "Open sheet" });
        fireEvent.click(trigger);

        const dialog = await screen.findByRole("dialog", { name: "Test sheet" });
        expect(dialog).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Close sheet" })).toHaveFocus();
        });

        fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
        expect(screen.getByRole("button", { name: "Second action" })).toHaveFocus();

        fireEvent.keyDown(document, { key: "Tab" });
        expect(screen.getByRole("button", { name: "Close sheet" })).toHaveFocus();

        fireEvent.keyDown(document, { key: "Escape" });

        await waitFor(() => {
            expect(screen.queryByRole("dialog", { name: "Test sheet" })).not.toBeInTheDocument();
            expect(trigger).toHaveFocus();
        });
    });
});
