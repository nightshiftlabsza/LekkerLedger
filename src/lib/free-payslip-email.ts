import { format } from "date-fns";
import { getRequiredEnvValue } from "./env";

interface SendFreePayslipEmailInput {
    to: string;
    employeeName: string;
    monthKey: string;
    filename: string;
    pdfBytes: Uint8Array;
}

const RESEND_API_URL = "https://api.resend.com/emails";

function monthLabelFromKey(monthKey: string) {
    const date = new Date(`${monthKey}-01T00:00:00`);
    return Number.isNaN(date.getTime()) ? monthKey : format(date, "MMMM yyyy");
}

export async function sendFreePayslipEmail(input: SendFreePayslipEmailInput) {
    const apiKey = getRequiredEnvValue("RESEND_API_KEY");
    const from = getRequiredEnvValue("FREE_PAYSLIP_FROM_EMAIL");
    const monthLabel = monthLabelFromKey(input.monthKey);
    const attachmentBase64 = Buffer.from(input.pdfBytes).toString("base64");

    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [input.to],
            subject: `Your free payslip for ${monthLabel}`,
            text: `Attached is the free payslip for ${input.employeeName} for ${monthLabel}.`,
            html: `<p>Attached is the free payslip for <strong>${input.employeeName}</strong> for <strong>${monthLabel}</strong>.</p>`,
            attachments: [
                {
                    filename: input.filename,
                    content: attachmentBase64,
                },
            ],
        }),
        cache: "no-store",
    });

    if (response.ok) {
        return;
    }

    let message = "The payslip email could not be sent.";
    try {
        const payload = await response.json() as { error?: { message?: string }; message?: string };
        message = payload.error?.message || payload.message || message;
    } catch {
        // Ignore response parsing failures and fall back to the generic message.
    }

    throw new Error(message);
}
