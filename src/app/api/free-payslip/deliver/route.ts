import { NextResponse } from "next/server";
import { sendFreePayslipEmail } from "@/lib/free-payslip-email";
import {
    buildFreePayslipPayload,
    FreePayslipRequestSchema,
    FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE,
    normalizeFreePayslipFormState,
    validateFreePayslipForm,
} from "@/lib/free-payslip-form";
import {
    consumeFreePayslipQuota,
    FREE_PAYSLIP_MONTHLY_LIMIT_MESSAGE,
    getFreePayslipQuotaStatus,
    toFreePayslipQuotaErrorResponse,
} from "@/lib/free-payslip-quota";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const json = await request.json().catch(() => null);
        const parsed = FreePayslipRequestSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || "Enter a valid email address." }, { status: 400 });
        }

        const email = parsed.data.email.trim().toLowerCase();
        const normalizedForm = normalizeFreePayslipFormState(parsed.data.form);
        const validationErrors = validateFreePayslipForm(normalizedForm);
        if (Object.keys(validationErrors).length > 0) {
            const firstError = Object.values(validationErrors).find((value) => Boolean(value));
            return NextResponse.json({ error: firstError || "Complete the required payslip details before sending." }, { status: 400 });
        }

        const payload = buildFreePayslipPayload(normalizedForm);
        if (!payload) {
            return NextResponse.json({ error: "Complete the required payslip details before sending." }, { status: 400 });
        }

        const quota = await getFreePayslipQuotaStatus(email);
        if (quota.usedThisMonth) {
            return NextResponse.json({ error: FREE_PAYSLIP_MONTHLY_LIMIT_MESSAGE }, { status: 409 });
        }

        const pdfBytes = await generatePayslipPdfBytes(payload.employee, payload.payslip, payload.settings, "en");
        const filename = getPayslipFilename(payload.employee, payload.payslip);

        await sendFreePayslipEmail({
            to: email,
            employeeName: payload.employee.name,
            monthKey: quota.monthKey,
            filename,
            pdfBytes,
        });

        try {
            await consumeFreePayslipQuota(email);
        } catch (error) {
            const quotaError = toFreePayslipQuotaErrorResponse(error);
            if (quotaError.status !== 409) {
                throw error;
            }
            console.warn("Free payslip quota was already consumed by a concurrent request after email send.", { email, monthKey: quota.monthKey });
        }

        return NextResponse.json(
            {
                status: "sent",
                email,
                monthKey: quota.monthKey,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        const quotaError = toFreePayslipQuotaErrorResponse(error);
        if (quotaError.status === 409) {
            return NextResponse.json({ error: quotaError.message }, { status: 409 });
        }

        const message = error instanceof Error ? error.message : FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE;
        return NextResponse.json(
            { error: message || FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE },
            { status: 503 },
        );
    }
}
