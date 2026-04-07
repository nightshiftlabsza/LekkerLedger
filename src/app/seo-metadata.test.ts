import { describe, expect, it } from "vitest";
import { ROOT_METADATA_BASE } from "@/lib/seo";
import { metadata as authMetadata } from "./(auth)/layout";
import { metadata as billingMetadata } from "./billing/layout";
import { metadata as homeMetadata } from "./(marketing)/page";
import { metadata as pricingMetadata } from "./(marketing)/pricing/layout";
import { metadata as calculatorMetadata } from "./(marketing)/calculator/layout";
import { metadata as resourcesMetadata } from "./(marketing)/resources/page";
import { metadata as guidesMetadata } from "./(marketing)/resources/guides/page";
import { metadata as toolsMetadata } from "./(marketing)/resources/tools/page";
import { metadata as checklistsMetadata } from "./(marketing)/resources/checklists/page";

describe("SEO metadata", () => {
    it("uses the canonical site URL as metadata base", () => {
        expect(ROOT_METADATA_BASE.toString()).toBe("https://lekkerledger.co.za/");
    });

    it("keeps auth and billing routes out of the index", () => {
        expect(authMetadata.robots).toMatchObject({ index: false, follow: true });
        expect(billingMetadata.robots).toMatchObject({ index: false, follow: true });
    });

    it("sets explicit canonical paths for key public pages", () => {
        expect(homeMetadata.alternates?.canonical).toBe("/");
        expect(homeMetadata.title).toBe("Domestic Worker Payslips, UIF & Payroll Records | LekkerLedger South Africa");
        expect(homeMetadata.description).toBe("Create domestic worker payslips, calculate UIF, track leave, store contracts, and keep payroll records organised for South African household employers.");
        expect(pricingMetadata.alternates?.canonical).toBe("/pricing");
        expect(calculatorMetadata.alternates?.canonical).toBe("/calculator");
        expect(resourcesMetadata.alternates?.canonical).toBe("/resources");
        expect(guidesMetadata.alternates?.canonical).toBe("/resources/guides");
        expect(toolsMetadata.alternates?.canonical).toBe("/resources/tools");
        expect(checklistsMetadata.alternates?.canonical).toBe("/resources/checklists");
    });
});
