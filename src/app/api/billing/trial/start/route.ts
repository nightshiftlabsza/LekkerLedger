import { NextResponse } from "next/server";
import { startTrialCheckout, toErrorResponse, verifyGoogleUserFromRequest } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const user = await verifyGoogleUserFromRequest(request);
        const body = await request.json() as {
            planId?: "standard" | "pro";
            billingCycle?: "monthly" | "yearly";
            referralCode?: string | null;
        };

        if ((body.planId !== "standard" && body.planId !== "pro") || (body.billingCycle !== "monthly" && body.billingCycle !== "yearly")) {
            return NextResponse.json({ error: "Choose Standard or Pro before starting the trial." }, { status: 400 });
        }

        const checkout = await startTrialCheckout(request, user, {
            planId: body.planId,
            billingCycle: body.billingCycle,
            referralCode: body.referralCode ?? null,
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
