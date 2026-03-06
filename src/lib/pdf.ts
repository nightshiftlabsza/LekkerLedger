import { PDFDocument, rgb, PDFFont, Color } from "pdf-lib";
import { Employee, PayslipInput, EmployerSettings } from "./schema";
import { calculatePayslip, getNMW } from "./calculator";
import { format } from "date-fns";
import { loadPdfFonts } from "./pdf-fonts";
import { drawPdfBrandLockup } from "./pdf-brand";
export const PDF_COLORS = {
    PRIMARY_GREEN: rgb(0, 122 / 255, 77 / 255),
    PRIMARY_BLUE: rgb(62 / 255, 95 / 255, 104 / 255),
    TEXT: rgb(16 / 255, 24 / 255, 40 / 255),
    TEXT_MUTED: rgb(71 / 255, 84 / 255, 103 / 255),
    BORDER: rgb(230 / 255, 224 / 255, 214 / 255),
    PAPER: rgb(250 / 255, 247 / 255, 240 / 255),
    SURFACE: rgb(1, 1, 1), // White surface for cards/elements
    RULING_LINE: rgb(0.9, 0.88, 0.84),
    DANGER: rgb(180 / 255, 35 / 255, 24 / 255),
    FOCUS_GOLD: rgb(196 / 255, 122 / 255, 28 / 255),
};

export const PDF_MARGIN = 50;
export const PDF_LAYOUT = {
    COL1: 50,
    COL2: 300,
    LINE_HEIGHT: 20
};

type SupportLang = "en" | "zu" | "xh";

const TRANSLATIONS: Record<SupportLang, Record<string, string>> = {
    en: {
        payslip: "PAYSLIP",
        netPayable: "NET AMOUNT PAID",
        employee: "EMPLOYEE",
        employer: "EMPLOYER",
        payPeriod: "PAY PERIOD",
        description: "DESCRIPTION",
        hours: "HOURS",
        rate: "RATE",
        total: "TOTAL",
        grossEarnings: "GROSS EARNINGS",
        deductions: "DEDUCTIONS",
        totalDeductions: "TOTAL DEDUCTIONS",
        uifEmployee: "UIF (Employee 1%)",
        accommodation: "Accommodation (Capped 10%)",
        employerContributions: "EMPLOYER CONTRIBUTIONS (Tax Records)",
        ordinaryHours: "Ordinary Hours",
        overtime: "Overtime (1.5x)",
        sundayPay: "Sunday Pay",
        publicHoliday: "Public Holiday (2x)",
        daysWorked: "Days Worked",
        uifEmployer: "UIF Employer (1%)",
        sdlEmployer: "SDL Employer (0%)",
        exempt: "Exempt",
        leaveRecorded: "Leave taken in this period",
        annual: "Annual",
        sick: "Sick",
        family: "Family",
        legalDisclaimer: "Prepared from payroll information entered by the employer. Review against official requirements where needed.",
        minWage: "Min Wage",
        proudlySA: "",
        legal: "RECORD",
        compliant: "REVIEW",
        bcea_sd7: "PAYROLL"
    },
    zu: {
        payslip: "ISILIPHU SEHOLO",
        netPayable: "IMALI EKHOKHIWEYO",
        employee: "UMSEBENZI",
        employer: "UMQASHI",
        payPeriod: "ISIKHATHI SOKUHOLA",
        description: "INCAZELO",
        hours: "AMAHORA",
        rate: "IZINGA",
        total: "INGQIKITHI",
        grossEarnings: "INANI LILONKE",
        deductions: "IZIMALI EZIDONSWAYO",
        totalDeductions: "IZIMALI EZIDONSIWE ZONKE",
        uifEmployee: "I-UIF (Umnikelo woMsebenzi 1%)",
        accommodation: "Indawo yokuhlala (Inqunywe ku-10%)",
        employerContributions: "IMINIKELO YOMQASHI (Amarekhodi akho)",
        ordinaryHours: "Amahora Ajwayelekile",
        overtime: "Isikhathi Esengeziwe",
        sundayPay: "Inkokhelo YangeSonto",
        publicHoliday: "Iholide Lomphakathi",
        daysWorked: "Izinsuku Ezisetshenziwe",
        uifEmployer: "I-UIF Yomqashi (1%)",
        sdlEmployer: "I-SDL Yomqashi (0%)",
        exempt: "Ikhululiwe",
        leaveRecorded: "Ikhefu kule nkathi",
        annual: "Lonyaka",
        sick: "Lokugula",
        family: "Lomndeni",
        legalDisclaimer: "SENZIWE ngokuhambisana ne-Sectoral Determination 7 kanye ne-BCEA.",
        minWage: "Iholo elincane",
        proudlySA: "",
        legal: "KUMTHETHO",
        compliant: "KUYAHHAMBISANA",
        bcea_sd7: "PAYROLL"
    },
    xh: {
        payslip: "ISILIPHU SOMVUZO",
        netPayable: "IMALI EHLAWULIWEYO",
        employee: "UMSEBENZI",
        employer: "UMQASHI",
        payPeriod: "IXESHA LOMVUZO",
        description: "INKCAZELO",
        hours: "IIYURE",
        rate: "IZINGA",
        total: "IMALI IONKE",
        grossEarnings: "IMALI IONKE",
        deductions: "IZITHABATHO",
        totalDeductions: "IZITHABATHO ZONKE",
        uifEmployee: "I-UIF (Igalelo lomsebenzi 1%)",
        accommodation: "Indawo yokuhlala (Ilinganiselwe kwi-10%)",
        employerContributions: "AMAGALELO OMQAHSIL (Iirekhodi zakho)",
        ordinaryHours: "Iiyure Eziqhelekileyo",
        overtime: "Ixesha Elingaphezulu",
        sundayPay: "Intlawulo YeCawe",
        publicHoliday: "Iholide Yoluntu",
        daysWorked: "Iintsuku Ezisetyenzisiweyo",
        uifEmployer: "I-UIF yoMqashi (1%)",
        sdlEmployer: "I-SDL yoMqashi (0%)",
        exempt: "Ikhululwe",
        leaveRecorded: "Ikhefu kweli xesha",
        annual: "Yonyaka",
        sick: "Yokugula",
        family: "Yosapho",
        legalDisclaimer: "SENZIWE ngokungqinelana neSectoral Determination 7 kunye neBCEA.",
        minWage: "Umvuzo ophantsi",
        proudlySA: "",
        legal: "KUSEMthethweni",
        compliant: "IYAQHUBEKA",
        bcea_sd7: "PAYROLL"
    }
};

