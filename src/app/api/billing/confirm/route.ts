import { NextResponse } from "next/server";
import { confirmPaystackTransaction, toErrorResponse, verifyUserFromRequest } from "@/lib/billing-server";
import { buildE2EBillingAccount, hasE2EBillingBypass } from "@/lib/e2e-billing";

export const maxDuration = 30;

export async function POST(request: Request) {
    if (hasE2EBillingBypass(request)) {
        const body = await request.json() as { reference?: string };
        if (!body.reference?.trim()) {
            return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
        }

        return NextResponse.json(buildE2EBillingAccount(), {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    }

    try {
        const user = await verifyUserFromRequest(request);
        const body = await request.json() as { reference?: string };

        if (!body.reference?.trim()) {
            return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
        }

        const billingAccount = await confirmPaystackTransaction(body.reference, user);

        return NextResponse.json({
            entitlements: billingAccount ? {
                ...billingAccount.entitlements,
                userId: user.userId,
                email: user.email,
            } : null,
            account: billingAccount?.account,
        }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("[billing/confirm] activation failed", error);
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
