import { NextResponse } from "next/server";
import { getBillingAccountForUser, toErrorResponse, verifyUserFromRequest } from "@/lib/billing-server";
import { buildE2EBillingAccount, hasE2EBillingBypass } from "@/lib/e2e-billing";

export async function GET(request: Request) {
    if (hasE2EBillingBypass(request)) {
        return NextResponse.json(buildE2EBillingAccount(), {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    }

    try {
        const user = await verifyUserFromRequest(request);
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
