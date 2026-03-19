import { NextResponse } from "next/server";
import { processDueBillingRenewals, toErrorResponse } from "@/lib/billing-server";
import { env } from "@/lib/env";

function isAuthorized(request: Request): boolean {
    const configuredSecret = env.BILLING_RENEWALS_SECRET?.trim();
    if (!configuredSecret) {
        return false;
    }

    const bearer = request.headers.get("authorization") || request.headers.get("Authorization") || "";
    const token = bearer.startsWith("Bearer ") ? bearer.slice("Bearer ".length).trim() : request.headers.get("x-billing-renewals-secret")?.trim() || "";
    return token === configuredSecret;
}

export async function POST(request: Request) {
    try {
        if (!isAuthorized(request)) {
            return NextResponse.json({ error: "Not authorized to run billing renewals." }, { status: 401 });
        }

        const result = await processDueBillingRenewals();
        return NextResponse.json(result, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
