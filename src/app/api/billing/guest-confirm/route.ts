import { NextResponse } from "next/server";
import { getGuestPaymentStatus, toErrorResponse } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const body = await request.json() as { reference?: string };

        if (!body.reference?.trim()) {
            return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
        }

        const result = await getGuestPaymentStatus(body.reference);

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
