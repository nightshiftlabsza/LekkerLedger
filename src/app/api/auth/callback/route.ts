import { NextResponse } from "next/server";
import { getConfiguredAppOrigin, getRequestAppOrigin } from "@/lib/app-origin";
import { createClient } from "@/lib/supabase/server";

function buildRedirect(origin: string, pathname: string) {
    return NextResponse.redirect(`${origin}${pathname}`);
}

function getSafeNext(value: string | null): string {
    if (!value || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value) || value.startsWith("//")) {
        return "/dashboard";
    }

    try {
        const parsed = new URL(value, "https://lekkerledger.internal");
        if (parsed.origin !== "https://lekkerledger.internal" || !parsed.pathname.startsWith("/")) {
            return "/dashboard";
        }
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return "/dashboard";
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const safeNext = getSafeNext(searchParams.get("next"));
    const origin = process.env.NODE_ENV === "production"
        ? getConfiguredAppOrigin() || getRequestAppOrigin(request)
        : getRequestAppOrigin(request);
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

    if (!code) {
        console.warn("[auth/callback] missing authorization code", { requestId });
        return buildRedirect(origin, "/login?error=invalid_or_expired_link");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return buildRedirect(origin, safeNext);
        }

        console.error("[auth/callback] code exchange failed", {
            requestId,
            error: error.message,
        });

    const errorMsg = error.message?.toLowerCase() ?? "";
    if (errorMsg.includes("expired") || errorMsg.includes("invalid")) {
      return buildRedirect(origin, "/login?error=invalid_or_expired_link");
    }

    return buildRedirect(origin, "/login?error=code_exchange_failed");
    } catch (error) {
        console.error("[auth/callback] unexpected callback failure", {
            requestId,
            error: error instanceof Error ? error.message : "unknown_error",
        });
        return buildRedirect(origin, "/login?error=code_exchange_failed");
    }
}
