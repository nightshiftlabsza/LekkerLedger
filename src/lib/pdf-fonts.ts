import { PDFDocument, StandardFonts } from "pdf-lib";

export async function loadPdfFonts(pdfDoc: PDFDocument) {
    let sansRegularBuf, sansBoldBuf, serifBoldBuf, serifRegularBuf;
    try {
        if (typeof fetch !== "undefined") {
            const fetchFont = async (url: string) => {
                const r = await fetch(url);
                if (!r.ok) throw new Error(`Font not found: ${url}`);
                return r.arrayBuffer();
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

    const sansRegular = sansRegularBuf ? await pdfDoc.embedFont(sansRegularBuf) : await pdfDoc.embedFont(StandardFonts.Helvetica);
    const sansBold = sansBoldBuf ? await pdfDoc.embedFont(sansBoldBuf) : await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const serifBold = serifBoldBuf ? await pdfDoc.embedFont(serifBoldBuf) : await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const serifRegular = serifRegularBuf ? await pdfDoc.embedFont(serifRegularBuf) : await pdfDoc.embedFont(StandardFonts.TimesRoman);

    return {
        sansRegular,
        sansBold,
        serifBold,
        serifRegular,
    };
}
