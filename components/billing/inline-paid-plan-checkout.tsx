"use client";

import * as React from "react";
// Dynamically imported at point of use to avoid SSR crash (window is not defined)
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaidPlanCheckoutDialog } from "./paid-plan-checkout-dialog";
import { createCheckoutSession, createInlinePurchaseIntent, type BillingAccountPayload } from "@/lib/billing-client";
import {
    writePendingBillingCheckoutState,
    writePendingBillingEmail,
    writePendingBillingReference,
} from "@/lib/billing-handoff";
import { createClient } from "@/lib/supabase/client";
import { getRequiredEnvValue } from "@/lib/env";
import { type BillingCycle, type PlanId } from "@/src/config/plans";
import { getMarketingPlanDisplay, getMarketingPriceDisplay } from "@/src/config/pricing-display";

type PreparedCheckout =
    | {
        mode: "signed_in";
        authorizationUrl: string;
        accessCode: string;
        reference: string;
        checkoutMode: "inline" | "redirect" | "no_charge";
        proration?: BillingAccountPayload["account"]["prorationPreview"];
        billingAccount?: BillingAccountPayload;
    }
    | {
        mode: "guest";
        authorizationUrl: string;
        accessCode: string;
        reference: string;
        amountCents: number;
        checkoutMode?: "inline" | "redirect";
    };

function formatCurrency(amountCents: number) {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
    }).format(amountCents / 100);
}

function buildActivationHref(reference: string) {
    return `/billing/activate?reference=${encodeURIComponent(reference)}`;
}

function buildReturnHref() {
    if (typeof window === "undefined") {
        return "/upgrade";
    }

    const params = new URLSearchParams(window.location.search);
    params.set("billingUpdated", String(Date.now()));
    return `${window.location.pathname}?${params.toString()}`;
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
}

