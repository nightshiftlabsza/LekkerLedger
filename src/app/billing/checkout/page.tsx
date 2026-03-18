"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInlinePurchaseIntent } from "@/lib/billing-client";
import {
    readPendingBillingCheckoutState,
    readPendingBillingEmail,
    writePendingBillingCheckoutState,
    writePendingBillingEmail,
    writePendingBillingReference,
} from "@/lib/billing-handoff";
import { getSettings } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { type BillingCycle, type PlanId, getPlanPrice } from "@/src/config/plans";

function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
}

function isValidPaidPlan(planId: string | null): planId is Exclude<PlanId, "free"> {
    return planId === "standard" || planId === "pro";
}

function isValidBillingCycle(value: string | null): value is BillingCycle {
    return value === "monthly" || value === "yearly";
}

function formatPlanLabel(planId: Exclude<PlanId, "free">) {
    return planId === "pro" ? "Pro" : "Standard";
}

function formatCycleLabel(value: BillingCycle) {
    return value === "yearly" ? "yearly" : "monthly";
}

function formatPrice(planId: Exclude<PlanId, "free">, billingCycle: BillingCycle) {
    const amount = getPlanPrice(planId, billingCycle);
    return `R${amount}/${billingCycle === "yearly" ? "year" : "month"}`;
}

async function getInitialEmail() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
        return normalizeEmail(user.email);
    }

    const pendingEmail = readPendingBillingEmail();
    if (pendingEmail) {
        return normalizeEmail(pendingEmail);
    }

    const pendingCheckout = readPendingBillingCheckoutState();
    if (pendingCheckout?.email) {
        return normalizeEmail(pendingCheckout.email);
    }

    try {
        const settings = await getSettings();
        return settings.employerEmail ? normalizeEmail(settings.employerEmail) : "";
    } catch {
        return "";
    }
}

export default function BillingCheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawPlanId = searchParams.get("plan");
    const rawCycle = searchParams.get("cycle");
    const referralCode = searchParams.get("ref")?.trim() || null;
    const planId = isValidPaidPlan(rawPlanId) ? rawPlanId : null;
    const billingCycle = isValidBillingCycle(rawCycle) ? rawCycle : null;
    const pendingCheckout = readPendingBillingCheckoutState();

    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [resumeHint, setResumeHint] = React.useState<string | null>(null);

    React.useEffect(() => {
        let active = true;

        getInitialEmail().then((resolvedEmail) => {
            if (active && resolvedEmail) {
                setEmail(resolvedEmail);
            }
        }).catch(() => undefined);

        return () => {
            active = false;
        };
    }, []);

    React.useEffect(() => {
        if (!pendingCheckout?.email) {
            setResumeHint(null);
            return;
        }

        if (
            pendingCheckout.planId === planId
            && pendingCheckout.billingCycle === billingCycle
            && pendingCheckout.reference
        ) {
            setResumeHint(`A previous ${formatPlanLabel(planId || "standard")} checkout was started with ${pendingCheckout.email}. Continuing will open a fresh Paystack session.`);
            return;
        }

        setResumeHint(null);
    }, [billingCycle, pendingCheckout?.billingCycle, pendingCheckout?.email, pendingCheckout?.planId, pendingCheckout?.reference, planId]);

    const handleSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!planId || !billingCycle) {
            setError("Select a valid paid plan before continuing.");
            return;
        }

        const normalizedEmail = normalizeEmail(email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Enter a valid email address to continue.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const intent = await createInlinePurchaseIntent({
                planId,
                billingCycle,
                email: normalizedEmail,
                referralCode,
            });

            writePendingBillingReference(intent.reference);
            writePendingBillingEmail(normalizedEmail);
            writePendingBillingCheckoutState({
                reference: intent.reference,
                email: normalizedEmail,
                planId,
                billingCycle,
                referralCode,
            });

            window.location.assign(intent.authorizationUrl);
        } catch (checkoutError) {
            setLoading(false);
            setError(checkoutError instanceof Error ? checkoutError.message : "Paystack checkout could not be started.");
        }
    }, [billingCycle, email, planId, referralCode]);

    const retryHref = planId && billingCycle
        ? `/billing/checkout?plan=${planId}&cycle=${billingCycle}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ""}`
        : "/pricing";

    if (!planId || !billingCycle) {
        return (
            <div className="min-h-[80vh] px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-8 shadow-[var(--shadow-lg)]">
                    <h1 className="font-serif text-3xl font-bold text-[var(--text)]">Choose a paid plan first</h1>
                    <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                        This checkout link is missing the selected plan or billing cycle.
                    </p>
                    <div className="mt-8">
                        <Link href="/pricing">
                            <Button>
                                <ArrowLeft className="h-4 w-4" />
                                Back to pricing
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] px-4 py-8 sm:px-6 lg:px-8">
            <div className="content-container-wide mx-auto grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] xl:items-start">
                <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Hosted checkout
                    </div>

                    <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
                        Continue to Paystack
                    </h1>
                    <p className="mt-3 max-w-[54ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                        Enter the billing email for this paid account. LekkerLedger keeps that email through payment verification and uses it to open the correct setup or unlock flow after checkout.
                    </p>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                        {error ? (
                            <div className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        ) : null}

                        {resumeHint ? (
                            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm leading-6 text-[var(--text-muted)]">
                                {resumeHint}
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[var(--text)]" htmlFor="billing-email">
                                Billing email
                            </label>
                            <input
                                id="billing-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                }}
                                placeholder="name@example.com"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[var(--focus)]"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm leading-6 text-[var(--text-muted)]">
                            Paystack opens as a full hosted checkout. After a verified payment, LekkerLedger sends you straight into paid account creation, setup continuation, or account unlock with this email prefilled.
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <Link href="/pricing" className="w-full sm:w-auto">
                                <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={loading}>
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                            <Button type="submit" className="w-full sm:min-w-[220px]" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                                {loading ? "Redirecting to Paystack..." : "Continue to payment"}
                            </Button>
                        </div>
                    </form>
                </section>

                <aside className="space-y-5 xl:sticky xl:top-6">
                    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            Selected plan
                        </p>
                        <div className="mt-4 space-y-3">
                            <p className="text-2xl font-bold text-[var(--text)]">
                                {formatPlanLabel(planId)}
                            </p>
                            <p className="text-sm leading-6 text-[var(--text-muted)]">
                                {formatPrice(planId, billingCycle)} billed {formatCycleLabel(billingCycle)}.
                            </p>
                            {referralCode ? (
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                                    Referral code: {referralCode}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
                        <p className="text-sm font-bold text-[var(--text)]">If checkout was interrupted</p>
                        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                            Return to this page and continue again. LekkerLedger keeps the selected plan, billing email, and payment reference so the handoff can recover cleanly.
                        </p>
                        <div className="mt-4">
                            <Link href={retryHref}>
                                <Button variant="outline">Reload this checkout</Button>
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
