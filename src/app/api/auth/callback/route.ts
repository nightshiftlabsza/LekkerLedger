import { NextResponse } from "next/server";
import { getRequestAppOrigin, getRequestCurrentOrigin } from "@/lib/app-origin";
import { createClient } from "@/lib/supabase/server";
import { E2E_FREE_PAYSLIP_COOKIE } from "@/lib/e2e-free-payslip";
import {
  buildFreePayslipVerificationHref,
  isFreePayslipVerificationPath,
} from "@/lib/free-payslip-verification";

function buildRedirect(origin: string, pathname: string) {
  return NextResponse.redirect(`${origin}${pathname}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/dashboard";
  const isFreePayslipFlow = isFreePayslipVerificationPath(next);
  const origin = isFreePayslipFlow ? getRequestCurrentOrigin(request) : getRequestAppOrigin(request);
  const e2eFreePayslipEmail = searchParams.get("e2eFreePayslipEmail")?.trim().toLowerCase() ?? "";

  if (process.env.E2E_BYPASS_AUTH === "1" && isFreePayslipFlow && e2eFreePayslipEmail) {
    const response = buildRedirect(origin, safeNext);
    response.cookies.set(E2E_FREE_PAYSLIP_COOKIE, e2eFreePayslipEmail, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  if (!code) {
    if (isFreePayslipFlow) {
      return buildRedirect(origin, buildFreePayslipVerificationHref("invalid-link"));
    }

    return buildRedirect(origin, "/login?error=invalid_or_expired_link");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return buildRedirect(origin, safeNext);
    }

    const errorMsg = error.message?.toLowerCase() ?? "";
    if (isFreePayslipFlow) {
      if (errorMsg.includes("expired") || errorMsg.includes("invalid")) {
        return buildRedirect(origin, buildFreePayslipVerificationHref("invalid-link"));
      }

      return buildRedirect(origin, buildFreePayslipVerificationHref("missing-session"));
    }

    if (errorMsg.includes("expired") || errorMsg.includes("invalid")) {
      return buildRedirect(origin, "/login?error=invalid_or_expired_link");
    }

    return buildRedirect(origin, "/login?error=code_exchange_failed");
  } catch {
    if (isFreePayslipFlow) {
      return buildRedirect(origin, buildFreePayslipVerificationHref("missing-session"));
    }

    return buildRedirect(origin, "/login?error=code_exchange_failed");
  }
}
