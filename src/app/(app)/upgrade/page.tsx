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
import { cancelSubscriptionRenewal, startTrialCheckout } from "@/lib/billing-client";
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
    const [downgradingTo, setDowngradingTo] = React.useState<PlanId | null>(null);
    const [cancelingForDowngrade, setCancelingForDowngrade] = React.useState(false);

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

    const PLAN_RANK: Record<PlanId, number> = { free: 0, standard: 1, pro: 2 };

    const handlePlanSelect = React.useCallback((planId: PlanId) => {
        const currentRank = PLAN_RANK[currentPlan.id as PlanId] ?? 0;
        const targetRank = PLAN_RANK[planId] ?? 0;
        if (targetRank < currentRank) {
            setDowngradingTo(planId);
            return;
        }
        if (planId === "standard" || planId === "pro") {
            void startCheckout(planId);
        }
    }, [currentPlan.id, startCheckout]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleConfirmDowngrade = React.useCallback(async () => {
        setCancelingForDowngrade(true);
        try {
            await cancelSubscriptionRenewal();
            setDowngradingTo(null);
            toast("Subscription renewal canceled. You'll keep your current plan until your billing period ends.");
            const updated = await getSettings();
            setSettings(updated as EmployerSettings);
        } catch (err) {
            toast(err instanceof Error ? err.message : "Could not cancel subscription.");
        } finally {
            setCancelingForDowngrade(false);
        }
    }, [toast]);

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
                    <CardContent className="space-y-2 p-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>
                            R1 for your first 14 days.
                        </p>
                        <p>
                            Pick a plan below. You&apos;ll sign in with Google and save a card for R1 today. Your full subscription only starts after 14 days — cancel before then and you pay nothing more.
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
                        onSelect={handlePlanSelect}
                        isLoadingPlanId={checkoutPlanId}
                    />
                </div>

                {downgradingTo !== null && (
                    <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-5 space-y-4 dark:bg-amber-950/20 dark:border-amber-500/30">
                        <div className="space-y-2">
                            <p className="font-bold text-amber-900 dark:text-amber-200">
                                Downgrade to {PLANS[downgradingTo].label}?
                            </p>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                This cancels your {currentPlan.label} renewal. You keep {currentPlan.label} until your current billing period ends, then move to the Free plan.
                            </p>
                            {downgradingTo !== "free" && (
                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                    After your {currentPlan.label} expires you can start a fresh {PLANS[downgradingTo].label} trial from Free.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDowngradingTo(null)}
                                disabled={cancelingForDowngrade}
                                className="flex-1 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-50 dark:bg-transparent dark:text-amber-200 dark:border-amber-500/40"
                            >
                                Keep {currentPlan.label}
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleConfirmDowngrade()}
                                disabled={cancelingForDowngrade}
                                className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                            >
                                {cancelingForDowngrade ? "Canceling..." : "Confirm downgrade"}
                            </button>
                        </div>
                    </div>
                )}

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

