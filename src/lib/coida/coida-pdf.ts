import { PDFDocument, rgb } from "pdf-lib";
import { format } from "date-fns";
import { Employee, EmployerSettings, PayslipInput } from "../schema";
import { PDF_COLORS, PDF_MARGIN } from "../pdf";
import { RoeData } from "./roe";
import { calculatePayslip } from "../calculator";

/**
 * Generates the "Detailed Payroll Report" PDF for COIDA ROE submission.
 * This is a mandatory upload document for the Compensation Fund.
 */
export async function generateRoePayrollPdfBytes(
    roeData: RoeData,
    employees: Employee[],
    allPayslips: PayslipInput[],
    settings: EmployerSettings
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    const { loadPdfFonts } = await import("../pdf-fonts");
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const t = (text: string, x: number, y: number, opts: any = {}) => {
        const font = opts.font ?? sansRegular;
        const size = opts.size ?? 9;
        const color = opts.color ?? PDF_COLORS.TEXT;
        let tx = x;
        if (opts.align === "right") {
            const w = font.widthOfTextAtSize(text, size);
            tx = x - w;
        }
        page.drawText(text, { x: tx, y, size, font, color });
    };

    const drawLine = (y: number) => {
        page.drawLine({
            start: { x: PDF_MARGIN, y },
            end: { x: width - PDF_MARGIN, y },
            thickness: 0.5,
            color: PDF_COLORS.BORDER
        });
    };

    // Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: PDF_COLORS.PAPER });

    let cy = height - 60;

    // Header
    t("LekkerLedger ROE Pack", PDF_MARGIN, cy, { font: serifBold, size: 18 });
    t("ANNUAL DETAILED PAYROLL REPORT", PDF_MARGIN, cy - 18, { font: sansBold, size: 10, color: PDF_COLORS.PRIMARY_GREEN });
    t(`Assessment Year: ${roeData.startDate.getFullYear()}/${roeData.endDate.getFullYear()}`, width - PDF_MARGIN, cy, { align: "right", font: sansBold });

    cy -= 50;
    drawLine(cy);
    cy -= 20;

    // Employer Info
    t("EMPLOYER DETAILS", PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
    t(settings.employerName || "Not set", PDF_MARGIN, cy - 15, { font: sansBold, size: 10 });
    t(`CF Number: ${settings.cfNumber || "Not provided"}`, PDF_MARGIN, cy - 28, { size: 8 });

    cy -= 50;

    // Summary Table Header
    t("Employee Name", PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
    t("ID Number", width / 2 - 50, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
    t("Gross Wages", width - PDF_MARGIN - 80, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    t("Capped Earnings", width - PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    cy -= 6;
    drawLine(cy);
    cy -= 18;

    // Group payslips by employee
    const periodPayslips = allPayslips.filter(ps => {
        const end = new Date(ps.payPeriodEnd);
        return end >= roeData.startDate && end <= roeData.endDate;
    });

    employees.forEach(emp => {
        const empPayslips = periodPayslips.filter(ps => ps.employeeId === emp.id);
        if (empPayslips.length === 0) return;

        let totalGross = 0;
        empPayslips.forEach(ps => {
            const res = calculatePayslip(ps);
            totalGross += res.grossPay;
        });

        const capped = Math.min(totalGross, roeData.maxCapPerEmployee);

        t(emp.name, PDF_MARGIN, cy, { size: 9 });
        t(emp.idNumber || "N/A", width / 2 - 50, cy, { size: 9 });
        t(`R ${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, width - PDF_MARGIN - 80, cy, { size: 9, align: "right" });
        t(`R ${capped.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, width - PDF_MARGIN, cy, { size: 9, align: "right", font: sansBold });

        cy -= 15;
        if (cy < 80) {
            // Add new page if needed (simplified for now)
        }
    });

    cy -= 10;
    drawLine(cy);
    cy -= 20;

    // Totals
    t("REPORT TOTALS", PDF_MARGIN, cy, { font: sansBold, size: 10 });
    t(`R ${roeData.actualEarnings.toLocaleString()}`, width - PDF_MARGIN, cy, { font: serifBold, size: 14, align: "right", color: PDF_COLORS.PRIMARY_GREEN });
    t("Total Declared Earnings (Capped)", width - PDF_MARGIN, cy - 12, { size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    // Footer
    t(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, PDF_MARGIN, 40, { size: 7, color: PDF_COLORS.TEXT_MUTED });
    t("LekkerLedger.app · COIDA Peace of Mind", width - PDF_MARGIN, 40, { size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    return pdfDoc.save();
}

/**
 * Generates a "Confirmation of Employer Details" PDF.
 */
export async function generateEmployerConfirmationPdfBytes(
    settings: EmployerSettings
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const { loadPdfFonts } = await import("../pdf-fonts");
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const t = (text: string, x: number, y: number, opts: any = {}) => {
        const font = opts.font ?? sansRegular;
        const size = opts.size ?? 9;
        const color = opts.color ?? PDF_COLORS.TEXT;
        let tx = x;
        if (opts.align === "right") {
            const w = font.widthOfTextAtSize(text, size);
            tx = x - w;
        }
        page.drawText(text, { x: tx, y, size, font, color });
    };

    page.drawRectangle({ x: 0, y: 0, width, height, color: PDF_COLORS.PAPER });

    let cy = height - 100;
    t("CONFIRMATION OF EMPLOYER DETAILS", width / 2, cy, { font: serifBold, size: 16, align: "center", color: PDF_COLORS.PRIMARY_GREEN });

    cy -= 60;
    const drawField = (label: string, value: string) => {
        t(label, PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
        t(value || "Not provided", PDF_MARGIN, cy - 15, { size: 11 });
        cy -= 40;
    };

    drawField("Employer Name / Household Name", settings.employerName);
    drawField("ID Number of Employer", settings.employerIdNumber);
    drawField("CF Registration Number", settings.cfNumber);
    drawField("UIF Registration Number", settings.uifRefNumber);
    drawField("Physical Address", settings.employerAddress);
    drawField("Contact Number", settings.phone);

    t("DECLARATION", PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
    cy -= 15;
    t("I hereby confirm that the details above are correct for the purposes of my Return of Earnings submission.", PDF_MARGIN, cy, { size: 9 });

    cy -= 60;
    page.drawLine({ start: { x: PDF_MARGIN, y: cy }, end: { x: PDF_MARGIN + 200, y: cy }, thickness: 1, color: PDF_COLORS.TEXT });
    t("Signature", PDF_MARGIN, cy - 10, { size: 7 });
    t(`Date: ${format(new Date(), "yyyy-MM-dd")}`, width - PDF_MARGIN, cy, { align: "right" });

    return pdfDoc.save();
}
