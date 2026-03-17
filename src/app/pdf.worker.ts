// worker file
import { generatePayslipPdfBytes } from "../lib/pdf";

globalThis.onmessage = async (evt: MessageEvent) => {
    const { employee, payslip, settings, msgId } = evt.data;
    try {
        const bytes = await generatePayslipPdfBytes(employee, payslip, settings, settings.defaultLanguage);
        self.postMessage({ msgId, bytes, error: null });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error generating PDF in worker";
        self.postMessage({ msgId, bytes: null, error: msg });
    }
};

