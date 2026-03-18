"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readPendingBillingCheckoutState } from "@/lib/billing-handoff";

function buildCheckoutHref() {
    const pending = readPendingBillingCheckoutState();
    if (!pending?.planId || !pending.billingCycle) {
        return "/pricing";
    }

    const params = new URLSearchParams({
        plan: pending.planId,
        cycle: pending.billingCycle,
    });

    if (pending.referralCode?.trim()) {
        params.set("ref", pending.referralCode.trim().toUpperCase());
    }

    return `/billing/checkout?${params.toString()}`;
}

export default function BillingCancelPage() {
    const retryHref = buildCheckoutHref();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-6 rounded-full p-4" style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}>
                <XCircle className="h-12 w-12" />
            </div>

            <h1 className="text-2xl font-black mb-3">Payment not completed</h1>
            <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
                LekkerLedger kept your selected plan and billing email. You can return to the hosted checkout and continue cleanly without re-entering everything.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Link href={retryHref} className="w-full">
                    <Button className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl">
                        Retry Checkout <RefreshCcw className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href="/pricing" className="w-full">
                    <Button variant="outline" className="w-full h-12 gap-2 font-bold rounded-2xl">
                        <ArrowLeft className="h-4 w-4" /> Back to Pricing
                    </Button>
                </Link>
            </div>

            <p className="mt-8 text-xs text-[var(--text-muted)]">
                Need help? Email us at <a href="mailto:support@lekkerledger.co.za" className="underline font-bold">support@lekkerledger.co.za</a>
            </p>
        </div>
    );
}
