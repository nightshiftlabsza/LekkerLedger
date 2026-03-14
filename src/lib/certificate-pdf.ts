import { PDFDocument } from "pdf-lib";
import { Employee, EmployerSettings } from "./schema";
import { format } from "date-fns";
import { getNMWForDate } from "./legal/registry";
import { PDF_COLORS } from "./pdf-theme";
import { loadPdfFonts } from "./pdf-fonts";
import { drawPdfBrandLockup } from "./pdf-brand";

export async function generateCertificateOfService(
    employee: Employee,
    settings: EmployerSettings
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 50;

    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let cy: number;

    // Civic Ledger BACKGROUND
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PDF_COLORS.PAPER });

    // Clean paper header instead of dark band
    drawPdfBrandLockup(page, {
        x: MARGIN,
        y: PAGE_H - 60,
        size: 24,
        serifBold,
        sansBold,
        subtitle: "HOUSEHOLD EMPLOYMENT RECORD",
    });

    page.drawText("CERTIFICATE OF SERVICE", {
        x: PAGE_W - MARGIN - serifBold.widthOfTextAtSize("CERTIFICATE OF SERVICE", 18),
        y: PAGE_H - 60,
        size: 16,
        font: serifBold,
        color: PDF_COLORS.TEXT,
    });

    page.drawText("(Section 42 of the Basic Conditions of Employment Act)", {
        x: PAGE_W - MARGIN - sansRegular.widthOfTextAtSize("(Section 42 of the Basic Conditions of Employment Act)", 9),
        y: PAGE_H - 74,
        size: 9,
        font: sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    // Header Rule (Ledger style)
    page.drawLine({ start: { x: MARGIN, y: PAGE_H - 90 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 90 }, thickness: 1, color: PDF_COLORS.BORDER });

    // Sections
    function section(title: string, y: number) {
        page.drawText(title.toUpperCase(), { x: MARGIN, y, size: 9, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
        page.drawLine({ start: { x: MARGIN, y: y - 6 }, end: { x: PAGE_W - MARGIN, y: y - 6 }, thickness: 0.5, color: PDF_COLORS.BORDER });
    }

    function row(label: string, value: string, y: number) {
        page.drawText(label + ":", { x: MARGIN + 8, y, size: 9, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
        page.drawText(value || "(Not set)", { x: MARGIN + 140, y, size: 9, font: sansRegular, color: PDF_COLORS.TEXT });
        page.drawLine({ start: { x: MARGIN, y: y - 5 }, end: { x: PAGE_W - MARGIN, y: y - 5 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });
    }

    // Employer
    cy = PAGE_H - 140;
    section("1. Employer Details", cy);
    cy -= 30;
    row("Employer Name", settings.employerName || "", cy);
    cy -= 18;
    row("Address", settings.employerAddress || "", cy);
    cy -= 18;
    row("UIF Ref Number", settings.uifRefNumber || "", cy);

    // Employee
    cy -= 45;
    section("2. Employee Details", cy);
    cy -= 30;
    row("Full Name", employee.name, cy);
    cy -= 18;
    row("ID / Passport", employee.idNumber || "", cy);
    cy -= 18;
    row("Job Title / Role", employee.role, cy);

    // Context
    cy -= 45;
    section("3. Period of Service", cy);
    cy -= 30;
    const startDate = employee.startDate ? new Date(employee.startDate) : new Date();
    const nmw = getNMWForDate(startDate);

    row("Commencement", format(startDate, "d MMMM yyyy"), cy);
    cy -= 18;
    row("Termination", format(new Date(), "d MMMM yyyy"), cy);
    cy -= 18;
    row("Final Rate", `R ${employee.hourlyRate.toFixed(2)} per hour (Min: R ${nmw.toFixed(2)})`, cy);

    // Duties
    cy -= 45;
    page.drawText("Description of Work Performed:", { x: MARGIN, y: cy, size: 9, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
    cy -= 18;
    const text = `This certificate records that the employee worked as ${employee.role || "an employee"} during the period shown above.`;
    page.drawText(text, { x: MARGIN, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: PAGE_W - MARGIN * 2 });

    // Signatures
    cy = 150;
    page.drawLine({ start: { x: MARGIN, y: cy }, end: { x: MARGIN + 150, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    page.drawText("Employer Signature", { x: MARGIN, y: cy - 14, size: 8, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
    page.drawText(settings.employerName || "Employer", { x: MARGIN, y: cy - 26, size: 8, font: sansRegular, color: PDF_COLORS.TEXT });

    const empR = PAGE_W - MARGIN - 150;
    page.drawLine({ start: { x: empR, y: cy }, end: { x: empR + 150, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    page.drawText("Employee Signature", { x: empR, y: cy - 14, size: 8, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
    page.drawText(employee.name, { x: empR, y: cy - 26, size: 8, font: sansRegular, color: PDF_COLORS.TEXT });

    page.drawRectangle({
        x: MARGIN,
        y: 178,
        width: PAGE_W - MARGIN * 2,
        height: 34,
        color: PDF_COLORS.SURFACE,
        borderColor: PDF_COLORS.BORDER,
        borderWidth: 0.5,
    });
    page.drawText(
        "Review the details before issuing this certificate and keep a signed copy with the employee's records.",
        { x: MARGIN + 10, y: 191, size: 8, font: sansRegular, color: PDF_COLORS.TEXT_MUTED, maxWidth: PAGE_W - MARGIN * 2 - 20 },
    );

    // Footer
    page.drawLine({ start: { x: MARGIN, y: 38 }, end: { x: PAGE_W - MARGIN, y: 38 }, thickness: 0.5, color: PDF_COLORS.BORDER });
    const footerText = "Prepared from your saved details. Review before issuing and keep the final copy with your records.";
    page.drawText(footerText, { x: PAGE_W / 2 - sansRegular.widthOfTextAtSize(footerText, 7) / 2, y: 25, size: 7, font: sansRegular, color: PDF_COLORS.TEXT_MUTED });

    return pdfDoc.save();
}
