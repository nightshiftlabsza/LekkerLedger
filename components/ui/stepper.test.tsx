import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Stepper } from "./stepper";

const STEPS = [
    { label: "Details" },
    { label: "Month" },
    { label: "Extra pay" },
];

describe("Stepper", () => {
    it("keeps the legacy state model when furthestStepReached is omitted", () => {
        render(<Stepper steps={STEPS} currentStep={1} />);

        expect(screen.getByTestId("stepper-step-0")).toHaveAttribute("data-state", "complete");
        expect(screen.getByTestId("stepper-step-1")).toHaveAttribute("data-state", "current");
        expect(screen.getByTestId("stepper-step-2")).toHaveAttribute("data-state", "upcoming");
    });

    it("preserves completed styling for previously reached steps when navigating backward", () => {
        const onStepClick = vi.fn();
        render(<Stepper steps={STEPS} currentStep={0} furthestStepReached={2} onStepClick={onStepClick} />);

        expect(screen.getByTestId("stepper-step-1")).toHaveAttribute("data-state", "complete");
        expect(screen.getByTestId("stepper-step-2")).toHaveAttribute("data-state", "complete");

        fireEvent.click(screen.getByRole("button", { name: "Extra pay" }));
        expect(onStepClick).toHaveBeenCalledWith(2);
    });
});
