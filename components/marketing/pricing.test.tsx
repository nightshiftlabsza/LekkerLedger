import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanFeatureList } from "./pricing";

describe("PlanFeatureList", () => {
    it("shows a separate planned-features section for pro", () => {
        const { container } = render(<PlanFeatureList planId="pro" />);

        expect(screen.getByText("Planned features")).toBeTruthy();
        expect(screen.getByText("Android app access when available")).toBeTruthy();
        expect(
            container.querySelector('[data-feature-section="planned"] [data-feature-kind="planned"]'),
        ).toBeTruthy();
    });

    it("does not render a planned-features section for standard", () => {
        const { container } = render(<PlanFeatureList planId="standard" />);

        expect(screen.queryByText("Planned features")).toBeNull();
        expect(container.querySelector('[data-feature-section="planned"]')).toBeNull();
    });
});
