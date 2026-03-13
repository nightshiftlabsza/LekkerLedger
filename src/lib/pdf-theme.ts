import { rgb } from "pdf-lib";

/**
 * CIVIC LEDGER PDF TOKENS
 * Derived from the exact hex codes in the UI spec.
 */

// Normalized RGB utility
const hexToRgb = (hex: string) => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
};

export const PDF_COLORS = {
    // Core Palette
    PAPER: hexToRgb("#FAF7F0"),      // Page background
    SURFACE: hexToRgb("#FFFFFF"),    // Cards/panels
    BORDER: hexToRgb("#E6E0D6"),     // Lines and boxes
    TEXT: hexToRgb("#101828"),       // Primary ink
    TEXT_MUTED: hexToRgb("#475467"), // Secondary/helper ink

    // Accents
    PRIMARY_GREEN: hexToRgb("#007A4D"), // CTA Green
    FOCUS_GOLD: hexToRgb("#C47A1C"),    // Highlights/Seal

    // Status
    DANGER: hexToRgb("#B42318"),
    SUCCESS: hexToRgb("#067647"),
    WARNING: hexToRgb("#B54708"),

    // Motif Helper
    RULING_LINE: rgb(0.9, 0.88, 0.84), // #E6E0D6 at ~40% opacity (effectively lighter)
};

export const PDF_LAYOUT = {
    MARGIN: 48,
    RADIUS: 12,
    LINE_THICKNESS: 0.5,
    LEDGER_SPACING: 14,
};
