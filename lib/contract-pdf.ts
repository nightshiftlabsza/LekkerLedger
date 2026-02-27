/**
 * BCEA-Compliant Employment Contract PDF Generator
 * Generates a professional, multi-page employment contract for domestic workers.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Employee, EmployerSettings } from "./schema";
import { format } from "date-fns";

const AMBER = rgb(0.77, 0.48, 0.11);
const DARK = rgb(0.11, 0.09, 0.08);
const SLATE = rgb(0.45, 0.40, 0.35);
const WHITE = rgb(1, 1, 1);
const LINE = rgb(0.88, 0.86, 0.83);

export interface ContractInput {
    employee: Employee;
    employer: EmployerSettings;
    startDate: string;       // ISO date
    workDays: string;        // e.g. "Monday to Friday"
    workHoursPerDay: number;
    duties: string;          // Description of duties
    probationMonths: number;
}

export async function generateContractPdfBytes(input: ContractInput): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Embed logo if exists
    let logoImage = null;
    if (input.employer.logoData) {
        try {
            if (input.employer.logoData.startsWith("data:image/png")) {
                logoImage = await pdfDoc.embedPng(input.employer.logoData);
            } else {
                logoImage = await pdfDoc.embedJpg(input.employer.logoData);
            }
        } catch (e) {
            console.error("Failed to embed logo", e);
        }
    }

    const MARGIN = 56;
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const LINE_H = 16;

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let cy = PAGE_H - MARGIN;

    function checkPage(needed: number) {
        if (cy - needed < MARGIN + 40) {
            // Footer on current page
            page.drawText("LekkerLedger — Employment Contract", {
                x: MARGIN, y: 30, size: 7, font: regular, color: SLATE,
            });
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            cy = PAGE_H - MARGIN;
        }
    }

    function heading(text: string) {
        checkPage(40);
        cy -= 10;
        page.drawText(text.toUpperCase(), { x: MARGIN, y: cy, size: 9, font: bold, color: AMBER });
        cy -= 4;
        page.drawLine({ start: { x: MARGIN, y: cy }, end: { x: PAGE_W - MARGIN, y: cy }, thickness: 0.5, color: LINE });
        cy -= LINE_H;
    }

    function para(text: string, indented = false) {
        const maxChars = indented ? 78 : 85;
        const x = indented ? MARGIN + 16 : MARGIN;
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
            if ((line + " " + word).length > maxChars && line.length > 0) {
                checkPage(LINE_H);
                page.drawText(line, { x, y: cy, size: 9.5, font: regular, color: DARK });
                cy -= LINE_H;
                line = word;
            } else {
                line = line ? line + " " + word : word;
            }
        }
        if (line) {
            checkPage(LINE_H);
            page.drawText(line, { x, y: cy, size: 9.5, font: regular, color: DARK });
            cy -= LINE_H;
        }
        cy -= 4;
    }

    function field(label: string, value: string) {
        checkPage(LINE_H);
        page.drawText(label + ":", { x: MARGIN, y: cy, size: 9, font: bold, color: SLATE });

        const maxW = PAGE_W - MARGIN - 160 - MARGIN; // available width
        let displayVal = value;
        const ellipsis = "...";
        if (regular.widthOfTextAtSize(displayVal, 9.5) > maxW) {
            while (displayVal.length > 0 && regular.widthOfTextAtSize(displayVal + ellipsis, 9.5) > maxW) {
                displayVal = displayVal.slice(0, -1);
            }
            displayVal += ellipsis;
        }

        page.drawText(displayVal, { x: MARGIN + 160, y: cy, size: 9.5, font: regular, color: DARK });
        cy -= LINE_H + 2;
    }

    // ── Title header ────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: DARK });
    page.drawRectangle({ x: 0, y: PAGE_H - 84, width: PAGE_W, height: 4, color: AMBER });

    page.drawText("EMPLOYMENT CONTRACT", {
        x: MARGIN, y: PAGE_H - 38, size: 22, font: bold, color: WHITE,
    });
    page.drawText("Basic Conditions of Employment Act (BCEA) · Sectoral Determination 7", {
        x: MARGIN, y: PAGE_H - 60, size: 9, font: regular, color: rgb(0.6, 0.55, 0.5),
    });
    page.drawText("LekkerLedger", {
        x: PAGE_W - MARGIN - bold.widthOfTextAtSize("LekkerLedger", 11),
        y: PAGE_H - 42, size: 11, font: bold, color: AMBER,
    });

    if (logoImage) {
        const dims = logoImage.scaleToFit(140, 50);
        page.drawImage(logoImage, {
            x: PAGE_W - MARGIN - dims.width,
            y: PAGE_H - 104 - 24, // below amber bar
            width: dims.width,
            height: dims.height,
        });
        cy = PAGE_H - 104 - 24 - dims.height - 20;
    } else {
        cy = PAGE_H - 110;
    }

    // ── Parties ──────────────────────────────────────────────────────────────
    heading("1. Parties to This Agreement");
    field("Employer", input.employer.employerName || "(Not set)");
    field("Employer Address", input.employer.employerAddress || "(Not set)");
    field("Employer ID", input.employer.employerIdNumber || "(Not set)");
    cy -= 6;
    field("Employee", input.employee.name);
    field("Employee ID/Passport", input.employee.idNumber || "(Not provided)");
    field("Employee Phone", input.employee.phone || "(Not provided)");

    // ── Commencement ─────────────────────────────────────────────────────────
    heading("2. Commencement and Duration");
    para(`This contract commences on ${input.startDate ? format(new Date(input.startDate), "d MMMM yyyy") : "(Date)"} and continues indefinitely until terminated by either party in accordance with the Basic Conditions of Employment Act No. 75 of 1997.`);
    if (input.probationMonths > 0) {
        para(`The employee shall serve a probationary period of ${input.probationMonths} month(s) from the commencement date.`);
    }

    // ── Job description ──────────────────────────────────────────────────────
    heading("3. Job Description");
    field("Job Title", input.employee.role);
    para(`The Employee's duties shall include, but are not limited to:`);
    para(input.duties || "General domestic duties as reasonably assigned.", true);

    // ── Working hours ────────────────────────────────────────────────────────
    heading("4. Working Hours");
    field("Working Days", input.workDays || "Monday to Friday");
    field("Hours Per Day", `${input.workHoursPerDay || 8} hours`);
    para("Overtime may be worked by agreement but may not exceed 10 hours per week. Overtime is paid at 1.5× the normal hourly rate. Work on Sundays and public holidays is paid at 2× the normal hourly rate.");

    // ── Remuneration ─────────────────────────────────────────────────────────
    heading("5. Remuneration");
    field("Hourly Rate", `R ${input.employee.hourlyRate.toFixed(2)}`);
    para("The hourly rate shall not be less than the National Minimum Wage for domestic workers as prescribed under Sectoral Determination 7. Wages shall be paid monthly on or before the last working day of each month.");

    // ── Deductions ───────────────────────────────────────────────────────────
    heading("6. Deductions");
    para("The Employer shall deduct 1% of gross remuneration as the Employee's contribution to the Unemployment Insurance Fund (UIF), and shall contribute a further 1% as the Employer's contribution. These contributions shall be paid to the UIF monthly.");
    para("No deductions shall be made without the written consent of the Employee, except where required by law.");
    para("Deductions for damages or loss may only be made if the Employer follows a fair procedure, the Employee agrees in writing, and the total deduction does not exceed 25% of the Employee's net remuneration (BCEA Section 34).");

    // ── Leave ────────────────────────────────────────────────────────────────
    heading("7. Leave Entitlements");
    para("Annual Leave: The Employee is entitled to 15 working days' paid leave per year (accrued at 1 day for every 17 days worked). Leave must be taken within 6 months of accrual.");
    para("Sick Leave: The Employee is entitled to 30 days' paid sick leave in a 36-month cycle (10 days per year). A medical certificate is required for absences exceeding 2 consecutive days.");
    para("Family Responsibility Leave: The Employee is entitled to 3 days' paid leave per year after 4 months of continuous employment, for the birth/illness/death of a close family member.");

    // ── Accommodation ────────────────────────────────────────────────────────
    heading("8. Accommodation");
    para("If accommodation is provided, the deduction shall not exceed 10% of the Employee's gross wage, as per Sectoral Determination 7.");

    // ── Termination ──────────────────────────────────────────────────────────
    heading("9. Termination of Employment");
    para("Either party may terminate this contract by giving written notice as follows:");
    para("• During probation: 1 week's notice.", true);
    para("• After 6 months but less than 1 year: 1 week's notice.", true);
    para("• After 1 year: 4 weeks' notice.", true);
    para("Summary dismissal may only occur in cases of serious misconduct as defined by the Labour Relations Act No. 66 of 1995.");

    // ── Dispute resolution ───────────────────────────────────────────────────
    heading("10. Dispute Resolution");
    para("Any disputes arising from this contract shall be referred to the Commission for Conciliation, Mediation and Arbitration (CCMA) in terms of the Labour Relations Act.");

    // ── Signatures ───────────────────────────────────────────────────────────
    heading("11. Signatures");
    cy -= 8;
    const sigY = cy;
    // Left: Employer
    page.drawText("Employer:", { x: MARGIN, y: sigY, size: 9, font: bold, color: SLATE });
    page.drawLine({ start: { x: MARGIN, y: sigY - 28 }, end: { x: MARGIN + 180, y: sigY - 28 }, thickness: 0.5, color: DARK });
    page.drawText("Signature", { x: MARGIN, y: sigY - 40, size: 7.5, font: regular, color: SLATE });
    page.drawLine({ start: { x: MARGIN, y: sigY - 64 }, end: { x: MARGIN + 180, y: sigY - 64 }, thickness: 0.5, color: DARK });
    page.drawText("Date", { x: MARGIN, y: sigY - 76, size: 7.5, font: regular, color: SLATE });

    // Right: Employee
    const rx = PAGE_W / 2 + 20;
    page.drawText("Employee:", { x: rx, y: sigY, size: 9, font: bold, color: SLATE });
    page.drawLine({ start: { x: rx, y: sigY - 28 }, end: { x: rx + 180, y: sigY - 28 }, thickness: 0.5, color: DARK });
    page.drawText("Signature", { x: rx, y: sigY - 40, size: 7.5, font: regular, color: SLATE });
    page.drawLine({ start: { x: rx, y: sigY - 64 }, end: { x: rx + 180, y: sigY - 64 }, thickness: 0.5, color: DARK });
    page.drawText("Date", { x: rx, y: sigY - 76, size: 7.5, font: regular, color: SLATE });

    // Footer on last page
    page.drawLine({ start: { x: MARGIN, y: 50 }, end: { x: PAGE_W - MARGIN, y: 50 }, thickness: 0.5, color: LINE });
    page.drawText(
        "Generated by LekkerLedger — in compliance with BCEA and Sectoral Determination 7 (Domestic Workers).",
        { x: MARGIN, y: 38, size: 7.5, font: regular, color: SLATE }
    );
    page.drawText("lekkerledger.app · By Nightshift Labs ZA · Data processed locally.", {
        x: MARGIN, y: 26, size: 7, font: regular, color: rgb(0.65, 0.6, 0.55),
    });

    return pdfDoc.save();
}
