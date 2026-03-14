import { PDFDocument, StandardFonts, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

type FontSource = {
    name: string;
    sources: string[];
    fallback: StandardFonts;
};

const FONT_SIGNATURES = {
    ttf: [0x00, 0x01, 0x00, 0x00],
    otf: [0x4f, 0x54, 0x54, 0x4f],
    woff: [0x77, 0x4f, 0x46, 0x46],
    woff2: [0x77, 0x4f, 0x46, 0x32],
} as const;

const FONT_SOURCES: Record<string, FontSource> = {
    sansRegular: {
        name: "IBM Plex Sans Regular",
        sources: [
            "/fonts/IBMPlexSans-Regular.woff",
            "/fonts/IBMPlexSans-Regular.ttf",
        ],
        fallback: StandardFonts.Helvetica,
    },
    sansBold: {
        name: "IBM Plex Sans Bold",
        sources: [
            "/fonts/IBMPlexSans-Bold.woff",
            "/fonts/IBMPlexSans-Bold.ttf",
        ],
        fallback: StandardFonts.HelveticaBold,
    },
    serifBold: {
        name: "IBM Plex Serif Bold",
        sources: ["/fonts/IBMPlexSerif-Bold.ttf"],
        fallback: StandardFonts.TimesRomanBold,
    },
    serifRegular: {
        name: "IBM Plex Serif Regular",
        sources: ["/fonts/IBMPlexSerif-Regular.ttf"],
        fallback: StandardFonts.TimesRoman,
    },
};

function isSupportedFontBinary(buffer: ArrayBuffer): boolean {
    const view = new Uint8Array(buffer);
    const signatures = Object.values(FONT_SIGNATURES);
    return signatures.some((signature) => signature.every((byte, index) => view[index] === byte));
}

export async function loadPdfFonts(pdfDoc: PDFDocument) {
    try {
        pdfDoc.registerFontkit(fontkit);
    } catch (e) {
        console.warn("Fontkit already registered or failed", e);
    }

    const fetchFont = async (source: string, label: string): Promise<ArrayBuffer | undefined> => {
        try {
            if (typeof window === "undefined") {
                const [{ access, readFile }, path] = await Promise.all([
                    import("node:fs/promises"),
                    import("node:path"),
                ]);
                const localPath = path.join(process.cwd(), "public", source.replace(/^\//, "").replaceAll("/", path.sep));
                await access(localPath);
                const buffer = await readFile(localPath);
                const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                if (!isSupportedFontBinary(bytes)) {
                    console.warn(`Skipping invalid font asset for ${label}: ${source}`);
                    return undefined;
                }
                return bytes;
            }

            const r = await fetch(source, { cache: "no-cache" });
            if (!r.ok) return undefined;

            const contentType = r.headers.get("content-type") || "";
            if (contentType.includes("text/html")) {
                console.warn(`Font fetch for ${label} returned HTML: ${source}`);
                return undefined;
            }

            const buffer = await r.arrayBuffer();
            if (!isSupportedFontBinary(buffer)) {
                console.warn(`Font fetch for ${label} returned invalid binary data: ${source}`);
                return undefined;
            }
            return buffer;
        } catch (err) {
            console.warn(`Error fetching font ${label} from ${source}:`, err);
            return undefined;
        }
    };

    const loadFontBytes = async ({ name, sources }: FontSource): Promise<ArrayBuffer | undefined> => {
        for (const source of sources) {
            const buffer = await fetchFont(source, name);
            if (buffer) return buffer;
        }
        return undefined;
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
        serifR: undefined as ArrayBuffer | undefined,
    };

    try {
        const [sansR, sansB, serifB, serifR] = await Promise.all([
            loadFontBytes(FONT_SOURCES.sansRegular),
            loadFontBytes(FONT_SOURCES.sansBold),
            loadFontBytes(FONT_SOURCES.serifBold),
            loadFontBytes(FONT_SOURCES.serifRegular),
        ]);
        fonts = { sansR, sansB, serifB, serifR };
    } catch (e) {
        console.warn("Failed to fetch custom fonts", e);
    }

    const [sansRegular, sansBold, serifBold, serifRegular] = await Promise.all([
        safeEmbed(fonts.sansR, FONT_SOURCES.sansRegular.fallback),
        safeEmbed(fonts.sansB, FONT_SOURCES.sansBold.fallback),
        safeEmbed(fonts.serifB, FONT_SOURCES.serifBold.fallback),
        safeEmbed(fonts.serifR, FONT_SOURCES.serifRegular.fallback),
    ]);

    return {
        sansRegular,
        sansBold,
        serifBold,
        serifRegular,
    };
}
