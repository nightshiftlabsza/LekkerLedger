import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdinaryWorkPatternPicker } from "./ordinary-work-pattern-picker";

const BASE_PATTERN = {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
};

describe("OrdinaryWorkPatternPicker", () => {
    it("shows Sunday by default for existing flows", () => {
        render(<OrdinaryWorkPatternPicker value={BASE_PATTERN} onChange={vi.fn()} />);

        expect(screen.getByRole("button", { name: "Sun" })).toBeInTheDocument();
    });

    it("hides Sunday only when the free-tool prop is passed", () => {
        const onChange = vi.fn();
        render(<OrdinaryWorkPatternPicker value={BASE_PATTERN} onChange={onChange} hiddenDayKeys={["sunday"]} />);

        expect(screen.queryByRole("button", { name: "Sun" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Sat" }));
        expect(onChange).toHaveBeenCalledWith({ ...BASE_PATTERN, saturday: true });
    });
});
