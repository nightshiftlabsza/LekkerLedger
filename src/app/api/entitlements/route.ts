import { NextResponse } from "next/server";
import { getVerifiedEntitlementsForUser, verifyUserFromRequest } from "@/lib/billing-server";
import { getFreeEntitlements } from "@/lib/billing";

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
        console.warn("Entitlement verification deferred to fallback:", error instanceof Error ? error.message : error);
        
        // Graceful fallback for Free/Guest mode
        return NextResponse.json({
            entitlements: getFreeEntitlements()
        }, { 
            status: 200,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    }
}
