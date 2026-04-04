import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pagePath = path.join(process.cwd(), "src/app/(marketing)/resources/tools/domestic-worker-payslip/page.tsx");

describe("domestic worker payslip page copy", () => {
    it("removes the bait-and-switch no-account wording from metadata and structured data", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).not.toMatch(/No account required/i);
        expect(source).not.toMatch(/Free, no account required/i);
        expect(source).not.toMatch(/works out the maths for you/i);
        expect(source).not.toMatch(/quietly in the background/i);
        expect(source).toMatch(/email one free payslip PDF per email address each calendar month\./i);
    });

    it("uses the tightened hero copy and layout shell", () => {
        const source = fs.readFileSync(pagePath, "utf8");

        expect(source).toMatch(/className="marketing-tool-shell py-10 sm:py-14"/);
        expect(source).toMatch(/Create this month&apos;s payslip/);
        expect(source).toMatch(/We email the PDF after a successful send, with one free payslip per email address each calendar month\./);
    });
});
