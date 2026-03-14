import { NextResponse } from "next/server";
import { createAnonymousPurchaseIntent, toErrorResponse } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const body = await request.json() as { planId?: "standard" | "pro"; billingCycle?: "monthly" | "yearly"; email?: string; referralCode?: string | null };

        if ((body.planId !== "standard" && body.planId !== "pro") || (body.billingCycle !== "monthly" && body.billingCycle !== "yearly")) {
            return NextResponse.json({ error: "Choose a valid paid plan first." }, { status: 400 });
        }

        if (!body.email?.trim()) {
            return NextResponse.json({ error: "Billing email is required." }, { status: 400 });
        }

        const intent = await createAnonymousPurchaseIntent(request, {
            planId: body.planId,
            billingCycle: body.billingCycle,
            email: body.email,
            referralCode: body.referralCode ?? null,
        });

        return NextResponse.json(intent, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
