"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchBillingAccount, type BillingAccountPayload } from "@/lib/billing-client";
import { hasStoredGoogleSession } from "@/lib/google-session";
import { PaidLoginButton } from "@/components/paid-login-button";

export default function BillingSuccessPage() {
    const router = useRouter();
    const [status, setStatus] = React.useState<"checking" | "trial" | "active" | "pending" | "auth" | "error">("checking");
    const [billingAccount, setBillingAccount] = React.useState<BillingAccountPayload | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        async function confirmBilling() {
            if (!hasStoredGoogleSession()) {
                if (!cancelled) setStatus("auth");
                return;
            }

            for (let attempt = 0; attempt < 8; attempt += 1) {
                try {
                    const account = await fetchBillingAccount();
                    if (!account) continue;
                    if (account.account.lastError) {
                        if (!cancelled) {
                            setBillingAccount(account);
                            setStatus("error");
                        }
                        return;
                    }
                    if (account.entitlements.status === "trialing" && account.entitlements.planId !== "free") {
                        if (!cancelled) {
                            setBillingAccount(account);
                            setStatus("trial");
                        }
                        return;
                    }
                    if (account.entitlements.isActive && account.entitlements.planId !== "free") {
                        if (!cancelled) {
                            setBillingAccount(account);
                            setStatus("active");
                        }
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
    }, []);

    // Automatic redirect when active
    React.useEffect(() => {
        if (status === "active" || status === "trial") {
            const timer = setTimeout(() => {
                router.push("/dashboard");
            }, 3200);
            return () => clearTimeout(timer);
        }
    }, [status, router]);

    const trialEnds = billingAccount?.account.trialEndsAt
        ? new Date(billingAccount.account.trialEndsAt).toLocaleDateString("en-ZA")
        : null;
    const nextCharge = billingAccount?.account.nextChargeAt
        ? new Date(billingAccount.account.nextChargeAt).toLocaleDateString("en-ZA")
        : null;

    const title = status === "trial"
        ? "Trial active"
        : status === "active"
            ? "Payment confirmed"
            : status === "error"
                ? "Billing setup needs attention"
        : status === "auth"
            ? "Google sign-in needed"
            : status === "pending"
                ? "Still confirming"
                : "Confirming payment";

    const message = status === "trial"
        ? `Your 14-day trial is active${trialEnds ? ` until ${trialEnds}` : ""}. ${nextCharge ? `Your first real charge is scheduled for ${nextCharge} unless you cancel first.` : "We are saving your next charge date now."}`
        : status === "active"
            ? `Your paid features are active${nextCharge ? ` and the next renewal is scheduled for ${nextCharge}` : ""}. We're redirecting you to your dashboard...`
        : status === "error"
            ? billingAccount?.account.lastError || "Your card setup completed, but the billing details still need a final check."
        : status === "auth"
            ? "Sign back into Google so LekkerLedger can confirm the subscription against your account."
            : status === "pending"
                ? "LekkerLedger is still waiting for the billing webhook to finish. This usually takes a few seconds."
                : "LekkerLedger is checking Paystack and your billing status now. This usually takes a few seconds.";

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                <div className="relative bg-emerald-500 rounded-full p-4 text-white shadow-xl shadow-emerald-500/20">
                    {status === "checking" ? <Loader2 className="h-12 w-12 animate-spin" /> : <CheckCircle2 className="h-12 w-12" />}
                </div>
            </div>

            <h1 className="text-3xl font-black mb-3">{title}</h1>
            <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
                {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                {status === "auth" ? (
                    <PaidLoginButton
                        label="Paid login"
                        className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl"
                        nextPath="/dashboard"
                        showInlineError
                    />
                ) : (
                    <Link href="/dashboard" className="w-full">
                        <Button className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl">
                            {status === "error" ? "Open Dashboard" : "Open Dashboard"} <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                )}
                <Link href="/upgrade" className="w-full">
                    <Button variant="outline" className="w-full h-12 font-bold rounded-2xl">
                        Back to Billing
                    </Button>
                </Link>
            </div>
        </div>
    );
}
