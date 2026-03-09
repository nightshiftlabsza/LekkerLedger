import { format } from "date-fns";
import { PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import { buildContractClauses } from "./contractTemplate";
import type { Contract, Employee, EmployerSettings } from "../schema";
import { getNMWRecordForDate } from "../legal/registry";
import { loadPdfFonts } from "../pdf-fonts";
import { drawPdfBrandLockup } from "../pdf-brand";
import { PDF_COLORS, PDF_LAYOUT } from "../pdf-theme";
import { CONTRACT_TEMPLATE_META } from "@/src/config/contract-template";

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
            noticeClause: "Notice periods must follow the BCEA and must be given in writing.",
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
    const footerText = `Prepared using LekkerLedger · Based on the DEL domestic-worker sample structure · Review carefully before signing and keep the signed copy with the employee's records.`;
    page.drawLine({
        start: { x: MARGIN, y: 38 },
        end: { x: PAGE_W - MARGIN, y: 38 },
        thickness: 0.5,
        color: PDF_COLORS.BORDER,
    });
    page.drawText(footerText, {
        x: PAGE_W / 2 - fonts.sansRegular.widthOfTextAtSize(footerText, 8) / 2,
        y: 25,
        size: 8,
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

function ensureSpace(
    pdfDoc: PDFDocument,
    fonts: PdfFonts,
    currentPage: PDFPage,
    cy: number,
    requiredSpace: number
): { page: PDFPage; cy: number } {
    const MIN_Y = MARGIN + 60; // bottom margin + footer clearance
    if (cy - requiredSpace < MIN_Y) {
        const newPage = addPage(pdfDoc, fonts);
        return { page: newPage, cy: PAGE_H - 120 };
    }
    return { page: currentPage, cy };
}

function drawSection(page: PDFPage, fonts: PdfFonts, title: string, y: number) {
    page.drawText(title, {
        x: MARGIN,
        y,
        size: 10,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT,
    });
    page.drawLine({
        start: { x: MARGIN, y: y - 8 },
        end: { x: PAGE_W - MARGIN, y: y - 8 },
        thickness: 0.5,
        color: PDF_COLORS.BORDER,
    });
}

function drawRow(page: PDFPage, fonts: PdfFonts, label: string, value: string, y: number) {
    page.drawText(`${label}:`, {
        x: MARGIN + 8,
        y,
        size: 10,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    page.drawText(value || "—", {
        x: MARGIN + 210,
        y,
        size: 10,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
        maxWidth: BODY_W - 220,
    });
    page.drawLine({
        start: { x: MARGIN, y: y - 5 },
        end: { x: PAGE_W - MARGIN, y: y - 5 },
        thickness: 0.2,
        color: PDF_COLORS.RULING_LINE,
    });
}

function drawParagraph(page: PDFPage, fonts: PdfFonts, text: string, y: number, maxWidth = BODY_W - 16) {
    const lines = Math.max(1, Math.ceil(fonts.sansRegular.widthOfTextAtSize(text, 10) / maxWidth));
    page.drawText(text, {
        x: MARGIN + 8,
        y,
        size: 10,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
        maxWidth,
        lineHeight: 14,
    });
    return y - (lines * 14 + 10);
}

function drawBulletList(page: PDFPage, fonts: PdfFonts, items: string[], y: number, maxWidth = BODY_W - 28) {
    let currentY = y;
    items.forEach((item) => {
        page.drawText("•", {
            x: MARGIN + 8,
            y: currentY,
            size: 10,
            font: fonts.sansBold,
            color: PDF_COLORS.PRIMARY_GREEN,
        });
        const lines = Math.max(1, Math.ceil(fonts.sansRegular.widthOfTextAtSize(item, 10) / maxWidth));
        page.drawText(item, {
            x: MARGIN + 22,
            y: currentY,
            size: 10,
            font: fonts.sansRegular,
            color: PDF_COLORS.TEXT,
            maxWidth,
            lineHeight: 14,
        });
        currentY -= (lines * 14 + 6);
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
    const nmwRecord = getNMWRecordForDate(startDate);
    const nmwDateStr = format(new Date(nmwRecord.effectiveDate), "d MMMM yyyy");
    const hours = contract.workingHours;
    const duties = contract.duties.length > 0 ? contract.duties : ["General household duties agreed by the employer and employee."];

    const pageOne = addPage(pdfDoc, fonts);
    pageOne.drawText("Employment Contract", {
        x: MARGIN,
        y: PAGE_H - 60,
        size: 18,
        font: fonts.serifBold,
        color: PDF_COLORS.TEXT,
    });
    const subtitle = `Prepared using LekkerLedger · Based on the DEL domestic-worker sample structure · Review before signing`;
    pageOne.drawText(subtitle, {
        x: MARGIN,
        y: PAGE_H - 76,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
        maxWidth: BODY_W,
    });
    pageOne.drawText(`Effective date: ${effectiveDate}   | Draft prepared: ${todayStr}`, {
        x: MARGIN,
        y: PAGE_H - 110,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });
    pageOne.drawText(`Template version ${CONTRACT_TEMPLATE_META.versionLabel}   | Last updated ${CONTRACT_TEMPLATE_META.updatedAtLabel}`, {
        x: MARGIN,
        y: PAGE_H - 122,
        size: 8,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    let cy = PAGE_H - 148;
    let currentPage = pageOne;

    const clauses = buildContractClauses(contract, employee, settings);

    for (let i = 0; i < clauses.length; i++) {
        const clause = clauses[i];

        ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 80));

        if (clause.type === "signatures") {
            ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 180));
            drawSection(currentPage, fonts, `${i + 1}. ${clause.title}`, cy);
            cy -= 48;
            currentPage.drawLine({
                start: { x: MARGIN, y: cy },
                end: { x: MARGIN + 190, y: cy },
                thickness: 0.5,
                color: PDF_COLORS.TEXT,
            });
            currentPage.drawText("Employer signature", {
                x: MARGIN,
                y: cy - 14,
                size: 8,
                font: fonts.sansBold,
                color: PDF_COLORS.TEXT_MUTED,
            });
            currentPage.drawText(settings.employerName || "Employer", {
                x: MARGIN,
                y: cy - 26,
                size: 8,
                font: fonts.sansRegular,
                color: PDF_COLORS.TEXT,
            });
            currentPage.drawText("Date: ____________________", {
                x: MARGIN,
                y: cy - 40,
                size: 8,
                font: fonts.sansRegular,
                color: PDF_COLORS.TEXT_MUTED,
            });

            const rightX = PAGE_W - MARGIN - 190;
            currentPage.drawLine({
                start: { x: rightX, y: cy },
                end: { x: rightX + 190, y: cy },
                thickness: 0.5,
                color: PDF_COLORS.TEXT,
            });
            currentPage.drawText("Employee signature", {
                x: rightX,
                y: cy - 14,
                size: 8,
                font: fonts.sansBold,
                color: PDF_COLORS.TEXT_MUTED,
            });
            currentPage.drawText(employee.name, {
                x: rightX,
                y: cy - 26,
                size: 8,
                font: fonts.sansRegular,
                color: PDF_COLORS.TEXT,
            });
            currentPage.drawText("Date: ____________________", {
                x: rightX,
                y: cy - 40,
                size: 8,
                font: fonts.sansRegular,
                color: PDF_COLORS.TEXT_MUTED,
            });
            continue;
        }

        drawSection(currentPage, fonts, `${i + 1}. ${clause.title}`, cy);
        cy -= 26;

        if (clause.type === "rows" && clause.rows) {
            for (const row of clause.rows) {
                ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 24));
                drawRow(currentPage, fonts, row.label, row.value, cy);
                cy -= 18;
            }
            cy -= 8;
        } else if (clause.type === "paragraphs" && clause.paragraphs) {
            for (const p of clause.paragraphs) {
                ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 40));
                cy = drawParagraph(currentPage, fonts, p, cy);
            }
            cy -= 6;
        } else if (clause.type === "bullets" && clause.bullets) {
            ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 40));
            cy = drawBulletList(currentPage, fonts, clause.bullets, cy);
            cy -= 10;
        }
    }

    return pdfDoc.save();
}

export function buildContractFileName(contract: Contract, employee: Employee) {
    const safeName = employee.name.trim().replace(/\s+/g, "_");
    return `Contract_${safeName}_v${contract.version}.pdf`;
}
