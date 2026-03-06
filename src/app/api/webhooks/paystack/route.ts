import { NextResponse } from "next/server";
import { processPaystackWebhook, toErrorResponse, verifyPaystackWebhookSignature } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-paystack-signature");

        if (!verifyPaystackWebhookSignature(rawBody, signature)) {
            return NextResponse.json({ error: "Invalid Paystack signature." }, { status: 401 });
        }

        const result = await processPaystackWebhook(rawBody);
        return NextResponse.json({ ok: true, handled: result.handled }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
