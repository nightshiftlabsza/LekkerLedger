"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchVerifiedEntitlements } from "@/lib/billing-client";
import { hasStoredGoogleSession } from "@/lib/google-session";

export default function BillingSuccessPage() {
    const [status, setStatus] = React.useState<"checking" | "active" | "pending" | "auth">("checking");

    React.useEffect(() => {
        let cancelled = false;

        async function confirmEntitlements() {
            if (!hasStoredGoogleSession()) {
                if (!cancelled) setStatus("auth");
                return;
            }

            for (let attempt = 0; attempt < 8; attempt += 1) {
                try {
                    const entitlements = await fetchVerifiedEntitlements(undefined, true);
                    if (entitlements?.isActive && entitlements.planId !== "free") {
                        if (!cancelled) setStatus("active");
                        return;
                    }
                } catch {
                    // Keep polling briefly while the webhook catches up.
                }

                await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            if (!cancelled) setStatus("pending");
        }

        void confirmEntitlements();
        return () => {
            cancelled = true;
        };
    }, []);

    const title = status === "active"
        ? "Payment confirmed"
        : status === "auth"
            ? "Google sign-in needed"
            : status === "pending"
                ? "Payment received"
                : "Confirming payment";

    const message = status === "active"
        ? "Your paid features are now active. Open the dashboard to keep working."
        : status === "auth"
            ? "Sign back into Google so LekkerLedger can confirm the subscription against your account."
            : status === "pending"
                ? "Paystack has sent the payment back. LekkerLedger is still waiting for the final confirmation from the billing webhook."
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
                    <Link href="/open-app?source=billing&recommended=google&next=/dashboard" className="w-full">
                        <Button className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl">
                            Connect Google Access <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <Link href="/dashboard" className="w-full">
                        <Button className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl">
                            Open Dashboard <ArrowRight className="h-4 w-4" />
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
