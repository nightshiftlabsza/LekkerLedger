import { NextResponse } from "next/server";
import { clearSubscriptionLastError, toErrorResponse, verifyUserFromRequest } from "@/lib/billing-server";

export async function POST(request: Request) {
    try {
        const user = await verifyUserFromRequest(request);
        await clearSubscriptionLastError(user.userId);
        return NextResponse.json({ ok: true });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
