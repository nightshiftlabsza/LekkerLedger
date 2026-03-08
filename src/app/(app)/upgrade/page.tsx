"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";
import { createCheckoutSession } from "@/lib/billing-client";
import { hasStoredGoogleSession } from "@/lib/google-session";
import { type BillingCycle, PLANS, type PlanId } from "@/src/config/plans";
import { EmployerSettings } from "@/lib/schema";
import { getUserPlan } from "@/lib/entitlements";
import { MarketingBillingToggle, MarketingPlanCards } from "@/components/marketing/pricing";

export default function UpgradePage() {
    return (
        <Suspense fallback={null}>
            <UpgradePageContent />
        </Suspense>
    );
}

function buildGoogleConnectHref(planId: "standard" | "pro", billingCycle: BillingCycle): string {
    const params = new URLSearchParams({
        recommended: "google",
        next: `/upgrade?plan=${planId}&billing=${billingCycle}&pay=1`,
        source: "billing",
    });
    return `/open-app?${params.toString()}`;
}

function UpgradePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("yearly");
    const [checkoutPlanId, setCheckoutPlanId] = React.useState<"standard" | "pro" | null>(null);
    const [checkoutError, setCheckoutError] = React.useState("");
    const hasAutoStartedCheckout = React.useRef(false);

    React.useEffect(() => {
        async function load() {
            const currentSettings = await getSettings();
            setSettings(currentSettings as EmployerSettings);
            const requestedBilling = searchParams.get("billing");
            setBillingCycle(requestedBilling === "monthly" ? "monthly" : requestedBilling === "yearly" ? "yearly" : currentSettings.billingCycle === "monthly" ? "monthly" : "yearly");
        }
        void load();
    }, [searchParams]);

    const startCheckout = React.useCallback(async (planId: "standard" | "pro") => {
        setCheckoutError("");

        if (!hasStoredGoogleSession()) {
            router.push(buildGoogleConnectHref(planId, billingCycle));
            return;
        }

        try {
            setCheckoutPlanId(planId);
            const checkout = await createCheckoutSession({ planId, billingCycle });
            window.location.href = checkout.authorizationUrl;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Checkout could not be started.";
            setCheckoutError(message);
            toast(message);
            setCheckoutPlanId(null);
        }
    }, [billingCycle, router, toast]);

    React.useEffect(() => {
        if (!settings || hasAutoStartedCheckout.current) return;
        const requestedPlan = searchParams.get("plan");
        const shouldPayNow = searchParams.get("pay") === "1";
        if ((requestedPlan === "standard" || requestedPlan === "pro") && shouldPayNow) {
            const currentPlan = getUserPlan(settings);
            if (currentPlan.id !== requestedPlan) {
                hasAutoStartedCheckout.current = true;
                void startCheckout(requestedPlan);
            }
        }
    }, [searchParams, settings, startCheckout]);

    const currentPlan = settings ? getUserPlan(settings) : PLANS.free;

    if (!settings) {
        return null;
    }

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title="Plans & billing"
                subtitle="Choose the level of Google-connected backup, archive depth, and household control you need."
            />

            <div className="mx-auto max-w-6xl space-y-10">
                <Card className="border-[var(--primary)] bg-[var(--primary)]/5">
                    <CardContent className="space-y-3 p-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>
                            Try Standard or Pro with a 14-day refund window.
                        </p>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>
                            Paid access is confirmed through your Google sign-in, not by this browser alone.
                        </p>
                        <p>
                            If you are not signed into Google yet, choosing a paid plan will first take you to Google connect. After that, LekkerLedger starts the Paystack checkout securely from the server.
                        </p>
                        <p>
                            You can stop renewal before the next billing period, and access continues until the end of the billing period you already paid for.
                        </p>
                    </CardContent>
                </Card>

                {checkoutError && (
                    <div className="rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "rgba(180,35,24,0.25)", backgroundColor: "rgba(180,35,24,0.06)", color: "var(--danger)" }}>
                        {checkoutError}
                    </div>
                )}

                <div className="flex flex-col items-center gap-10">
                    <MarketingBillingToggle 
                        billingCycle={billingCycle} 
                        onChange={setBillingCycle} 
                        align="center" 
                    />

                    <MarketingPlanCards 
                        billingCycle={billingCycle} 
                        currentPlanId={currentPlan.id as PlanId}
                        onSelect={(planId) => {
                            if (planId === "standard" || planId === "pro") {
                                void startCheckout(planId);
                            }
                        }}
                        isLoadingPlanId={checkoutPlanId}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-[var(--border)]">
                        <CardContent className="space-y-4 p-6 text-sm">
                            <h3 className="type-h3" style={{ color: "var(--text)" }}>What changes on paid plans</h3>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Paid plans are for households that want less repeated admin: Google-connected backup across browsers and devices, exports, deeper archives, and cleaner annual paperwork. They are meant to cost less than the time or outside help it usually takes to reconstruct records later.
                            </p>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Standard is the paid plan for most households that want organised records, Google-connected backup, and annual paperwork. Pro is for households that want deeper history and more control, with multi-household support and unlimited employees when you need more headroom.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-[var(--primary)] bg-[var(--primary)]/5">
                        <CardContent className="space-y-4 p-6 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-[var(--primary)] p-3 text-white">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h3 className="type-h3" style={{ color: "var(--text)" }}>Refunds and trust</h3>
                            </div>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                If you request a refund within 14 days of purchase, we will usually refund you in full after payment verification. The goal is to keep the decision low-risk, not to push hard-sell billing language through the app.
                            </p>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                You can stop renewal before the next billing period, and access continues until the end of the billing period already paid for.
                            </p>
                            <Link href="/legal/refunds" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
                                View refund policy <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}






