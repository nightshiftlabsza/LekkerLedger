import { PDFDocument } from "pdf-lib";
import { Employee, EmployerSettings } from "./schema";
import { format } from "date-fns";
import { PDF_COLORS } from "./pdf-theme";
import { loadPdfFonts } from "./pdf-fonts";

export type DisciplinaryType = "verbal-warning" | "written-warning" | "final-warning" | "disciplinary-notice";

export interface DisciplinaryInput {
    type: DisciplinaryType;
    employee: Employee;
    employer: EmployerSettings;
    date: string;
    offence: string;
    details: string;
    actionRequired?: string;
    hearingDate?: string;
    hearingTime?: string;
}

export async function generateDisciplinaryPdfBytes(input: DisciplinaryInput): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const { sansRegular, sansBold, serifBold } = await loadPdfFonts(pdfDoc);

    const MARGIN = 56;
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const LINE_H = 16;

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    // Civic Ledger Background
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PDF_COLORS.PAPER });

    let cy = PAGE_H - MARGIN;

    function checkPage(needed: number) {
        if (cy - needed < MARGIN + 40) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PDF_COLORS.PAPER });
            cy = PAGE_H - MARGIN;
        }
    }

    function heading(text: string) {
        checkPage(40);
        cy -= 10;
        page.drawRectangle({ x: MARGIN, y: cy - 6, width: PAGE_W - MARGIN * 2, height: 20, color: PDF_COLORS.SURFACE, borderColor: PDF_COLORS.BORDER, borderWidth: 0.5 });
        page.drawLine({ start: { x: MARGIN, y: cy + 14 }, end: { x: MARGIN, y: cy - 6 }, thickness: 3, color: PDF_COLORS.PRIMARY_GREEN });
        page.drawText(text.toUpperCase(), { x: MARGIN + 10, y: cy + 4, size: 9, font: sansBold, color: PDF_COLORS.TEXT });
        cy -= 10;
    }

    function para(text: string, isBold = false) {
        const maxChars = 85;
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
            if ((line + " " + word).length > maxChars && line.length > 0) {
                checkPage(LINE_H);
                page.drawText(line, { x: MARGIN, y: cy, size: 9, font: isBold ? sansBold : sansRegular, color: PDF_COLORS.TEXT });
                cy -= LINE_H;
                line = word;
            } else {
                line = line ? line + " " + word : word;
            }
        }
        if (line) {
            checkPage(LINE_H);
            page.drawText(line, { x: MARGIN, y: cy, size: 9, font: isBold ? sansBold : sansRegular, color: PDF_COLORS.TEXT });
            cy -= LINE_H;
        }
        cy -= 4;
    }

    function field(label: string, value: string) {
        checkPage(LINE_H);
        page.drawText(label + ":", { x: MARGIN, y: cy, size: 9, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
        page.drawText(value || "(Not set)", { x: MARGIN + 160, y: cy, size: 9, font: sansRegular, color: PDF_COLORS.TEXT });
        page.drawLine({ start: { x: MARGIN, y: cy - 5 }, end: { x: PAGE_W - MARGIN, y: cy - 5 }, thickness: 0.2, color: PDF_COLORS.RULING_LINE });
        cy -= LINE_H + 2;
    }

    const titles: Record<DisciplinaryType, string> = {
        "verbal-warning": "RECORD OF VERBAL WARNING",
        "written-warning": "WRITTEN WARNING",
        "final-warning": "FINAL WRITTEN WARNING",
        "disciplinary-notice": "NOTICE OF DISCIPLINARY INQUIRY"
    };

    // Header
    page.drawText("LekkerLedger", { x: MARGIN, y: PAGE_H - 60, size: 22, font: serifBold, color: PDF_COLORS.TEXT });

    const titleColor = input.type === "final-warning" ? PDF_COLORS.DANGER : PDF_COLORS.PRIMARY_GREEN;
    page.drawText(titles[input.type], {
        x: PAGE_W - MARGIN - serifBold.widthOfTextAtSize(titles[input.type], 16),
        y: PAGE_H - 60,
        size: 16, font: serifBold, color: titleColor
    });

    page.drawLine({ start: { x: MARGIN, y: PAGE_H - 80 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 80 }, thickness: 1.5, color: titleColor });

    cy = PAGE_H - 110;

    heading("1. EMPLOYEE & EMPLOYER DETAILS");
    cy -= 10;
    field("Employer", input.employer.employerName || "N/A");
    field("Employee", input.employee.name);
    field("Date Issued", format(new Date(input.date), "d MMMM yyyy"));
    cy -= 10;

    if (input.type === "disciplinary-notice") {
        heading("2. NOTICE OF INQUIRY");
        cy -= 10;
        para("You are hereby notified to attend a disciplinary inquiry to be held as follows:");
        field("Date", input.hearingDate || "TBA");
        field("Time", input.hearingTime || "TBA");
        field("Venue", "Place of Employment");
        cy -= 10;

        heading("3. NATURE OF ALLEGATIONS");
        cy -= 10;
        para(input.offence, true);
        para(input.details);
        cy -= 10;

        heading("4. YOUR RIGHTS");
        cy -= 10;
        para("- The right to be represented by a fellow employee.");
        para("- The right to an interpreter (if required).");
        para("- The right to call witnesses and to cross-examine employer witnesses.");
        para("- The right to an impartial chairperson.");
    } else {
        heading("2. NATURE OF WARNING");
        cy -= 10;
        para(`Type: ${titles[input.type]}`, true);
        cy -= 10;

        heading("3. INCIDENT DETAILS");
        cy -= 10;
        field("Subject / Offence", input.offence);
        para("Details of incident/conduct:", true);
        para(input.details);
        cy -= 10;

        if (input.actionRequired) {
            heading("4. REQUIRED CORRECTIVE ACTION");
            cy -= 10;
            para(input.actionRequired);
            cy -= 10;
        }

        heading("5. VALIDITY PERIOD");
        cy -= 10;
        para(`This warning will remain valid for a period of ${input.type === "final-warning" ? "6" : "3"} months from the date of issue.`);
    }

    // Signatures
    cy -= 60;
    checkPage(100);
    const sigW = 180;

    page.drawLine({ start: { x: MARGIN, y: cy }, end: { x: MARGIN + sigW, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    page.drawText("Employer Signature", { x: MARGIN, y: cy - 14, size: 8, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
    page.drawText(input.employer.employerName || "Employer", { x: MARGIN, y: cy - 26, size: 8, font: sansRegular, color: PDF_COLORS.TEXT });

    page.drawLine({ start: { x: PAGE_W - MARGIN - sigW, y: cy }, end: { x: PAGE_W - MARGIN, y: cy }, thickness: 0.5, color: PDF_COLORS.TEXT });
    page.drawText("Employee Signature", { x: PAGE_W - MARGIN - sigW, y: cy - 14, size: 8, font: sansBold, color: PDF_COLORS.TEXT_MUTED });
    page.drawText(input.employee.name, { x: PAGE_W - MARGIN - sigW, y: cy - 26, size: 8, font: sansRegular, color: PDF_COLORS.TEXT });
    page.drawText("(Acknowledgement of receipt only)", { x: PAGE_W - MARGIN - sigW, y: cy - 36, size: 7, font: sansRegular, color: PDF_COLORS.TEXT_MUTED });

    // Footer generation mark
    page.drawText("Generated by LekkerLedger", {
        x: PAGE_W / 2 - sansRegular.widthOfTextAtSize("Generated by LekkerLedger", 7) / 2,
        y: 95,
        size: 7,
        font: sansRegular,
        color: PDF_COLORS.TEXT_MUTED,
    });

    page.drawLine({ start: { x: MARGIN, y: 38 }, end: { x: PAGE_W - MARGIN, y: 38 }, thickness: 0.5, color: PDF_COLORS.BORDER });
    const footerText = "LekkerLedger.app · Civic Ledger Design · Labor Relations";
    page.drawText(footerText, { x: PAGE_W / 2 - sansRegular.widthOfTextAtSize(footerText, 7) / 2, y: 25, size: 7, font: sansRegular, color: PDF_COLORS.TEXT_MUTED });

    return pdfDoc.save();
}
