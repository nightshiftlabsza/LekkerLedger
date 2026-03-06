"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings, saveSettings } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";
import { annualPriceLabel, getAnnualPrice, NEXT_PUBLIC_ANNUAL_PRICE_MODE, PLANS } from "../../../config/plans";
import { EmployerSettings } from "../../../lib/schema";
const PAYSTACK_PUBLIC_KEY = "pk_test_3520c14017518f98180b12907a3069d4916eac7c";
const PAYSTACK_PLAN_ANNUAL = "PLN_xdijjb5u3pqneld";

const PaystackHookWrapper = dynamic(() => import('@/components/paystack-wrapper'), { ssr: false });

export default function UpgradePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = React.useState<string>("free");
    const [selectedPlan, setSelectedPlan] = React.useState<"annual" | "lifetime" | null>(null);
    const [makePayment, setMakePayment] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            const s = (await getSettings()) as EmployerSettings;
            setStatus(s.proStatus || "free");
        }
        load();
    }, []);

    const getPaystackConfig = () => {
        const isAnnual = selectedPlan === "annual";
        const email = typeof window !== "undefined" ? localStorage.getItem("google_email") || "user@lekkerledger.co.za" : "user@lekkerledger.co.za";
        const amount = isAnnual ? getAnnualPrice() * 100 : (PLANS.lifetime.onceOffPrice ?? 299) * 100;
        return {
            reference: (new Date()).getTime().toString(),
            email,
            amount: amount,
            publicKey: PAYSTACK_PUBLIC_KEY,
            currency: 'ZAR',
            plan: isAnnual ? PAYSTACK_PLAN_ANNUAL : undefined,
            metadata: {
                custom_fields: [
                    { display_name: "Plan ID", variable_name: "planId", value: selectedPlan || "unknown" },
                    { display_name: "Billing", variable_name: "billing", value: isAnnual ? "annual" : "once_off" },
                    { display_name: "Price Mode", variable_name: "priceMode", value: isAnnual ? NEXT_PUBLIC_ANNUAL_PRICE_MODE : "regular" },
                    { display_name: "Source", variable_name: "source", value: "upgrade_page" }
                ]
            }
        };
    };

    const handleUpgradeSuccess = async (plan: "annual" | "lifetime") => {
        const s = await getSettings();
        const paidUntil = new Date();
        if (plan === "annual") {
            paidUntil.setFullYear(paidUntil.getFullYear() + 1);
        } else {
            paidUntil.setFullYear(paidUntil.getFullYear() + 100);
        }
        await saveSettings({ ...s, proStatus: plan, paidUntil: paidUntil.toISOString() });
        setStatus(plan);
        setMakePayment(false);
        // GA4 / Tracking
        if (typeof window !== "undefined") {
            router.push("/billing/success");
        }
    };

    const handleAction = (plan: "annual" | "lifetime") => {
        setSelectedPlan(plan);
        setMakePayment(true);
    };

    const handlePaymentCancel = () => {
        setMakePayment(false);
        router.push("/billing/cancel");
    };

    const handleStartTrial = async () => {
        const s = await getSettings();
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        await saveSettings({
            ...s,
            proStatus: "trial",
            trialExpiry: expiry.toISOString()
        });
        setStatus("trial");
        toast("Your 1-month Pro trial has started! Enjoy full access.");
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader title="Support & Upgrade" subtitle="Manage your LekkerLedger plan and billing" />

            {makePayment && selectedPlan && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <PaystackHookWrapper
                        config={getPaystackConfig()}
                        onSuccess={() => handleUpgradeSuccess(selectedPlan)}
                        onClose={handlePaymentCancel}
                    />
                </div>
            )}

            <div className="max-w-5xl mx-auto space-y-8">
                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
                    <PricingCard
                        title={PLANS.annual.label}
                        price={annualPriceLabel().split(' ')[0]}
                        period="per year"
                        description="Cloud backup and priority reference rate and template updates."
                        badge="Popular"
                        features={PLANS.annual.marketingBullets.map((b) => ({ text: b, included: true }))}
                        buttonText={status === "annual" ? "Active" : "Subscribe Yearly"}
                        onAction={() => handleAction("annual")}
                        colorClass="text-[var(--color-success)]"
                    />

                    <PricingCard
                        title={PLANS.lifetime.label}
                        price={`R${PLANS.lifetime.onceOffPrice}`}
                        period="once-off"
                        description="The complete payroll vault. Pay once, keep forever."
                        badge="Best Value"
                        features={PLANS.lifetime.marketingBullets.map((b) => ({ text: b, included: true }))}
                        buttonText={status === "pro" || status === "lifetime" || status === "trial" ? "Activated" : "Get Lifetime Access"}
                        onAction={() => handleAction("lifetime")}
                        isPro
                        colorClass="text-[var(--primary)]"
                    />
                </div>

                {/* Free Trial Banner */}
                {status === "free" && (
                    <div className="p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[var(--primary)]/20 transition-all duration-700" />
                        <div className="space-y-3 z-10 text-center md:text-left">
                            <h3 className="type-h3" style={{ color: "var(--text)" }}>Experience Pro Risk-Free</h3>
                            <p className="max-w-md text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Unlock every feature, unlimited employees, and cloud backups for 30 days. No credit card required.
                            </p>
                        </div>
                        <Button
                            className="h-14 px-10 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-semibold text-base shadow-xl z-10 whitespace-nowrap"
                            onClick={handleStartTrial}
                        >
                            Start 30-Day Free Trial
                        </Button>
                    </div>
                )}

                {/* How Billing Works */}
                <div className="p-8 rounded-2xl border border-[var(--border)]" style={{ backgroundColor: "var(--surface-1)" }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>How billing works</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Standard</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Free forever for 1 employee and limited history.</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Annual Support (R99/year)</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Renews yearly. Cancel anytime—your access continues until the end of the paid year.</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Lekker Pro (R299 once-off)</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>One-time payment for long-term access on this device, plus features like extended archive and (if enabled) Drive backup.</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-3">
                        <div>
                            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Refunds</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>If you request a refund within 14 days of purchase, we’ll refund you in full. How to request: Use the in-app Support link or email support@lekkerledger.co.za with your purchase email + date.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Link href="/legal/refunds" className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary)]">
                                View full refund & cancellation policy →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PricingCard({
    title, price, period, description, features, badge,
    buttonText, buttonDisabled, onAction, isPro, colorClass
}: {
    title: string;
    price: string;
    period: string;
    description: string;
    features: { text: string; included: boolean }[];
    badge?: string;
    buttonText: string;
    buttonDisabled?: boolean;
    onAction: () => void;
    isPro?: boolean;
    colorClass?: string;
}) {
    return (
        <Card className={`relative overflow-hidden transition-all duration-300 glass-panel hover-lift active-scale ${isPro ? 'border-2 border-[var(--primary)] shadow-2xl md:scale-105 z-10' : ''}`}>
            {badge && (
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest shadow-sm z-10 ${isPro ? 'bg-[var(--primary)] text-white' : 'bg-[var(--accent-subtle)] text-[var(--primary)] border-l border-b border-[var(--border)]'}`}>
                    {badge}
                </div>
            )}
            <CardContent className="p-8 space-y-8 h-full flex flex-col bg-[var(--surface-1)]">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className={`text-xl font-black tracking-tight ${colorClass || 'text-[var(--text-muted)]'}`}>{title}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-semibold tracking-tight type-mono">{price}</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{period}</span>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed h-8">
                        {description}
                    </p>
                </div>

                <div className="flex-1 space-y-4 border-t border-[var(--border)] pt-6">
                    <ul className="space-y-3">
                        {features.map((f, i) => (
                            <li key={i} className={`flex items-start gap-3 text-xs leading-tight ${f.included ? 'text-[var(--text)] font-medium' : 'text-[var(--text-muted)]'}`}>
                                <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${f.included ? (isPro ? 'bg-amber-100 text-[var(--primary)]' : 'bg-zinc-100 text-zinc-500') : 'bg-zinc-50'}`}>
                                    {f.included ? <Check className="h-2.5 w-2.5 stroke-[4px]" /> : <div className="h-1 w-1 bg-zinc-300 rounded-full" />}
                                </div>
                                {f.text}
                            </li>
                        ))}
                    </ul>
                </div>

                <Button
                    variant={isPro ? "default" : "outline"}
                    className={`h-12 w-full rounded-2xl font-black text-sm tracking-tight shadow-sm transition-all ${isPro ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white shadow-[var(--primary)]/20' : ''}`}
                    disabled={buttonDisabled}
                    onClick={onAction}
                >
                    {buttonText} {isPro && <Zap className="h-3.5 w-3.5 fill-current ml-2" />}
                </Button>
            </CardContent>
        </Card>
    );
}

