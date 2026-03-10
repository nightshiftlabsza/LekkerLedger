import { NextResponse } from "next/server";
import { cancelSubscriptionForUser, toErrorResponse, verifyGoogleUserFromRequest } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const user = await verifyGoogleUserFromRequest(request);
        const billingAccount = await cancelSubscriptionForUser(user.userId);

        return NextResponse.json({
            entitlements: {
                ...billingAccount.entitlements,
                userId: user.userId,
                email: user.email,
            },
            account: billingAccount.account,
        }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
