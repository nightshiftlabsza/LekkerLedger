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

function BillingSuccessPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = React.useState<string | null>(null);

    const hasPaidAccess = React.useCallback((billingAccount: Awaited<ReturnType<typeof fetchBillingAccount>>) => {
        return Boolean(
            billingAccount
            && billingAccount.entitlements.isActive
            && billingAccount.entitlements.planId !== "free",
        );
    }, []);

    const routeToCurrentFlow = React.useCallback(async () => {
        setError(null);

        const queryReference = searchParams.get("reference")?.trim() || "";
        const reference = queryReference || readPendingBillingReference() || "";
        if (reference) {
            writePendingBillingReference(reference);
        }

        try {
            if (reference) {
                const confirmedAccount = await confirmBillingTransaction(reference).catch(() => null);
                if (hasPaidAccess(confirmedAccount)) {
                    router.replace(buildPaidDashboardHref({ reference }));
                    return;
                }
            }

            const billingAccount = await fetchBillingAccount();
            if (hasPaidAccess(billingAccount)) {
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

        if (reference) {
            try {
                const guestStatus = await confirmGuestBillingTransaction(reference);
                if (guestStatus.email) {
                    writePendingBillingEmail(guestStatus.email);
                }
            } catch {
                // Keep the reference and continue to paid login even if guest verification lags.
            }
            router.replace(buildPaidLoginHref(reference));
            return;
        }

        router.replace("/pricing");
    }, [hasPaidAccess, router, searchParams]);

    React.useEffect(() => {
        void routeToCurrentFlow();
    }, [routeToCurrentFlow]);

    return (
        <div className="min-h-[80vh] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
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
                        <p className="mt-3 max-w-[46ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                            LekkerLedger is moving this older payment link into the current paid login and activation flow.
                        </p>
                    </div>
                </div>

                {error ? (
                    <div className="mt-8 rounded-[1.5rem] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4">
                        <p className="text-sm leading-6 text-[var(--text-muted)]">{error}</p>
                        <Button variant="outline" className="mt-4" onClick={() => void routeToCurrentFlow()}>
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
