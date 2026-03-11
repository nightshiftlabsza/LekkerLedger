import { NextResponse } from "next/server";
import { getVerifiedEntitlementsForUser, toErrorResponse, verifyUserFromRequest } from "@/lib/billing-server";

export async function GET(request: Request) {
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
        return NextResponse.json({ error: message }, { status });
    }
}
