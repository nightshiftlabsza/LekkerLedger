"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings, saveSettings } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";
import { type BillingCycle, PLAN_ORDER, PLANS, getPlanDisplayPrice, getPlanPeriodLabel, getPlanPrice, getPlanSavingsLabel } from "@/src/config/plans";
import { EmployerSettings } from "@/lib/schema";
import { getUserPlan } from "@/lib/entitlements";

const PAYSTACK_PUBLIC_KEY = "pk_test_3520c14017518f98180b12907a3069d4916eac7c";
const PaystackHookWrapper = dynamic(() => import("@/components/paystack-wrapper"), { ssr: false });

export default function UpgradePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("yearly");
    const [selectedPlan, setSelectedPlan] = React.useState<"standard" | "pro" | null>(null);
    const [makePayment, setMakePayment] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            const currentSettings = await getSettings();
            setSettings(currentSettings as EmployerSettings);
            setBillingCycle(currentSettings.billingCycle === "monthly" ? "monthly" : "yearly");
        }
        load();
    }, []);

    const currentPlan = settings ? getUserPlan(settings) : PLANS.free;
    const selectedPrice = selectedPlan ? getPlanPrice(selectedPlan, billingCycle) : null;

    const getPaystackConfig = () => {
        const email = typeof window !== "undefined" ? localStorage.getItem("google_email") || "user@lekkerledger.co.za" : "user@lekkerledger.co.za";
        return {
            reference: new Date().getTime().toString(),
            email,
            amount: (selectedPrice ?? 0) * 100,
            publicKey: PAYSTACK_PUBLIC_KEY,
            currency: "ZAR",
            metadata: {
                custom_fields: [
                    { display_name: "Plan ID", variable_name: "planId", value: selectedPlan || "unknown" },
                    { display_name: "Billing Cycle", variable_name: "billingCycle", value: billingCycle },
                    { display_name: "Source", variable_name: "source", value: "upgrade_page" },
                ],
            },
        };
    };

    const handleUpgradeSuccess = async () => {
        if (!settings || !selectedPlan) return;
        const paidUntil = new Date();
        if (billingCycle === "monthly") {
            paidUntil.setMonth(paidUntil.getMonth() + 1);
        } else {
            paidUntil.setFullYear(paidUntil.getFullYear() + 1);
        }

        const updated = {
            ...settings,
            proStatus: selectedPlan,
            billingCycle,
            paidUntil: paidUntil.toISOString(),
        } satisfies EmployerSettings;

        await saveSettings(updated);
        setSettings(updated);
        setMakePayment(false);
        toast(`${PLANS[selectedPlan].label} activated.`);
        router.push("/billing/success");
    };

    const handleSelectPlan = (planId: "standard" | "pro") => {
        setSelectedPlan(planId);
        setMakePayment(true);
    };

    if (!settings) {
        return null;
    }

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title="Plans & billing"
                subtitle="Choose the level of Google-connected backup, archive depth, and household control you need."
            />

            {makePayment && selectedPlan && selectedPrice && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <PaystackHookWrapper
                        config={getPaystackConfig()}
                        onSuccess={handleUpgradeSuccess}
                        onClose={() => setMakePayment(false)}
                    />
                </div>
            )}

            <div className="mx-auto max-w-6xl space-y-8">
                <div className="flex justify-center">
                    <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-[var(--shadow-1)]">
                        {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                            <button
                                key={cycle}
                                type="button"
                                onClick={() => setBillingCycle(cycle)}
                                className="rounded-full px-5 py-2.5 text-sm font-bold transition-all"
                                style={{
                                    backgroundColor: billingCycle === cycle ? "var(--primary)" : "transparent",
                                    color: billingCycle === cycle ? "#ffffff" : "var(--text-muted)",
                                }}
                            >
                                {cycle === "monthly" ? "Monthly" : "Yearly"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    {PLAN_ORDER.map((planId) => {
                        const plan = PLANS[planId];
                        const featured = plan.id === "pro";
                        const cycle = plan.id === "free" ? "yearly" : billingCycle;
                        const isCurrent = currentPlan.id === plan.id;
                        return (
                            <Card key={plan.id} className={`overflow-hidden border ${featured ? "border-[var(--primary)] shadow-[var(--shadow-2)]" : "border-[var(--border)]"}`}>
                                <CardContent className="p-7 space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>{plan.label}</p>
                                            <h2 className="mt-2 text-2xl font-black" style={{ color: "var(--text)" }}>{plan.bestFor}</h2>
                                        </div>
                                        {plan.badge && (
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${featured ? "bg-[var(--primary)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"}`}>
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                        <div className="flex items-end gap-2">
                                            <span className="text-4xl font-semibold type-mono" style={{ color: "var(--text)" }}>
                                                {getPlanDisplayPrice(plan, cycle)}
                                            </span>
                                            <span className="pb-1 text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                {getPlanPeriodLabel(plan, cycle)}
                                            </span>
                                        </div>
                                        {plan.pricing.yearly && (
                                            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                                                {billingCycle === "yearly" ? getPlanSavingsLabel(plan) : `${getPlanDisplayPrice(plan, "yearly")}/year if you prefer the lower yearly rate`}
                                            </p>
                                        )}
                                    </div>

                                    <ul className="space-y-3">
                                        {plan.marketingBullets.map((bullet) => (
                                            <li key={bullet} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="border-t border-[var(--border)] pt-5">
                                        {plan.id === "free" ? (
                                            <Button variant="outline" className="w-full font-bold" disabled={isCurrent}>
                                                {isCurrent ? "Current plan" : "Free plan"}
                                            </Button>
                                        ) : (
                                            <Button className="w-full font-bold" disabled={isCurrent} onClick={() => { if (plan.id !== "free") handleSelectPlan(plan.id); }}>
                                                {isCurrent ? "Current plan" : `Choose ${plan.label}`}
                                                {!isCurrent && <ArrowRight className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-[var(--border)]">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="type-h3" style={{ color: "var(--text)" }}>What changes on paid plans</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Paid plans are for households that want less repeated admin: Google-connected backup across browsers and devices, exports, deeper archives, and cleaner annual paperwork. They are meant to cost less than the time or outside help it usually takes to reconstruct records later.
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Standard is the paid plan for most households that want proper records, Google-connected backup, and annual paperwork. Pro is for households that want deeper history and admin control, with multi-household support and unlimited employees there when you need more headroom.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-[var(--primary)] bg-[var(--primary)]/5">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-[var(--primary)] p-3 text-white">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h3 className="type-h3" style={{ color: "var(--text)" }}>Refunds and trust</h3>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                If you request a refund within 14 days of purchase, we&apos;ll refund you in full. The goal is to keep the decision low-risk, not to push hard-sell billing language through the app.
                            </p>
                            <Link href="/legal/refunds" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                                View refund policy <ArrowRight className="h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


