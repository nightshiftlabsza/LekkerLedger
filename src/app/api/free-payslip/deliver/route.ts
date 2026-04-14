import { NextResponse } from "next/server";
import { addNewsletterSubscriber } from "@/lib/newsletter";
import { sendFreePayslipEmail } from "@/lib/free-payslip-email";
import {
    buildFreePayslipPayload,
    FreePayslipRequestSchema,
    FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE,
    normalizeFreePayslipFormState,
    validateFreePayslipForm,
} from "@/lib/free-payslip-form";
import {
    claimFreePayslipSample,
    FREE_PAYSLIP_ALREADY_USED_MESSAGE,
    getFreePayslipClaimStatus,
    normalizeFreePayslipEmail,
    toFreePayslipClaimErrorResponse,
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

        const email = normalizeFreePayslipEmail(parsed.data.email);
        const marketingConsent = parsed.data.marketingConsent === true;
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

        const claimStatus = await getFreePayslipClaimStatus(email);
        if (claimStatus.isClaimed) {
            return NextResponse.json(
                {
                    status: "already-used",
                    email,
                    error: FREE_PAYSLIP_ALREADY_USED_MESSAGE,
                },
                { status: 409 },
            );
        }

        const pdfBytes = await generatePayslipPdfBytes(payload.employee, payload.payslip, payload.settings, "en");
        const filename = getPayslipFilename(payload.employee, payload.payslip);

        await sendFreePayslipEmail({
            to: email,
            employeeName: payload.employee.name,
            monthKey: normalizedForm.monthKey,
            filename,
            pdfBytes,
        });

        if (marketingConsent) {
            void addNewsletterSubscriber(email).catch((error) => {
                console.error("[newsletter] subscriber insert failed after free payslip delivery", { email, error });
            });
        }

        try {
            await claimFreePayslipSample(email);
        } catch (error) {
            const claimError = toFreePayslipClaimErrorResponse(error);
            if (claimError.status === 409) {
                console.warn("Free payslip sample was already claimed by a concurrent request after email send.", { email });
                return NextResponse.json(
                    {
                        status: "already-used",
                        email,
                        error: claimError.message,
                    },
                    { status: 409 },
                );
            }

            throw error;
        }

        return NextResponse.json(
            {
                status: "sent",
                email,
                monthKey: normalizedForm.monthKey,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        const claimError = toFreePayslipClaimErrorResponse(error);
        if (claimError.status === 409) {
            return NextResponse.json(
                {
                    status: "already-used",
                    error: claimError.message,
                },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { error: FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE },
            { status: 503 },
        );
    }
}
