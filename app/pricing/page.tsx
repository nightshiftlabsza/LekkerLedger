"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
    ArrowLeft, Check, Sparkles, Coffee, ShieldCheck, Zap,
    Cloud, FileText, Smartphone, AlertTriangle, Shield,
    ChevronRight, CalendarDays, Lock, Award, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getSettings, saveSettings } from "@/lib/storage";

const PAYSTACK_PUBLIC_KEY = "pk_test_3520c14017518f98180b12907a3069d4916eac7c";
const PAYSTACK_PLAN_ANNUAL = "PLN_xdijjb5u3pqneld";

// Load Paystack dynamically to prevent Next.js SSR window errors
const PaystackHookWrapper = dynamic(
    () => Promise.resolve(({ config, onSuccess, onClose }: any) => {
        const { usePaystackPayment } = require('react-paystack');
        const initializePayment = usePaystackPayment(config);

        React.useEffect(() => {
            if (config.amount > 0) {
                initializePayment({ onSuccess, onClose });
            }
        }, [config.amount]);

        return null;
    }),
    { ssr: false }
);

export default function PricingPage() {
    const [status, setStatus] = React.useState<"free" | "annual" | "pro" | "trial">("free");
    const [loading, setLoading] = React.useState(true);
    const [selectedPlan, setSelectedPlan] = React.useState<"annual" | "pro" | null>(null);
    const [makePayment, setMakePayment] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            const s = await getSettings();
            setStatus(s.proStatus || "free");
            setLoading(false);
        }
        load();
    }, []);

    // Payment Config builder
    const getPaystackConfig = () => {
        const isAnnual = selectedPlan === "annual";
        return {
            reference: (new Date()).getTime().toString(),
            email: "user@lekkerledger.co.za",
            amount: isAnnual ? 9900 : 29900,
            publicKey: PAYSTACK_PUBLIC_KEY,
            currency: 'ZAR',
            plan: isAnnual ? PAYSTACK_PLAN_ANNUAL : undefined, // Attach plan only if it's the annual subscription
        };
    };

    const handleUpgradeSuccess = async (plan: "annual" | "pro") => {
        const s = await getSettings();
        await saveSettings({ ...s, proStatus: plan });
        setStatus(plan);
        setMakePayment(false);
        alert(`Payment Successful! Welcome to Lekker ${plan === "pro" ? "Pro Lifetime" : "Annual Support"}! Access activated.`);
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
        alert("Your 1-month Pro trial has started! Enjoy full access.");
    };

    return (
        <div className="min-h-screen flex flex-col selection:bg-amber-200 relative" style={{ backgroundColor: "var(--bg-base)" }}>
            <header className="sticky top-0 z-40 glass-panel border-b border-[var(--border-subtle)]">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/dashboard">
                            <button className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-amber-600 transition-all active-scale">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="font-black text-lg tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
                                Compliance <span className="text-amber-500">Center</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                Secure your domestic payroll
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {makePayment && selectedPlan && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <PaystackHookWrapper
                        config={getPaystackConfig()}
                        onSuccess={() => handleUpgradeSuccess(selectedPlan)}
                        onClose={() => setMakePayment(false)}
                    />
                </div>
            )}

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 md:py-20 space-y-20">
                {/* Hero section */}
                <div className="text-center space-y-6 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest animate-fade-in">
                        <Shield className="h-3 w-3" /> 100% Privacy Focused
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9]" style={{ color: "var(--text-primary)" }}>
                        Professional compliance.<br />
                        <span className="text-amber-500 underline decoration-amber-500/20 underline-offset-8">Zero complexity.</span>
                    </h2>
                    <p className="text-base md:text-lg leading-relaxed text-[var(--text-secondary)]">
                        LekkerLedger is a localized legal engine that lives on your device. No cloud subscriptions, no data mining—just peace of mind.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {/* Standard Card */}
                    <PricingCard
                        title="Standard"
                        price="Free"
                        period="forever"
                        description="Essential tools for the single-worker household."
                        features={[
                            { text: "1 Active Employee Seat", included: true },
                            { text: "3 Months History Archive", included: true },
                            { text: "BCEA Compliance Math", included: true },
                            { text: "1-Click Monthly Payroll", included: false },
                            { text: "Google Drive Cloud Sync", included: false },
                        ]}
                        buttonText={status === "free" ? "Current Plan" : "Downgrade"}
                        buttonDisabled={status === "free"}
                        onAction={() => { }}
                    />

                    {/* Annual Card */}
                    <PricingCard
                        title="Annual Support"
                        price="R 99"
                        period="per year"
                        description="Perfect for families with dynamic needs."
                        badge="Popular"
                        features={[
                            { text: "Up to 3 Employee Seats", included: true },
                            { text: "1 Year Compliance Archive", included: true },
                            { text: "1-Click Monthly Payroll", included: true },
                            { text: "Weekly G-Drive Sync", included: true },
                            { text: "Contract Generator", included: true },
                        ]}
                        buttonText={status === "annual" ? "Active" : "Subscribe Yearly"}
                        buttonVariant="outline"
                        onAction={() => handleAction("annual")}
                        highlight
                    />

                    {/* Pro Card */}
                    <PricingCard
                        title="Lekker Pro"
                        price="R 299"
                        period="once off"
                        description="The complete legal vault for total protection."
                        badge="Best Value"
                        features={[
                            { text: "Unlimited Employee Seats", included: true },
                            { text: "5 Year Legal Archive (BCEA Required)", included: true },
                            { text: "Continuous Cloud Defences", included: true },
                            { text: "1-Click Monthly Payroll", included: true },
                            { text: "Automated Leave & Loan Tracker", included: true },
                        ]}
                        buttonText={status === "pro" ? "Activated" : "Get Lifetime Access"}
                        buttonVariant="primary"
                        onAction={() => handleAction("pro")}
                        isPro
                    />
                </div>

                {/* Free Trial Banner */}
                {status === "free" && (
                    <div className="p-8 rounded-[2rem] bg-zinc-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />
                        <div className="space-y-3 z-10 text-center md:text-left">
                            <h3 className="text-2xl font-black tracking-tight">Experience Pro Risk-Free</h3>
                            <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
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

                {/* Risk Section: Mistake vs Solution */}
                <div className="space-y-8 py-10">
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-extrabold tracking-tight">The "Legal Insurance" Perspective</h3>
                        <p className="text-sm text-[var(--text-secondary)]">One small oversight can cost more than a lifetime of Lekker Pro.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-8 rounded-3xl bg-red-50/50 border border-red-100 space-y-4">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-black uppercase tracking-widest text-[10px]">The Risk</span>
                            </div>
                            <h4 className="text-xl font-bold leading-tight">A Single Labor Dispute (CCMA)</h4>
                            <div className="space-y-3 pt-2">
                                <RiskItem text="Inaccurate records = Automatic fine" />
                                <RiskItem text="Legal fees start at R5,000+" />
                                <RiskItem text="Potential 12-month backpay award" />
                            </div>
                            <div className="pt-4">
                                <p className="text-3xl font-black text-red-600">± R 45,000</p>
                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">Estimated Liability</p>
                            </div>
                        </div>

                        <div className="p-8 rounded-3xl bg-amber-50/50 border border-amber-100 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 text-amber-600">
                                <ShieldCheck className="h-5 w-5" />
                                <span className="font-black uppercase tracking-widest text-[10px]">The Lekker Solution</span>
                            </div>
                            <h4 className="text-xl font-bold leading-tight">Pro Lifetime Protection</h4>
                            <div className="space-y-3 pt-2">
                                <SolutionItem text="Automated 5-Year Legal Archive" />
                                <SolutionItem text="Valid BCEA-Compliant Contracts" />
                                <SolutionItem text="Irrefutable record of payments" />
                            </div>
                            <div className="pt-4">
                                <p className="text-3xl font-black text-amber-600">R 299</p>
                                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-1">Once-off Payment</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support/Coffee Section */}
                <div className="pt-10 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-8 opacity-80">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="h-12 w-12 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center shrink-0 shadow-inner">
                            <Coffee className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold">Support Local Developers</h4>
                            <p className="text-xs text-[var(--text-secondary)]">Every Pro upgrade helps us keep the Standard plan free for everyone.</p>
                        </div>
                    </div>
                    <Link href="https://buymeacoffee.com" target="_blank" className="hover:scale-105 transition-transform">
                        <img
                            src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=nightshiftlabs&button_colour=ffdd00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff"
                            alt="Buy me a coffee"
                            className="h-10"
                        />
                    </Link>
                </div>

                {/* Trust Footer */}
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 pt-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] grayscale opacity-50">
                    <div className="flex items-center gap-2 italic hover:grayscale-0 transition-all cursor-default"><Award className="h-4 w-4" /> BCEA Certified Math</div>
                    <div className="flex items-center gap-2 italic hover:grayscale-0 transition-all cursor-default"><Lock className="h-4 w-4" /> AES-256 Local Storage</div>
                    <div className="flex items-center gap-2 italic hover:grayscale-0 transition-all cursor-default"><History className="h-4 w-4" /> 5-Year Compliance Ready</div>
                </div>
            </main>
        </div>
    );
}

function PricingCard({
    title, price, period, description, features, badge,
    buttonText, buttonDisabled, buttonVariant, onAction, highlight, isPro
}: {
    title: string;
    price: string;
    period: string;
    description: string;
    features: { text: string; included: boolean }[];
    badge?: string;
    buttonText: string;
    buttonDisabled?: boolean;
    buttonVariant?: "outline" | "primary";
    onAction: () => void;
    highlight?: boolean;
    isPro?: boolean;
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
                        <h3 className={`text-base font-black tracking-tight ${isPro ? 'text-amber-600' : 'text-[var(--text-secondary)]'}`}>{title}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black">{price}</span>
                            <span className="text-xs font-medium text-[var(--text-muted)]">{period}</span>
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

function RiskItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 text-xs font-medium text-red-700/80">
            <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
            {text}
        </div>
    );
}

function SolutionItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 text-xs font-bold text-amber-700">
            <Check className="h-3.5 w-3.5 text-amber-500 stroke-[3px]" />
            {text}
        </div>
    );
}
