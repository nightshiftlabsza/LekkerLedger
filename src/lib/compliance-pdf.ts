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
        size: 24,
        serifBold,
        sansBold,
        subtitle: "HOUSEHOLD PAYROLL RECORD",
    });
    t("PAYSLIP RECORD SUMMARY", width - PDF_LAYOUT.MARGIN - serifBold.widthOfTextAtSize("PAYSLIP RECORD SUMMARY", 16), height - 60, 16, serifBold, PDF_COLORS.TEXT);

    const subtitle = `Summary for ${employee.name} · Period ending ${format(new Date(payslip.payPeriodEnd), "dd MMM yyyy")}`;
    t(subtitle, width - PDF_LAYOUT.MARGIN - sansRegular.widthOfTextAtSize(subtitle, 9), height - 74, 9, sansRegular, PDF_COLORS.TEXT_MUTED);

    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: height - 90 }, end: { x: width - PDF_LAYOUT.MARGIN, y: height - 90 }, thickness: 1, color: PDF_COLORS.BORDER });

    let cy = height - 120;

    t("This summary lists the main record items captured for the related payslip.", 48, cy, 9, sansRegular, PDF_COLORS.TEXT_MUTED);
    cy -= 30;

    // Table rows
    const rows = [
        ["Record item", "Status", "Details"],
        ["National minimum wage", breakdown.complianceWarnings.length === 0 ? "Within rate shown" : "Check rate", `R${employee.hourlyRate.toFixed(2)}/hr`],
        ["UIF Contributions", breakdown.deductions.uifEmployee > 0 ? "Applied" : "Exempt", `R${breakdown.deductions.uifEmployee.toFixed(2)} deducted`],
        ["Accommodation deduction", (breakdown.deductions.accommodation ?? 0) <= breakdown.grossPay * 0.1 ? "Within cap" : "Check amount", "10% cap reference"],
        ["Sunday pay rate", employee.ordinarilyWorksSundays ? "1.5x" : "2.0x", "Saved employee setting"],
        ["Overtime rate", "1.5x", "Saved payroll setting"],
        ["Leave accrual", "Recorded", `${breakdown.leaveAccruedDays.toFixed(2)} days accrued this period`]
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
    const decl = "Prepared from the payroll information saved for this payslip. Review the figures alongside your own records and current official guidance where needed.";
    page.drawText(decl, { x: 48, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: width - 96, lineHeight: 14 });

    // Footer
    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: 38 }, end: { x: width - PDF_LAYOUT.MARGIN, y: 38 }, thickness: 0.5, color: PDF_COLORS.BORDER });
    const footerText = "Prepared from your saved payroll details. Review before sharing or filing.";
    t(footerText, width / 2 - sansRegular.widthOfTextAtSize(footerText, 7) / 2, 25, 7, sansRegular, PDF_COLORS.TEXT_MUTED);

    return pdfDoc.save();
}

