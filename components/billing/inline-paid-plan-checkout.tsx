"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInlinePurchaseIntent } from "@/lib/billing-client";
import { writePendingBillingEmail, writePendingBillingReference } from "@/lib/billing-handoff";
import { buildPaidDashboardHref, buildPaidLoginHref } from "@/lib/paid-activation";
import { getSettings } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { endAppMetric, startAppMetric } from "@/lib/app-performance";
async function getAuthEmail() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || "";
}
import { type BillingCycle, type PlanId } from "@/src/config/plans";

const CHECKOUT_EMAIL_STORAGE_KEY = "lekkerledger:checkout-email";
const PAYSTACK_PRECONNECT_URLS = [
    "https://checkout.paystack.com",
    "https://api.paystack.co",
] as const;
const PREPARED_INTENT_TTL_MS = 90_000;

type PaystackPopup = {
    resumeTransaction: (
        accessCode: string,
        handlers: {
            onLoad: () => void;
            onSuccess: (response: unknown) => void;
            onCancel: () => void;
            onError: (error: { message?: string } | undefined) => void;
        },
    ) => void;
};

type InlinePurchaseIntent = {
    reference: string;
    accessCode: string;
    amountCents: number;
};

type PreparedIntent = {
    cacheKey: string;
    preparedAt: number;
    intent: InlinePurchaseIntent;
};

let paystackConstructorPromise: Promise<new () => PaystackPopup> | null = null;

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function extractReference(value: unknown): string | null {
    if (!value || typeof value !== "object") return null;
    const data = value as { reference?: unknown; ref?: unknown };
    if (typeof data.reference === "string" && data.reference.trim()) {
        return data.reference.trim();
    }
    if (typeof data.ref === "string" && data.ref.trim()) {
        return data.ref.trim();
    }
    return null;
}

function getPlanChargeLabel(planId: Exclude<PlanId, "free">, billingCycle: BillingCycle): string {
    if (planId === "standard") {
        return billingCycle === "monthly" ? "R29 today, then monthly" : "R249 today, then yearly";
    }
    return billingCycle === "monthly" ? "R49 today, then monthly" : "R399 today, then yearly";
}

function getIntentCacheKey(input: {
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    email: string;
    referralCode?: string | null;
}) {
    return JSON.stringify({
        planId: input.planId,
        billingCycle: input.billingCycle,
        email: normalizeEmail(input.email),
        referralCode: input.referralCode?.trim()?.toUpperCase() || "",
    });
}

function readStoredCheckoutEmail(): string {
    if (typeof globalThis.window === "undefined") return "";
    const stored = globalThis.window.localStorage.getItem(CHECKOUT_EMAIL_STORAGE_KEY);
    return stored ? normalizeEmail(stored) : "";
}

function writeStoredCheckoutEmail(email: string) {
    if (typeof globalThis.window === "undefined") return;
    globalThis.window.localStorage.setItem(CHECKOUT_EMAIL_STORAGE_KEY, normalizeEmail(email));
}

function loadPaystackConstructor(): Promise<new () => PaystackPopup> {
    paystackConstructorPromise ??= import("@paystack/inline-js").then((paystackModule) => paystackModule.default as new () => PaystackPopup);

    return paystackConstructorPromise;
}

async function openInlinePaystackPayment(input: {
    accessCode: string;
    onLoad: () => void;
    onSuccess: (response: unknown) => void;
    onCancel: () => void;
    onError: (message: string) => void;
}) {
    const PaystackPop = await loadPaystackConstructor();
    const popup = new PaystackPop();

    popup.resumeTransaction(input.accessCode, {
        onLoad: () => {
            input.onLoad();
        },
        onSuccess: input.onSuccess,
        onCancel: input.onCancel,
        onError: (error: { message?: string } | undefined) => {
            input.onError(error?.message?.trim() || "The payment popup could not be opened.");
        },
    });
}

