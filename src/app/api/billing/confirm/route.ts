import { NextResponse } from "next/server";
import { confirmPaystackTransaction, toErrorResponse, verifyUserFromRequest } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const user = await verifyUserFromRequest(request);
        const body = await request.json() as { reference?: string };

        if (!body.reference || !body.reference.trim()) {
            return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
        }

        const billingAccount = await confirmPaystackTransaction(body.reference, user);

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
        console.error("[billing/confirm] activation failed", error);
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
