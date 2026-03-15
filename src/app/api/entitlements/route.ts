import { NextResponse } from "next/server";
import { getVerifiedEntitlementsForUser, toErrorResponse, verifyUserFromRequest } from "@/lib/billing-server";
import { buildE2EPaidEntitlements, hasE2EBillingBypass } from "@/lib/e2e-billing";

export async function GET(request: Request) {
    if (hasE2EBillingBypass(request)) {
        return NextResponse.json({
            entitlements: buildE2EPaidEntitlements(),
        }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    }

    try {
        const user = await verifyUserFromRequest(request);
        const entitlements = await getVerifiedEntitlementsForUser(user.userId);

        return NextResponse.json({
            entitlements: {
                ...entitlements,
                userId: user.userId,
                email: user.email,
            },
        }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, {
            status,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    }
}
