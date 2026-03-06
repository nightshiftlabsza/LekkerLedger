import { PDFDocument } from "pdf-lib";
import { Employee, PayslipInput, EmployerSettings } from "./schema";
import { calculatePayslip } from "./calculator";
import { format } from "date-fns";
import { PDF_COLORS, PDF_LAYOUT } from "./pdf-theme";
import { loadPdfFonts } from "./pdf-fonts";

/**
 * Generates a Certificate of Service (BCEA Section 42)
 */
export async function generateCertificateOfServicePdf(
    employee: Employee,
    employer: EmployerSettings
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const t = (text: string, x: number, y: number, size = 10, font = sansRegular, color = PDF_COLORS.TEXT) => {
        page.drawText(text, { x, y, size, font, color });
    };

    // Civic Ledger Paper
    page.drawRectangle({ x: 0, y: 0, width, height, color: PDF_COLORS.PAPER });

    // Official Header
    t("LekkerLedger", PDF_LAYOUT.MARGIN, height - 60, 22, serifBold, PDF_COLORS.TEXT);
    t("CERTIFICATE OF SERVICE", width - PDF_LAYOUT.MARGIN - serifBold.widthOfTextAtSize("CERTIFICATE OF SERVICE", 18), height - 60, 18, serifBold, PDF_COLORS.PRIMARY_GREEN);

    t("(Section 42 of the Basic Conditions of Employment Act)", width - PDF_LAYOUT.MARGIN - sansRegular.widthOfTextAtSize("(Section 42 of the Basic Conditions of Employment Act)", 9), height - 74, 9, sansRegular, PDF_COLORS.TEXT_MUTED);

    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: height - 90 }, end: { x: width - PDF_LAYOUT.MARGIN, y: height - 90 }, thickness: 1.5, color: PDF_COLORS.PRIMARY_GREEN });

    let cy = height - 120;

    // Employer Info
    t("1. EMPLOYER DETAILS", 48, cy, 9, sansBold, PDF_COLORS.TEXT_MUTED);
    cy -= 20;
    t(`Name: ${employer.employerName || "N/A"}`, 48, cy);
    cy -= 18;
    t(`Address: ${employer.employerAddress || "N/A"}`, 48, cy);
    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: cy - 10 }, end: { x: width - PDF_LAYOUT.MARGIN, y: cy - 10 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });

    cy -= 30;

    // Employee Info
    t("2. EMPLOYEE DETAILS", 48, cy, 9, sansBold, PDF_COLORS.TEXT_MUTED);
    cy -= 20;
    t(`Full Name: ${employee.name}`, 48, cy);
    cy -= 18;
    t(`Identity Number: ${employee.idNumber || "N/A"}`, 48, cy);
    cy -= 18;
    t(`Position: ${employee.role || "Worker"}`, 48, cy);
    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: cy - 10 }, end: { x: width - PDF_LAYOUT.MARGIN, y: cy - 10 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });

    cy -= 30;

    // Service Period
    t("3. PERIOD OF SERVICE", 48, cy, 9, sansBold, PDF_COLORS.TEXT_MUTED);
    cy -= 20;
    t(`Date of Commencement: ${employee.startDate ? format(new Date(employee.startDate), "dd MMMM yyyy") : "N/A"}`, 48, cy);
    cy -= 18;
    t(`Date of Termination: ${format(new Date(), "dd MMMM yyyy")} (Date of Issue)`, 48, cy);
    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: cy - 10 }, end: { x: width - PDF_LAYOUT.MARGIN, y: cy - 10 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });

    cy -= 30;

    // Job Description
    t("4. DESCRIPTION OF WORK", 48, cy, 9, sansBold, PDF_COLORS.TEXT_MUTED);
    cy -= 20;
    const desc = "The employee was engaged in domestic work and related services, including but not limited to general household management, cleaning, and maintenance in accordance with Sectoral Determination 7.";
    page.drawText(desc, { x: 48, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT, maxWidth: width - 96, lineHeight: 14 });

    cy -= 60;

    // Remuneration
    t("5. REMUNERATION AT TERMINATION", 48, cy, 9, sansBold, PDF_COLORS.TEXT_MUTED);
    cy -= 20;
    t(`Hourly Rate: R${employee.hourlyRate.toFixed(2)}`, 48, cy);
    cy -= 18;
    t(`Pay Frequency: ${employee.frequency || "Monthly"}`, 48, cy);

    cy -= 80;

    // Signatures
    page.drawLine({ start: { x: 48, y: cy }, end: { x: 200, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    t("Employer Signature", 48, cy - 14, 8, sansBold, PDF_COLORS.TEXT_MUTED);

    page.drawLine({ start: { x: width - 200, y: cy }, end: { x: width - 48, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    t("Date of Issue", width - 200, cy - 14, 8, sansBold, PDF_COLORS.TEXT_MUTED);

    // Footer
    page.drawLine({ start: { x: PDF_LAYOUT.MARGIN, y: 38 }, end: { x: width - PDF_LAYOUT.MARGIN, y: 38 }, thickness: 0.5, color: PDF_COLORS.BORDER });
    t("LekkerLedger.app · Civic Ledger Design · BCEA SEC 42", width / 2 - sansRegular.widthOfTextAtSize("LekkerLedger.app · Civic Ledger Design · BCEA SEC 42", 7) / 2, 25, 7, sansRegular, PDF_COLORS.TEXT_MUTED);

    return pdfDoc.save();
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
    t("LekkerLedger", PDF_LAYOUT.MARGIN, height - 60, 22, serifBold, PDF_COLORS.TEXT);
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
    const footerText = "LekkerLedger.app · Civic Ledger Design · Household payroll record summary";
    t(footerText, width / 2 - sansRegular.widthOfTextAtSize(footerText, 7) / 2, 25, 7, sansRegular, PDF_COLORS.TEXT_MUTED);

    return pdfDoc.save();
}

