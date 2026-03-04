"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
    Check, Zap, ArrowRight, Menu, X, Shield,
    Mail, Github, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSettings, saveSettings } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";

const PAYSTACK_PUBLIC_KEY = "pk_test_3520c14017518f98180b12907a3069d4916eac7c";
const PAYSTACK_PLAN_ANNUAL = "PLN_xdijjb5u3pqneld";

const PaystackHookWrapper = dynamic(() => import('@/components/paystack-wrapper'), { ssr: false });

/* ═══════════════════════════════════════════════════════════════════════════
 * PRICING PAGE — uses marketing layout (NO app shell nav)
 * Full pricing comparison + payment integration
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function PricingPage() {
    const { toast } = useToast();
    const [status, setStatus] = React.useState<"free" | "annual" | "pro" | "trial">("free");
    const [selectedPlan, setSelectedPlan] = React.useState<"annual" | "pro" | null>(null);
    const [makePayment, setMakePayment] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            const s = await getSettings();
            setStatus(s.proStatus || "free");
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
        toast(`Payment Successful! Welcome to Lekker ${plan === "pro" ? "Pro Lifetime" : "Annual Support"}! Access activated.`);
    };

    const handleAction = (plan: "annual" | "pro") => {
        setSelectedPlan(plan);
        setMakePayment(true);
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
        <div className="min-h-screen flex flex-col selection:bg-amber-200" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Marketing Header */}
            <PricingHeader />

            {makePayment && selectedPlan && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <PaystackHookWrapper
                        config={getPaystackConfig()}
                        onSuccess={() => handleUpgradeSuccess(selectedPlan)}
                        onClose={() => setMakePayment(false)}
                    />
                </div>
            )}

            <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Simple, transparent pricing.
                        </h1>
                        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            Start free with one employee. Upgrade when your household needs more.
                        </p>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        <PricingCard
                            title="Standard"
                            price="Free"
                            period="forever"
                            description="Essential tools for the single-worker household."
                            features={[
                                { text: "1 Active Employee Seat", included: true },
                                { text: "3 Months History Archive", included: true },
                                { text: "BCEA Aligned Calculations", included: true },
                                { text: "Easy Monthly Payslips", included: true },
                                { text: "Google Drive Sync", included: false },
                            ]}
                            buttonText={status === "free" ? "Current Plan" : "Downgrade"}
                            buttonDisabled={status === "free"}
                            onAction={() => { }}
                        />

                        <PricingCard
                            title="Annual Support"
                            price="R 99"
                            period="per year"
                            description="Perfect for families with dynamic needs. Renews yearly — cancel anytime."
                            badge="Popular"
                            features={[
                                { text: "Up to 3 Employee Seats", included: true },
                                { text: "1 Year Compliance Archive", included: true },
                                { text: "Repeat Last Month Payroll", included: true },
                                { text: "BCEA Contract Generator", included: true },
                                { text: "Google Drive Sync", included: false },
                            ]}
                            buttonText={status === "annual" ? "Active" : "Subscribe Yearly"}
                            onAction={() => handleAction("annual")}
                            colorClass="text-[var(--color-success)]"
                        />

                        <PricingCard
                            title="Lekker Pro"
                            price="R 299"
                            period="once-off"
                            description="The complete payroll vault. Pay once, keep forever."
                            badge="Best Value"
                            features={[
                                { text: "Unlimited Employee Seats", included: true },
                                { text: "5 Year Archive (recommended best practice)", included: true },
                                { text: "Private Google Drive Sync", included: true },
                                { text: "1-Click Monthly Payroll", included: true },
                                { text: "Full Document Vault", included: true },
                            ]}
                            buttonText={status === "pro" ? "Activated" : "Get Lifetime Access"}
                            onAction={() => handleAction("pro")}
                            isPro
                            colorClass="text-[var(--color-brand)]"
                        />
                    </div>

                    {/* Free Trial Banner */}
                    {status === "free" && (
                        <div className="mt-12 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group" style={{ backgroundColor: "var(--bg-muted)", border: "1px solid var(--border-strong)" }}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />
                            <div className="space-y-3 z-10 text-center md:text-left">
                                <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Experience Pro Risk-Free</h3>
                                <p className="max-w-md text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                    Unlock every feature, unlimited employees, and cloud backups for 30 days. No credit card required.
                                </p>
                            </div>
                            <Button
                                className="h-14 px-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-base shadow-xl z-10 whitespace-nowrap"
                                onClick={handleStartTrial}
                            >
                                Start 30-Day Free Trial
                            </Button>
                        </div>
                    )}

                    {/* How Billing Works */}
                    <div className="mt-16 p-8 rounded-2xl border border-[var(--border-subtle)]" style={{ backgroundColor: "var(--bg-surface)" }}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>How billing works</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Standard (Free)</p>
                                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Free forever. No payment needed. Supports 1 employee with 3 months of history.</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Annual Support (R99/yr)</p>
                                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Renews yearly. Cancel anytime — access continues until your current year ends, then stops renewing.</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Lekker Pro (R299 once-off)</p>
                                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Pay once, keep forever. No recurring fees. 14-day no-questions-asked refund guarantee.</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                            <Link href="/legal/refunds" className="text-sm font-semibold text-amber-600 hover:text-amber-500">
                                View refund & cancellation policy →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border-subtle)] py-8 px-4" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>© 2026 LekkerLedger. All rights reserved. Crafted by Nightshift Labs 🇿🇦</p>
                    <div className="flex items-center gap-4">
                        <Link href="/legal/privacy" className="text-xs hover:text-amber-600" style={{ color: "var(--text-muted)" }}>Privacy</Link>
                        <Link href="/legal/terms" className="text-xs hover:text-amber-600" style={{ color: "var(--text-muted)" }}>Terms</Link>
                        <Link href="/legal/refunds" className="text-xs hover:text-amber-600" style={{ color: "var(--text-muted)" }}>Refunds</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ─── PRICING HEADER (marketing, no app nav) ─────────────────────────────── */
