import { PDFDocument, rgb, PDFFont, Color } from "pdf-lib";
import { Employee, PayslipInput, EmployerSettings } from "./schema";
import { calculatePayslip, getNMW } from "./calculator";
import { format } from "date-fns";
import { loadPdfFonts } from "./pdf-fonts";
import { drawPdfBrandLockup, drawPdfBrandMark } from "./pdf-brand";
import { PDF_COLORS as SHARED_PDF_COLORS } from "./pdf-theme";
export const PDF_COLORS = {
    ...SHARED_PDF_COLORS,
    PRIMARY_BLUE: rgb(62 / 255, 95 / 255, 104 / 255),
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
        paymentDate: "Payment Date",
        employeeId: "ID / Passport",
        occupation: "Occupation",
        ordinaryRate: "Ordinary Rate",
        overtimeRate: "Overtime Rate",
        sundayRate: "Sunday Rate",
        publicHolidayRate: "Public Holiday Rate",
        payRecordDetails: "PAY RECORD DETAILS",
        actualAmountPaid: "ACTUAL AMOUNT PAID",
        advanceRecovery: "Advance recovered",
        otherDeductions: "Other agreed deductions",
        notProvided: "Not provided",
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
        paymentDate: "Usuku Lokukhokha",
        employeeId: "I-ID / Ipasipoti",
        occupation: "Umsebenzi",
        ordinaryRate: "Izinga Elijwayelekile",
        overtimeRate: "Izinga Lesikhathi Esengeziwe",
        sundayRate: "Izinga LangeSonto",
        publicHolidayRate: "Izinga Leholide Lomphakathi",
        payRecordDetails: "IMINININGWANE YEREKHODI LEMALIHOLI",
        actualAmountPaid: "IMALI EKHOKHIWEYO",
        advanceRecovery: "Imbuyiselo yenkokhelo yangaphambili",
        otherDeductions: "Ezinye izimali ezidonsiwe okuvunyelwene ngazo",
        notProvided: "Akufakwanga",
        uifEmployer: "I-UIF Yomqashi (1%)",
        sdlEmployer: "I-SDL Yomqashi (0%)",
        exempt: "Ikhululiwe",
        leaveRecorded: "Ikhefu kule nkathi",
        annual: "Lonyaka",
        sick: "Lokugula",
        family: "Lomndeni",
        legalDisclaimer: "Kulungiswe ngolwazi lwe-payroll olufakwe ngumqashi. Buyekeza nezimfuneko ezisemthethweni lapho kudingeka.",
        minWage: "Iholo elincane",
        proudlySA: "",
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
        paymentDate: "Umhla Wentlawulo",
        employeeId: "I-ID / Ipaspoti",
        occupation: "Umsebenzi",
        ordinaryRate: "Izinga Eliqhelekileyo",
        overtimeRate: "Izinga Lexesha Elongezelelweyo",
        sundayRate: "Izinga LangeCawa",
        publicHolidayRate: "Izinga Leholide Yoluntu",
        payRecordDetails: "IINKCUKACHA ZEREKHODI LENTLAWULO",
        actualAmountPaid: "IMALI EHLAWULIWEYO",
        advanceRecovery: "Imbuyiselo yentlawulo yangaphambili",
        otherDeductions: "Ezinye izithabatho ekuvunyelwene ngazo",
        notProvided: "Ayifakwanga",
        uifEmployer: "I-UIF yoMqashi (1%)",
        sdlEmployer: "I-SDL yoMqashi (0%)",
        exempt: "Ikhululwe",
        leaveRecorded: "Ikhefu kweli xesha",
        annual: "Yonyaka",
        sick: "Yokugula",
        family: "Yosapho",
        legalDisclaimer: "Ilungiswe ngolwazi lwe-payroll olungeniswe ngumqeshi. Phonononga iimfuno ezisemthethweni xa kuyimfuneko.",
        minWage: "Umvuzo ophantsi",
        proudlySA: "",
    }
};

/**
 * Consistent naming for compliance evidence
 */
export function getPayslipFilename(employee: Employee, payslip: PayslipInput): string {
    const monthStr = format(new Date(payslip.payPeriodStart), "yyyy-MM");
    // Remove non-alphanumeric chars for safe filenames
    const safeName = employee.name.replaceAll(/[^a-z0-9]/gi, '_');
    // Use last 4 of ID for uniqueness in the filename
    const runId = payslip.id.slice(-4);
    return `LekkerLedger_Payslip_${safeName}_${monthStr}_${runId}.pdf`;
}

