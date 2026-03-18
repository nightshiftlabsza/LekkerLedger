import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    PAID_ACTIVATION_COOKIE_NAME,
    createPaidActivationAccount,
    toErrorResponse,
} from "@/lib/billing-server";

function validatePassword(password: string): string | null {
    if (password.length < 10) return "Password must be at least 10 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
    if (!/\d/.test(password)) return "Password must include at least one number.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return "Password must include at least one special character.";
    return null;
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({})) as { reference?: string; password?: string };
        const reference = body.reference?.trim() || "";
        const password = body.password || "";

        if (!reference) {
            return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return NextResponse.json({ error: passwordError }, { status: 400 });
        }

        const cookieValue = (await cookies()).get(PAID_ACTIVATION_COOKIE_NAME)?.value || "";
        const [cookieReference, activationNonce] = cookieValue.split(":");

        if (!activationNonce || cookieReference !== reference) {
            return NextResponse.json({ error: "This account creation session has expired. Restart checkout to continue." }, { status: 401 });
        }

        const result = await createPaidActivationAccount({
            reference,
            password,
            activationNonce,
        });

        const response = NextResponse.json(result, {
            headers: {
                "Cache-Control": "no-store",
            },
        });

        response.cookies.set(PAID_ACTIVATION_COOKIE_NAME, "", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 0,
            path: "/",
        });

        return response;
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
