"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmBillingTransaction, fetchBillingAccount, type BillingAccountPayload } from "@/lib/billing-client";

export default function BillingSuccessPage() {
    return (
        <Suspense fallback={null}>
            <BillingSuccessPageContent />
        </Suspense>
    );
}

function BillingSuccessPageContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = React.useState<"checking" | "trial" | "active" | "pending" | "auth" | "error">("checking");
    const [billingAccount, setBillingAccount] = React.useState<BillingAccountPayload | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        const reference = searchParams.get("reference")?.trim() || "";

        function applyAccount(account: BillingAccountPayload): boolean {
            if (account.account.lastError) {
                if (!cancelled) {
                    setBillingAccount(account);
                    setStatus("error");
                }
                return true;
            }

            if (account.entitlements.status === "trialing" && account.entitlements.planId !== "free") {
                if (!cancelled) {
                    setBillingAccount(account);
                    setStatus("trial");
                }
                return true;
            }

            if (account.entitlements.isActive && account.entitlements.planId !== "free") {
                if (!cancelled) {
                    setBillingAccount(account);
                    setStatus("active");
                }
                return true;
            }

            return false;
        }

        async function confirmBilling() {
            for (let attempt = 0; attempt < 8; attempt += 1) {
                if (reference) {
                    try {
                        const confirmed = await confirmBillingTransaction(reference);
                        if (applyAccount(confirmed)) {
                            return;
                        }
                    } catch {
                        // Keep polling briefly while the webhook or verification catches up.
                    }
                }

                try {
                    const account = await fetchBillingAccount();
                    if (!account) continue;
                    if (applyAccount(account)) {
                        return;
                    }
                } catch {
                    // Keep polling briefly while the webhook catches up.
                }

                await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            if (!cancelled) setStatus("pending");
        }

        void confirmBilling();
        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    const trialEnds = billingAccount?.account.trialEndsAt
        ? new Date(billingAccount.account.trialEndsAt).toLocaleDateString("en-ZA")
        : null;
    const nextCharge = billingAccount?.account.nextChargeAt
        ? new Date(billingAccount.account.nextChargeAt).toLocaleDateString("en-ZA")
        : null;

    const title = status === "trial"
        ? "Thank you, your trial is active"
        : status === "active"
            ? "Thank you, payment confirmed"
            : status === "error"
                ? "Payment received, but setup needs attention"
        : status === "auth"
            ? "Thank you for your order"
            : status === "pending"
                ? "Finishing your activation"
                : "Confirming payment";

    const message = status === "trial"
        ? `Your 14-day trial is active${trialEnds ? ` until ${trialEnds}` : ""}. ${nextCharge ? `Your first real charge is scheduled for ${nextCharge} unless you cancel first.` : "We are still saving your next charge date."}`
        : status === "active"
            ? `Your paid features are active${nextCharge ? ` and the next renewal is scheduled for ${nextCharge}` : ""}. Encrypted sync will be available soon.`
        : status === "error"
            ? billingAccount?.account.lastError || "Your card setup completed, but the billing details still need a final check."
            : status === "pending"
                ? "LekkerLedger is still finishing the payment confirmation. This usually takes a few seconds."
                : "LekkerLedger is checking Paystack and your billing status now. This usually takes a few seconds.";

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: "var(--success-soft)" }} />
                <div className="relative rounded-full p-4 text-white shadow-xl" style={{ backgroundColor: "var(--success)" }}>
                    {status === "checking" ? <Loader2 className="h-12 w-12 animate-spin" /> : <CheckCircle2 className="h-12 w-12" />}
                </div>
            </div>

            <h1 className="text-3xl font-black mb-3">{title}</h1>
            <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
                {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link href="/dashboard" className="w-full">
                    <Button className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl">
                        Open Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href="/upgrade" className="w-full">
                    <Button variant="outline" className="w-full h-12 font-bold rounded-2xl">
                        Manage Billing
                    </Button>
                </Link>
            </div>
        </div>
    );
}
