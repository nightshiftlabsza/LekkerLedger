"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";
import { startTrialCheckout } from "@/lib/billing-client";
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

function buildUpgradeHref(planId: "standard" | "pro", billingCycle: BillingCycle, referralCode?: string): string {
    const params = new URLSearchParams({
        plan: planId,
        billing: billingCycle,
        pay: "1",
    });
    if (referralCode) {
        params.set("ref", referralCode);
    }
    return `/upgrade?${params.toString()}`;
}

function buildPaidLoginHref(planId: "standard" | "pro", billingCycle: BillingCycle, referralCode?: string): string {
    const params = new URLSearchParams({
        paidLogin: "1",
        next: buildUpgradeHref(planId, billingCycle, referralCode),
    });
    return `/dashboard?${params.toString()}`;
}

function UpgradePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("yearly");
    const [checkoutPlanId, setCheckoutPlanId] = React.useState<"standard" | "pro" | null>(null);
    const [checkoutError, setCheckoutError] = React.useState("");
    const [referralCode, setReferralCode] = React.useState("");
    const hasAutoStartedCheckout = React.useRef(false);

    React.useEffect(() => {
        async function load() {
            const currentSettings = await getSettings();
            setSettings(currentSettings as EmployerSettings);
            const requestedBilling = searchParams.get("billing");
            const requestedReferral = searchParams.get("ref");
            setBillingCycle(requestedBilling === "monthly" ? "monthly" : requestedBilling === "yearly" ? "yearly" : currentSettings.billingCycle === "monthly" ? "monthly" : "yearly");
            setReferralCode(requestedReferral ? requestedReferral.toUpperCase() : "");
        }
        void load();
    }, [searchParams]);

    const startCheckout = React.useCallback(async (planId: "standard" | "pro") => {
        setCheckoutError("");
        const normalizedReferralCode = referralCode.trim().toUpperCase();

        if (!hasStoredGoogleSession()) {
            router.push(buildPaidLoginHref(planId, billingCycle, normalizedReferralCode || undefined));
            return;
        }

        try {
            setCheckoutPlanId(planId);
            const checkout = await startTrialCheckout({
                planId,
                billingCycle,
                referralCode: normalizedReferralCode || null,
            });
            window.location.href = checkout.authorizationUrl;
        } catch (error) {
            const message = error instanceof Error ? error.message : "The free trial could not be started.";
            setCheckoutError(message);
            toast(message);
            setCheckoutPlanId(null);
        }
    }, [billingCycle, referralCode, router, toast]);

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
                            R1 for your first 14 days on Standard or Pro.
                        </p>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>
                            Paid access is confirmed through your Google sign-in, not by this browser alone.
                        </p>
                        <p>
                            If you are not signed into Google yet, choosing a paid plan starts paid login immediately, then LekkerLedger starts the Paystack card setup securely from the server.
                        </p>
                        <p>
                            A small R1 card verification charge is taken today. The real subscription charge only happens after the 14-day trial unless you cancel first.
                        </p>
                    </CardContent>
                </Card>

                {checkoutError && (
                    <div className="rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "rgba(180,35,24,0.25)", backgroundColor: "rgba(180,35,24,0.06)", color: "var(--danger)" }}>
                        {checkoutError}
                    </div>
                )}

                <Card className="border-[var(--border)]">
                    <CardContent className="space-y-3 p-5">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-[var(--text)]">Referral code</p>
                            <p className="text-sm text-[var(--text-muted)]">
                                Add a referral code before you start the trial. You earn 1 free month when the referred person completes their trial and makes their first payment. Up to 12 free months per account. The referred person still gets the normal 14-day trial.
                            </p>
                        </div>
                        <Input
                            value={referralCode}
                            onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                            placeholder="Optional referral code"
                            className="h-12 font-semibold uppercase tracking-[0.08em]"
                        />
                    </CardContent>
                </Card>

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
                            If you request a refund within 14 days of the first real subscription charge, we will refund you in full once we have verified the payment. The goal is to keep the decision low-risk, not to push hard-sell billing language through the app.
                        </p>
                        <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            You can cancel during the trial and keep access until the trial ends. No real plan charge happens until the saved charge date shown after setup.
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

