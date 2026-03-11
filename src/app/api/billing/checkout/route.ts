import { NextResponse } from "next/server";
import { createCheckoutSession, toErrorResponse, verifyUserFromRequest } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const user = await verifyUserFromRequest(request);
        const body = await request.json() as { planId?: "standard" | "pro"; billingCycle?: "monthly" | "yearly" };

        if ((body.planId !== "standard" && body.planId !== "pro") || (body.billingCycle !== "monthly" && body.billingCycle !== "yearly")) {
            return NextResponse.json({ error: "Choose a valid paid plan first." }, { status: 400 });
        }

        const checkout = await createCheckoutSession(request, user, {
            planId: body.planId,
            billingCycle: body.billingCycle,
        });

        return NextResponse.json(checkout, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
