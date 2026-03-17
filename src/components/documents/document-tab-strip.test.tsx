import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentTabStrip } from "@/components/documents/document-tab-strip";

describe("DocumentTabStrip", () => {
    it("renders readable tabs and keeps counts outside the tab labels", () => {
        const onChange = vi.fn();

        render(
            <DocumentTabStrip
                ariaLabel="Document types"
                activeTab="payslips"
                onChange={onChange}
                showSummaryCounts={true}
                tabs={[
                    { id: "payslips", label: "Payslips", count: 12 },
                    { id: "contracts", label: "Contracts", count: 4 },
                    { id: "records", label: "Records", count: 2 },
                ]}
            />,
        );

        const payslipsTab = screen.getByRole("tab", { name: "Payslips" });
        const contractsTab = screen.getByRole("tab", { name: "Contracts" });

        expect(payslipsTab).toHaveAttribute("aria-selected", "true");
        expect(payslipsTab).not.toHaveTextContent("12");
        expect(screen.getByText("12")).toBeInTheDocument();

        fireEvent.click(contractsTab);
        expect(onChange).toHaveBeenCalledWith("contracts");
    });
});
