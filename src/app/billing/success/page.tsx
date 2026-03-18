"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { buildPaidActivationHref } from "@/lib/paid-activation";
import { readPendingBillingReference, writePendingBillingReference } from "@/lib/billing-handoff";

function BillingSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const reference = searchParams.get("reference")?.trim() || readPendingBillingReference() || "";
        if (reference) {
            writePendingBillingReference(reference);
        }

        router.replace(buildPaidActivationHref(reference));
    }, [router, searchParams]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-8 text-center shadow-[var(--shadow-lg)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                    <Loader2 className="h-7 w-7 animate-spin" />
                </div>
                <h1 className="mt-5 font-serif text-3xl font-bold text-[var(--text)]">
                    Opening your activation flow
                </h1>
                <p className="mt-3 max-w-[34rem] text-sm leading-7 text-[var(--text-muted)]">
                    This older success link now forwards straight into the verified paid activation flow.
                </p>
            </div>
        </div>
    );
}

export default function BillingSuccessPage() {
    return (
        <React.Suspense fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
        }>
            <BillingSuccessContent />
        </React.Suspense>
    );
}
