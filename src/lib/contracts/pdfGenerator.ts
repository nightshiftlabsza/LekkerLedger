import { format } from "date-fns";
import { PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import { buildContractClauses } from "./contractTemplate";
import type { Contract, Employee, EmployerSettings } from "../schema";
import { getNMWRecordForDate } from "../legal/registry";
import { loadPdfFonts } from "../pdf-fonts";
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

type PdfFonts = {
    sansRegular: PDFFont;
    sansBold: PDFFont;
    serifBold: PDFFont;
};

/**
 * Adds a new page with a clean header (no branding) and a minimal footer.
 */
function addPage(pdfDoc: PDFDocument, fonts: PdfFonts, pageNumber: number): PDFPage {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Warm paper background
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PDF_COLORS.PAPER });

    // Top rule — thin green accent line
    page.drawLine({
        start: { x: MARGIN, y: PAGE_H - 36 },
        end: { x: PAGE_W - MARGIN, y: PAGE_H - 36 },
        thickness: 1.5,
        color: PDF_COLORS.PRIMARY_GREEN,
    });

    // Footer rule
    page.drawLine({
        start: { x: MARGIN, y: 38 },
        end: { x: PAGE_W - MARGIN, y: 38 },
        thickness: 0.5,
        color: PDF_COLORS.BORDER,
    });

    const footerText = `Review carefully before signing · Keep the signed copy with the employee's records`;
    const footerW = fonts.sansRegular.widthOfTextAtSize(footerText, 7.5);
    page.drawText(footerText, {
        x: PAGE_W / 2 - footerW / 2,
        y: 24,
        size: 7.5,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    // Page number (right aligned)
    const pageStr = `${pageNumber}`;
    const pageStrW = fonts.sansRegular.widthOfTextAtSize(pageStr, 7.5);
    page.drawText(pageStr, {
        x: PAGE_W - MARGIN - pageStrW,
        y: 24,
        size: 7.5,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    return page;
}

function ensureSpace(
    pdfDoc: PDFDocument,
    fonts: PdfFonts,
    currentPage: PDFPage,
    cy: number,
    requiredSpace: number,
    pageCounter: { n: number },
): { page: PDFPage; cy: number } {
    const MIN_Y = MARGIN + 60;
    if (cy - requiredSpace < MIN_Y) {
        pageCounter.n += 1;
        const newPage = addPage(pdfDoc, fonts, pageCounter.n);
        return { page: newPage, cy: PAGE_H - 72 };
    }
    return { page: currentPage, cy };
}

function drawSectionHeader(page: PDFPage, fonts: PdfFonts, title: string, y: number) {
    page.drawText(title.toUpperCase(), {
        x: MARGIN,
        y,
        size: 9,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    page.drawLine({
        start: { x: MARGIN, y: y - 7 },
        end: { x: PAGE_W - MARGIN, y: y - 7 },
        thickness: 0.75,
        color: PDF_COLORS.PRIMARY_GREEN,
        opacity: 0.6,
    });
}

function drawRow(page: PDFPage, fonts: PdfFonts, label: string, value: string, y: number) {
    const labelText = `${label}:`;
    page.drawText(labelText, {
        x: MARGIN + 6,
        y,
        size: 9.5,
        font: fonts.sansBold,
        color: PDF_COLORS.TEXT_MUTED,
    });
    page.drawText(value || "—", {
        x: MARGIN + 200,
        y,
        size: 9.5,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
        maxWidth: BODY_W - 210,
    });
    page.drawLine({
        start: { x: MARGIN, y: y - 6 },
        end: { x: PAGE_W - MARGIN, y: y - 6 },
        thickness: 0.2,
        color: PDF_COLORS.RULING_LINE,
    });
}

/**
 * More reliable paragraph drawing. Estimates line count based on character width,
 * adds a conservative buffer, then draws using pdf-lib's built-in word wrap.
 */
function drawParagraph(page: PDFPage, fonts: PdfFonts, text: string, y: number, maxWidth = BODY_W - 12): number {
    const charsPerLine = Math.floor(maxWidth / (fonts.sansRegular.widthOfTextAtSize("n", 10)));
    const wordCount = text.split(/\s+/).length;
    const avgWordLen = text.length / Math.max(wordCount, 1);
    const wordsPerLine = Math.max(1, Math.floor(charsPerLine / (avgWordLen + 1)));
    // Conservative estimate: use ceil + 1 for safety to avoid overlap
    const estimatedLines = Math.ceil(wordCount / wordsPerLine) + 1;
    const lineH = 15;

    page.drawText(text, {
        x: MARGIN + 6,
        y,
        size: 10,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT,
        maxWidth,
        lineHeight: lineH,
    });

    return y - (estimatedLines * lineH + 8);
}

function drawBulletList(page: PDFPage, fonts: PdfFonts, items: string[], y: number, maxWidth = BODY_W - 28): number {
    let currentY = y;
    for (const item of items) {
        page.drawText("•", {
            x: MARGIN + 6,
            y: currentY,
            size: 10,
            font: fonts.sansBold,
            color: PDF_COLORS.PRIMARY_GREEN,
        });
        const charsPerLine = Math.floor(maxWidth / (fonts.sansRegular.widthOfTextAtSize("n", 10)));
        const wordCount = item.split(/\s+/).length;
        const avgWordLen = item.length / Math.max(wordCount, 1);
        const wordsPerLine = Math.max(1, Math.floor(charsPerLine / (avgWordLen + 1)));
        const estimatedLines = Math.ceil(wordCount / wordsPerLine) + 1;

        page.drawText(item, {
            x: MARGIN + 20,
            y: currentY,
            size: 10,
            font: fonts.sansRegular,
            color: PDF_COLORS.TEXT,
            maxWidth,
            lineHeight: 15,
        });
        currentY -= (estimatedLines * 15 + 4);
    }
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

    const pageCounter = { n: 1 };
    const pageOne = addPage(pdfDoc, fonts, 1);

    // ── Page 1 header: "EMPLOYMENT CONTRACT" centered ──
    const titleText = "EMPLOYMENT CONTRACT";
    const titleW = fonts.serifBold.widthOfTextAtSize(titleText, 20);
    pageOne.drawText(titleText, {
        x: PAGE_W / 2 - titleW / 2,
        y: PAGE_H - 70,
        size: 20,
        font: fonts.serifBold,
        color: PDF_COLORS.TEXT,
    });

    const employerName = settings.employerName || "Employer";
    const partiesText = `Between  ${employerName}  and  ${employee.name}`;
    const partiesW = fonts.sansRegular.widthOfTextAtSize(partiesText, 10);
    pageOne.drawText(partiesText, {
        x: PAGE_W / 2 - partiesW / 2,
        y: PAGE_H - 87,
        size: 10,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    const effectiveLine = `Effective  ${effectiveDate}   ·   Prepared  ${todayStr}`;
    const effectiveW = fonts.sansRegular.widthOfTextAtSize(effectiveLine, 8.5);
    pageOne.drawText(effectiveLine, {
        x: PAGE_W / 2 - effectiveW / 2,
        y: PAGE_H - 101,
        size: 8.5,
        font: fonts.sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    // Divider below header
    pageOne.drawLine({
        start: { x: MARGIN, y: PAGE_H - 114 },
        end: { x: PAGE_W - MARGIN, y: PAGE_H - 114 },
        thickness: 0.75,
        color: PDF_COLORS.BORDER,
    });

    let cy = PAGE_H - 136;
    let currentPage = pageOne;

    const clauses = buildContractClauses(contract, employee, settings);

    for (let i = 0; i < clauses.length; i++) {
        const clause = clauses[i];
        const sectionNumber = `${i + 1}.`;

        if (clause.type === "signatures") {
            ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 200, pageCounter));

            drawSectionHeader(currentPage, fonts, `${sectionNumber} ${clause.title}`, cy);
            cy -= 18;

            // "Please sign below" hint
            const sigHintText = "— PLEASE SIGN BELOW —";
            const sigHintW = fonts.sansBold.widthOfTextAtSize(sigHintText, 8);
            currentPage.drawText(sigHintText, {
                x: PAGE_W / 2 - sigHintW / 2,
                y: cy,
                size: 8,
                font: fonts.sansBold,
                color: PDF_COLORS.TEXT_MUTED,
            });
            cy -= 28;

            // Employer sig block (left)
            currentPage.drawLine({
                start: { x: MARGIN, y: cy },
                end: { x: MARGIN + 200, y: cy },
                thickness: 0.75,
                color: PDF_COLORS.TEXT,
            });
            currentPage.drawText("Employer signature", { x: MARGIN, y: cy - 14, size: 8, font: fonts.sansBold, color: PDF_COLORS.TEXT_MUTED });
            currentPage.drawText(employerName, { x: MARGIN, y: cy - 26, size: 9, font: fonts.sansRegular, color: PDF_COLORS.TEXT });
            currentPage.drawText("Date: ____________________", { x: MARGIN, y: cy - 42, size: 8, font: fonts.sansRegular, color: PDF_COLORS.TEXT_MUTED });

            // Employee sig block (right)
            const rightX = PAGE_W - MARGIN - 200;
            currentPage.drawLine({
                start: { x: rightX, y: cy },
                end: { x: rightX + 200, y: cy },
                thickness: 0.75,
                color: PDF_COLORS.TEXT,
            });
            currentPage.drawText("Employee signature", { x: rightX, y: cy - 14, size: 8, font: fonts.sansBold, color: PDF_COLORS.TEXT_MUTED });
            currentPage.drawText(employee.name, { x: rightX, y: cy - 26, size: 9, font: fonts.sansRegular, color: PDF_COLORS.TEXT });
            currentPage.drawText("Date: ____________________", { x: rightX, y: cy - 42, size: 8, font: fonts.sansRegular, color: PDF_COLORS.TEXT_MUTED });

            continue;
        }

        // Section header — need ~70 pts minimum
        ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 70, pageCounter));

        drawSectionHeader(currentPage, fonts, `${sectionNumber} ${clause.title}`, cy);
        cy -= 24;

        if (clause.type === "rows" && clause.rows) {
            for (const row of clause.rows) {
                ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 24, pageCounter));
                drawRow(currentPage, fonts, row.label, row.value, cy);
                cy -= 20;
            }
            cy -= 6;
        } else if (clause.type === "paragraphs" && clause.paragraphs) {
            for (const p of clause.paragraphs) {
                ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 50, pageCounter));
                cy = drawParagraph(currentPage, fonts, p, cy);
            }
            cy -= 4;
        } else if (clause.type === "bullets" && clause.bullets) {
            ({ page: currentPage, cy } = ensureSpace(pdfDoc, fonts, currentPage, cy, 50, pageCounter));
            cy = drawBulletList(currentPage, fonts, clause.bullets, cy);
            cy -= 8;
        }

        // Gap between sections
        cy -= 10;
    }

    return pdfDoc.save();
}

export function buildContractFileName(contract: Contract, employee: Employee) {
    const safeName = employee.name.trim().replace(/\s+/g, "_");
    return `Contract_${safeName}_v${contract.version}.pdf`;
}
