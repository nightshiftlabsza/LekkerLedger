import { NextResponse } from "next/server";
import { getE2EFreePayslipEmail } from "@/lib/e2e-free-payslip";
import { createClient } from "@/lib/supabase/server";
import {
    consumeFreePayslipQuota,
    getFreePayslipQuotaStatus,
    toFreePayslipQuotaErrorResponse,
} from "@/lib/free-payslip-quota";

async function getVerifiedEmail(request: Request) {
    const e2eEmail = getE2EFreePayslipEmail(request);
    if (e2eEmail) {
        return e2eEmail;
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.email) {
        throw new Error("Email verification is required before downloading the free payslip.");
    }

    return user.email;
}

export async function GET(request: Request) {
    try {
        const email = await getVerifiedEmail(request);
        const status = await getFreePayslipQuotaStatus(email);
        return NextResponse.json(status, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Email verification is required.";
        return NextResponse.json({ error: message }, { status: 401 });
    }
}

export async function POST(request: Request) {
    try {
        const email = await getVerifiedEmail(request);
        const status = await consumeFreePayslipQuota(email);
        return NextResponse.json(status, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes("Email verification")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        const { status, message } = toFreePayslipQuotaErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
