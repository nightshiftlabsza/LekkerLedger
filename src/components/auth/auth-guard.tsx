"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { getSettings } from "@/lib/storage";
import { hasPaidAccess } from "@/lib/entitlements";

export function AuthGuard({ children, type }: { children: React.ReactNode, type: "login" | "signup" }) {
    const [isChecking, setIsChecking] = React.useState(true);
    const [hasAccess, setHasAccess] = React.useState(false);
    const [bypass, setBypass] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        async function checkEntitlement() {
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
            <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] text-center animate-fade-in relative overflow-hidden">
                {/* Decorative background element matching civic ledger vibes */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--primary)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
                
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--surface-2)] text-[var(--primary)] mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-[var(--border)]/50">
                    <Lock className="w-7 h-7" strokeWidth={2.5} />
                </div>
                
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
                    Premium Feature
                </h1>
                
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed mb-8 max-w-[280px] mx-auto">
                    Accounts and encrypted cloud sync are premium features. Please upgrade your plan to {type === "signup" ? "create an account" : "log in"}.
                </p>
                
                <Link 
                    href="/upgrade"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-white px-5 py-3.5 font-bold transition-all hover:bg-[#006640] active-scale shadow-[0_4px_14px_rgba(0,122,77,0.25)]"
                >
                    View Upgrade Plans
                    <ArrowRight className="w-4 h-4" />
                </Link>
                
                {type === "login" && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]/50">
                        <button
                            onClick={() => setBypass(true)}
                            className="text-sm font-semibold text-[var(--primary)] hover:underline"
                        >
                            Already paid? Log in here
                        </button>
                    </div>
                )}
                
                <div className="mt-6 pt-5 border-t border-[var(--border)]/50">
                    <Link href="/dashboard" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return <div className="animate-fade-in w-full">{children}</div>;
}
