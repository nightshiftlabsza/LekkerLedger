import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { Employee, PayslipInput, EmployerSettings } from "./schema";
import { calculatePayslip, getNMW } from "./calculator";
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

type SupportLang = "en" | "zu" | "xh";

const TRANSLATIONS: Record<SupportLang, Record<string, string>> = {
    en: {
        payslip: "PAYSLIP",
        netPayable: "NET PAYABLE",
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
        uifEmployee: "UIF (Employee contribution 1%)",
        accommodation: "Accommodation Deduction (Capped at 10%)",
        employerContributions: "EMPLOYER CONTRIBUTIONS (For your records)",
        ordinaryHours: "Ordinary Hours",
        overtime: "Overtime",
        sundayPay: "Sunday Pay",
        publicHoliday: "Public Holiday",
        daysWorked: "Days Worked",
        uifEmployer: "UIF Employer (1%)",
        sdlEmployer: "SDL Employer (0%)",
        exempt: "Exempt",
        leaveRecorded: "Leave Recorded",
        annual: "Annual",
        sick: "Sick",
        family: "Family",
        legalDisclaimer: "This payslip is generated in accordance with Sectoral Determination 7 and the BCEA.",
        minWage: "Minimum wage",
        proudlySA: "Proudly South African",
        legal: "LEGAL",
        compliant: "COMPLIANT",
        bcea_sd7: "BCEA/SD7"
    },
    zu: {
        payslip: "ISILIPHU SEHOLO",
        netPayable: "IMALO ETHOLAKALAYO",
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
        leaveRecorded: "Ikhefu Elirekhodiwe",
        annual: "Lonyaka",
        sick: "Lokugula",
        family: "Lomndeni",
        legalDisclaimer: "Leli siliphu seholo senziwe ngokuhambisana ne-Sectoral Determination 7 kanye ne-BCEA.",
        minWage: "Iholo elincane",
        proudlySA: "Kwenziwe eNingizimu Afrika",
        legal: "KUMTHETHO",
        compliant: "KUYAHHAMBISANA",
        bcea_sd7: "BCEA/SD7"
    },
    xh: {
        payslip: "ISILIPHU SOMVUZO",
        netPayable: "IMALI EPHUMAYO",
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
        leaveRecorded: "Ikhefu Elibhalisiweyo",
        annual: "Yonyaka",
        sick: "Yokugula",
        family: "Yosapho",
        legalDisclaimer: "Esi siliphu somvuzo senziwe ngokungqinelana neSectoral Determination 7 kunye neBCEA.",
        minWage: "Umvuzo ophantsi",
        proudlySA: "Yenziwe eMzantsi Afrika",
        legal: "KUSEMthethweni",
        compliant: "IYAQHUBEKA",
        bcea_sd7: "BCEA/SD7"
    }
};

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

    // Logo Handling
    let logoDrawn = false;
    if (settings.proStatus === "pro" && settings.logoData) {
        try {
            const base64Data = settings.logoData.split(",")[1];
            if (base64Data) {
                const logoBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                const logoImg = await pdfDoc.embedPng(logoBytes);
                const logoDims = logoImg.scaleToFit(120, 40);
                page.drawImage(logoImg, {
                    x: 48,
                    y: height - 65,
                    width: logoDims.width,
                    height: logoDims.height,
                });
                logoDrawn = true;
            }
        } catch (e) {
            console.error("Failed to embed custom logo", e);
        }
    }

    if (!logoDrawn) {
        t("LekkerLedger", 48, height - 46, { font: bold, size: 24, color: WHITE });
    }

    t(settings.employerName || "Employer Name Not Set", 48, height - 74, { font: bold, size: 10, color: rgb(0.8, 0.75, 0.7), maxWidth: 280 });
    t(settings.employerAddress || "Address Not Set", 48, height - 86, { font: regular, size: 7.5, color: rgb(0.6, 0.55, 0.5), maxWidth: 280 });

    t(dict.payslip, width - 48, height - 46, { font: bold, size: 20, color: AMBER, align: "right" });
    t(format(payslip.payPeriodEnd, "MMMM yyyy").toUpperCase(), width - 48, height - 70, { font: bold, size: 10, color: WHITE, align: "right" });

    // ── Amber accent bar ─────────────────────────────────────────────────────
    rect(0, height - 104, width, 4, AMBER);

    // ── User Information ─────────────────────────────────────────────────────
    const infoY = height - 140;

    // Employee Box
    t(dict.employee, 48, infoY, { font: bold, size: 8, color: SLATE });
    t(employee.name, 48, infoY - 18, { font: bold, size: 14 });
    t(employee.role, 48, infoY - 32, { font: regular, size: 9, color: SLATE });
    if (employee.idNumber) {
        t(`ID: ${employee.idNumber}`, 48, infoY - 44, { font: regular, size: 8, color: SLATE });
    }

    // Period Box
    t(dict.payPeriod, width - 180, infoY, { font: bold, size: 8, color: SLATE });
    t(`${format(payslip.payPeriodStart, "dd MMM")} – ${format(payslip.payPeriodEnd, "dd MMM yyyy")}`, width - 180, infoY - 18, { font: regular, size: 10 });
    t(`${dict.daysWorked}: ${payslip.daysWorked}`, width - 180, infoY - 32, { font: regular, size: 9, color: SLATE });

    line(height - 200);

    // ── Earnings Table ───────────────────────────────────────────────────────
    let cy = height - 220;
    t(dict.description, 48, cy, { font: bold, size: 8, color: SLATE });
    t(dict.hours, width - 150, cy, { font: bold, size: 8, color: SLATE, align: "right" });
    t(dict.rate, width - 100, cy, { font: bold, size: 8, color: SLATE, align: "right" });
    t(dict.total, width - 48, cy, { font: bold, size: 8, color: SLATE, align: "right" });

    cy -= 20;

    // Ordinary
    t(dict.ordinaryHours, 48, cy, { size: 10 });
    t(breakdown.effectiveOrdinaryHours.toString(), width - 150, cy, { size: 10, align: "right" });
    t(`R ${payslip.hourlyRate.toFixed(2)}`, width - 100, cy, { size: 10, align: "right" });
    t(`R ${breakdown.ordinaryPay.toFixed(2)}`, width - 48, cy, { font: bold, size: 10, align: "right" });
    cy -= 18;

    // Overtime
    if (payslip.overtimeHours > 0) {
        t(`${dict.overtime} (1.5x)`, 48, cy, { size: 10 });
        t(payslip.overtimeHours.toString(), width - 150, cy, { size: 10, align: "right" });
        t(`R ${(payslip.hourlyRate * 1.5).toFixed(2)}`, width - 100, cy, { size: 10, align: "right" });
        t(`R ${breakdown.overtimePay.toFixed(2)}`, width - 48, cy, { size: 10, align: "right" });
        cy -= 18;
    }

    // Sunday
    if (payslip.sundayHours > 0) {
        const mult = employee.ordinarilyWorksSundays ? 1.5 : 2.0;
        t(`${dict.sundayPay} (${mult}x)`, 48, cy, { size: 10 });
        t(payslip.sundayHours.toString(), width - 150, cy, { size: 10, align: "right" });
        t(`R ${(payslip.hourlyRate * mult).toFixed(2)}`, width - 100, cy, { size: 10, align: "right" });
        t(`R ${breakdown.sundayPay.toFixed(2)}`, width - 48, cy, { size: 10, align: "right" });
        cy -= 18;
    }

    // Holiday
    if (payslip.publicHolidayHours > 0) {
        t(`${dict.publicHoliday} (2x)`, 48, cy, { size: 10 });
        t(payslip.publicHolidayHours.toString(), width - 150, cy, { size: 10, align: "right" });
        t(`R ${(payslip.hourlyRate * 2).toFixed(2)}`, width - 100, cy, { size: 10, align: "right" });
        t(`R ${breakdown.publicHolidayPay.toFixed(2)}`, width - 48, cy, { size: 10, align: "right" });
        cy -= 18;
    }

    line(cy + 5);
    cy -= 15;
    t(dict.grossEarnings, 48, cy, { font: bold, size: 10 });
    t(`R ${breakdown.grossPay.toFixed(2)}`, width - 48, cy, { font: bold, size: 12, align: "right" });

    // ── Deductions Table ─────────────────────────────────────────────────────
    cy -= 40;
    t(dict.deductions, 48, cy, { font: bold, size: 8, color: SLATE });
    cy -= 20;

    // UIF
    t(dict.uifEmployee, 48, cy, { size: 9, color: SLATE });
    t(`- R ${breakdown.deductions.uifEmployee.toFixed(2)}`, width - 48, cy, { size: 9, align: "right", color: RED });
    cy -= 18;

    // Accommodation
    if (payslip.includeAccommodation && breakdown.deductions.accommodation) {
        t(dict.accommodation, 48, cy, { size: 9, color: SLATE });
        t(`- R ${breakdown.deductions.accommodation.toFixed(2)}`, width - 48, cy, { size: 9, align: "right", color: RED });
        cy -= 18;
    }

    line(cy + 5);
    cy -= 15;
    t(dict.totalDeductions, 48, cy, { font: bold, size: 9, color: SLATE });
    t(`R ${breakdown.deductions.total.toFixed(2)}`, width - 48, cy, { font: bold, size: 9, align: "right" });

    // ── Net Pay Block ────────────────────────────────────────────────────────
    cy -= 50;
    rect(48, cy, width - 96, 50, AMBER);
    t(dict.netPayable, 64, cy + 18, { font: bold, size: 12, color: WHITE });
    t(`R ${breakdown.netPay.toFixed(2)}`, width - 64, cy + 15, { font: bold, size: 22, color: WHITE, align: "right" });

    // ── Compliance Footer ────────────────────────────────────────────────────
    const footerY = 80;
    line(footerY + 20);

    t(dict.employerContributions, 48, footerY, { font: bold, size: 7, color: SLATE });
    t(`${dict.uifEmployer}: R ${breakdown.employerContributions.uifEmployer.toFixed(2)}`, 48, footerY - 12, { size: 7, color: SLATE });
    t(`${dict.sdlEmployer}: R 0.00 (${dict.exempt})`, 48, footerY - 20, { size: 7, color: SLATE });

    const leaveText = `${dict.leaveRecorded}: ${dict.annual}: ${breakdown.leaveTaken.annual}d | ${dict.sick}: ${breakdown.leaveTaken.sick}d | ${dict.family}: ${breakdown.leaveTaken.family}d`;
    t(leaveText, width - 48, footerY, { size: 7, color: SLATE, align: "right" });

    const legalText = `${dict.legalDisclaimer} ${dict.minWage}: R${nmw.toFixed(2)}/hr.`;
    t(legalText, 48, 40, { size: 7, color: SLATE });
    t(`${dict.proudlySA} · LekkerLedger.app`, width - 48, 40, { size: 7, color: SLATE, align: "right" });

    // ── Compliance Seal ──
    const sealX = width - 100;
    const sealY = 100;
    page.drawCircle({ x: sealX, y: sealY, size: 30, color: rgb(0.95, 0.95, 0.95), borderColor: AMBER, borderWidth: 1 });
    t(dict.legal, sealX, sealY + 8, { font: bold, size: 7, color: AMBER, align: "right" });
    t(dict.compliant, sealX, sealY - 2, { font: bold, size: 5, color: SLATE, align: "right" });
    t(dict.bcea_sd7, sealX, sealY - 10, { font: bold, size: 5, color: SLATE, align: "right" });

    return pdfDoc.save();
}
