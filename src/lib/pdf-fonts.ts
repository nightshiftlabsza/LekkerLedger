import { PDFDocument, StandardFonts } from "pdf-lib";

export async function loadPdfFonts(pdfDoc: PDFDocument) {
    let sansRegularBuf, sansBoldBuf, serifBoldBuf, serifRegularBuf;
    try {
        // Run in browser/worker environment
        if (typeof fetch !== "undefined") {
            const [sansR, sansB, serifB, serifR] = await Promise.all([
                fetch("/fonts/IBMPlexSans-Regular.ttf").then((r) => r.arrayBuffer()),
                fetch("/fonts/IBMPlexSans-Bold.ttf").then((r) => r.arrayBuffer()),
                fetch("/fonts/IBMPlexSerif-Bold.ttf").then((r) => r.arrayBuffer()),
                fetch("/fonts/IBMPlexSerif-Regular.ttf").then((r) => r.arrayBuffer()),
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
