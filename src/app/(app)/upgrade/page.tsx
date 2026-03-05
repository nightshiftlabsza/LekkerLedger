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
import { PRICING_PLANS, PlanKey } from "@/src/config/plans";

const PAYSTACK_PUBLIC_KEY = "pk_test_3520c14017518f98180b12907a3069d4916eac7c";
const PAYSTACK_PLAN_ANNUAL = "PLN_xdijjb5u3pqneld";

const PaystackHookWrapper = dynamic(() => import('@/components/paystack-wrapper'), { ssr: false });

export default function UpgradePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = React.useState<PlanKey>("free");
    const [selectedPlan, setSelectedPlan] = React.useState<"annual" | "pro" | null>(null);
    const [makePayment, setMakePayment] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            const s = await getSettings();
            setStatus((s.proStatus as PlanKey) || "free");
        }
        load();
    }, []);

    const getPaystackConfig = () => {
        const isAnnual = selectedPlan === "annual";
        const email = typeof window !== "undefined" ? localStorage.getItem("google_email") || "user@lekkerledger.co.za" : "user@lekkerledger.co.za";
        return {
            reference: (new Date()).getTime().toString(),
            email,
            amount: isAnnual ? 9900 : 29900,
            publicKey: PAYSTACK_PUBLIC_KEY,
            currency: 'ZAR',
            plan: isAnnual ? PAYSTACK_PLAN_ANNUAL : undefined,
        };
    };

    const handleUpgradeSuccess = async (plan: "annual" | "pro") => {
        const s = await getSettings();
        await saveSettings({ ...s, proStatus: plan });
        setStatus(plan);
        setMakePayment(false);
        // GA4 / Tracking
        if (typeof window !== "undefined") {
            router.push("/billing/success");
        }
    };

    const handleAction = (plan: "annual" | "pro") => {
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    <PricingCard
                        title={PRICING_PLANS.free.name}
                        price={PRICING_PLANS.free.price}
                        period="forever"
                        description={PRICING_PLANS.free.description}
                        features={[
                            { text: "1 Active Employee Seat", included: true },
                            { text: "3 Months History Archive", included: true },
                            { text: "BCEA Aligned Calculations", included: true },
                            { text: "Easy Monthly Payslips", included: true },
                            { text: "Google Drive Sync", included: PRICING_PLANS.free.hasDriveSync },
                        ]}
                        buttonText={status === "free" ? "Current Plan" : "Downgrade"}
                        buttonDisabled={status === "free"}
                        onAction={() => { }}
                    />

                    <PricingCard
                        title={PRICING_PLANS.annual.name}
                        price={PRICING_PLANS.annual.price.split(' ')[0] + ' ' + PRICING_PLANS.annual.price.split(' ')[1]}
                        period="per year"
                        description={PRICING_PLANS.annual.description}
                        badge="Popular"
                        features={[
                            { text: "Up to 3 Employee Seats", included: true },
                            { text: "1 Year Compliance Archive", included: true },
                            { text: "Repeat Last Month Payroll", included: true },
                            { text: "BCEA Contract Generator", included: true },
                            { text: "Google Drive Sync", included: PRICING_PLANS.annual.hasDriveSync },
                        ]}
                        buttonText={status === "annual" ? "Active" : "Subscribe Yearly"}
                        onAction={() => handleAction("annual")}
                        colorClass="text-[var(--color-success)]"
                    />

                    <PricingCard
                        title={PRICING_PLANS.pro.name}
                        price={PRICING_PLANS.pro.price.split(' ')[0] + ' ' + PRICING_PLANS.pro.price.split(' ')[1]}
                        period="once-off"
                        description={PRICING_PLANS.pro.description}
                        badge="Best Value"
                        features={[
                            { text: "Unlimited Employee Seats", included: true },
                            { text: "5 Year Archive (recommended)", included: true },
                            { text: "Private Google Drive Sync", included: PRICING_PLANS.pro.hasDriveSync },
                            { text: "1-Click Monthly Payroll", included: true },
                            { text: "Full Document Vault", included: true },
                        ]}
                        buttonText={status === "pro" || status === "trial" ? "Activated" : "Get Lifetime Access"}
                        onAction={() => handleAction("pro")}
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
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>If you request a refund within {PRICING_PLANS.annual.refundWindowDays} days of purchase, we’ll refund you in full. How to request: Use the in-app Support link or email support@lekkerledger.co.za with your purchase email + date.</p>
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
