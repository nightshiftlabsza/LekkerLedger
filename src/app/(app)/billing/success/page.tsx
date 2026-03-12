"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    confirmBillingTransaction,
    confirmGuestBillingTransaction,
    fetchBillingAccount,
    type BillingAccountPayload,
} from "@/lib/billing-client";

const PENDING_BILLING_REFERENCE_KEY = "lekkerledger:pending-billing-reference";

function readPendingReference() {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(PENDING_BILLING_REFERENCE_KEY)?.trim() || "";
}

function writePendingReference(reference: string) {
    if (typeof window === "undefined") return;
    if (!reference) {
        window.localStorage.removeItem(PENDING_BILLING_REFERENCE_KEY);
        return;
    }
    window.localStorage.setItem(PENDING_BILLING_REFERENCE_KEY, reference);
}

export default function BillingSuccessPage() {
    return (
        <Suspense fallback={null}>
            <BillingSuccessPageContent />
        </Suspense>
    );
}

function BillingSuccessPageContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = React.useState<"checking" | "trial" | "active" | "pending" | "auth" | "error">("checking");
    const [billingAccount, setBillingAccount] = React.useState<BillingAccountPayload | null>(null);
    const [guestEmail, setGuestEmail] = React.useState<string | null>(null);
    const [resolvedReference, setResolvedReference] = React.useState("");
    const [isRetrying, setIsRetrying] = React.useState(false);

    const applyAccount = React.useCallback((account: BillingAccountPayload): boolean => {
        if (account.account.lastError) {
            setBillingAccount(account);
            setStatus("error");
            return true;
        }

        if (account.entitlements.status === "trialing" && account.entitlements.planId !== "free") {
            setBillingAccount(account);
            setStatus("trial");
            writePendingReference("");
            return true;
        }

        if (account.entitlements.isActive && account.entitlements.planId !== "free") {
            setBillingAccount(account);
            setStatus("active");
            writePendingReference("");
            return true;
        }

        return false;
    }, []);

    const confirmPayment = React.useCallback(async (reference: string, attemptLimit = 12) => {
        if (!reference) {
            try {
                const account = await fetchBillingAccount();
                if (account && applyAccount(account)) {
                    return;
                }
            } catch {
                // Ignore and fall through to pending.
            }

            setStatus("pending");
            return;
        }

        writePendingReference(reference);
        setResolvedReference(reference);
        setStatus("checking");

        for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
            try {
                const confirmed = await confirmBillingTransaction(reference);
                if (applyAccount(confirmed)) {
                    return;
                }
            } catch (error) {
                if (error instanceof Error && (error.message.includes("Sign-in") || error.message.includes("401"))) {
                    try {
                        const guestStatus = await confirmGuestBillingTransaction(reference);
                        if (guestStatus.paid) {
                            setGuestEmail(guestStatus.email);
                            setStatus("auth");
                            return;
                        }
                    } catch {
                        // Keep polling while Paystack/webhook work catches up.
                    }
                }
            }

            try {
                const account = await fetchBillingAccount();
                if (account && applyAccount(account)) {
                    return;
                }
            } catch {
                // Keep polling.
            }

            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        setStatus("pending");
    }, [applyAccount]);

    React.useEffect(() => {
        const queryReference = searchParams.get("reference")?.trim() || "";
        const storedReference = readPendingReference();
        const nextReference = queryReference || storedReference;

        if (queryReference) {
            writePendingReference(queryReference);
        }

        void confirmPayment(nextReference);
    }, [confirmPayment, searchParams]);

    const handleRetry = React.useCallback(async () => {
        if (isRetrying) return;
        setIsRetrying(true);
        try {
            await confirmPayment(resolvedReference || readPendingReference(), 6);
        } finally {
            setIsRetrying(false);
        }
    }, [confirmPayment, isRetrying, resolvedReference]);

    const trialEnds = billingAccount?.account.trialEndsAt
        ? new Date(billingAccount.account.trialEndsAt).toLocaleDateString("en-ZA")
        : null;
    const nextCharge = billingAccount?.account.nextChargeAt
        ? new Date(billingAccount.account.nextChargeAt).toLocaleDateString("en-ZA")
        : null;

    const title = status === "trial"
        ? "Your paid trial is ready"
        : status === "active"
            ? "Payment confirmed"
            : status === "error"
                ? "Payment received, but setup needs a final check"
                : status === "auth"
                    ? "Payment confirmed. Finish your account"
                    : status === "pending"
                        ? "Still finishing activation"
                        : "Confirming your payment";

    const message = status === "trial"
        ? `Your 14-day trial is active${trialEnds ? ` until ${trialEnds}` : ""}.${nextCharge ? ` Your first renewal is scheduled for ${nextCharge} unless you cancel first.` : ""}`
        : status === "active"
            ? `Your paid access is now active${nextCharge ? ` and the next renewal is scheduled for ${nextCharge}` : ""}. Log in on any device, then unlock sync with your recovery key.`
            : status === "error"
                ? billingAccount?.account.lastError || "Your card setup completed, but LekkerLedger still needs one final billing check."
                : status === "auth"
                    ? `We have matched this payment to ${guestEmail || "your billing email"}. Create your LekkerLedger account now to finish activation and unlock encrypted sync.`
                    : status === "pending"
                        ? "Paystack has replied, but the final billing confirmation is still catching up. Your payment reference has been saved on this device so you can safely retry."
                        : "LekkerLedger is checking Paystack and your billing status. This usually takes a few seconds.";

    const signupUrl = `/signup?email=${encodeURIComponent(guestEmail || "")}&reference=${encodeURIComponent(resolvedReference)}`;
    const loginUrl = resolvedReference
        ? `/login?reference=${encodeURIComponent(resolvedReference)}`
        : "/login";

    return (
        <div className="min-h-[80vh] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,24rem)] lg:items-start">
                <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Secure billing
                    </div>

                    <div className="mt-6 flex items-start gap-4">
                        <div className="relative shrink-0">
                            {status === "checking" ? (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">
                                    <Loader2 className="h-7 w-7 animate-spin" />
                                </div>
                            ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success)] text-white shadow-[var(--shadow-sm)]">
                                    <CheckCircle2 className="h-7 w-7" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-[46ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {status === "auth" ? (
                            <>
                                <Link href={signupUrl} className="w-full sm:w-auto">
                                    <Button className="w-full sm:min-w-[220px]">
                                        Create account
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href={loginUrl} className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:min-w-[220px]">
                                        Already have an account? Log in
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/dashboard" className="w-full sm:w-auto">
                                    <Button className="w-full sm:min-w-[220px]">
                                        Open dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/upgrade" className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:min-w-[220px]">
                                        View plans and billing
                                    </Button>
                                </Link>
                                {status === "pending" || status === "error" ? (
                                    <Button variant="outline" className="w-full sm:min-w-[220px]" onClick={() => void handleRetry()} disabled={isRetrying}>
                                        {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        {isRetrying ? "Checking again..." : "Refresh payment status"}
                                    </Button>
                                ) : null}
                            </>
                        )}
                    </div>
                </section>

                <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        What happens next
                    </p>
                    <ol className="mt-4 space-y-4 text-sm leading-6 text-[var(--text-muted)]">
                        <li>
                            <span className="font-semibold text-[var(--text)]">1. Payment is checked.</span> LekkerLedger confirms your Paystack reference and matches it to your plan.
                        </li>
                        <li>
                            <span className="font-semibold text-[var(--text)]">2. Account access is unlocked.</span> If you paid before creating an account, use the same email on the account step.
                        </li>
                        <li>
                            <span className="font-semibold text-[var(--text)]">3. Sync is protected.</span> On your first device you will create a recovery key. On later devices you will enter that key to restore your records.
                        </li>
                    </ol>

                    {resolvedReference ? (
                        <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Saved payment reference</p>
                            <p className="mt-2 break-all font-mono text-sm text-[var(--text)]">{resolvedReference}</p>
                        </div>
                    ) : null}
                </aside>
            </div>
        </div>
    );
}
