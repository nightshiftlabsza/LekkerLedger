import { degrees, type PDFFont, type PDFPage } from "pdf-lib";
import { PDF_COLORS } from "./pdf-theme";

interface DrawPdfBrandMarkOptions {
    x: number;
    y: number;
    size?: number;
}

interface DrawPdfBrandLockupOptions extends DrawPdfBrandMarkOptions {
    serifBold: PDFFont;
    sansBold?: PDFFont;
    title?: string;
    subtitle?: string;
    titleSize?: number;
}

export function drawPdfBrandMark(page: PDFPage, { x, y, size = 28 }: DrawPdfBrandMarkOptions) {
    const s = size;

    page.drawRectangle({
        x: x + s * 0.12,
        y: y + s * 0.02,
        width: s * 0.6,
        height: s * 0.78,
        color: PDF_COLORS.BORDER,
        rotate: degrees(-4),
        opacity: 0.8,
    });

    page.drawRectangle({
        x: x + s * 0.08,
        y: y + s * 0.08,
        width: s * 0.62,
        height: s * 0.8,
        color: PDF_COLORS.SURFACE,
        borderColor: PDF_COLORS.BORDER,
        borderWidth: 0.6,
        rotate: degrees(-4),
    });

    page.drawSvgPath("M0 0 L8 0 L8 8 Z", {
        x: x + s * 0.55,
        y: y + s * 0.68,
        scale: s / 30,
        color: PDF_COLORS.PRIMARY_GREEN,
        rotate: degrees(-4),
    });

    const lineX = x + s * 0.2;
    const lineW = s * 0.16;
    const lineGap = s * 0.18;
    const lineRows = [0.56, 0.42, 0.28, 0.14];

    for (const row of lineRows) {
        page.drawRectangle({
            x: lineX,
            y: y + s * row,
            width: lineW,
            height: s * 0.05,
            color: PDF_COLORS.TEXT_MUTED,
            opacity: 0.35,
            rotate: degrees(-4),
        });
        page.drawRectangle({
            x: lineX + lineGap,
            y: y + s * row,
            width: lineW,
            height: s * 0.05,
            color: PDF_COLORS.TEXT_MUTED,
            opacity: 0.35,
            rotate: degrees(-4),
        });
    }

    page.drawLine({
        start: { x: x + s * 0.2, y: y + s * 0.16 },
        end: { x: x + s * 0.46, y: y + s * 0.16 },
        thickness: 1.4,
        color: PDF_COLORS.FOCUS_GOLD,
        opacity: 0.8,
    });

    page.drawEllipse({
        x: x + s * 0.43,
        y: y + s * 0.04,
        xScale: s * 0.08,
        yScale: s * 0.05,
        color: PDF_COLORS.BORDER,
        opacity: 0.9,
        rotate: degrees(12),
    });
    page.drawEllipse({
        x: x + s * 0.52,
        y: y + s * 0.06,
        xScale: s * 0.08,
        yScale: s * 0.05,
        color: PDF_COLORS.BORDER,
        opacity: 0.9,
        rotate: degrees(-8),
    });
    page.drawEllipse({
        x: x + s * 0.72,
        y: y + s * 0.03,
        xScale: s * 0.13,
        yScale: s * 0.07,
        color: PDF_COLORS.PRIMARY_GREEN,
        rotate: degrees(36),
    });
}

export function drawPdfBrandLockup(page: PDFPage, {
    x,
    y,
    size = 28,
    serifBold,
    sansBold,
    title = "LekkerLedger",
    subtitle,
    titleSize = 22,
}: DrawPdfBrandLockupOptions) {
    drawPdfBrandMark(page, { x, y: y - size * 0.46, size });

    const textX = x + size + 10;
    page.drawText(title, {
        x: textX,
        y,
        size: titleSize,
        font: serifBold,
        color: PDF_COLORS.TEXT,
    });

    if (subtitle && sansBold) {
        page.drawText(subtitle, {
            x: textX,
            y: y - 14,
            size: 7.5,
            font: sansBold,
            color: PDF_COLORS.TEXT_MUTED,
        });
    }
}
