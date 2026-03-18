"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";
import { createPaidActivationAccount, resolvePaidActivation } from "@/lib/billing-client";
import { type PaidActivationState } from "@/lib/billing-activation";
import {
    clearPendingBillingHandoff,
    readPendingBillingCheckoutState,
    readPendingBillingReference,
    writePendingBillingCheckoutState,
    writePendingBillingEmail,
    writePendingBillingReference,
} from "@/lib/billing-handoff";
import { storeCredentialHandoff } from "@/lib/credential-handoff";
import { buildPaidDashboardHref } from "@/lib/paid-activation";
import { createClient } from "@/lib/supabase/client";

function buildCheckoutHref(input: {
    planId?: string;
    billingCycle?: string;
    referralCode?: string | null;
}) {
    if (!input.planId || !input.billingCycle) {
        return "/pricing";
    }

    const params = new URLSearchParams({
        plan: input.planId,
        cycle: input.billingCycle,
    });

    if (input.referralCode?.trim()) {
        params.set("ref", input.referralCode.trim().toUpperCase());
    }

    return `/billing/checkout?${params.toString()}`;
}

function validatePassword(password: string): string | null {
    if (password.length < 10) return "Password must be at least 10 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
    if (!/\d/.test(password)) return "Password must include at least one number.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return "Password must include at least one special character.";
    return null;
}

function BillingActivateContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pendingCheckout = readPendingBillingCheckoutState();
    const queryReference = searchParams.get("reference")?.trim() || "";
    const reference = queryReference || readPendingBillingReference() || pendingCheckout?.reference || "";
    const [activation, setActivation] = React.useState<PaidActivationState | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [password, setPassword] = React.useState("");
    const [passwordError, setPasswordError] = React.useState<string | null>(null);
    const [submittingAccount, setSubmittingAccount] = React.useState(false);
    const [matchedSignedInUser, setMatchedSignedInUser] = React.useState(false);

    const refreshActivation = React.useCallback(async () => {
        if (!reference) {
            setActivation(null);
            setLoading(false);
            setError("We could not find your payment reference.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const nextState = await resolvePaidActivation(reference);
            setActivation(nextState);
            writePendingBillingReference(nextState.reference);
            if (nextState.email) {
                writePendingBillingEmail(nextState.email);
            }
            writePendingBillingCheckoutState({
                reference: nextState.reference,
                email: nextState.email,
                planId: nextState.planId ?? pendingCheckout?.planId ?? undefined,
                billingCycle: nextState.billingCycle ?? pendingCheckout?.billingCycle ?? undefined,
                referralCode: pendingCheckout?.referralCode ?? null,
            });
        } catch (activationError) {
            setError(activationError instanceof Error ? activationError.message : "Paid activation could not be resolved.");
            setActivation(null);
        } finally {
            setLoading(false);
        }
    }, [pendingCheckout?.billingCycle, pendingCheckout?.planId, pendingCheckout?.referralCode, reference]);

    React.useEffect(() => {
        refreshActivation().catch(() => undefined);
    }, [refreshActivation]);

    React.useEffect(() => {
        if (!activation?.email) {
            setMatchedSignedInUser(false);
            return;
        }

        let active = true;
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (!active) {
                return;
            }

            setMatchedSignedInUser((data.user?.email || "").trim().toLowerCase() === activation.email.trim().toLowerCase());
        }).catch(() => {
            if (active) {
                setMatchedSignedInUser(false);
            }
        });

        return () => {
            active = false;
        };
    }, [activation?.email]);

    React.useEffect(() => {
        if (!activation) {
            return;
        }

        if (activation.status === "payment_verified_existing_unlock") {
            router.replace(buildPaidDashboardHref({ reference: activation.reference }));
            return;
        }

        if (activation.status === "already_active" && matchedSignedInUser) {
            clearPendingBillingHandoff();
            router.replace("/dashboard");
        }
    }, [activation, matchedSignedInUser, router]);

    React.useEffect(() => {
        if (activation?.status !== "pending_payment") {
            return;
        }

        const handle = window.setTimeout(() => {
            refreshActivation().catch(() => undefined);
        }, 2500);

        return () => {
            window.clearTimeout(handle);
        };
    }, [activation?.status, refreshActivation]);

    const retryHref = React.useMemo(() => buildCheckoutHref({
        planId: activation?.planId ?? pendingCheckout?.planId,
        billingCycle: activation?.billingCycle ?? pendingCheckout?.billingCycle,
        referralCode: pendingCheckout?.referralCode ?? null,
    }), [activation?.billingCycle, activation?.planId, pendingCheckout?.billingCycle, pendingCheckout?.planId, pendingCheckout?.referralCode]);

    const handleCreateAccount = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activation) {
            return;
        }

        const validationError = validatePassword(password);
        if (validationError) {
            setPasswordError(validationError);
            return;
        }

        setPasswordError(null);
        setSubmittingAccount(true);
        setError(null);

        try {
            const result = await createPaidActivationAccount({
                reference: activation.reference,
                password,
            });

            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: activation.email,
                password,
            });

            if (signInError) {
                throw new Error(signInError.message);
            }

            storeCredentialHandoff(activation.email, password);
            writePendingBillingReference(activation.reference);
            setActivation(result);
            router.replace(buildPaidDashboardHref({ reference: activation.reference }));
        } catch (accountError) {
            setError(accountError instanceof Error ? accountError.message : "The paid account could not be created.");
        } finally {
            setSubmittingAccount(false);
        }
    }, [activation, password, router]);

    const status = activation?.status;
    const title = loading
        ? "Verifying your payment"
        : status === "payment_verified_new_user"
            ? "Payment confirmed. Create your password."
            : status === "payment_verified_existing_login"
                ? "Payment confirmed. Log in to continue."
                : status === "payment_verified_existing_continue_setup"
                    ? "Payment confirmed. Continue secure setup."
                    : status === "payment_verified_existing_unlock"
                        ? "Opening your paid workspace"
                        : status === "already_active"
                            ? "This email already has paid access"
                            : status === "payment_cancelled_or_abandoned"
                                ? "Payment was not completed"
                                : status === "payment_failed_or_unpaid"
                                    ? "Payment could not be verified"
                                    : "Payment is still processing";

    const summary = loading
        ? "LekkerLedger is verifying this Paystack reference and preparing the correct activation path."
        : status === "payment_verified_new_user"
            ? "Your payment is verified. Set the password for the paid account attached to this billing email."
            : status === "payment_verified_existing_login"
                ? "This billing email already has an account. Log in with the same email to continue directly into paid access."
                : status === "payment_verified_existing_continue_setup"
                    ? "This account already exists but secure setup still needs to be completed. Log in with the billing email to continue."
                    : status === "payment_verified_existing_unlock"
                        ? "Your payment is verified and this account is ready. LekkerLedger is opening the dashboard unlock flow."
                        : status === "already_active"
                            ? "This account already has paid access. Open the dashboard or log in with the same email to continue."
                            : status === "payment_cancelled_or_abandoned"
                                ? "The Paystack checkout was cancelled or abandoned before payment completed."
                                : status === "payment_failed_or_unpaid"
                                    ? "LekkerLedger could not confirm a successful payment for this reference."
                                    : "Paystack has not confirmed the transaction yet. This can take a few seconds if the callback arrived before verification settled.";

    return (
        <div className="min-h-[80vh] px-4 py-8 sm:px-6 lg:px-8">
            <div className="content-container-wide mx-auto grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(21rem,0.9fr)] xl:items-start">
                <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Paid activation
                    </div>

                    <div className="mt-6 flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">
                            {loading || status === "pending_payment" || status === "payment_verified_existing_unlock"
                                ? <Loader2 className="h-7 w-7 animate-spin" />
                                : status === "payment_verified_new_user" || status === "payment_verified_existing_login" || status === "payment_verified_existing_continue_setup" || status === "already_active"
                                    ? <CheckCircle2 className="h-7 w-7" />
                                    : <AlertCircle className="h-7 w-7" />}
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-[54ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                                {summary}
                            </p>
                        </div>
                    </div>

                    {activation?.email ? (
                        <div className="mt-6 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-muted)]">
                            Billing email: <span className="font-semibold text-[var(--text)]">{activation.email}</span>
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mt-6 rounded-[1.25rem] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                            {error}
                        </div>
                    ) : null}

                    {status === "payment_verified_new_user" ? (
                        <form className="mt-8 space-y-5" onSubmit={handleCreateAccount}>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[var(--text)]" htmlFor="activation-password">
                                    Create a password
                                </label>
                                <input
                                    id="activation-password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        if (passwordError) {
                                            setPasswordError(null);
                                        }
                                    }}
                                    placeholder="Min. 10 chars (A-z, 0-9, !@#$)"
                                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[var(--focus)]"
                                    disabled={submittingAccount}
                                    required
                                />
                                {passwordError ? (
                                    <p className="text-xs font-medium text-[var(--danger)]">{passwordError}</p>
                                ) : (
                                    <p className="text-xs leading-5 text-[var(--text-muted)]">
                                        Must be 10+ characters with uppercase, lowercase, numbers, and a symbol.
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full sm:w-auto" disabled={submittingAccount}>
                                {submittingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                {submittingAccount ? "Creating account..." : "Create paid account"}
                            </Button>
                        </form>
                    ) : null}

                    {status === "payment_verified_existing_login" || status === "payment_verified_existing_continue_setup" || (status === "already_active" && !matchedSignedInUser) ? (
                        <div className="mt-8 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5">
                            <LoginForm
                                embedded
                                title="Log in"
                                description=""
                                initialEmail={activation?.email || ""}
                                lockEmail
                                showSignupFooter={false}
                            />
                        </div>
                    ) : null}

                    {status === "pending_payment" || status === "payment_failed_or_unpaid" || status === "payment_cancelled_or_abandoned" ? (
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button type="button" onClick={() => refreshActivation().catch(() => undefined)}>
                                <RefreshCw className="h-4 w-4" />
                                Retry verification
                            </Button>
                            <Link href={retryHref}>
                                <Button type="button" variant="outline">
                                    <ArrowRight className="h-4 w-4" />
                                    Retry checkout
                                </Button>
                            </Link>
                        </div>
                    ) : null}

                    {status === "already_active" && matchedSignedInUser ? (
                        <div className="mt-8">
                            <Button type="button" onClick={() => router.replace("/dashboard")}>
                                Open dashboard
                            </Button>
                        </div>
                    ) : null}
                </section>

                <aside className="space-y-5 xl:sticky xl:top-6">
                    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            Flow
                        </p>
                        <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                            <p>1. Verify the Paystack reference server-side.</p>
                            <p>2. Match the payment to the billing email and plan.</p>
                            <p>3. Continue into account creation, setup, login, or unlock without restarting the purchase.</p>
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
                        <p className="text-sm font-bold text-[var(--text)]">Reference</p>
                        <p className="mt-3 break-all text-sm leading-7 text-[var(--text-muted)]">
                            {reference || "No reference found yet."}
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default function BillingActivatePage() {
    return (
        <React.Suspense fallback={
            <div className="flex min-h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
        }>
            <BillingActivateContent />
        </React.Suspense>
    );
}
