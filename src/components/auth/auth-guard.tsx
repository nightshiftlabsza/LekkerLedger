"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { confirmGuestBillingTransaction, fetchBillingAccount } from "@/lib/billing-client";
import { readPendingBillingReference } from "@/lib/billing-handoff";

export function AuthGuard({ children, type }: { children: React.ReactNode; type: "login" | "signup" }) {
    const [isChecking, setIsChecking] = React.useState(type === "signup");
    const [hasAccess, setHasAccess] = React.useState(type === "login");
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference")?.trim() || readPendingBillingReference() || "";

    React.useEffect(() => {
        if (type === "login") {
            setHasAccess(true);
            setIsChecking(false);
            return;
        }

        let mounted = true;

        async function checkSignupAccess() {
            try {
                if (reference) {
                    const guestStatus = await confirmGuestBillingTransaction(reference);
                    if (mounted && guestStatus.paid) {
                        setHasAccess(true);
                        setIsChecking(false);
                        return;
                    }
                }

                const billingAccount = await fetchBillingAccount();
                if (mounted) {
                    setHasAccess(Boolean(billingAccount?.entitlements.isActive || billingAccount?.entitlements.status === "trialing"));
                }
            } catch (error) {
                console.error("Failed to verify account access.", error);
                if (mounted) {
                    setHasAccess(false);
                }
            } finally {
                if (mounted) {
                    setIsChecking(false);
                }
            }
        }

        void checkSignupAccess();
        return () => {
            mounted = false;
        };
    }, [reference, type]);

    if (isChecking) {
        return (
            <div className="flex min-h-[320px] flex-col items-center justify-center space-y-4 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                <p className="text-sm font-semibold text-[var(--text-muted)]">Checking your payment access...</p>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Paid activation
                    </div>

                    <div className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--surface-2)] text-[var(--primary)] shadow-[var(--shadow-sm)]">
                        <Lock className="h-7 w-7" />
                    </div>

                    <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-[var(--text)]">
                        Accounts are for paid plans
                    </h1>
                    <p className="mt-4 max-w-[42ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                        Free access stays on the public payslip tool with no sign-up. Pay first, then create the account that holds your encrypted sync access and paid dashboard.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <button className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 font-bold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--primary-hover)]">
                                View plans
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto">
                            <button className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-transparent px-6 py-3 font-bold text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]">
                                Log in to restore access
                            </button>
                        </Link>
                    </div>
                </div>

                <aside className="mt-8 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 lg:mt-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Best path</p>
                    <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                        <li><span className="font-semibold text-[var(--text)]">1.</span> Use the free tool without an account, or choose a paid plan on pricing.</li>
                        <li><span className="font-semibold text-[var(--text)]">2.</span> After paying, create your paid account or log in with the same billing email.</li>
                        <li><span className="font-semibold text-[var(--text)]">3.</span> On later devices, just log in and enter your recovery key.</li>
                    </ol>
                </aside>
            </div>
        );
    }

    return <div className="w-full animate-fade-in">{children}</div>;
}
