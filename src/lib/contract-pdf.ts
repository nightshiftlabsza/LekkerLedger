import { PDFDocument } from "pdf-lib";
import { Employee, EmployerSettings } from "./schema";
import { format } from "date-fns";
import { getNMWForDate } from "./legal/registry";
import { PDF_COLORS } from "./pdf";
import { loadPdfFonts } from "./pdf-fonts";

export async function generateEmploymentContract(
    employee: Employee,
    settings: EmployerSettings
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Exact IBM Plex Fonts loaded from local TTF files as per guidelines
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 50;
    const BODY_W = PAGE_W - MARGIN * 2;

    const startDate = employee.startDate ? new Date(employee.startDate) : new Date();
    const nmw = getNMWForDate(startDate);
    const effectiveDate = format(startDate, "d MMMM yyyy");
    const todayStr = format(new Date(), "d MMMM yyyy");

    // Helper: add a new page with ledger motif and footer
    const addPage = () => {
        const p = pdfDoc.addPage([PAGE_W, PAGE_H]);

        // Civic Ledger BACKGROUND
        p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PDF_COLORS.PAPER });

        // Footer on every page
        const footerText = "LekkerLedger.app · Civic Ledger Design · BCEA Compliant";
        p.drawText(footerText, {
            x: PAGE_W / 2 - sansRegular.widthOfTextAtSize(footerText, 7) / 2,
            y: 25,
            size: 7,
            font: sansRegular,
            color: PDF_COLORS.TEXT_MUTED,
        });
        p.drawLine({ start: { x: MARGIN, y: 38 }, end: { x: PAGE_W - MARGIN, y: 38 }, thickness: 0.5, color: PDF_COLORS.BORDER });
        return p;
    };

    // ── PAGE 1: Header + Parties ──────────────────────────────────────────────
    const p1 = addPage();

    // Clean paper header instead of dark band
    p1.drawText("LekkerLedger", { x: MARGIN, y: PAGE_H - 60, size: 22, font: serifBold, color: PDF_COLORS.TEXT });

    p1.drawText("EMPLOYMENT CONTRACT", {
        x: PAGE_W - MARGIN - serifBold.widthOfTextAtSize("EMPLOYMENT CONTRACT", 18),
        y: PAGE_H - 60,
        size: 18, font: serifBold, color: PDF_COLORS.PRIMARY_GREEN,
    });

    p1.drawText("Domestic Worker Agreement · BCEA 1997", {
        x: PAGE_W - MARGIN - sansRegular.widthOfTextAtSize("Domestic Worker Agreement · BCEA 1997", 9),
        y: PAGE_H - 74,
        size: 9, font: sansRegular, color: PDF_COLORS.TEXT_MUTED,
    });

    // Header Rule (Ledger style)
    p1.drawLine({ start: { x: MARGIN, y: PAGE_H - 90 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 90 }, thickness: 1.5, color: PDF_COLORS.PRIMARY_GREEN });

    p1.drawText(`Effective Date: ${effectiveDate}   | Generated: ${todayStr} `, {
        x: MARGIN,
        y: PAGE_H - 110,
        size: 8, font: sansRegular, color: PDF_COLORS.TEXT_MUTED,
    });

    let cy = PAGE_H - 140;

    const section = (page: ReturnType<typeof addPage>, title: string, y: number) => {
        // Flat ledger section header
        page.drawRectangle({ x: MARGIN, y: y - 6, width: BODY_W, height: 20, color: PDF_COLORS.SURFACE, borderColor: PDF_COLORS.BORDER, borderWidth: 0.5 });
        page.drawLine({ start: { x: MARGIN, y: y + 14 }, end: { x: MARGIN, y: y - 6 }, thickness: 3, color: PDF_COLORS.PRIMARY_GREEN });
        page.drawText(title, { x: MARGIN + 10, y: y + 4, size: 9, font: sansBold, color: PDF_COLORS.TEXT });
    };

    const row = (page: ReturnType<typeof addPage>, label: string, value: string, y: number) => {
        page.drawText(label + ":", { x: MARGIN + 8, y, size: 9, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
        page.drawText(value || "(Not provided)", { x: MARGIN + 160, y, size: 9, font: sansRegular, color: PDF_COLORS.TEXT });
        page.drawLine({ start: { x: MARGIN, y: y - 5 }, end: { x: PAGE_W - MARGIN, y: y - 5 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });
    };

    // Preamble
    p1.drawText("This agreement is entered into between the Employer and the Employee named below,", {
        x: MARGIN, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: BODY_W,
    });
    cy -= 16;
    p1.drawText("in accordance with the Basic Conditions of Employment Act No. 75 of 1997 (BCEA) and the", {
        x: MARGIN, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: BODY_W,
    });
    cy -= 16;
    p1.drawText("Sectoral Determination 7 (Domestic Worker Sector, South Africa).", {
        x: MARGIN, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: BODY_W,
    });
    cy -= 35;

    // Section 1: Employer
    section(p1, "1. EMPLOYER DETAILS", cy);
    cy -= 30;
    row(p1, "Name / Business", settings.employerName || "(Not set)", cy); cy -= 18;
    row(p1, "Address", settings.employerAddress || "(Not set)", cy); cy -= 18;
    row(p1, "UIF Reference Number", settings.uifRefNumber || "(Not set)", cy); cy -= 18;

    cy -= 25;

    // Section 2: Employee
    section(p1, "2. EMPLOYEE DETAILS", cy);
    cy -= 30;
    row(p1, "Full Name", employee.name, cy); cy -= 18;
    row(p1, "SA ID / Passport", employee.idNumber || "(Not provided)", cy); cy -= 18;
    row(p1, "Phone Number", employee.phone || "(Not provided)", cy); cy -= 18;
    row(p1, "Job Title / Role", employee.role, cy); cy -= 18;
    row(p1, "Start Date", effectiveDate, cy); cy -= 18;

    cy -= 25;

    // Section 3: Remuneration
    section(p1, "3. REMUNERATION", cy);
    cy -= 30;
    row(p1, "Hourly Rate", `R ${employee.hourlyRate.toFixed(2)} per hour`, cy); cy -= 18;
    row(p1, "National Min. Wage (NMW)", `R ${nmw.toFixed(2)} per hour(SD7 current)`, cy); cy -= 18;
    row(p1, "Pay Frequency", employee.frequency || "Monthly", cy); cy -= 18;
    const uifNote = "1% employee contribution deducted from gross earnings where applicable (BCEA S.86).";
    p1.drawText(uifNote, { x: MARGIN + 8, y: cy, size: 8, font: sansRegular, color: PDF_COLORS.TEXT_MUTED, maxWidth: BODY_W - 10 });
    cy -= 18;

    cy -= 25;

    // Section 4: Working Hours
    section(p1, "4. WORKING HOURS", cy);
    cy -= 30;
    const hoursPerDay = employee.ordinaryHoursPerDay || 8;
    row(p1, "Ordinary Hours/Day", `${hoursPerDay} hours`, cy); cy -= 18;
    row(p1, "Ordinary Hours/Week", `${hoursPerDay * 5} hours(Mon–Sat, max 45 / week per BCEA S.9)`, cy); cy -= 18;
    row(p1, "Works Sundays", employee.ordinarilyWorksSundays ? "Yes (1.5x rate applies)" : "No (2x rate applies if required)", cy); cy -= 18;
    row(p1, "Overtime Rate", "1.5x ordinary for hours > 45/week (BCEA S.10)", cy); cy -= 18;
    row(p1, "Sunday / PH Rate", "2.0x ordinary (SD7 S.6–7)", cy); cy -= 18;

    // ── PAGE 2: Leave + Deductions + Clauses ─────────────────────────────────
    const p2 = addPage();
    cy = PAGE_H - 70;

    // Section 5: Leave
    section(p2, "5. LEAVE ENTITLEMENTS (BCEA S.20–30)", cy);
    cy -= 30;
    const leaveRows = [
        ["Annual Leave", "3 weeks (15 working days) per 12-month cycle (BCEA S.20)."],
        ["Sick Leave", "1 day per 26 days worked (1st 6 months). Then: days normally worked in 6 weeks per 36 months."],
        ["Family Responsibility", "5 days per year (employed > 4 months & >= 4 days/week — BCEA S.27)."],
        ["Maternity Leave", "4 consecutive months (unpaid — claimable via UIF — BCEA S.25)."],
        ["Public Holidays", "All workers entitled to public holidays on full pay (BCEA S.18)."],
    ];
    for (const [label, value] of leaveRows) {
        p2.drawText(`${label}: `, { x: MARGIN + 8, y: cy, size: 9, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
        p2.drawText(value, { x: MARGIN + 170, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: BODY_W - 170 });
        p2.drawLine({ start: { x: MARGIN, y: cy - 5 }, end: { x: PAGE_W - MARGIN, y: cy - 5 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });
        cy -= 22;
    }

    cy -= 10;

    // Section 6: Deductions
    section(p2, "6. DEDUCTIONS (SD7 S.19)", cy);
    cy -= 30;
    const dedRows = [
        ["UIF", "1% of gross (up to monthly cap) — BCEA S.86 & UIF Act."],
        ["Accommodation", "Max 10% of gross wage if employer provides accommodation (SD7 S.19)."],
        ["Other", "No deduction may be made without written consent of the employee."],
    ];
    for (const [label, value] of dedRows) {
        p2.drawText(`${label}: `, { x: MARGIN + 8, y: cy, size: 9, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
        p2.drawText(value, { x: MARGIN + 170, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: BODY_W - 170 });
        p2.drawLine({ start: { x: MARGIN, y: cy - 5 }, end: { x: PAGE_W - MARGIN, y: cy - 5 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });
        cy -= 22;
    }

    cy -= 10;

    // Section 7: Notice Period
    section(p2, "7. NOTICE PERIOD (BCEA S.37)", cy);
    cy -= 30;
    p2.drawText(
        "• <= 6 months employed: 1 week notice required from either party.\n" +
        "• > 6 months employed: 4 weeks notice required from either party.\n" +
        "• Notice must be given in writing. Notice may not be given during leave periods.",
        { x: MARGIN + 8, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, lineHeight: 16, maxWidth: BODY_W - 10 }
    );
    cy -= 55;

    // Section 8: Record Keeping
    section(p2, "8. RECORD KEEPING (BCEA S.31)", cy);
    cy -= 30;
    p2.drawText(
        "The employer must keep a written record of employment particulars for each worker.\n" +
        "Records must be retained for 3 years after termination of employment (BCEA S.31).",
        { x: MARGIN + 8, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, lineHeight: 16, maxWidth: BODY_W - 10 }
    );
    cy -= 40;

    // Section 9: General
    section(p2, "9. GENERAL CONDITIONS", cy);
    cy -= 30;
    const general = [
        "Both parties agree to treat each other with dignity and respect.",
        "This contract is governed by the laws of the Republic of South Africa.",
        "Any dispute arising from this contract shall first be referred to the CCMA for conciliation.",
        "No variation/amendment of this contract is valid unless agreed to in writing.",
    ];
    for (const clause of general) {
        p2.drawText(`• ${clause} `, { x: MARGIN + 8, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: BODY_W - 10 });
        cy -= 18;
    }

    cy -= 30;

    // Signatures
    section(p2, "10. SIGNATURES", cy);
    cy -= 50;

    // Employer signature block
    p2.drawLine({ start: { x: MARGIN, y: cy }, end: { x: MARGIN + 180, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    p2.drawText("Employer Signature", { x: MARGIN, y: cy - 14, size: 8, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
    p2.drawText(settings.employerName || "Employer", { x: MARGIN, y: cy - 26, size: 8, font: sansRegular, color: PDF_COLORS.TEXT });
    p2.drawText(`Date: ____________________`, { x: MARGIN, y: cy - 38, size: 8, font: sansRegular, color: PDF_COLORS.TEXT_MUTED });

    // Employee signature block
    const rCol = PAGE_W - MARGIN - 180;
    p2.drawLine({ start: { x: rCol, y: cy }, end: { x: rCol + 180, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    p2.drawText("Employee Signature", { x: rCol, y: cy - 14, size: 8, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
    p2.drawText(employee.name, { x: rCol, y: cy - 26, size: 8, font: sansRegular, color: PDF_COLORS.TEXT });
    p2.drawText(`Date: ____________________`, { x: rCol, y: cy - 38, size: 8, font: sansRegular, color: PDF_COLORS.TEXT_MUTED });

    // BCEA Compliance Seal (Civic Gold)
    const sealX = PAGE_W / 2;
    const sealY = 95;
    p2.drawCircle({ x: sealX, y: sealY, size: 28, color: PDF_COLORS.SURFACE, borderColor: PDF_COLORS.FOCUS_GOLD, borderWidth: 1.5 });
    p2.drawText("BCEA", { x: sealX - sansBold.widthOfTextAtSize("BCEA", 7) / 2, y: sealY + 5, size: 7, font: sansBold, color: PDF_COLORS.FOCUS_GOLD });
    p2.drawText("SD7", { x: sealX - sansRegular.widthOfTextAtSize("SD7", 6) / 2, y: sealY - 5, size: 6, font: sansRegular, color: PDF_COLORS.TEXT_MUTED });

    return pdfDoc.save();
}
