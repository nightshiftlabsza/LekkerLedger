import { describe, expect, it } from "vitest";
import { ROOT_METADATA_BASE } from "@/lib/seo";
import { metadata as authMetadata } from "./(auth)/layout";
import { metadata as billingMetadata } from "./billing/layout";
import { metadata as marketingMetadata } from "./(marketing)/layout";
import { metadata as helpMetadata } from "./(marketing)/help/layout";
import { metadata as homeMetadata } from "./(marketing)/page";
import { metadata as pricingMetadata } from "./(marketing)/pricing/layout";
import { metadata as calculatorMetadata } from "./(marketing)/calculator/layout";
import { metadata as uifMetadata } from "./(marketing)/uif-calculator/page";
import { metadata as resourcesMetadata } from "./(marketing)/resources/page";
import { metadata as guidesMetadata } from "./(marketing)/resources/guides/page";
import { metadata as toolsMetadata } from "./(marketing)/resources/tools/page";
import { metadata as checklistsMetadata } from "./(marketing)/resources/checklists/page";
import { metadata as payslipToolMetadata } from "./(marketing)/resources/tools/domestic-worker-payslip/page";

describe("SEO metadata", () => {
    it("uses the canonical site URL as metadata base", () => {
        expect(ROOT_METADATA_BASE.toString()).toBe("https://lekkerledger.co.za/");
    });

    it("keeps auth and billing routes out of the index", () => {
        expect(authMetadata.robots).toMatchObject({ index: false, follow: true });
        expect(billingMetadata.robots).toMatchObject({ index: false, follow: true });
    });

    it("keeps legacy help pages out of the index without affecting public resources", () => {
        expect(marketingMetadata.robots).toMatchObject({ index: true, follow: true });
        expect(marketingMetadata.title).toBe("LekkerLedger | Domestic Worker Payslips and UIF for South African Households");
        expect(marketingMetadata.description).toBe("Create domestic worker payslips, check UIF, and keep monthly household employer admin in order.");
        expect(helpMetadata.robots).toMatchObject({ index: false, follow: true });
        expect(checklistsMetadata.robots).toBeUndefined();
    });

    it("sets explicit canonical paths for key public pages", () => {
        expect(homeMetadata.alternates?.canonical).toBe("/");
        expect(homeMetadata.title).toBe("Domestic Worker Payslips & UIF Calculator for South African Households | LekkerLedger");
        expect(homeMetadata.description).toBe("Create domestic worker payslips, check UIF deductions, and keep monthly household employer admin organised.");
        expect(pricingMetadata.alternates?.canonical).toBe("/pricing");
        expect(pricingMetadata.title).toBe("Pricing for Domestic Worker Payroll Software | LekkerLedger");
        expect(pricingMetadata.description).toBe("Compare Free, Standard, and Pro for domestic worker payslips, UIF records, leave tracking, contracts, and household payroll admin in South Africa.");
        expect(calculatorMetadata.alternates?.canonical).toBe("/calculator");
        expect(calculatorMetadata.title).toBe("Domestic Worker Pay Calculator (Hours, Wage & UIF) | LekkerLedger");
        expect(calculatorMetadata.description).toBe("Estimate domestic worker pay from hours worked, hourly rate, minimum wage, and UIF deduction.");
        expect(uifMetadata.alternates?.canonical).toBe("/uif-calculator");
        expect(uifMetadata.title).toBe("UIF Deduction Calculator for Domestic Workers | LekkerLedger");
        expect(uifMetadata.description).toBe("Calculate employer and employee UIF contributions for a domestic worker, check the current ceiling, and understand the monthly deduction.");
        expect(resourcesMetadata.alternates?.canonical).toBe("/resources");
        expect(guidesMetadata.alternates?.canonical).toBe("/resources/guides");
        expect(toolsMetadata.alternates?.canonical).toBe("/resources/tools");
        expect(checklistsMetadata.alternates?.canonical).toBe("/resources/checklists");
        expect(payslipToolMetadata.alternates?.canonical).toBe("/resources/tools/domestic-worker-payslip");
        expect(payslipToolMetadata.title).toBe("Free Domestic Worker Payslip Template & Generator | LekkerLedger");
        expect(payslipToolMetadata.description).toBe("Create a domestic worker payslip template and PDF for this month. Enter the pay details and email yourself one free payslip each calendar month.");
    });
});
