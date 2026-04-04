import { NextResponse } from "next/server";
import { getRequestAppOrigin } from "@/lib/app-origin";
import { createClient } from "@/lib/supabase/server";

function buildRedirect(origin: string, pathname: string) {
  return NextResponse.redirect(`${origin}${pathname}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/dashboard";
  const origin = getRequestAppOrigin(request);

  if (!code) {
    return buildRedirect(origin, "/login?error=invalid_or_expired_link");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return buildRedirect(origin, safeNext);
    }

    const errorMsg = error.message?.toLowerCase() ?? "";
    if (errorMsg.includes("expired") || errorMsg.includes("invalid")) {
      return buildRedirect(origin, "/login?error=invalid_or_expired_link");
    }

    return buildRedirect(origin, "/login?error=code_exchange_failed");
  } catch {
    return buildRedirect(origin, "/login?error=code_exchange_failed");
  }
}
