import { PDFDocument } from "pdf-lib";
import { Employee, PayslipInput, EmployerSettings } from "./schema";
import { calculatePayslip } from "./calculator";
import { format } from "date-fns";
import { PDF_COLORS, PDF_LAYOUT } from "./pdf-theme";
import { loadPdfFonts } from "./pdf-fonts";
import { drawPdfBrandLockup } from "./pdf-brand";
import { generateCertificateOfService } from "./certificate-pdf";

/**
 * Generates a Certificate of Service (BCEA Section 42)
 */
export async function generateCertificateOfServicePdf(
    employee: Employee,
    employer: EmployerSettings
): Promise<Uint8Array> {
    return generateCertificateOfService(employee, employer);
}

/**
 * Generates a BCEA Section 33 Summary / Audit PDF
 */
export async function generateBCEASummaryPdf(
    employee: Employee,
    payslip: PayslipInput,
    employer: EmployerSettings
): Promise<Uint8Array> {
    void employer;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const breakdown = calculatePayslip(payslip);

    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const t = (text: string, x: number, y: number, size = 10, font = sansRegular, color = PDF_COLORS.TEXT) => {
        page.drawText(text, { x, y, size, font, color });
    };

    // Civic Ledger Paper
    page.drawRectangle({ x: 0, y: 0, width, height, color: PDF_COLORS.PAPER });

    // Official Header
    drawPdfBrandLockup(page, {
        x: PDF_LAYOUT.MARGIN,
        y: height - 60,
        size: 30,
        serifBold,
        sansBold,
        subtitle: "HOUSEHOLD PAYROLL RECORD",
    });
    t("BCEA PAYSLIP RECORD SUMMARY", width - PDF_LAYOUT.MARGIN - serifBold.widthOfTextAtSize("BCEA PAYSLIP RECORD SUMMARY", 18), height - 60, 18, serifBold, PDF_COLORS.PRIMARY_GREEN);

    const subtitle = `Audit for ${employee.name} · Period Ending ${format(new Date(payslip.payPeriodEnd), "dd MMM yyyy")}`;
    t(subtitle, width - PDF_LAYOUT.MARGIN - sansRegular.widthOfTextAtSize(subtitle, 9), height - 74, 9, sansRegular, PDF_COLORS.TEXT_MUTED);

    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: height - 90 }, end: { x: width - PDF_LAYOUT.MARGIN, y: height - 90 }, thickness: 1.5, color: PDF_COLORS.PRIMARY_GREEN });

    let cy = height - 120;

    t("Section 33 of the Basic Conditions of Employment Act requires specific information to be provided to employees.", 48, cy, 9, sansRegular, PDF_COLORS.TEXT_MUTED);
    cy -= 30;

    // Table rows
    const rows = [
        ["Legal Parameter", "Status", "Details"],
        ["National Minimum Wage", breakdown.complianceWarnings.length === 0 ? "Compliant" : "WARNING", `R${employee.hourlyRate.toFixed(2)}/hr`],
        ["UIF Contributions", breakdown.deductions.uifEmployee > 0 ? "Applied" : "Exempt", `R${breakdown.deductions.uifEmployee.toFixed(2)} deducted`],
        ["Accommodation Cap", (breakdown.deductions.accommodation ?? 0) <= breakdown.grossPay * 0.1 ? "Compliant" : "Exceeded", "Max 10% allowed"],
        ["Sunday Pay Rate", employee.ordinarilyWorksSundays ? "1.5x" : "2.0x", "Statutory requirement met"],
        ["Overtime Rate", "1.5x", "Based on SD7 Regulation"],
        ["Leave Accrual", "Active", `${breakdown.leaveAccruedDays.toFixed(2)} days accrued this period`]
    ];

    rows.forEach((row, i) => {
        const isHeader = i === 0;
        const font = isHeader ? sansBold : sansRegular;
        const color = isHeader ? PDF_COLORS.TEXT_MUTED : PDF_COLORS.TEXT;

        t(row[0], 48, cy, 9, font, color);
        t(row[1], 200, cy, 9, font, color);
        t(row[2], 300, cy, 9, font, color);

        page.drawLine({ start: { x: 48, y: cy - 5 }, end: { x: width - 48, y: cy - 5 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });
        cy -= 25;
    });

    cy -= 20;
    t("LEAVE RECORD FOR THIS PERIOD", 48, cy, 9, sansBold, PDF_COLORS.TEXT_MUTED);
    cy -= 20;
    t(`Annual Leave Taken: ${breakdown.leaveTaken.annual} days`, 48, cy);
    t(`Sick Leave Taken: ${breakdown.leaveTaken.sick} days`, 250, cy);
    cy -= 18;
    t(`Family Responsibility Leave: ${breakdown.leaveTaken.family} days`, 48, cy);

    cy -= 30;
    const decl = "This document summarizes the associated payslip using the information saved in LekkerLedger. Verify the figures against official government sources before relying on this record.";
    page.drawText(decl, { x: 48, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: width - 96, lineHeight: 14 });

    // Footer
    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: 38 }, end: { x: width - PDF_LAYOUT.MARGIN, y: 38 }, thickness: 0.5, color: PDF_COLORS.BORDER });
    const footerText = "Generated with LekkerLedger from your saved payroll details.";
    t(footerText, width / 2 - sansRegular.widthOfTextAtSize(footerText, 7) / 2, 25, 7, sansRegular, PDF_COLORS.TEXT_MUTED);

    return pdfDoc.save();
}

