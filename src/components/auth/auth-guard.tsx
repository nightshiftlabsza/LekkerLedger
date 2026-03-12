"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { getSettings } from "@/lib/storage";
import { hasPaidAccess } from "@/lib/entitlements";
import { useSearchParams } from "next/navigation";

export function AuthGuard({ children, type }: { children: React.ReactNode, type: "login" | "signup" }) {
    const [isChecking, setIsChecking] = React.useState(true);
    const [hasAccess, setHasAccess] = React.useState(false);
    const [bypass, setBypass] = React.useState(false);
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference");

    React.useEffect(() => {
        let mounted = true;
        async function checkEntitlement() {
            if (reference) {
                try {
                    const res = await fetch("/api/billing/guest-confirm", {
                        method: "POST",
                        body: JSON.stringify({ reference }),
                    });
                    const data = await res.json();
                    if (mounted && data.paid) {
                        setBypass(true);
                        setHasAccess(true);
                        setIsChecking(false);
                        return;
                    }
                } catch (e) {
                    console.error("Guest bypass check failed", e);
                }
            }

            try {
                const settings = await getSettings();
                if (mounted) {
                    setHasAccess(hasPaidAccess(settings));
                    setIsChecking(false);
                }
            } catch (error) {
                console.error("Failed to check entitlements:", error);
                if (mounted) {
                    setIsChecking(false);
                }
            }
        }
        void checkEntitlement();
        return () => { mounted = false; };
    }, []);

    if (isChecking) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px]">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                <p className="text-sm font-semibold text-[var(--text-muted)] animate-pulse">Verifying access...</p>
            </div>
        );
    }

    if (!hasAccess && !bypass) {
        return (
            <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-[32px] p-8 sm:p-10 shadow-[var(--shadow-lg)] text-center animate-fade-in relative overflow-hidden max-w-lg mx-auto">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--primary)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
                
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[var(--surface-2)] text-[var(--primary)] mb-8 shadow-sm border border-[var(--border)]/50">
                    <Lock className="w-8 h-8" strokeWidth={2.5} />
                </div>
                
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-4 tracking-tight">
                    Premium Feature
                </h1>
                
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed mb-10 max-w-[320px] mx-auto">
                    Accounts and encrypted cloud sync are premium features. Please upgrade your plan to {type === "signup" ? "create an account" : "log in"}.
                </p>
                
                <div className="space-y-4">
                    <Link 
                        href="/pricing"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-white px-6 py-4 font-bold transition-all hover:bg-[var(--primary-hover)] active:scale-[0.98] shadow-md"
                    >
                        View Upgrade Plans
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    
                    {type === "login" && (
                        <button
                            onClick={() => setBypass(true)}
                            className="w-full py-3 text-sm font-bold text-[var(--primary)] hover:underline"
                        >
                            Already paid? Log in here
                        </button>
                    )}
                </div>
                
                <div className="mt-10 pt-6 border-t border-[var(--border)]/50">
                    <Link href="/dashboard" className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return <div className="animate-fade-in w-full">{children}</div>;
}