export function getPayslipPdfRequiredCopy(
    employee: Employee,
    payslip: PayslipInput,
    lang: SupportLang = "en",
) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const paymentDate = payslip.createdAt ? new Date(payslip.createdAt) : new Date(payslip.payPeriodEnd);
    const employeeIdentifier = employee.idNumber?.trim() || dict.notProvided;

    return {
        actualAmountPaidLabel: dict.actualAmountPaid,
        payRecordDetailsLabel: dict.payRecordDetails,
        employeeIdLine: `${dict.employeeId}: ${employeeIdentifier}`,
        paymentDateLine: `${dict.paymentDate}: ${format(paymentDate, "dd MMM yyyy")}`,
        generatedByLine: "Generated by LekkerLedger",
    };
}

export async function generatePayslipPdfBytes(
    employee: Employee,
    payslip: PayslipInput,
    settings: EmployerSettings,
    lang: SupportLang = "en",

    _isLimited: boolean = false
): Promise<Uint8Array> {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const breakdown = calculatePayslip(payslip);
    const nmw = getNMW(payslip.payPeriodEnd);
    const requiredCopy = getPayslipPdfRequiredCopy(employee, payslip, lang);
    const paymentDate = payslip.createdAt ? new Date(payslip.createdAt) : new Date(payslip.payPeriodEnd);
    const employeeIdentifier = employee.idNumber?.trim() || dict.notProvided;


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
        if (Number.isNaN(x) || Number.isNaN(y)) return;

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
    drawPdfBrandMark(page, { x: width - PDF_MARGIN - 24, y: headerY - 20, size: 28 });

    // Document Title
    t(dict.payslip, width - PDF_MARGIN - 38, headerY, { font: serifBold, size: 15, color: PDF_COLORS.TEXT, align: "right" });
    t(format(payslip.payPeriodEnd, "MMMM yyyy").toUpperCase(), width - PDF_MARGIN - 38, headerY - 13, { font: sansBold, size: 8.5, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    // Header Rules (Official look)
    drawLine(headerY - 28, PDF_MARGIN, width - PDF_MARGIN, 1, PDF_COLORS.BORDER);

    // ── Parties Section (Ledger Card Motif) ──────────────────────────────────
    let cy = headerY - 60;
    const infoBottomY = cy - 64;
    const employerX = PDF_MARGIN;
    const employeeX = PDF_MARGIN + 220;
    const periodX = width - PDF_MARGIN;

    // Employer Details
    t(dict.employer, employerX, cy - 2, { font: sansBold, size: 7, color: PDF_COLORS.TEXT_MUTED });
    t(settings.employerName || "Employer Name", employerX, cy - 18, { font: sansBold, size: 10, maxWidth: 180 });
    if (settings.employerAddress?.trim()) {
        t(settings.employerAddress, employerX, cy - 31, { font: sansRegular, size: 7.5, color: PDF_COLORS.TEXT_MUTED, maxWidth: 180 });
    }
    t(requiredCopy.paymentDateLine, employerX, cy - 44, { font: sansRegular, size: 7.5, color: PDF_COLORS.TEXT_MUTED, maxWidth: 180 });

    // Employee Details
    t(dict.employee, employeeX, cy - 2, { font: sansBold, size: 7, color: PDF_COLORS.TEXT_MUTED });
    t(employee.name || "Employee Name", employeeX, cy - 18, { font: sansBold, size: 10, maxWidth: 150 });
    if (employee.role?.trim()) {
        t(employee.role, employeeX, cy - 31, { font: sansRegular, size: 8, color: PDF_COLORS.TEXT_MUTED, maxWidth: 150 });
    }
    t(requiredCopy.employeeIdLine, employeeX, cy - 44, { font: sansRegular, size: 7.5, color: PDF_COLORS.TEXT_MUTED, maxWidth: 150 });

    // Period Details
    t(dict.payPeriod, periodX, cy - 2, { font: sansBold, size: 7, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    const pStart = payslip.payPeriodStart ? new Date(payslip.payPeriodStart) : new Date();
    const pEnd = payslip.payPeriodEnd ? new Date(payslip.payPeriodEnd) : new Date();
    const periodStr = `${format(pStart, "dd MMM")} – ${format(pEnd, "dd MMM yyyy")}`;
    t(periodStr, periodX, cy - 18, { font: sansRegular, size: 9, align: "right" });
    t(`${dict.daysWorked}: ${payslip.daysWorked || 0} days`, periodX, cy - 31, { font: sansRegular, size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    t(`${dict.occupation}: ${employee.role || dict.notProvided}`, periodX, cy - 44, { font: sansRegular, size: 7.5, color: PDF_COLORS.TEXT_MUTED, align: "right", maxWidth: 165 });
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

    const renderDeductionRow = (label: string, amount: number) => {
        t(label, PDF_MARGIN, cy, { size: 9, color: PDF_COLORS.TEXT_MUTED });
        t(`- R ${amount.toFixed(2)}`, width - PDF_MARGIN, cy, { size: 9, align: "right", color: PDF_COLORS.DANGER });
        cy -= 18;
    };

    if (breakdown.deductions.uifEmployee > 0) {
        renderDeductionRow(dict.uifEmployee, breakdown.deductions.uifEmployee);
    }

    if (payslip.includeAccommodation && breakdown.deductions.accommodation) {
        renderDeductionRow(dict.accommodation, breakdown.deductions.accommodation);
    }

    if ((payslip.advanceAmount ?? 0) > 0) {
        renderDeductionRow(dict.advanceRecovery, payslip.advanceAmount ?? 0);
    }

    if ((payslip.otherDeductions ?? 0) > 0) {
        renderDeductionRow(dict.otherDeductions, payslip.otherDeductions ?? 0);
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

    t(requiredCopy.actualAmountPaidLabel, PDF_MARGIN + 14, cy + 16, { font: sansBold, size: 9, color: PDF_COLORS.TEXT });
    t(`R ${breakdown.netPay.toFixed(2)}`, width - PDF_MARGIN - 14, cy + 15, { font: serifBold, size: 13, color: PDF_COLORS.TEXT, align: "right" });

    cy -= 58;
    const detailsBoxY = cy - 46;
    page.drawRectangle({
        x: PDF_MARGIN,
        y: detailsBoxY,
        width: width - (PDF_MARGIN * 2),
        height: 64,
        color: PDF_COLORS.SURFACE,
        borderColor: PDF_COLORS.BORDER,
        borderWidth: 0.8,
    });
    t(requiredCopy.payRecordDetailsLabel, PDF_MARGIN + 12, detailsBoxY + 48, { font: sansBold, size: 7.5, color: PDF_COLORS.TEXT_MUTED });
    t(`${dict.employee}: ${employee.name}`, PDF_MARGIN + 12, detailsBoxY + 33, { size: 8 });
    t(requiredCopy.employeeIdLine, PDF_MARGIN + 12, detailsBoxY + 20, { size: 8, color: PDF_COLORS.TEXT_MUTED, maxWidth: 205 });
    t(`${dict.ordinaryRate}: R ${breakdown.hourlyRate.toFixed(2)}/hr`, PDF_MARGIN + 12, detailsBoxY + 7, { size: 8, color: PDF_COLORS.TEXT_MUTED });

    t(`${dict.employer}: ${settings.employerName || dict.notProvided}`, width - PDF_MARGIN - 12, detailsBoxY + 33, { size: 8, align: "right", maxWidth: 205 });
    t(requiredCopy.paymentDateLine, width - PDF_MARGIN - 12, detailsBoxY + 20, { size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });
    t(`${requiredCopy.actualAmountPaidLabel}: R ${breakdown.netPay.toFixed(2)}`, width - PDF_MARGIN - 12, detailsBoxY + 7, { size: 8, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    // ── Footer (Official Rules & Seal) ───────────────────────────────────────
    const footerY = 58;
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
    t(legalText, PDF_MARGIN, 28, { size: 6.5, color: PDF_COLORS.TEXT_MUTED, maxWidth: 350 });
    t(requiredCopy.generatedByLine, width - PDF_MARGIN, 28, { size: 6.5, color: PDF_COLORS.TEXT_MUTED, align: "right" });

    return pdfDoc.save();
}





