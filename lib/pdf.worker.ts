// worker file
import { generatePayslipPdfBytes } from "./pdf";

self.onmessage = async (evt: MessageEvent) => {
    const { employee, payslip, settings, msgId, isLimited } = evt.data;
    try {
        const bytes = await generatePayslipPdfBytes(employee, payslip, settings, settings.defaultLanguage, isLimited);
        self.postMessage({ msgId, bytes, error: null });
    } catch (err: any) {
        self.postMessage({ msgId, bytes: null, error: err.message || "Unknown error generating PDF in worker" });
    }
};
