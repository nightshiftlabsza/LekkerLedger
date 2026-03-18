import { NextResponse } from "next/server";
import {
    PAID_ACTIVATION_COOKIE_NAME,
    resolvePaidActivation,
    toErrorResponse,
    verifyUserFromRequest,
} from "@/lib/billing-server";

function buildActivationCookieValue(reference: string, nonce: string) {
    return `${reference}:${nonce}`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({})) as { reference?: string };
        const reference = body.reference?.trim() || "";
        if (!reference) {
            return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
        }

        let user = null;
        try {
            user = await verifyUserFromRequest(request);
        } catch {
            user = null;
        }

        const result = await resolvePaidActivation(reference, user);
        const response = NextResponse.json(result.state, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
        if (result.activationNonce) {
            const cookieValue = buildActivationCookieValue(reference, result.activationNonce);
            response.cookies.set(PAID_ACTIVATION_COOKIE_NAME, cookieValue, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60,
                path: "/",
            });
        } else {
            response.cookies.set(PAID_ACTIVATION_COOKIE_NAME, "", {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                maxAge: 0,
                path: "/",
            });
        }

        return response;
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
