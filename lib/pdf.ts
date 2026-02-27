import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Employee, PayslipInput } from "./schema";
import { calculatePayslip } from "./calculator";
import { format } from "date-fns";

// SA amber gold in PDF colour
const AMBER = rgb(0.77, 0.48, 0.11);
const DARK = rgb(0.11, 0.09, 0.08);
const SLATE = rgb(0.45, 0.40, 0.35);
const WHITE = rgb(1, 1, 1);
const RED = rgb(0.75, 0.22, 0.17);
const GREEN = rgb(0.10, 0.42, 0.23);
const LIGHT_BG = rgb(0.98, 0.97, 0.97);
const LINE = rgb(0.88, 0.86, 0.83);

export async function generatePayslipPdfBytes(
    employee: Employee,
    payslip: PayslipInput
): Promise<Uint8Array> {
    const breakdown = calculatePayslip(payslip);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const t = (
        text: string,
        x: number,
        y: number,
        opts?: {
            font?: typeof regular;
            size?: number;
            color?: typeof DARK;
            align?: "left" | "right";
            maxWidth?: number;
        }
    ) => {
        const font = opts?.font ?? regular;
        const size = opts?.size ?? 10;
        const color = opts?.color ?? DARK;

        let displayTxt = text;
        if (opts?.maxWidth) {
            const ellipsis = "...";
            if (font.widthOfTextAtSize(displayTxt, size) > opts.maxWidth) {
                while (displayTxt.length > 0 && font.widthOfTextAtSize(displayTxt + ellipsis, size) > opts.maxWidth) {
                    displayTxt = displayTxt.slice(0, -1);
                }
                displayTxt += ellipsis;
            }
        }

        let tx = x;
        if (opts?.align === "right") {
            const w = font.widthOfTextAtSize(displayTxt, size);
            tx = x - w;
        }
        page.drawText(displayTxt, { x: tx, y, size, font, color });
    };

    const line = (y: number, x1 = 48, x2 = width - 48, thickness = 0.5) => {
        page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: LINE });
    };

    const rect = (x: number, y: number, w: number, h: number, color: typeof DARK) => {
        page.drawRectangle({ x, y, width: w, height: h, color });
    };

    // ── Header band ──────────────────────────────────────────────────────────
    rect(0, height - 100, width, 100, DARK);

    t("PAYSLIP", 48, height - 46, { font: bold, size: 28, color: WHITE });
    t("LekkerLedger", 48, height - 70, { font: regular, size: 12, color: rgb(0.6, 0.55, 0.5), maxWidth: 250 });

    // Right side of header
    t("CONFIDENTIAL DOCUMENT", width - 48, height - 46, {
        font: bold, size: 9.5, color: rgb(0.5, 0.45, 0.40), align: "right",
    });

    // ── Amber accent bar ─────────────────────────────────────────────────────
    rect(0, height - 104, width, 4, AMBER);

    // ── Employee + Period block ───────────────────────────────────────────────
    const blockY = height - 145;

    // Left: Employee info
    t("EMPLOYEE", 48, blockY + 2, { font: bold, size: 8, color: SLATE });
    t(employee.name, 48, blockY - 16, { font: bold, size: 16, maxWidth: 250 });
    t(employee.role, 48, blockY - 34, { font: regular, size: 10.5, color: SLATE, maxWidth: 250 });
    if (employee.idNumber) {
        t(`ID / Passport: ${employee.idNumber}`, 48, blockY - 50, { font: regular, size: 9.5, color: SLATE });
    }

    // Right: Pay period
    const periodStr = `${format(payslip.payPeriodStart, "d MMM yyyy")} – ${format(payslip.payPeriodEnd, "d MMM yyyy")}`;
    t("PAY PERIOD", width - 48, blockY + 2, { font: bold, size: 8, color: SLATE, align: "right" });
    t(periodStr, width - 48, blockY - 16, { font: regular, size: 11, align: "right" });
    t(`Generated: ${format(new Date(), "d MMM yyyy")}`, width - 48, blockY - 34, {
        font: regular, size: 9.5, color: SLATE, align: "right",
    });

    line(height - 205); // Move separator line down

    // ── Earnings section ──────────────────────────────────────────────────────
    let cy = height - 215;

    t("EARNINGS", 48, cy, { font: bold, size: 8, color: AMBER });
    cy -= 22;

    const earningRows: [string, number][] = [
        [`Ordinary hours  (${payslip.ordinaryHours} h × R${payslip.hourlyRate.toFixed(2)}/hr)`, breakdown.ordinaryPay],
    ];
    if (payslip.overtimeHours > 0) {
        earningRows.push([`Overtime hours  (${payslip.overtimeHours} h × R${(payslip.hourlyRate * 1.5).toFixed(2)}/hr — 1.5×)`, breakdown.overtimePay]);
    }
    if (payslip.sundayHours > 0) {
        earningRows.push([`Sunday hours  (${payslip.sundayHours} h × R${(payslip.hourlyRate * 2).toFixed(2)}/hr — 2×)`, breakdown.sundayPay]);
    }
    if (payslip.publicHolidayHours > 0) {
        earningRows.push([`Public holiday hours  (${payslip.publicHolidayHours} h × R${(payslip.hourlyRate * 2).toFixed(2)}/hr — 2×)`, breakdown.publicHolidayPay]);
    }

    for (const [label, amount] of earningRows) {
        t(label, 48, cy, { font: regular, size: 10, color: SLATE });
        t(`R ${amount.toFixed(2)}`, width - 48, cy, { font: regular, size: 10, align: "right" });
        cy -= 20;
    }

    cy -= 6;
    line(cy + 2);
    cy -= 16;
    t("Gross Pay", 48, cy, { font: bold, size: 11 });
    t(`R ${breakdown.grossPay.toFixed(2)}`, width - 48, cy, { font: bold, size: 11, align: "right" });

    // ── Deductions section ────────────────────────────────────────────────────
    cy -= 32;
    t("DEDUCTIONS", 48, cy, { font: bold, size: 8, color: AMBER });
    cy -= 22;

    const uifLabel = breakdown.totalHours > 24
        ? `UIF — employee contribution (1% of capped base)`
        : `UIF — not applicable (worker ≤ 24 hours this period)`;
    t(uifLabel, 48, cy, { font: regular, size: 10, color: SLATE });
    t(`-R ${breakdown.deductions.uifEmployee.toFixed(2)}`, width - 48, cy, { font: regular, size: 10, color: RED, align: "right" });
    cy -= 20;

    if (payslip.includeAccommodation && breakdown.deductions.accommodation) {
        t(`Accommodation deduction (max 10% of gross — SD7)`, 48, cy, { font: regular, size: 10, color: SLATE });
        t(`-R ${breakdown.deductions.accommodation.toFixed(2)}`, width - 48, cy, { font: regular, size: 10, color: RED, align: "right" });
        cy -= 20;
    }

    cy -= 6;
    line(cy + 2);
    cy -= 16;
    t("Total Deductions", 48, cy, { font: bold, size: 11 });
    t(`R ${breakdown.deductions.total.toFixed(2)}`, width - 48, cy, { font: bold, size: 11, align: "right" });

    // ── Net Pay banner ────────────────────────────────────────────────────────
    // Space below total deductions
    cy -= 24;
    const netBannerHeight = 52;
    cy -= netBannerHeight; // cy is now the bottom of the Net Pay rectangle

    // Draw Net Pay Background
    rect(48, cy, width - 96, netBannerHeight, AMBER);

    // Text is drawn relative to cy (baseline is ~18px from bottom)
    t("NET PAY", 68, cy + 20, { font: bold, size: 12, color: WHITE });
    t(`R ${breakdown.netPay.toFixed(2)}`, width - 68, cy + 16, { font: bold, size: 24, color: WHITE, align: "right" });

    // ── Employer contribution note ────────────────────────────────────────────
    const empNoteHeight = 44;
    cy -= empNoteHeight; // cy is now the bottom of employer note rectangle

    // Draw Employer Note Background
    rect(48, cy, width - 96, empNoteHeight, LIGHT_BG);

    // Text inside Employer Note
    t("Employer Contributions (for your records — not deducted from worker):", 68, cy + 24, { font: bold, size: 8.5, color: SLATE });
    t(`UIF employer contribution (1%): R ${breakdown.employerContributions.uifEmployer.toFixed(2)}`, 68, cy + 10, { font: regular, size: 9, color: SLATE });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = 44;
    line(footerY + 18);
    t(
        "Generated by LekkerLedger — in compliance with the Basic Conditions of Employment Act (BCEA) and Sectoral Determination 7 (Domestic Workers).",
        48, footerY + 6,
        { font: regular, size: 7.5, color: SLATE }
    );
    t("lekkerledger.app · By Nightshift Labs ZA · Data processed locally — never stored on external servers.", 48, footerY - 8, {
        font: regular, size: 7, color: rgb(0.65, 0.6, 0.55),
    });

    return pdfDoc.save();
}
