import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaidPlansProofSection } from "./paid-plans-proof-section";

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

vi.mock("next/image", () => ({
    default: ({ alt, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
        <img alt={alt} src={typeof src === "string" ? src : ""} {...props} />
    ),
}));

describe("PaidPlansProofSection", () => {
    it("renders the proof heading and swaps desktop tabs manually", () => {
        render(<PaidPlansProofSection />);

        expect(
            screen.getByRole("heading", { level: 2, name: "What paid plans add after the first payslip" }),
        ).toBeInTheDocument();

        const contractsTab = screen.getByRole("tab", { name: /Keep contracts with the worker record/i });
        fireEvent.click(contractsTab);

        expect(screen.getAllByAltText(/contracts view showing the worker contract workflow/i).length).toBeGreaterThan(0);
    });
});
