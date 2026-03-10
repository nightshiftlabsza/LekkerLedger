import { NextResponse } from "next/server";
import { getBillingAccountForUser, toErrorResponse, verifyGoogleUserFromRequest } from "@/lib/billing-server";

export async function GET(request: Request) {
    try {
        const user = await verifyGoogleUserFromRequest(request);
        const billingAccount = await getBillingAccountForUser(user.userId);

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
