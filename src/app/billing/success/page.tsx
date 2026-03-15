"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmBillingTransaction, confirmGuestBillingTransaction, fetchBillingAccount } from "@/lib/billing-client";
import {
    readPendingBillingReference,
    writePendingBillingEmail,
    writePendingBillingReference,
} from "@/lib/billing-handoff";
import { buildPaidDashboardHref, buildPaidLoginHref } from "@/lib/paid-activation";

export default function BillingSuccessPage() {
    return (
        <Suspense fallback={null}>
            <BillingSuccessPageContent />
        </Suspense>
    );
}

function billingAccountHasPaidAccess(billingAccount: Awaited<ReturnType<typeof fetchBillingAccount>>) {
    return Boolean(
        billingAccount
        && billingAccount.entitlements.isActive
        && billingAccount.entitlements.planId !== "free",
    );
}

async function getReferenceDashboardHref(reference: string): Promise<string | null> {
    const confirmedAccount = await confirmBillingTransaction(reference).catch(() => null);
    return billingAccountHasPaidAccess(confirmedAccount) ? buildPaidDashboardHref({ reference }) : null;
}

async function storeGuestBillingEmail(reference: string): Promise<void> {
    try {
        const guestStatus = await confirmGuestBillingTransaction(reference);
        if (guestStatus.email) {
            writePendingBillingEmail(guestStatus.email);
        }
    } catch {
        // Keep the reference and continue to paid login even if guest verification lags.
    }
}

function BillingSuccessPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = React.useState<string | null>(null);

    const routeToCurrentFlow = React.useCallback(async () => {
        setError(null);

        const queryReference = searchParams.get("reference")?.trim() || "";
        const reference = queryReference || readPendingBillingReference() || "";
        if (reference) {
            writePendingBillingReference(reference);
        }

        try {
            if (reference) {
                const referenceDashboardHref = await getReferenceDashboardHref(reference);
                if (referenceDashboardHref) {
                    router.replace(referenceDashboardHref);
                    return;
                }
            }

            const billingAccount = await fetchBillingAccount();
            if (billingAccountHasPaidAccess(billingAccount)) {
                router.replace(reference ? buildPaidDashboardHref({ reference }) : "/dashboard");
                return;
            }

            if (billingAccount && !reference) {
                router.replace("/pricing");
                return;
            }
        } catch (routeError) {
            setError(routeError instanceof Error ? routeError.message : "We could not continue your billing handoff.");
            return;
        }

        if (!reference) {
            router.replace("/pricing");
            return;
        }

        await storeGuestBillingEmail(reference);
        router.replace(buildPaidLoginHref(reference));
    }, [router, searchParams]);

    const handleRetry = React.useCallback(() => {
        routeToCurrentFlow().catch(() => undefined);
    }, [routeToCurrentFlow]);

    React.useEffect(() => {
        routeToCurrentFlow().catch(() => undefined);
    }, [routeToCurrentFlow]);

    return (
        <div className="min-h-[80vh] px-4 py-8 sm:px-6 lg:px-8">
            <div className="content-container-wide mx-auto grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-start">
                <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Secure billing
                    </div>

                    <div className="mt-6 flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">
                            <Loader2 className="h-7 w-7 animate-spin" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
                                Sending you to the right place
                            </h1>
                            <p className="mt-3 max-w-[52ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                                LekkerLedger is moving this older payment link into the current paid login and activation flow.
                            </p>
                        </div>
                    </div>

                    {error ? (
                        <div className="mt-8 rounded-[1.5rem] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4">
                            <p className="text-sm leading-6 text-[var(--text-muted)]">{error}</p>
                            <Button variant="outline" className="mt-4" onClick={handleRetry}>
                                <RefreshCw className="h-4 w-4" />
                                Try again
                            </Button>
                        </div>
                    ) : null}
                </section>

                <aside className="space-y-5 xl:sticky xl:top-6">
                    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            What happens next
                        </p>
                        <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--text-muted)]">
                            <p>We check whether this payment already belongs to a paid account.</p>
                            <p>If it does, you go straight back into the dashboard or login flow.</p>
                            <p>If not, we keep the payment reference and send you into the correct paid signup path.</p>
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)]">
                        <p className="text-sm font-bold text-[var(--text)]">Need help with a payment handoff?</p>
                        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                            Keep the payment reference handy. If the screen does not move after a retry, contact support with the reference and the email used at checkout.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
