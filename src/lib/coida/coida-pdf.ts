import { PDFDocument, type PDFPage } from "pdf-lib";
import { format } from "date-fns";
import { Employee, EmployerSettings, PayslipInput } from "../schema";
import { PDF_COLORS, PDF_LAYOUT } from "../pdf-theme";
import { RoeData } from "./roe";
import { calculatePayslip } from "../calculator";
import { drawPdfBrandLockup } from "../pdf-brand";

const PAGE_SIZE: [number, number] = [595.28, 841.89];
const BOTTOM_MARGIN = 60;
const PDF_MARGIN = PDF_LAYOUT.MARGIN;

function formatCurrency(value: number): string {
    const rounded = value.toFixed(2);
    const [whole, cents] = rounded.split(".");
    return `R ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
}

function clipText(text: string, font: { widthOfTextAtSize: (value: string, size: number) => number }, size: number, maxWidth?: number): string {
    if (!maxWidth || font.widthOfTextAtSize(text, size) <= maxWidth) return text;
    let output = text;
    while (output.length > 0 && font.widthOfTextAtSize(`${output}...`, size) > maxWidth) {
        output = output.slice(0, -1);
    }
    return `${output}...`;
}

export async function generateRoePayrollPdfBytes(
    roeData: RoeData,
    employees: Employee[],
    allPayslips: PayslipInput[],
    settings: EmployerSettings
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const { loadPdfFonts } = await import("../pdf-fonts");
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const pageState = { page: pdfDoc.addPage(PAGE_SIZE), y: PAGE_SIZE[1] - 60 };

    const t = (page: PDFPage, text: string, x: number, y: number, opts: { align?: "left" | "right" | "center"; size?: number; font?: typeof sansRegular; color?: typeof PDF_COLORS.TEXT; maxWidth?: number } = {}) => {
        const font = opts.font ?? sansRegular;
        const size = opts.size ?? 9;
        const color = opts.color ?? PDF_COLORS.TEXT;
        const safeText = clipText(String(text ?? ""), font, size, opts.maxWidth);
        let tx = x;
        const width = font.widthOfTextAtSize(safeText, size);
        if (opts.align === "right") tx = x - width;
        if (opts.align === "center") tx = x - (width / 2);
        page.drawText(safeText, { x: tx, y, size, font, color });
    };

    const drawLine = (page: PDFPage, y: number) => {
        const { width } = page.getSize();
        page.drawLine({
            start: { x: PDF_MARGIN, y },
            end: { x: width - PDF_MARGIN, y },
            thickness: 0.5,
            color: PDF_COLORS.BORDER,
        });
    };

    const drawHeader = (page: PDFPage) => {
        const { width, height } = page.getSize();
        page.drawRectangle({ x: 0, y: 0, width, height, color: PDF_COLORS.PAPER });
        pageState.y = height - 60;
        drawPdfBrandLockup(page, {
            x: PDF_MARGIN,
            y: pageState.y,
            size: 24,
            serifBold,
            sansBold,
            subtitle: "COMPENSATION FUND RECORDS",
            titleSize: 20,
        });
        t(page, "Detailed payroll record", PDF_MARGIN + 34, pageState.y - 18, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, maxWidth: width / 2 });
        t(page, `Assessment Year: ${roeData.startDate.getFullYear()}/${roeData.endDate.getFullYear()}`, width - PDF_MARGIN, pageState.y, { align: "right", font: sansBold });

        pageState.y -= 50;
        drawLine(page, pageState.y);
        pageState.y -= 20;

        t(page, "EMPLOYER DETAILS", PDF_MARGIN, pageState.y, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
        t(page, settings.employerName || "Not set", PDF_MARGIN, pageState.y - 15, { font: sansBold, size: 10, maxWidth: width - (PDF_MARGIN * 2) - 120 });
        t(page, `CF Number: ${settings.cfNumber || "Not provided"}`, PDF_MARGIN, pageState.y - 28, { size: 8 });

        pageState.y -= 50;
        t(page, "Employee Name", PDF_MARGIN, pageState.y, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
        t(page, "ID Number", width / 2 - 50, pageState.y, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
        t(page, "Gross Wages", width - PDF_MARGIN - 90, pageState.y, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
        t(page, "Capped Earnings", width - PDF_MARGIN, pageState.y, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
        pageState.y -= 6;
        drawLine(page, pageState.y);
        pageState.y -= 18;
    };

    const ensureSpace = () => {
        if (pageState.y >= BOTTOM_MARGIN + 40) return;
        pageState.page = pdfDoc.addPage(PAGE_SIZE);
        drawHeader(pageState.page);
    };

    drawHeader(pageState.page);

    const periodPayslips = allPayslips.filter((payslip) => {
        const end = new Date(payslip.payPeriodEnd);
        return end >= roeData.startDate && end <= roeData.endDate;
    });

    for (const employee of employees) {
        const employeePayslips = periodPayslips.filter((payslip) => payslip.employeeId === employee.id);
        let totalGross = 0;
        for (const payslip of employeePayslips) {
            totalGross += calculatePayslip(payslip).grossPay;
        }
        const capped = Math.min(totalGross, roeData.maxCapPerEmployee);

        ensureSpace();
        const { width } = pageState.page.getSize();
        t(pageState.page, employee.name, PDF_MARGIN, pageState.y, { size: 9, maxWidth: width / 2 - 80 });
        t(pageState.page, employee.idNumber || "N/A", width / 2 - 50, pageState.y, { size: 9, maxWidth: 120 });
        t(pageState.page, formatCurrency(totalGross), width - PDF_MARGIN - 90, pageState.y, { size: 9, align: "right" });
        t(pageState.page, formatCurrency(capped), width - PDF_MARGIN, pageState.y, { size: 9, align: "right", font: sansBold });
        pageState.y -= 15;
    }

    pageState.y -= 10;
    drawLine(pageState.page, pageState.y);
    pageState.y -= 20;
    const totalPageWidth = pageState.page.getSize().width;
    t(pageState.page, "Report totals", PDF_MARGIN, pageState.y, { font: sansBold, size: 10, color: PDF_COLORS.TEXT_MUTED });
    t(pageState.page, formatCurrency(roeData.actualEarnings), totalPageWidth - PDF_MARGIN, pageState.y, { font: serifBold, size: 13, align: "right", color: PDF_COLORS.TEXT });
    t(pageState.page, "Total declared earnings (capped)", totalPageWidth - PDF_MARGIN, pageState.y - 12, { size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    t(pageState.page, `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm XXX")}`, PDF_MARGIN, 40, { size: 7, color: PDF_COLORS.TEXT_MUTED });
    t(pageState.page, "Prepared from your saved records. Review before filing or sharing.", totalPageWidth - PDF_MARGIN, 40, { size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    return pdfDoc.save();
}

export async function generateEmployerConfirmationPdfBytes(
    settings: EmployerSettings
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PAGE_SIZE);
    const { width, height } = page.getSize();
    const { loadPdfFonts } = await import("../pdf-fonts");
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const t = (text: string, x: number, y: number, opts: { align?: "left" | "right" | "center"; size?: number; font?: typeof sansRegular; color?: typeof PDF_COLORS.TEXT; maxWidth?: number } = {}) => {
        const font = opts.font ?? sansRegular;
        const size = opts.size ?? 9;
        const color = opts.color ?? PDF_COLORS.TEXT;
        const safeText = clipText(String(text ?? ""), font, size, opts.maxWidth);
        let tx = x;
        const textWidth = font.widthOfTextAtSize(safeText, size);
        if (opts.align === "right") tx = x - textWidth;
        if (opts.align === "center") tx = x - (textWidth / 2);
        page.drawText(safeText, { x: tx, y, size, font, color });
    };

    page.drawRectangle({ x: 0, y: 0, width, height, color: PDF_COLORS.PAPER });
    drawPdfBrandLockup(page, {
        x: PDF_MARGIN,
        y: height - 60,
        size: 24,
        serifBold,
        sansBold,
        subtitle: "COMPENSATION FUND RECORDS",
        titleSize: 20,
    });

    let currentY = height - 100;
    t("EMPLOYER DETAILS RECORD", width / 2, currentY, { font: serifBold, size: 15, align: "center", color: PDF_COLORS.TEXT, maxWidth: width - (PDF_MARGIN * 2) });

    currentY -= 60;
    const drawField = (label: string, value: string) => {
        t(label, PDF_MARGIN, currentY, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
        t(value || "Not provided", PDF_MARGIN, currentY - 15, { size: 11, maxWidth: width - (PDF_MARGIN * 2) });
        currentY -= 40;
    };

    drawField("Employer Name / Household Name", settings.employerName);
    drawField("ID Number of Employer", settings.employerIdNumber);
    drawField("CF Registration Number", settings.cfNumber);
    drawField("UIF Registration Number", settings.uifRefNumber);
    drawField("Physical Address", settings.employerAddress);
    drawField("Contact Number", settings.phone);

    t("REVIEW NOTE", PDF_MARGIN, currentY, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
    currentY -= 15;
    t("Review these details before using them in a Return of Earnings submission or as a supporting copy.", PDF_MARGIN, currentY, { size: 9, maxWidth: width - (PDF_MARGIN * 2) });

    currentY -= 60;
    page.drawLine({ start: { x: PDF_MARGIN, y: currentY }, end: { x: PDF_MARGIN + 200, y: currentY }, thickness: 1, color: PDF_COLORS.TEXT });
    t("Signature", PDF_MARGIN, currentY - 10, { size: 7 });
    t(`Date: ${format(new Date(), "yyyy-MM-dd XXX")}`, width - PDF_MARGIN, currentY, { align: "right" });
    t("Prepared from your saved employer details. Review before filing or sharing.", width - PDF_MARGIN, 40, { align: "right", size: 7, color: PDF_COLORS.TEXT_MUTED });

    return pdfDoc.save();
}
