import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pagePath = path.join(process.cwd(), "src/app/(marketing)/resources/tools/domestic-worker-payslip/page.tsx");

describe("domestic worker payslip page copy", () => {
    it("removes the bait-and-switch no-account wording from metadata and structured data", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).not.toMatch(/No account required/i);
        expect(source).not.toMatch(/Free, no account required/i);
        expect(source).toMatch(/Verify an email in this browser to unlock one free PDF each month\./);
        expect(source).toMatch(/Verify an email in this browser to unlock one free PDF per month\./);
    });

    it("uses the tightened hero copy and layout shell", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).toMatch(/className="marketing-tool-shell py-10 sm:py-14"/);
        expect(source).toMatch(/Create a clear domestic worker payslip without wrestling the payroll maths\./);
        expect(source).toMatch(/email verification is only used to unlock one free PDF download per month/i);
    });
});
