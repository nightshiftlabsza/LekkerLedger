"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { readPendingBillingReference } from "@/lib/billing-handoff";
import { buildPaidActivationHref } from "@/lib/paid-activation";

type SignUpFormProps = {
    initialEmail?: string;
    reference?: string;
    title?: string;
    description?: string;
    showLoginFooter?: boolean;
};

export function SignUpForm({
    reference: referenceProp,
    // Legacy callers may still pass the other props; paid setup is now handled
    // by /billing/activate so this component only performs the safe handoff.
}: SignUpFormProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const reference = referenceProp || searchParams.get("reference")?.trim() || readPendingBillingReference() || "";

    React.useEffect(() => {
        router.replace(reference ? buildPaidActivationHref(reference) : "/pricing");
    }, [reference, router]);

    return (
        <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-8 text-center shadow-[var(--shadow-lg)]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--primary)]" />
            <p className="mt-4 text-sm font-semibold text-[var(--text)]">Opening secure account setup…</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Your payment and account state will be checked before anything is changed.</p>
        </div>
    );
}
