import { PDFDocument, StandardFonts, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function loadPdfFonts(pdfDoc: PDFDocument) {
    try {
        pdfDoc.registerFontkit(fontkit);
    } catch (e) {
        console.warn("Fontkit already registered or failed", e);
    }

    const fetchFont = async (url: string): Promise<ArrayBuffer | undefined> => {
        try {
            const r = await fetch(url, { cache: "no-cache" });
            if (!r.ok) return undefined;

            // CRITICAL: Ensure we didn't get an HTML error page instead of a font
            const contentType = r.headers.get("content-type") || "";
            if (contentType.includes("text/html")) {
                console.warn(`Font fetch for ${url} returned HTML. Likely a 404 or redirect.`);
                return undefined;
            }

            const buffer = await r.arrayBuffer();
            // Basic sanity check for TTF/OTF magic bytes
            const view = new Uint8Array(buffer);
            const isFont = (view[0] === 0x00 && view[1] === 0x01 && view[2] === 0x00 && view[3] === 0x00) || // TTF
                (view[0] === 0x4f && view[1] === 0x54 && view[2] === 0x54 && view[3] === 0x4f);   // OTF

            if (!isFont && buffer.byteLength < 1000) {
                console.warn(`Font fetch for ${url} returned invalid binary data.`);
                return undefined;
            }

            return buffer;
        } catch (err) {
            console.warn(`Error fetching font ${url}:`, err);
            return undefined;
        }
    };

    const safeEmbed = async (buffer: ArrayBuffer | undefined, fallback: StandardFonts): Promise<PDFFont> => {
        if (!buffer || buffer.byteLength === 0) return pdfDoc.embedFont(fallback);
        try {
            return await pdfDoc.embedFont(buffer);
        } catch (err) {
            console.error(`Failed to embed custom font, falling back to ${fallback}:`, err);
            return pdfDoc.embedFont(fallback);
        }
    };

    let fonts = {
        sansR: undefined as ArrayBuffer | undefined,
        sansB: undefined as ArrayBuffer | undefined,
        serifB: undefined as ArrayBuffer | undefined,
        serifR: undefined as ArrayBuffer | undefined
    };

    try {
        if (typeof fetch !== "undefined") {
            const [sansR, sansB, serifB, serifR] = await Promise.all([
                fetchFont("/fonts/IBMPlexSans-Regular.ttf"),
                fetchFont("/fonts/IBMPlexSans-Bold.ttf"),
                fetchFont("/fonts/IBMPlexSerif-Bold.ttf"),
                fetchFont("/fonts/IBMPlexSerif-Regular.ttf"),
            ]);
            fonts = { sansR, sansB, serifB, serifR };
        }
    } catch (e) {
        console.warn("Failed to fetch custom fonts", e);
    }

    const [sansRegular, sansBold, serifBold, serifRegular] = await Promise.all([
        safeEmbed(fonts.sansR, StandardFonts.Helvetica),
        safeEmbed(fonts.sansB, StandardFonts.HelveticaBold),
        safeEmbed(fonts.serifB, StandardFonts.TimesRomanBold),
        safeEmbed(fonts.serifR, StandardFonts.TimesRoman),
    ]);

    return {
        sansRegular,
        sansBold,
        serifBold,
        serifRegular,
    };
}