/**
 * Consistent naming for compliance evidence
 */
export function getPayslipFilename(employee: Employee, payslip: PayslipInput): string {
    const monthStr = format(new Date(payslip.payPeriodStart), "yyyy-MM");
    // Remove non-alphanumeric chars for safe filenames
    const safeName = employee.name.replace(/[^a-z0-9]/gi, '_');
    // Use last 4 of ID for uniqueness in the filename
    const runId = payslip.id.slice(-4);
    return `LekkerLedger_Payslip_${safeName}_${monthStr}_${runId}.pdf`;
}

export async function generatePayslipPdfBytes(
    employee: Employee,
    payslip: PayslipInput,
    settings: EmployerSettings,
    lang: SupportLang = "en",
    isLimited: boolean = false
): Promise<Uint8Array> {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const breakdown = calculatePayslip(payslip);
    const nmw = getNMW(payslip.payPeriodEnd);


    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    // Fonts: Standardized loading
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);


    const t = (
        text: string,
        x: number,
        y: number,
        opts?: {
            font?: PDFFont;
            size?: number;
            color?: Color;
            align?: "left" | "right";
            maxWidth?: number;
        }
    ) => {
        const font = opts?.font ?? sansRegular;
        const size = opts?.size ?? 9;
        const color = opts?.color ?? PDF_COLORS.TEXT;

        // Defensive: ensure text is a string and not null/undefined
        let displayTxt = String(text ?? "");

        // Safety: If somehow x or y is NaN, we skip to prevent crash
        if (isNaN(x) || isNaN(y)) return;

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

    const drawLine = (y: number, x1 = PDF_MARGIN, x2 = width - PDF_MARGIN, thickness = 0.5, color = PDF_COLORS.BORDER) => {
        page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
    };

    // ── Civic Ledger Background (Paper) ──────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width, height, color: PDF_COLORS.PAPER });

    // ── Header (Official Stationery Look) ────────────────────────────────────
    const headerY = height - 60;

    drawPdfBrandLockup(page, {
        x: PDF_MARGIN,
        y: headerY,
        size: 23,
        serifBold,
        sansBold,
        subtitle: dict.proudlySA ? dict.proudlySA.toUpperCase() : undefined,
        titleSize: 16,
    });

    // Document Title
    t(dict.payslip, width - PDF_MARGIN, headerY, { font: serifBold, size: 15, color: PDF_COLORS.TEXT, align: "right" });
    t(format(payslip.payPeriodEnd, "MMMM yyyy").toUpperCase(), width - PDF_MARGIN, headerY - 13, { font: sansBold, size: 8.5, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    // Header Rules (Official look)
    drawLine(headerY - 28, PDF_MARGIN, width - PDF_MARGIN, 1, PDF_COLORS.BORDER);

    // ── Parties Section (Ledger Card Motif) ──────────────────────────────────
    let cy = headerY - 60;
    const infoBottomY = cy - 52;
    const employerX = PDF_MARGIN;
    const employeeX = PDF_MARGIN + 220;
    const periodX = width - PDF_MARGIN;

    // Employer Details
    t(dict.employer, employerX, cy - 2, { font: sansBold, size: 7, color: PDF_COLORS.TEXT_MUTED });
    t(settings.employerName || "Employer Name", employerX, cy - 18, { font: sansBold, size: 10, maxWidth: 180 });
    if (settings.employerAddress?.trim()) {
        t(settings.employerAddress, employerX, cy - 31, { font: sansRegular, size: 7.5, color: PDF_COLORS.TEXT_MUTED, maxWidth: 180 });
    }

    // Employee Details
    t(dict.employee, employeeX, cy - 2, { font: sansBold, size: 7, color: PDF_COLORS.TEXT_MUTED });
    t(employee.name || "Employee Name", employeeX, cy - 18, { font: sansBold, size: 10, maxWidth: 150 });
    if (employee.role?.trim()) {
        t(employee.role, employeeX, cy - 31, { font: sansRegular, size: 8, color: PDF_COLORS.TEXT_MUTED, maxWidth: 150 });
    }

    // Period Details
    t(dict.payPeriod, periodX, cy - 2, { font: sansBold, size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    const pStart = payslip.payPeriodStart ? new Date(payslip.payPeriodStart) : new Date();
    const pEnd = payslip.payPeriodEnd ? new Date(payslip.payPeriodEnd) : new Date();
    const periodStr = `${format(pStart, "dd MMM")} – ${format(pEnd, "dd MMM yyyy")}`;
    t(periodStr, periodX, cy - 18, { font: sansRegular, size: 9, align: "right" });
    t(`${dict.daysWorked}: ${payslip.daysWorked || 0} days`, periodX, cy - 31, { font: sansRegular, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    drawLine(infoBottomY);

    cy = infoBottomY - 22;

    // ── Earnings Table ───────────────────────────────────────────────────────
    t(dict.description, PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
    t(dict.hours, width - 150, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    t(dict.rate, width - 100, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    t(dict.total, width - PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    drawLine(cy - 6);
    cy -= 20;

    const renderRow = (label: string, hours: string, rate: string, total: string, isBold = false) => {
        t(label, PDF_MARGIN, cy, { font: isBold ? sansBold : sansRegular, size: 9 });
        t(hours, width - 150, cy, { font: sansRegular, size: 9, align: "right" });
        t(rate, width - 100, cy, { font: sansRegular, size: 9, align: "right" });
        t(total, width - PDF_MARGIN, cy, { font: sansBold, size: 9, align: "right" });
        cy -= 18;
    };

    renderRow(dict.ordinaryHours, breakdown.effectiveOrdinaryHours.toString(), `R ${payslip.hourlyRate.toFixed(2)}`, `R ${breakdown.ordinaryPay.toFixed(2)}`);

    if (payslip.overtimeHours > 0) {
        renderRow(`${dict.overtime}`, payslip.overtimeHours.toString(), `R ${(payslip.hourlyRate * 1.5).toFixed(2)}`, `R ${breakdown.overtimePay.toFixed(2)}`);
    }
    if (payslip.sundayHours > 0) {
        const mult = employee.ordinarilyWorksSundays ? 1.5 : 2.0;
        renderRow(`${dict.sundayPay} (${mult}x)`, payslip.sundayHours.toString(), `R ${(payslip.hourlyRate * mult).toFixed(2)}`, `R ${breakdown.sundayPay.toFixed(2)}`);
    }
    if (payslip.publicHolidayHours > 0) {
        renderRow(`${dict.publicHoliday}`, payslip.publicHolidayHours.toString(), `R ${(payslip.hourlyRate * 2).toFixed(2)}`, `R ${breakdown.publicHolidayPay.toFixed(2)}`);
    }

    drawLine(cy + 5);
    cy -= 15;
    t(dict.grossEarnings, PDF_MARGIN, cy, { font: serifBold, size: 10 });
    t(`R ${breakdown.grossPay.toFixed(2)}`, width - PDF_MARGIN, cy, { font: serifBold, size: 11, align: "right" });

    // ── Deductions ───────────────────────────────────────────────────────────
    cy -= 35;
    t(dict.deductions, PDF_MARGIN, cy, { font: sansBold, size: 8, color: PDF_COLORS.TEXT_MUTED });
    drawLine(cy - 6);
    cy -= 20;

    t(dict.uifEmployee, PDF_MARGIN, cy, { size: 9, color: PDF_COLORS.TEXT_MUTED });
    t(`- R ${breakdown.deductions.uifEmployee.toFixed(2)}`, width - PDF_MARGIN, cy, { size: 9, align: "right", color: PDF_COLORS.DANGER });
    cy -= 18;

    if (payslip.includeAccommodation && breakdown.deductions.accommodation) {
        t(dict.accommodation, PDF_MARGIN, cy, { size: 9, color: PDF_COLORS.TEXT_MUTED });
        t(`- R ${breakdown.deductions.accommodation.toFixed(2)}`, width - PDF_MARGIN, cy, { size: 9, align: "right", color: PDF_COLORS.DANGER });
        cy -= 18;
    }

    drawLine(cy + 5);
    cy -= 15;
    t(dict.totalDeductions, PDF_MARGIN, cy, { font: sansBold, size: 9, color: PDF_COLORS.TEXT_MUTED });
    t(`R ${breakdown.deductions.total.toFixed(2)}`, width - PDF_MARGIN, cy, { font: sansBold, size: 9, align: "right" });

    // ── Net Pay Summary ───────────────────────────────────────────────────────
    cy -= 44;
    const netPayH = 34;
    page.drawRectangle({
        x: PDF_MARGIN,
        y: cy + 4,
        width: width - (PDF_MARGIN * 2),
        height: netPayH,
        color: PDF_COLORS.SURFACE,
        borderColor: PDF_COLORS.BORDER,
        borderWidth: 0.8,
    });
    page.drawLine({
        start: { x: PDF_MARGIN, y: cy + 4 },
        end: { x: width - PDF_MARGIN, y: cy + 4 },
        thickness: 1.1,
        color: PDF_COLORS.PRIMARY_GREEN,
    });

    t(dict.netPayable, PDF_MARGIN + 14, cy + 16, { font: sansBold, size: 9, color: PDF_COLORS.TEXT });
    t(`R ${breakdown.netPay.toFixed(2)}`, width - PDF_MARGIN - 14, cy + 15, { font: serifBold, size: 13, color: PDF_COLORS.TEXT, align: "right" });

    // ── Footer (Official Rules & Seal) ───────────────────────────────────────
    const footerY = 70;
    drawLine(footerY + 30);

    t(dict.employerContributions, PDF_MARGIN, footerY + 15, { font: sansBold, size: 7, color: PDF_COLORS.TEXT_MUTED });
    t(`${dict.uifEmployer}: R ${breakdown.employerContributions.uifEmployer.toFixed(2)} · ${dict.sdlEmployer}: R 0.00`, PDF_MARGIN, footerY + 5, { size: 7, color: PDF_COLORS.TEXT_MUTED });

    const leaveItems = [
        breakdown.leaveTaken.annual > 0 ? `${dict.annual}: ${breakdown.leaveTaken.annual} days` : null,
        breakdown.leaveTaken.sick > 0 ? `${dict.sick}: ${breakdown.leaveTaken.sick} days` : null,
        breakdown.leaveTaken.family > 0 ? `${dict.family}: ${breakdown.leaveTaken.family} days` : null,
    ].filter(Boolean);

    if (leaveItems.length > 0) {
        const leaveText = `${dict.leaveRecorded}: ${leaveItems.join(" | ")}`;
        t(leaveText, width - PDF_MARGIN, footerY + 15, { size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    }

    // metadata line
    const appVersion = "0.1.0"; // From package.json
    const generatedTs = format(new Date(), "yyyy-MM-dd HH:mm");
    const metaLine = `v${appVersion} · Generated ${generatedTs}`;
    t(metaLine, PDF_MARGIN, footerY - 5, { size: 6, color: PDF_COLORS.TEXT_MUTED });

    const legalText = `${dict.legalDisclaimer} ${dict.minWage}: R${nmw.toFixed(2)}/hr.`;
    t(legalText, PDF_MARGIN, 40, { size: 7, color: PDF_COLORS.TEXT_MUTED });
    t("Generated by LekkerLedger", width - PDF_MARGIN, 40, { size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    return pdfDoc.save();
}





