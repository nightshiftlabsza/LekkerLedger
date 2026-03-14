"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";
import { cancelSubscriptionRenewal, fetchBillingAccount } from "@/lib/billing-client";
// TODO: Batch 2 — gate referral code loading behind Supabase auth
import { type BillingCycle, PLANS, type PlanId } from "@/src/config/plans";
import { EmployerSettings } from "@/lib/schema";
import { getUserPlan, ENTITLEMENTS, type FeatureKey } from "@/lib/entitlements";
import { MarketingBillingToggle, MarketingPlanCards } from "@/components/marketing/pricing";
import { useInlinePaidPlanCheckout } from "@/components/billing/inline-paid-plan-checkout";

export default function UpgradePage() {
    return (
        <Suspense fallback={null}>
            <UpgradePageContent />
        </Suspense>
    );
}

function UpgradePageContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly");
    const [referralCode, setReferralCode] = React.useState("");
    const hasAutoStartedCheckout = React.useRef(false);
    const [downgradingTo, setDowngradingTo] = React.useState<PlanId | null>(null);
    const [cancelingForDowngrade, setCancelingForDowngrade] = React.useState(false);
    const [ownReferralCode, setOwnReferralCode] = React.useState<string | null>(null);
    const { startCheckout, loadingPlanId, dialog } = useInlinePaidPlanCheckout({ billingCycle, referralCode });

    const sourceKey = searchParams.get("source") as FeatureKey | null;

    const entitlement = sourceKey ? ENTITLEMENTS[sourceKey] : null;



    React.useEffect(() => {
        async function load() {
            const currentSettings = await getSettings();
            setSettings(currentSettings);
            const requestedBilling = searchParams.get("billing");
            const requestedReferral = searchParams.get("ref");
            setBillingCycle(requestedBilling === "monthly" ? "monthly" : requestedBilling === "yearly" ? "yearly" : currentSettings.billingCycle === "monthly" ? "monthly" : "yearly");
            setReferralCode(requestedReferral ? requestedReferral.toUpperCase() : "");
            // Load the logged-in user's own referral code so they can share it
            // TODO: Batch 2 — gate behind Supabase auth session check
            try {
                const account = await fetchBillingAccount();
                if (account?.account.referralCode) {
                    setOwnReferralCode(account.account.referralCode);
                }
            } catch {
                // Non-critical — referral code display is optional
            }
        }
        load();
    }, [searchParams]);

    React.useEffect(() => {
        if (!settings || hasAutoStartedCheckout.current) return;
        const requestedPlan = searchParams.get("plan");
        const shouldPayNow = searchParams.get("pay") === "1";
        if ((requestedPlan === "standard" || requestedPlan === "pro") && shouldPayNow) {
            const currentPlan = getUserPlan(settings);
            if (currentPlan.id !== requestedPlan) {
                hasAutoStartedCheckout.current = true;
                startCheckout(requestedPlan);
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
            startCheckout(planId);
        }
    }, [currentPlan.id, startCheckout]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCopyOwnCode = React.useCallback(async () => {
        if (!ownReferralCode) return;
        try {
            await navigator.clipboard.writeText(ownReferralCode);
            toast("Referral code copied.");
        } catch {
            toast("Could not copy the code.");
        }
    }, [ownReferralCode, toast]);

    const handleConfirmDowngrade = React.useCallback(async () => {
        setCancelingForDowngrade(true);
        try {
            await cancelSubscriptionRenewal();
            setDowngradingTo(null);
            toast("Subscription renewal canceled. You'll keep your current plan until your billing period ends.");
            const updated = await getSettings();
            setSettings(updated);
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
                subtitle="Choose the level of backup, archive depth, and household control you need."
            />

            <div className="mx-auto max-w-6xl space-y-10">
                {entitlement && (
                    <Card className="border-[var(--primary)] bg-[var(--primary)]/10">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-xl bg-[var(--primary)] p-2 text-white">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text)]">{entitlement.upsellHeadline}</p>
                                <p className="text-sm text-[var(--text-muted)]">{entitlement.upsellBody}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                <Card className="border-[var(--primary)] bg-[var(--primary)]/5">
                    <CardContent className="space-y-2 p-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>
                            Paid plans start immediately.
                        </p>
                        <p>
                            You&apos;ll be charged the full Standard or Pro price today through Paystack. The 14-day refund window starts from that purchase date.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-[var(--border)]">
                    <CardContent className="divide-y divide-[var(--border)] p-0">
                        {/* ── Your own referral code to share ── */}
                        {ownReferralCode && (
                            <div className="space-y-3 p-5">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-[var(--text)]">Your referral code</p>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Share this with anyone. You earn 1 free month every time someone subscribes using your code. Up to 12 free months per account.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                                        <span className="font-black tracking-[0.18em] text-[var(--text)]">{ownReferralCode}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyOwnCode()}
                                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* ── Enter a friend's referral code ── */}
                        <div className="space-y-3 p-5">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-[var(--text)]">Have a referral code?</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Enter a friend&apos;s code before subscribing. They earn 1 free month when you make your first full payment.
                                </p>
                            </div>
                            <Input
                                value={referralCode}
                                onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                                placeholder="Enter referral code"
                                className="h-12 font-semibold uppercase tracking-[0.08em]"
                            />
                        </div>
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
                        isLoadingPlanId={loadingPlanId}
                    />
                </div>

                {downgradingTo !== null && (
                    <div className="space-y-4 rounded-2xl border p-5" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                        <div className="space-y-2">
                            <p className="font-bold text-[var(--text)]">
                                Downgrade to {PLANS[downgradingTo].label}?
                            </p>
                            <p className="text-sm text-[var(--warning)]">
                                This cancels your {currentPlan.label} renewal. You keep {currentPlan.label} until your current billing period ends, then move to the Free plan.
                            </p>
                            {downgradingTo !== "free" && (
                                <p className="text-sm text-[var(--warning)]">
                                    After your {currentPlan.label} expires you can start a fresh {PLANS[downgradingTo].label} period from Free.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDowngradingTo(null)}
                                disabled={cancelingForDowngrade}
                                className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold text-[var(--warning)] hover:bg-[var(--surface-1)] disabled:opacity-50"
                                style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--surface-1)" }}
                            >
                                Keep {currentPlan.label}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleConfirmDowngrade()}
                                disabled={cancelingForDowngrade}
                                className="flex-1 rounded-xl bg-[var(--warning)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
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
                                Paid plans are for households that want less repeated admin: encrypted sync across browsers and devices, exports, deeper archives, and cleaner annual paperwork. They are meant to cost less than the time or outside help it usually takes to reconstruct records later.
                            </p>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Standard is the paid plan for most households that want organised records, encrypted sync, and annual paperwork. Pro is for households that want deeper history and more control, with multi-household support and unlimited employees when you need more headroom.
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
                            If you request a refund within 14 days of a paid charge, we will refund you in full once we have verified the payment. The goal is to keep the decision low-risk, not to push hard-sell billing language through the app.
                        </p>
                        <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            You can cancel renewal at any time. Access stays on until the end of the period you have already paid for.
                        </p>
                        <Link href="/legal/refunds" className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
                            View refund policy <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {dialog}
        </div>
    );
}

