import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pagePath = path.join(process.cwd(), "src/app/(marketing)/resources/tools/domestic-worker-payslip/page.tsx");

describe("domestic worker payslip page copy", () => {
    it("uses the updated SEO metadata and structured data copy", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).toMatch(/Create a domestic worker payslip template and PDF for this month\. Enter the pay details and email yourself one free payslip each calendar month\./);
        expect(source).toMatch(/name: "Free Domestic Worker Payslip Template & Generator"/);
        expect(source).not.toMatch(/Create this month's domestic worker payslip/i);
        expect(source).not.toMatch(/Tell us her schedule, what she worked, and where to send the PDF\./i);
        expect(source).not.toMatch(/No account required/i);
    });

    it("uses the tightened hero copy, helper block, and paid bridge", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).toMatch(/className="marketing-tool-shell py-10 sm:py-14"/);
        expect(source).toMatch(/Free Domestic Worker Payslip Template &amp; Generator/);
        expect(source).toMatch(/What this includes/);
        expect(source).toMatch(/Where UIF applies, it should be shown clearly\./);
        expect(source).toMatch(/Employer and worker details/);
        expect(source).toMatch(/Use this for a domestic worker, nanny, gardener, or caregiver employed by a South African household\./);
        expect(source).toMatch(/Free covers one emailed payslip each calendar month\./);
        expect(source).toMatch(/Paid plans keep leave, contracts, documents, exports, and longer history together\./);
        expect(source).not.toMatch(/What this payslip generator helps with/);
    });
});
