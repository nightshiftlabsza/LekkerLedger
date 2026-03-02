/**
 * BCEA-Compliant Disciplinary Templates PDF Generator
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Employee, EmployerSettings } from "./schema";
import { format } from "date-fns";

const AMBER = rgb(0.77, 0.48, 0.11);
const DARK = rgb(0.11, 0.09, 0.08);
const SLATE = rgb(0.45, 0.40, 0.35);
const WHITE = rgb(1, 1, 1);
const LINE = rgb(0.88, 0.86, 0.83);
const RED = rgb(0.8, 0.2, 0.2);

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
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const MARGIN = 56;
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const LINE_H = 16;

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let cy = PAGE_H - MARGIN;

    function checkPage(needed: number) {
        if (cy - needed < MARGIN + 40) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            cy = PAGE_H - MARGIN;
        }
    }

    function heading(text: string, color = AMBER) {
        checkPage(40);
        cy -= 10;
        page.drawText(text.toUpperCase(), { x: MARGIN, y: cy, size: 9, font: bold, color });
        cy -= 4;
        page.drawLine({ start: { x: MARGIN, y: cy }, end: { x: PAGE_W - MARGIN, y: cy }, thickness: 0.5, color: LINE });
        cy -= LINE_H;
    }

    function para(text: string, isBold = false) {
        const maxChars = 85;
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
            if ((line + " " + word).length > maxChars && line.length > 0) {
                checkPage(LINE_H);
                page.drawText(line, { x: MARGIN, y: cy, size: 9.5, font: isBold ? bold : regular, color: DARK });
                cy -= LINE_H;
                line = word;
            } else {
                line = line ? line + " " + word : word;
            }
        }
        if (line) {
            checkPage(LINE_H);
            page.drawText(line, { x: MARGIN, y: cy, size: 9.5, font: isBold ? bold : regular, color: DARK });
            cy -= LINE_H;
        }
        cy -= 4;
    }

    function field(label: string, value: string) {
        checkPage(LINE_H);
        page.drawText(label + ":", { x: MARGIN, y: cy, size: 9, font: bold, color: SLATE });
        page.drawText(value || "(Not set)", { x: MARGIN + 160, y: cy, size: 9.5, font: regular, color: DARK });
        cy -= LINE_H + 2;
    }

    const titles: Record<DisciplinaryType, string> = {
        "verbal-warning": "RECORD OF VERBAL WARNING",
        "written-warning": "WRITTEN WARNING",
        "final-warning": "FINAL WRITTEN WARNING",
        "disciplinary-notice": "NOTICE OF DISCIPLINARY INQUIRY"
    };

    // Header
    const headerColor = input.type === "final-warning" ? RED : DARK;
    page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: headerColor });
    page.drawRectangle({ x: 0, y: PAGE_H - 84, width: PAGE_W, height: 4, color: AMBER });
    page.drawText(titles[input.type], { x: MARGIN, y: PAGE_H - 38, size: 18, font: bold, color: WHITE });

    cy = PAGE_H - 110;

    heading("1. Employee & Employer Details");
    field("Employer", input.employer.employerName);
    field("Employee", input.employee.name);
    field("Date Issued", format(new Date(input.date), "d MMMM yyyy"));

    if (input.type === "disciplinary-notice") {
        heading("2. Notice of Inquiry");
        para("You are hereby notified to attend a disciplinary inquiry to be held as follows:");
        field("Date", input.hearingDate || "TBA");
        field("Time", input.hearingTime || "TBA");
        field("Venue", "Place of Employment");

        heading("3. Nature of Allegations");
        para(input.offence, true);
        para(input.details);

        heading("4. Your Rights");
        para("- The right to be represented by a fellow employee.");
        para("- The right to an interpreter (if required).");
        para("- The right to call witnesses and to cross-examine employer witnesses.");
        para("- The right to an impartial chairperson.");
    } else {
        heading("2. Nature of Warning");
        para(`Type: ${titles[input.type]}`, true);

        heading("3. Incident Details");
        field("Subject / Offence", input.offence);
        para("Details of incident/conduct:", true);
        para(input.details);

        if (input.actionRequired) {
            heading("4. Required Corrective Action");
            para(input.actionRequired);
        }

        heading("5. Validity Period");
        para(`This warning will remain valid for a period of ${input.type === "final-warning" ? "6" : "3"} months from the date of issue.`);
    }

    // Signatures
    cy -= 60;
    checkPage(100);
    const sigW = 180;

    page.drawLine({ start: { x: MARGIN, y: cy }, end: { x: MARGIN + sigW, y: cy }, thickness: 0.5, color: SLATE });
    page.drawText("Employer Signature", { x: MARGIN, y: cy - 12, size: 7, font: regular, color: SLATE });

    page.drawLine({ start: { x: PAGE_W - MARGIN - sigW, y: cy }, end: { x: PAGE_W - MARGIN, y: cy }, thickness: 0.5, color: SLATE });
    page.drawText("Employee Signature", { x: PAGE_W - MARGIN - sigW, y: cy - 12, size: 7, font: regular, color: SLATE });
    page.drawText("(Acknowledgement of receipt only)", { x: PAGE_W - MARGIN - sigW, y: cy - 20, size: 6, font: regular, color: SLATE });

    // Footer & Seal
    const sealX = PAGE_W - 80;
    const sealY = 60;
    page.drawCircle({ x: sealX, y: sealY, size: 30, color: rgb(0.95, 0.95, 0.95), borderColor: AMBER, borderWidth: 1 });
    page.drawText("LEGAL", { x: sealX - 10, y: sealY + 6, size: 7, font: bold, color: AMBER });
    page.drawText("COMPLIANCE", { x: sealX - 16, y: sealY - 6, size: 5, font: bold, color: SLATE });

    return pdfDoc.save();
}
