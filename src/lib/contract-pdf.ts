import { format } from "date-fns";
import { PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import type { Contract, Employee, EmployerSettings } from "./schema";
import { getNMWForDate } from "./legal/registry";
import { loadPdfFonts } from "./pdf-fonts";
import { drawPdfBrandLockup } from "./pdf-brand";
import { PDF_COLORS, PDF_LAYOUT } from "./pdf-theme";

type ResolvedContractDraft = {
    contract: Contract;
    employee: Employee;
    settings: EmployerSettings;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = PDF_LAYOUT.MARGIN;
const BODY_W = PAGE_W - MARGIN * 2;

function isContract(value: Contract | Employee): value is Contract {
    return "employeeId" in value;
}

function createLegacyContract(employee: Employee, settings: EmployerSettings): Contract {
    return {
        id: crypto.randomUUID(),
        householdId: employee.householdId ?? "default",
        employeeId: employee.id,
        status: "draft",
        version: 1,
        effectiveDate: employee.startDate || new Date().toISOString().split("T")[0],
        jobTitle: employee.role || "Domestic worker",
        placeOfWork: settings.employerAddress || "",
        duties: ["General cleaning", "Laundry", "Basic household support"],
        workingHours: {
            daysPerWeek: 5,
            startAt: "08:00",
            endAt: "17:00",
            breakDuration: 60,
        },
        salary: {
            amount: Number((employee.hourlyRate * 195).toFixed(2)),
            frequency: employee.frequency || "Monthly",
        },
        leave: {
            annualDays: 21,
            sickDays: 30,
        },
        terms: {
            accommodationProvided: false,
            accommodationDetails: "",
            overtimeAgreement: "Any overtime must be agreed in advance and paid according to the BCEA.",
            sundayHolidayAgreement: employee.ordinarilyWorksSundays
                ? "Sunday work forms part of the normal schedule and must still be paid at the correct statutory rate."
                : "Sunday or public-holiday work must be agreed in advance and paid at the correct statutory rate.",
            noticeClause: "Notice periods should follow the BCEA and should be given in writing.",
            lawyerReviewAcknowledged: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

function resolveDraft(
    contractOrEmployee: Contract | Employee,
    employeeOrSettings: Employee | EmployerSettings,
    maybeSettings?: EmployerSettings,
): ResolvedContractDraft {
    if (isContract(contractOrEmployee)) {
        return {
            contract: contractOrEmployee,
            employee: employeeOrSettings as Employee,
            settings: maybeSettings as EmployerSettings,
        };
    }

    const employee = contractOrEmployee;
    const settings = employeeOrSettings as EmployerSettings;
    return {
        contract: createLegacyContract(employee, settings),
        employee,
        settings,
    };
}

function addPage(pdfDoc: PDFDocument, fonts: PdfFonts) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PDF_COLORS.PAPER });
    drawPdfBrandLockup(page, {
        x: MARGIN,
        y: PAGE_H - 60,
        size: 24,
        serifBold: fonts.serifBold,
        sansBold: fonts.sansBold,
        subtitle: "HOUSEHOLD EMPLOYMENT RECORD",
    });
    page.drawLine({
        start: { x: MARGIN, y: PAGE_H - 90 },
        end: { x: PAGE_W - MARGIN, y: PAGE_H - 90 },
        thickness: 1,
        color: PDF_COLORS.BORDER,
    });
    const footerText = "Prepared from your saved details. Review, update if needed, and keep the signed copy with your records.";
    page.drawLine({
        start: { x: MARGIN, y: 38 },
        end: { x: PAGE_W - MARGIN, y: 38 },
        thickness: 0.5,
        color: PDF_COLORS.BORDER,
    });
    page.drawText(footerText, {
        x: PAGE_W / 2 - fonts.sansRegular.widthOfTextAtSize(footerText, 7) / 2,
        y: 25,
        size: 7,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });
    return page;
}

type PdfFonts = {
    sansRegular: PDFFont;
    sansBold: PDFFont;
    serifBold: PDFFont;
};

function drawSection(page: PDFPage, fonts: PdfFonts, title: string, y: number) {
    page.drawText(title, {
        x: MARGIN,
        y,
        size: 9,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    page.drawLine({
        start: { x: MARGIN, y: y - 6 },
        end: { x: PAGE_W - MARGIN, y: y - 6 },
        thickness: 0.5,
        color: PDF_COLORS.BORDER,
    });
}

function drawRow(page: PDFPage, fonts: PdfFonts, label: string, value: string, y: number) {
    page.drawText(`${label}:`, {
        x: MARGIN + 8,
        y,
        size: 9,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    page.drawText(value || "(Not provided)", {
        x: MARGIN + 170,
        y,
        size: 9,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
        maxWidth: BODY_W - 180,
    });
    page.drawLine({
        start: { x: MARGIN, y: y - 5 },
        end: { x: PAGE_W - MARGIN, y: y - 5 },
        thickness: 0.2,
        color: PDF_COLORS.RULING_LINE,
    });
}

function drawParagraph(page: PDFPage, fonts: PdfFonts, text: string, y: number, maxWidth = BODY_W - 16) {
    page.drawText(text, {
        x: MARGIN + 8,
        y,
        size: 9,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
        maxWidth,
        lineHeight: 14,
    });
}

function drawBulletList(page: PDFPage, fonts: PdfFonts, items: string[], y: number) {
    let currentY = y;
    items.forEach((item) => {
        page.drawText("•", {
            x: MARGIN + 8,
            y: currentY,
            size: 9,
            font: fonts.sansBold,
            color: PDF_COLORS.PRIMARY_GREEN,
        });
        page.drawText(item, {
            x: MARGIN + 22,
            y: currentY,
            size: 9,
            font: fonts.sansRegular,
            color: PDF_COLORS.TEXT,
            maxWidth: BODY_W - 28,
            lineHeight: 14,
        });
        currentY -= 18;
    });
    return currentY;
}

export async function generateEmploymentContract(
    contractOrEmployee: Contract | Employee,
    employeeOrSettings: Employee | EmployerSettings,
    maybeSettings?: EmployerSettings,
): Promise<Uint8Array> {
    const { contract, employee, settings } = resolveDraft(contractOrEmployee, employeeOrSettings, maybeSettings);
    const pdfDoc = await PDFDocument.create();
    const fonts: PdfFonts = await loadPdfFonts(pdfDoc);

    const startDate = contract.effectiveDate ? new Date(contract.effectiveDate) : new Date();
    const effectiveDate = format(startDate, "d MMMM yyyy");
    const todayStr = format(new Date(), "d MMMM yyyy");
    const nmw = getNMWForDate(startDate);
    const hours = contract.workingHours;
    const duties = contract.duties.length > 0 ? contract.duties : ["General household duties agreed by the employer and employee."];

    const pageOne = addPage(pdfDoc, fonts);
    pageOne.drawText("EMPLOYMENT CONTRACT DRAFT", {
        x: PAGE_W - MARGIN - fonts.serifBold.widthOfTextAtSize("EMPLOYMENT CONTRACT DRAFT", 18),
        y: PAGE_H - 60,
        size: 16,
        font: fonts.serifBold,
        color: PDF_COLORS.TEXT,
    });
    const subtitle = "Based on the domestic-worker sample structure from the Department of Employment and Labour";
    pageOne.drawText(subtitle, {
        x: PAGE_W - MARGIN - fonts.sansRegular.widthOfTextAtSize(subtitle, 8),
        y: PAGE_H - 74,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });
    pageOne.drawText(`Effective date: ${effectiveDate}   | Draft prepared: ${todayStr}`, {
        x: MARGIN,
        y: PAGE_H - 110,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    pageOne.drawRectangle({
        x: MARGIN,
        y: PAGE_H - 154,
        width: BODY_W,
        height: 30,
        color: PDF_COLORS.SURFACE,
        borderColor: PDF_COLORS.BORDER,
        borderWidth: 0.6,
    });
    drawParagraph(
        pageOne,
        fonts,
        "Draft for review. Confirm that the pay, hours, duties, leave, and signatures match the real arrangement before signing.",
        PAGE_H - 142,
        BODY_W - 16,
    );

    let cy = PAGE_H - 190;
    drawSection(pageOne, fonts, "1. PARTIES", cy);
    cy -= 30;
    drawRow(pageOne, fonts, "Employer", settings.employerName || "(Employer name not set)", cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Employer address", settings.employerAddress || "(Address not set)", cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Employer phone", settings.phone || "(Not provided)", cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Employee", employee.name, cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Employee ID / passport", employee.idNumber || "(Not provided)", cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Employee phone", employee.phone || "(Not provided)", cy);

    cy -= 24;
    drawSection(pageOne, fonts, "2. POSITION AND PLACE OF WORK", cy);
    cy -= 30;
    drawRow(pageOne, fonts, "Job title", contract.jobTitle, cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Place of work", contract.placeOfWork || settings.employerAddress || "(To be confirmed)", cy);
    cy -= 24;
    pageOne.drawText("Main duties:", {
        x: MARGIN + 8,
        y: cy,
        size: 9,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    cy -= 18;
    cy = drawBulletList(pageOne, fonts, duties, cy);

    cy -= 10;
    drawSection(pageOne, fonts, "3. HOURS AND PAY", cy);
    cy -= 30;
    drawRow(pageOne, fonts, "Days per week", `${hours.daysPerWeek} day(s)`, cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Ordinary hours", `${hours.startAt} to ${hours.endAt}`, cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Meal / rest break", `${hours.breakDuration} minutes`, cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Pay", `R ${contract.salary.amount.toFixed(2)} ${contract.salary.frequency.toLowerCase()}`, cy);
    cy -= 18;
    drawRow(pageOne, fonts, "Current minimum wage reference", `R ${nmw.toFixed(2)} per hour`, cy);

    const pageTwo = addPage(pdfDoc, fonts);
    pageTwo.drawText("EMPLOYMENT TERMS", {
        x: PAGE_W - MARGIN - fonts.serifBold.widthOfTextAtSize("EMPLOYMENT TERMS", 18),
        y: PAGE_H - 60,
        size: 16,
        font: fonts.serifBold,
        color: PDF_COLORS.TEXT,
    });

    cy = PAGE_H - 120;
    drawSection(pageTwo, fonts, "4. LEAVE AND BASIC CONDITIONS", cy);
    cy -= 30;
    drawRow(pageTwo, fonts, "Annual leave", `${contract.leave.annualDays} day(s) per cycle`, cy);
    cy -= 18;
    drawRow(pageTwo, fonts, "Sick leave", `${contract.leave.sickDays} day(s) in the sick-leave cycle`, cy);
    cy -= 22;
    drawParagraph(
        pageTwo,
        fonts,
        "Family responsibility leave, maternity leave, public holidays, overtime, and notice should still be applied in line with the BCEA and any lawful written agreement between the parties.",
        cy,
    );

    cy -= 58;
    drawSection(pageTwo, fonts, "5. AGREED CLAUSES", cy);
    cy -= 30;
    const clauseItems = [
        contract.terms.overtimeAgreement,
        contract.terms.sundayHolidayAgreement,
        contract.terms.noticeClause,
        contract.terms.accommodationProvided
            ? `Accommodation forms part of this job. ${contract.terms.accommodationDetails || "The parties should record the room and deduction details clearly in writing."}`
            : "No accommodation arrangement is recorded in this draft.",
    ];
    cy = drawBulletList(pageTwo, fonts, clauseItems, cy);

    cy -= 16;
    drawSection(pageTwo, fonts, "6. BEFORE SIGNING", cy);
    cy -= 30;
    const signingItems = [
        "Read the draft together and change anything that does not match the real arrangement.",
        "Keep pay, hours, rest periods, Sundays, public holidays, and accommodation wording specific and clear.",
        "Print and sign the final version, or only use an electronic-signature method once you are comfortable that it is appropriate for your situation.",
        "Keep the signed copy with the employee's records.",
    ];
    cy = drawBulletList(pageTwo, fonts, signingItems, cy);

    cy -= 18;
    pageTwo.drawRectangle({
        x: MARGIN,
        y: cy - 12,
        width: BODY_W,
        height: 36,
        color: PDF_COLORS.SURFACE,
        borderColor: PDF_COLORS.BORDER,
        borderWidth: 0.5,
    });
    drawParagraph(
        pageTwo,
        fonts,
        "This document is a drafting aid based on the details saved in LekkerLedger. Review it carefully before relying on it.",
        cy,
        BODY_W - 16,
    );

    cy -= 70;
    drawSection(pageTwo, fonts, "7. SIGNATURES", cy);
    cy -= 48;
    pageTwo.drawLine({
        start: { x: MARGIN, y: cy },
        end: { x: MARGIN + 190, y: cy },
        thickness: 0.5,
        color: PDF_COLORS.TEXT,
    });
    pageTwo.drawText("Employer signature", {
        x: MARGIN,
        y: cy - 14,
        size: 8,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    pageTwo.drawText(settings.employerName || "Employer", {
        x: MARGIN,
        y: cy - 26,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
    });
    pageTwo.drawText("Date: ____________________", {
        x: MARGIN,
        y: cy - 40,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    const rightX = PAGE_W - MARGIN - 190;
    pageTwo.drawLine({
        start: { x: rightX, y: cy },
        end: { x: rightX + 190, y: cy },
        thickness: 0.5,
        color: PDF_COLORS.TEXT,
    });
    pageTwo.drawText("Employee signature", {
        x: rightX,
        y: cy - 14,
        size: 8,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    pageTwo.drawText(employee.name, {
        x: rightX,
        y: cy - 26,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
    });
    pageTwo.drawText("Date: ____________________", {
        x: rightX,
        y: cy - 40,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    return pdfDoc.save();
}