export function useInlinePaidPlanCheckout({
    billingCycle,
    referralCode,
}: {
    billingCycle: BillingCycle;
    referralCode?: string | null;
}) {
    const router = useRouter();
    const [checkoutEmail, setCheckoutEmail] = React.useState("");
    const [emailError, setEmailError] = React.useState("");
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [requestedPlanId, setRequestedPlanId] = React.useState<Exclude<PlanId, "free"> | null>(null);
    const [loadingPlanId, setLoadingPlanId] = React.useState<Exclude<PlanId, "free"> | null>(null);
    const preparedIntentRef = React.useRef<PreparedIntent | null>(null);
    const prepareRequestIdRef = React.useRef(0);

    React.useEffect(() => {
        let cancelled = false;

        async function prefillEmail() {
            const authEmail = await getAuthEmail();
            if (authEmail) {
                if (!cancelled) {
                    setCheckoutEmail(normalizeEmail(authEmail));
                }
                return;
            }

            const storedCheckoutEmail = readStoredCheckoutEmail();
            if (storedCheckoutEmail) {
                if (!cancelled) {
                    setCheckoutEmail(storedCheckoutEmail);
                }
                return;
            }

            try {
                const settings = await getSettings();
                const employerEmail = settings.employerEmail ? normalizeEmail(settings.employerEmail) : "";
                if (!cancelled && employerEmail) {
                    setCheckoutEmail(employerEmail);
                }
            } catch {
                // Local settings are optional on the marketing pages.
            }
        }

        prefillEmail();
        return () => {
            cancelled = true;
        };
    }, []);

    React.useEffect(() => {
        if (typeof globalThis.window === "undefined") return;

        const cleanup: Array<() => void> = [];
        for (const href of PAYSTACK_PRECONNECT_URLS) {
            const existing = document.head.querySelector(`link[rel="preconnect"][href="${href}"]`);
            if (existing) continue;

            const link = document.createElement("link");
            link.rel = "preconnect";
            link.href = href;
            link.crossOrigin = "anonymous";
            document.head.appendChild(link);
            cleanup.push(() => {
                link.remove();
            });
        }

        const warmPaystack = () => {
            void loadPaystackConstructor();
        };

        if (typeof globalThis.window.requestIdleCallback === "function") {
            const idleHandle = globalThis.window.requestIdleCallback(() => {
                warmPaystack();
            });
            cleanup.push(() => {
                globalThis.window.cancelIdleCallback?.(idleHandle);
            });
        } else {
            const timeoutHandle = globalThis.window.setTimeout(() => {
                warmPaystack();
            }, 250);
            cleanup.push(() => {
                globalThis.window.clearTimeout(timeoutHandle);
            });
        }

        return () => {
            cleanup.forEach((dispose) => dispose());
        };
    }, []);

    const prepareCheckout = React.useCallback(async (
        planId: Exclude<PlanId, "free">,
        emailOverride?: string,
    ) => {
        const normalizedEmail = normalizeEmail(emailOverride ?? checkoutEmail);
        if (!isValidEmail(normalizedEmail)) {
            return;
        }

        const cacheKey = getIntentCacheKey({
            planId,
            billingCycle,
            email: normalizedEmail,
            referralCode,
        });
        const cached = preparedIntentRef.current;
        if (cached && cached.cacheKey === cacheKey && (Date.now() - cached.preparedAt) < PREPARED_INTENT_TTL_MS) {
            return;
        }

        const requestId = prepareRequestIdRef.current + 1;
        prepareRequestIdRef.current = requestId;

        try {
            const intent = await createInlinePurchaseIntent({
                planId,
                billingCycle,
                email: normalizedEmail,
                referralCode: referralCode?.trim() || null,
            });

            if (prepareRequestIdRef.current !== requestId) {
                return;
            }

            preparedIntentRef.current = {
                cacheKey,
                preparedAt: Date.now(),
                intent,
            };
        } catch {
            if (prepareRequestIdRef.current === requestId) {
                preparedIntentRef.current = null;
            }
        }
    }, [billingCycle, checkoutEmail, referralCode]);

    const warmCheckout = React.useCallback((planId?: Exclude<PlanId, "free">) => {
        void loadPaystackConstructor();
        if (planId) {
            void prepareCheckout(planId);
        }
    }, [prepareCheckout]);

    React.useEffect(() => {
        if (!isValidEmail(checkoutEmail)) {
            preparedIntentRef.current = null;
            return;
        }

        if (typeof globalThis.window === "undefined") {
            return;
        }

        const defaultPlanId: Exclude<PlanId, "free"> = requestedPlanId ?? "standard";
        if (typeof globalThis.window.requestIdleCallback === "function") {
            const idleHandle = globalThis.window.requestIdleCallback(() => {
                void prepareCheckout(defaultPlanId);
            });

            return () => {
                globalThis.window.cancelIdleCallback?.(idleHandle);
            };
        }

        const timeoutHandle = globalThis.window.setTimeout(() => {
            void prepareCheckout(defaultPlanId);
        }, 200);

        return () => {
            globalThis.window.clearTimeout(timeoutHandle);
        };
    }, [checkoutEmail, prepareCheckout, requestedPlanId]);

    const openPaystackCheckout = React.useCallback(async (planId: Exclude<PlanId, "free">, email: string) => {
        setLoadingPlanId(planId);
        setEmailError("");
        startAppMetric("paystack_open_latency");

        const normalizedEmail = normalizeEmail(email);
        const isAuthenticated = Boolean(await getAuthEmail());
        writeStoredCheckoutEmail(normalizedEmail);

        try {
            const cacheKey = getIntentCacheKey({
                planId,
                billingCycle,
                email: normalizedEmail,
                referralCode,
            });
            const cached = preparedIntentRef.current;
            const intent = cached && cached.cacheKey === cacheKey && (Date.now() - cached.preparedAt) < PREPARED_INTENT_TTL_MS
                ? cached.intent
                : await createInlinePurchaseIntent({
                    planId,
                    billingCycle,
                    email: normalizedEmail,
                    referralCode: referralCode?.trim() || null,
                });

            preparedIntentRef.current = {
                cacheKey,
                preparedAt: Date.now(),
                intent,
            };

            await openInlinePaystackPayment({
                accessCode: intent.accessCode,
                onLoad: () => {
                    setLoadingPlanId(null);
                    endAppMetric("paystack_open_latency", {
                        plan_id: planId,
                        billing_cycle: billingCycle,
                    });
                },
                onSuccess: (response) => {
                    const reference = extractReference(response) || intent.reference;
                    writePendingBillingReference(reference);
                    writePendingBillingEmail(normalizedEmail);
                    setDialogOpen(false);
                    setRequestedPlanId(null);
                    setLoadingPlanId(null);
                    router.push(
                        isAuthenticated
                            ? buildPaidDashboardHref({ reference })
                            : buildPaidLoginHref(reference),
                    );
                },
                onCancel: () => {
                    setLoadingPlanId(null);
                    endAppMetric("paystack_open_latency", {
                        plan_id: planId,
                        billing_cycle: billingCycle,
                        status: "cancelled",
                    });
                },
                onError: (message) => {
                    setLoadingPlanId(null);
                    setEmailError(message);
                    endAppMetric("paystack_open_latency", {
                        plan_id: planId,
                        billing_cycle: billingCycle,
                        status: "error",
                    });
                },
            });
        } catch (error) {
            setLoadingPlanId(null);
            const message = error instanceof Error ? error.message : "The payment popup could not be opened.";
            setEmailError(message);
            setDialogOpen(true);
            endAppMetric("paystack_open_latency", {
                plan_id: planId,
                billing_cycle: billingCycle,
                status: "failed_before_open",
            });
        }
    }, [billingCycle, referralCode, router]);

    const startCheckout = React.useCallback((planId: PlanId) => {
        if (planId === "free") {
            router.push("/resources/tools/domestic-worker-payslip");
            return;
        }

        setRequestedPlanId(planId);
        const normalizedEmail = normalizeEmail(checkoutEmail);
        if (!isValidEmail(normalizedEmail)) {
            setDialogOpen(true);
            return;
        }

        openPaystackCheckout(planId, normalizedEmail);
    }, [checkoutEmail, openPaystackCheckout, router]);

    const handleDialogSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!requestedPlanId) {
            setDialogOpen(false);
            return;
        }

        const normalizedEmail = normalizeEmail(checkoutEmail);
        if (!isValidEmail(normalizedEmail)) {
            setEmailError("Enter a valid email address to continue.");
            return;
        }

        openPaystackCheckout(requestedPlanId, normalizedEmail);
    }, [checkoutEmail, openPaystackCheckout, requestedPlanId]);

    const dialog = dialogOpen ? (
        <dialog open className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6" aria-modal="true">
            <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
                <div className="space-y-4 p-6 sm:p-7">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Payment first
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text)]">
                            Open secure payment
                        </h2>
                        <p className="text-sm leading-6 text-[var(--text-muted)]">
                            Paystack will open here in a secure popup. After payment, LekkerLedger will send you straight into paid login or dashboard activation.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleDialogSubmit}>
                        <div className="space-y-2">
                            <label htmlFor="checkout-email" className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                Billing email
                            </label>
                            <Input
                                id="checkout-email"
                                type="email"
                                autoComplete="email"
                                placeholder="name@example.com"
                                value={checkoutEmail}
                                error={emailError}
                                onChange={(event) => {
                                    const nextEmail = event.target.value;
                                    setCheckoutEmail(nextEmail);
                                    if (emailError) {
                                        setEmailError("");
                                    }
                                    if (requestedPlanId) {
                                        void prepareCheckout(requestedPlanId, nextEmail);
                                    }
                                }}
                            />
                        </div>

                        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--text-muted)]">
                            You&apos;ll pay the full plan price now through Paystack. After payment, existing customers go straight back into paid activation and new customers go to paid sign-up to create their dashboard account.
                        </div>

                        {requestedPlanId ? (
                            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
                                {getPlanChargeLabel(requestedPlanId, billingCycle)}
                            </div>
                        ) : null}

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                disabled={!!loadingPlanId}
                                onClick={() => {
                                    if (loadingPlanId) return;
                                    setDialogOpen(false);
                                    setEmailError("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="w-full sm:w-auto min-w-[180px]" disabled={!!loadingPlanId}>
                                {loadingPlanId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {loadingPlanId ? "Opening Paystack..." : "Continue to payment"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </dialog>
    ) : null;

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
    loadingLabel = "Opening Paystack...",
    disabled,
    ...buttonProps
}: {
    planId: Exclude<PlanId, "free">;
    billingCycle: BillingCycle;
    referralCode?: string | null;
    children: React.ReactNode;
    loadingLabel?: string;
} & React.ComponentProps<typeof Button>) {
    const { startCheckout, loadingPlanId, dialog, warmCheckout } = useInlinePaidPlanCheckout({ billingCycle, referralCode });
    const isLoading = loadingPlanId === planId;

    return (
        <>
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
            {dialog}
        </>
    );
}