function PricingHeader() {
    return (
        <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border-subtle)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    <Link href="/" className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[var(--bg-subtle)] transition-colors" style={{ color: "var(--text-secondary)" }}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/brand/logo-light.png" alt="LekkerLedger" width={120} height={30} className="h-7 w-auto block dark:hidden" priority />
                        <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={120} height={30} className="h-7 w-auto hidden dark:block" priority />
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/app/dashboard" className="text-sm font-semibold transition-colors hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>
                        Sign in
                    </Link>
                    <Link href="/app/dashboard" className="hidden sm:block">
                        <Button className="h-10 px-5 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-sm shadow-md">
                            Create your first payslip
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}

/* ─── PRICING CARD ────────────────────────────────────────────────────────── */
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
        <Card className={`relative overflow-hidden transition-all duration-300 glass-panel hover-lift active-scale ${isPro ? 'border-2 border-amber-500 shadow-2xl scale-105 z-10' : ''}`}>
            {badge && (
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest shadow-sm z-10 ${isPro ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 border-l border-b border-amber-100'}`}>
                    {badge}
                </div>
            )}
            <CardContent className="p-8 space-y-8 h-full flex flex-col bg-[var(--bg-surface)]">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className={`text-xl font-black tracking-tight ${colorClass || 'text-[var(--text-secondary)]'}`}>{title}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black tracking-tighter">{price}</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{period}</span>
                            {isPro && <span className="ml-2 text-[10px] font-black uppercase text-amber-600 animate-pulse">(Best Value)</span>}
                        </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed h-8">
                        {description}
                    </p>
                </div>

                <div className="flex-1 space-y-4 border-t border-[var(--border-subtle)] pt-6">
                    <ul className="space-y-3">
                        {features.map((f, i) => (
                            <li key={i} className={`flex items-start gap-3 text-xs leading-tight ${f.included ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
                                <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${f.included ? (isPro ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-500') : 'bg-zinc-50'}`}>
                                    {f.included ? <Check className="h-2.5 w-2.5 stroke-[4px]" /> : <div className="h-1 w-1 bg-zinc-300 rounded-full" />}
                                </div>
                                {f.text}
                            </li>
                        ))}
                    </ul>
                </div>

                <Button
                    variant={isPro ? "default" : "outline"}
                    className={`h-12 w-full rounded-2xl font-black text-sm tracking-tight shadow-sm transition-all ${isPro ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : ''}`}
                    disabled={buttonDisabled}
                    onClick={onAction}
                >
                    {buttonText} {isPro && <Zap className="h-3.5 w-3.5 fill-current ml-2" />}
                </Button>
            </CardContent>
        </Card>
    );
}
