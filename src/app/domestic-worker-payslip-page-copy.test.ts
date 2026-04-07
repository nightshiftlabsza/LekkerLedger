import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pagePath = path.join(process.cwd(), "src/app/(marketing)/resources/tools/domestic-worker-payslip/page.tsx");

describe("domestic worker payslip page copy", () => {
    it("uses the updated SEO metadata and structured data copy", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).toMatch(/Create a free domestic worker payslip PDF for South Africa\. Enter pay details, hours worked, and UIF to email one free payslip per month\./);
        expect(source).toMatch(/name: "Free Domestic Worker Payslip Generator"/);
        expect(source).not.toMatch(/Create this month's domestic worker payslip/i);
        expect(source).not.toMatch(/Tell us her schedule, what she worked, and where to send the PDF\./i);
        expect(source).not.toMatch(/No account required/i);
    });

    it("uses the tightened hero copy, helper block, and paid bridge", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).toMatch(/className="marketing-tool-shell py-10 sm:py-14"/);
        expect(source).toMatch(/Free Domestic Worker Payslip Generator \(South Africa\)/);
        expect(source).toMatch(/What this payslip generator helps with/);
        expect(source).toMatch(/Show UIF deducted from pay clearly/);
        expect(source).toMatch(/Use this for a domestic worker, nanny, gardener, or caregiver employed by a South African household\./);
        expect(source).toMatch(/Need more than one free payslip a month\?/);
        expect(source).toMatch(/to keep monthly payslips, contracts, leave, and records together\./);
        expect(source).not.toMatch(/What&apos;s included on the payslip/);
    });
});
