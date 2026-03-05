import { PDFDocument, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function loadPdfFonts(pdfDoc: PDFDocument) {
    pdfDoc.registerFontkit(fontkit);
    let sansRegularBuf: ArrayBuffer | undefined;
    let sansBoldBuf: ArrayBuffer | undefined;
    let serifBoldBuf: ArrayBuffer | undefined;
    let serifRegularBuf: ArrayBuffer | undefined;

    try {
        if (typeof fetch !== "undefined") {
            const fetchFont = async (url: string) => {
                try {
                    const r = await fetch(url);
                    if (!r.ok) {
                        console.warn(`Font not found: ${url}`);
                        return undefined;
                    }
                    return await r.arrayBuffer();
                } catch (err) {
                    console.warn(`Error fetching font ${url}:`, err);
                    return undefined;
                }
            };

            const [sansR, sansB, serifB, serifR] = await Promise.all([
                fetchFont("/fonts/IBMPlexSans-Regular.ttf"),
                fetchFont("/fonts/IBMPlexSans-Bold.ttf"),
                fetchFont("/fonts/IBMPlexSerif-Bold.ttf"),
                fetchFont("/fonts/IBMPlexSerif-Regular.ttf"),
            ]);

            sansRegularBuf = sansR;
            sansBoldBuf = sansB;
            serifBoldBuf = serifB;
            serifRegularBuf = serifR;
        }
    } catch (e) {
        console.warn("Failed to fetch custom fonts, falling back to standard fonts", e);
    }

    // Embed fonts, falling back to StandardFonts if custom ones failed to load
    const [sansRegular, sansBold, serifBold, serifRegular] = await Promise.all([
        sansRegularBuf ? pdfDoc.embedFont(sansRegularBuf) : pdfDoc.embedFont(StandardFonts.Helvetica),
        sansBoldBuf ? pdfDoc.embedFont(sansBoldBuf) : pdfDoc.embedFont(StandardFonts.HelveticaBold),
        serifBoldBuf ? pdfDoc.embedFont(serifBoldBuf) : pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        serifRegularBuf ? pdfDoc.embedFont(serifRegularBuf) : pdfDoc.embedFont(StandardFonts.TimesRoman),
    ]);

    return {
        sansRegular,
        sansBold,
        serifBold,
        serifRegular,
    };
}
