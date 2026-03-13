type ShareChannel = "whatsapp" | "email" | "system";

function normalisePhone(phone: string): string {
    const cleanPhone = phone.replaceAll(/\D/g, "");
    if (!cleanPhone) return "";
    return cleanPhone.startsWith("0") ? `27${cleanPhone.slice(1)}` : cleanPhone;
}

function buildPdfFile(pdfBytes: Uint8Array, fileName: string): File {
    return new File([pdfBytes.slice(0)], fileName, { type: "application/pdf" });
}

function openWhatsAppChat(phone?: string, text?: string): void {
    const intlPhone = normalisePhone(phone || "");
    const message = text?.trim() ?? "";

    if (intlPhone) {
        const query = message ? `?text=${encodeURIComponent(message)}` : "";
        window.open(`https://wa.me/${intlPhone}${query}`, "_blank", "noopener,noreferrer");
        return;
    }

    window.open("https://web.whatsapp.com/", "_blank", "noopener,noreferrer");
}

export function downloadPdf(pdfBytes: Uint8Array, fileName: string): void {
    const blob = new Blob([pdfBytes.slice(0)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function sharePdfFile(
    channel: ShareChannel,
    pdfBytes: Uint8Array,
    fileName: string,
    options: {
        title: string;
        text: string;
        employeePhone?: string;
        emailSubject?: string;
    },
): Promise<"shared" | "downloaded" | "cancelled"> {
    const file = buildPdfFile(pdfBytes, fileName);
    const canUseNativeFileShare = navigator.share && navigator.canShare?.({ files: [file] });

    // For WhatsApp, prefer opening the employee's chat when we have a phone number.
    // Native file share can attach the PDF on some devices, but it cannot target a specific chat.
    if (channel !== "whatsapp" && canUseNativeFileShare) {
        try {
            await navigator.share({
                title: options.title,
                text: options.text,
                files: [file],
            });
            return "shared";
        } catch (error) {
            if ((error as Error).name === "AbortError") {
                return "cancelled";
            }
        }
    }

    downloadPdf(pdfBytes, fileName);

    if (channel === "whatsapp") {
        openWhatsAppChat(options.employeePhone, options.text);
    }

    if (channel === "email") {
        const subject = encodeURIComponent(options.emailSubject || options.title);
        const body = encodeURIComponent(`${options.text}\n\nThe PDF has been downloaded to this device. Attach it from your downloads folder before sending.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    return "downloaded";
}

export async function shareViaWhatsApp(
    pdfBytes: Uint8Array,
    employeeName: string,
    phone: string,
    periodLabel: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
    const fileName = `Payslip_${employeeName.replaceAll(/\s+/g, "_")}_${periodLabel}.pdf`;
    return sharePdfFile("whatsapp", pdfBytes, fileName, {
        title: `Payslip for ${employeeName}`,
        text: `Hi ${employeeName.split(" ")[0]}, here is your payslip for ${periodLabel}.`,
        employeePhone: phone,
    });
}

export async function shareViaEmail(
    pdfBytes: Uint8Array,
    employeeName: string,
    periodLabel: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
    const fileName = `Payslip_${employeeName.replaceAll(/\s+/g, "_")}_${periodLabel}.pdf`;
    return sharePdfFile("email", pdfBytes, fileName, {
        title: `Payslip for ${employeeName}`,
        text: `Attached is the payslip for ${employeeName} for ${periodLabel}.`,
        emailSubject: `${employeeName} payslip for ${periodLabel}`,
    });
}
