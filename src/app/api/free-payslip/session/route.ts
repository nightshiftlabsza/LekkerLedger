import { NextResponse } from "next/server";
import { E2E_FREE_PAYSLIP_COOKIE } from "@/lib/e2e-free-payslip";

export async function DELETE() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(E2E_FREE_PAYSLIP_COOKIE, "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
    });

    return response;
}