export function useInlinePaidPlanCheckout({
    billingCycle,
    referralCode,
}: {
    billingCycle: BillingCycle;
    referralCode?: string | null;
}) {
    const router = useRouter();
    const [loadingPlanId, setLoadingPlanId] = React.useState<Exclude<PlanId, "free"> | null>(null);
    const [open, setOpen] = React.useState(false);
    const [selectedPlanId, setSelectedPlanId] = React.useState<Exclude<PlanId, "free"> | null>(null);
    const [email, setEmail] = React.useState("");
    const [preparedCheckout, setPreparedCheckout] = React.useState<PreparedCheckout | null>(null);
    const [preparing, setPreparing] = React.useState(false);
    const [launching, setLaunching] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isSignedIn, setIsSignedIn] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        let active = true;
        const supabase = createClient();

        supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            const sessionEmail = data.session?.user?.email?.trim().toLowerCase() || "";
            setIsSignedIn(Boolean(data.session?.user));
            if (sessionEmail) {
                setEmail(sessionEmail);
            }
        }).catch(() => {
            if (active) {
                setIsSignedIn(false);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    const warmCheckout = React.useCallback((_planId?: Exclude<PlanId, "free">) => undefined, []);

    const closeDialog = React.useCallback(() => {
        setOpen(false);
        setSelectedPlanId(null);
        setPreparedCheckout(null);
        setPreparing(false);
        setLaunching(false);
        setError(null);
        setLoadingPlanId(null);
    }, []);

    const startCheckout = React.useCallback((planId: PlanId) => {
        if (planId === "free") {
            router.push("/resources/tools/domestic-worker-payslip");
            return;
        }

        setSelectedPlanId(planId);
        setLoadingPlanId(planId);
        setPreparedCheckout(null);
        setError(null);
        setOpen(true);
    }, [router]);

    const prepareCheckout = React.useCallback(async () => {
        if (!selectedPlanId) {
            return undefined;
        }

        setPreparing(true);
        setError(null);

        try {
            if (isSignedIn) {
                const checkout = await createCheckoutSession({
                    planId: selectedPlanId,
                    billingCycle,
                });
                setPreparedCheckout({
                    mode: "signed_in",
                    ...checkout,
                });
                return checkout;
            }

            const normalizedEmail = normalizeEmail(email);
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                throw new Error("Enter a valid billing email to continue.");
            }

            const checkout = await createInlinePurchaseIntent({
                planId: selectedPlanId,
                billingCycle,
                email: normalizedEmail,
                referralCode,
            });
            setPreparedCheckout({
                mode: "guest",
                ...checkout,
            });
            return checkout;
        } catch (checkoutError) {
            setError(checkoutError instanceof Error ? checkoutError.message : "Paystack checkout could not be started.");
            return undefined;
        } finally {
            setPreparing(false);
        }
    }, [billingCycle, email, isSignedIn, referralCode, selectedPlanId]);

    const openInlineCheckout = React.useCallback(async () => {
        if (!selectedPlanId || !preparedCheckout) {
            return;
        }

        if (preparedCheckout.mode === "signed_in" && preparedCheckout.checkoutMode === "no_charge") {
            closeDialog();
            window.location.assign(buildReturnHref());
            return;
        }

        const requiresRedirect = preparedCheckout.mode === "signed_in"
            ? preparedCheckout.checkoutMode === "redirect" || !preparedCheckout.accessCode
            : preparedCheckout.checkoutMode === "redirect" || !preparedCheckout.accessCode;

        const reference = preparedCheckout.reference;
        const preparedEmail = preparedCheckout.mode === "guest" ? normalizeEmail(email) : email;
        if (preparedEmail) {
            writePendingBillingEmail(preparedEmail);
        }
        writePendingBillingReference(reference);
        writePendingBillingCheckoutState({
            reference,
            email: preparedEmail,
            planId: selectedPlanId,
            billingCycle,
            referralCode,
        });

        setLaunching(true);
        setError(null);

        try {
            if (requiresRedirect) {
                closeDialog();
                window.location.assign(preparedCheckout.authorizationUrl);
                return;
            }

            const publicKey = getRequiredEnvValue("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY");
            const { default: PaystackPop } = await import("@paystack/inline-js");
            const popup = new PaystackPop();

            let callbackFired = false;
            const redirectUrl = preparedCheckout.authorizationUrl;

            // Fallback: if Paystack inline doesn't respond within 8 seconds
            // (popup blocked, iframe fails to load, mobile issues), redirect instead.
            const fallbackTimer = window.setTimeout(() => {
                if (!callbackFired && redirectUrl) {
                    callbackFired = true;
                    closeDialog();
                    window.location.assign(redirectUrl);
                }
            }, 8_000);

            popup.resumeTransaction(preparedCheckout.accessCode, {
                key: publicKey,
                onSuccess: (transaction: { reference?: string }) => {
                    callbackFired = true;
                    clearTimeout(fallbackTimer);
                    const successfulReference = transaction.reference || reference;
                    closeDialog();
                    router.push(buildActivationHref(successfulReference));
                },
                onCancel: () => {
                    callbackFired = true;
                    clearTimeout(fallbackTimer);
                    setLaunching(false);
                },
                onError: (checkoutError: { message?: string }) => {
                    callbackFired = true;
                    clearTimeout(fallbackTimer);
                    setLaunching(false);
                    setError(checkoutError.message || "Paystack checkout could not be opened inline.");
                },
            });
        } catch (checkoutError) {
            setLaunching(false);
            setError(checkoutError instanceof Error ? checkoutError.message : "Paystack checkout could not be opened inline.");
        }
    }, [billingCycle, closeDialog, email, preparedCheckout, referralCode, router, selectedPlanId]);

    const selectedPlanDisplay = selectedPlanId ? getMarketingPlanDisplay(selectedPlanId) : null;
    const selectedPriceDisplay = selectedPlanId ? getMarketingPriceDisplay(selectedPlanId, billingCycle) : null;
    const proration = preparedCheckout?.mode === "signed_in" ? preparedCheckout.proration : undefined;

    const dialog = (
        <PaidPlanCheckoutDialog
            open={open}
            title="Open secure payment"
            description="Pay inside LekkerLedger first. Redirect is only used if the payment flow itself requires it."
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    closeDialog();
                    return;
                }

                setOpen(nextOpen);
            }}
        >
            <div className="space-y-6">
                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        Selected plan
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[var(--text)]">{selectedPlanDisplay?.headline || "Paid plan"}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{selectedPlanDisplay?.subtitle}</p>
                    <p className="mt-4 text-lg font-black text-[var(--text)]">
                        {selectedPriceDisplay?.primary}
                        {selectedPriceDisplay?.periodLabel ? <span className="ml-1 text-sm text-[var(--text-muted)]">{selectedPriceDisplay.periodLabel}</span> : null}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedPriceDisplay?.helperText}</p>
                </div>

                {!isSignedIn && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--text)]" htmlFor="billing-email-inline">
                            Billing email
                        </label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                            <Input
                                id="billing-email-inline"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="pl-10"
                                placeholder="name@example.com"
                                disabled={preparing || launching}
                            />
                        </div>
                    </div>
                )}

                {proration ? (
                    <div className="rounded-[1.25rem] border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4 text-sm text-[var(--text-muted)]">
                        <p><strong className="text-[var(--text)]">Amount due now:</strong> {formatCurrency(proration.amountDueNowCents)}</p>
                        <p><strong className="text-[var(--text)]">Prorated credit applied:</strong> {formatCurrency(proration.creditAppliedCents)}</p>
                        <p><strong className="text-[var(--text)]">Next renewal:</strong> {new Date(proration.nextRenewalDate).toLocaleDateString("en-ZA")}</p>
                        <p><strong className="text-[var(--text)]">Next recurring amount:</strong> {formatCurrency(proration.nextRecurringAmountCents)}</p>
                    </div>
                ) : null}

                {preparedCheckout?.mode === "signed_in" && preparedCheckout.billingAccount?.account.issue ? (
                    <div className="rounded-[1.25rem] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning)]">
                        {preparedCheckout.billingAccount.account.issue.customerMessage}
                    </div>
                ) : null}

                {error ? (
                    <div className="rounded-[1.25rem] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                        {error}
                    </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {!preparedCheckout ? (
                        <Button
                            type="button"
                            className="w-full sm:w-auto"
                            disabled={preparing || launching || !selectedPlanId}
                            onClick={() => { void prepareCheckout(); }}
                        >
                            {preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            {preparing ? "Preparing..." : "Review payment"}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            className="w-full sm:w-auto"
                            disabled={launching}
                            onClick={() => { void openInlineCheckout(); }}
                        >
                            {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            {preparedCheckout.mode === "signed_in" && preparedCheckout.checkoutMode === "no_charge"
                                ? "Apply plan change"
                                : proration
                                    ? `Pay ${formatCurrency(proration.amountDueNowCents)} now`
                                    : "Continue to secure payment"}
                        </Button>
                    )}
                </div>
            </div>
        </PaidPlanCheckoutDialog>
    );

    return {
        startCheckout,
        loadingPlanId,
        dialog,
        warmCheckout,
        prepareCheckout,
    };
}

export function InlinePlanCheckoutButton({
    planId,
    billingCycle,
    referralCode,
    children,
    loadingLabel = "Continuing...",
    disabled,
    ...buttonProps
}: {
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    referralCode?: string | null;
    children: React.ReactNode;
    loadingLabel?: string;
} & React.ComponentProps<typeof Button>) {
    const { startCheckout, loadingPlanId, warmCheckout } = useInlinePaidPlanCheckout({ billingCycle, referralCode });
    const isLoading = loadingPlanId === planId;

    return (
        <Button
            type="button"
            {...buttonProps}
            disabled={disabled || isLoading}
            onClick={(event) => {
                buttonProps.onClick?.(event);
                if (event.defaultPrevented) return;
                startCheckout(planId);
            }}
            onPointerEnter={(event) => {
                buttonProps.onPointerEnter?.(event);
                warmCheckout(planId);
            }}
            onFocus={(event) => {
                buttonProps.onFocus?.(event);
                warmCheckout(planId);
            }}
            onTouchStart={(event) => {
                buttonProps.onTouchStart?.(event);
                warmCheckout(planId);
            }}
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? loadingLabel : children}
        </Button>
    );
}
