import { NextResponse } from "next/server";
import { getConfiguredAppOrigin, getRequestAppOrigin } from "@/lib/app-origin";
import { createClient } from "@/lib/supabase/server";

const RESET_PASSWORD_NEXT_PATH = "/reset-password";
const GENERIC_RESET_ERROR = "We could not send the reset email right now. Please try again in a moment.";
const NETWORK_RESET_ERROR = "Unable to reach the password reset service. Please try again in a moment.";
const RATE_LIMIT_ERROR = "Too many reset attempts. Please wait a moment before trying again.";

function isValidEmail(value: unknown): value is string {
    return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function mapResetStatus(message: string): { status: number; error: string } {
    const lower = message.toLowerCase();

    if (lower.includes("you can only request this") || lower.includes("rate limit") || lower.includes("too many requests")) {
        return { status: 429, error: RATE_LIMIT_ERROR };
    }

    if (lower.includes("network") || lower.includes("fetch") || lower.includes("load failed")) {
        return { status: 502, error: NETWORK_RESET_ERROR };
    }

    return { status: 502, error: GENERIC_RESET_ERROR };
}

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const email = typeof body === "object" && body !== null && "email" in body
        ? (body as { email?: unknown }).email
        : null;

    if (!isValidEmail(email)) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const origin = process.env.NODE_ENV === "production"
        ? getConfiguredAppOrigin() || getRequestAppOrigin(request)
        : getRequestAppOrigin(request);
    const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(RESET_PASSWORD_NEXT_PATH)}`;
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

        if (!error) {
            console.info("[auth/reset-password] reset email request accepted", { requestId });
            return NextResponse.json({ ok: true });
        }

        const mapped = mapResetStatus(error.message);
        console.error("[auth/reset-password] Supabase reset failed", {
            requestId,
            status: mapped.status,
            message: error.message,
        });
        return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    } catch (error) {
        console.error("[auth/reset-password] Reset request failed", {
            requestId,
            error: error instanceof Error ? error.message : "unknown_error",
        });
        return NextResponse.json({ error: GENERIC_RESET_ERROR }, { status: 502 });
    }
}
