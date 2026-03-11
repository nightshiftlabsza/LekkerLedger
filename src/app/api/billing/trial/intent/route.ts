import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonymousTrialIntent, toErrorResponse } from "@/lib/billing-server";

const bodySchema = z.object({
    planId: z.enum(["standard", "pro"]),
    billingCycle: z.enum(["monthly", "yearly"]),
    email: z.string().trim().email("Enter a valid email address."),
    referralCode: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
    try {
        const payload = bodySchema.parse(await request.json());
        const intent = await createAnonymousTrialIntent({
            planId: payload.planId,
            billingCycle: payload.billingCycle,
            email: payload.email,
            referralCode: payload.referralCode ?? null,
        });

        return NextResponse.json(intent, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message || "Enter a valid email address." }, { status: 400 });
        }

        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
