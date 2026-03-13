"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppOrigin } from "@/lib/app-origin";
import { readPendingBillingEmail, readPendingBillingReference } from "@/lib/billing-handoff";
import { buildPaidDashboardHref, PAID_LOGIN_SUCCESS_QUERY } from "@/lib/paid-activation";

function mapSignUpError(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes("already registered") || lower.includes("already been registered") || lower.includes("user_already_exists"))
        return "An account with this email already exists. Try logging in instead.";
    if (lower.includes("you can only request this") || lower.includes("rate limit") || lower.includes("too many requests"))
        return "Too many attempts. Please wait a moment before trying again.";
    if (lower.includes("password") && (lower.includes("weak") || lower.includes("short") || lower.includes("length")))
        return "Your password does not meet the minimum security requirements. Please choose a stronger one.";
    if (lower.includes("network") || lower.includes("fetch"))
        return "Unable to reach the server. Please check your internet connection and try again.";
    if (lower.includes("not authorized") || lower.includes("signup_disabled"))
        return "Account registration is currently unavailable. Please try again later.";
    return message;
}

type SignUpFormProps = {
    initialEmail?: string;
    reference?: string;
    title?: string;
    description?: string;
    showLoginFooter?: boolean;
};

export function SignUpForm({
    initialEmail,
    reference: referenceProp,
    title = "Create your secure account",
    description,
    showLoginFooter = true,
}: SignUpFormProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [email, setEmail] = React.useState(
        initialEmail || searchParams.get("email") || readPendingBillingEmail() || ""
    );
    const [password, setPassword] = React.useState("");
    const [passwordError, setPasswordError] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const reference = referenceProp || searchParams.get("reference")?.trim() || readPendingBillingReference() || "";

    const validatePassword = (pass: string) => {
        if (pass.length < 10) return "Password must be at least 10 characters long.";
        if (!/[A-Z]/.test(pass)) return "Password must include at least one uppercase letter.";
        if (!/[a-z]/.test(pass)) return "Password must include at least one lowercase letter.";
        if (!/[0-9]/.test(pass)) return "Password must include at least one number.";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must include at least one special character.";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const pError = validatePassword(password);
        if (pError) {
            setPasswordError(pError);
            return;
        }
        setPasswordError(null);
        setIsLoading(true);

        const next = reference
            ? buildPaidDashboardHref({ reference, activation: PAID_LOGIN_SUCCESS_QUERY })
            : "/dashboard";
        const appOrigin = getBrowserAppOrigin();

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${appOrigin}/api/auth/callback?next=${encodeURIComponent(next)}`,
            },
        });

        if (signUpError) {
            setError(mapSignUpError(signUpError.message));
            setIsLoading(false);
            return;
        }

        setIsSuccess(true);
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] text-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-[var(--primary)]" />
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--success-soft)] text-[var(--primary)] mb-6 shadow-sm border border-[var(--success-border)]">
                    <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
                </div>
                
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
                    Check your email
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed mb-8 max-w-[280px] mx-auto">
                    We&apos;ve sent a confirmation link to <span className="font-semibold text-[var(--text)]">{email}</span>. Click the link to complete your account setup.
                </p>
                
                <div className="mt-6 pt-5 border-t border-[var(--border)]/50">
                    <button 
                        onClick={() => router.push("/login")}
                        className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                        Return to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-[var(--text)] mb-2 tracking-tight">
                    {title}
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem]">
                    {description || (
                        reference
                            ? "Your payment is already on file. Create the paid account that will hold your encrypted sync access."
                            : "Create the account that will hold your encrypted payroll backup and sync access."
                    )}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)] rounded-xl text-sm animate-slide-down">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[var(--text)]" htmlFor="email">
                            Email address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]/60" strokeWidth={1.5} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[#C47A1C] focus:border-transparent transition-all sm:text-sm"
                                placeholder="name@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[var(--text)]" htmlFor="password">
                            Create a password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]/60" strokeWidth={1.5} />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (passwordError) setPasswordError(null);
                                }}
                                className={`w-full pl-11 pr-4 py-3 bg-[var(--bg)] border ${passwordError ? 'border-red-500' : 'border-[var(--border)]'} rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[#C47A1C] focus:border-transparent transition-all sm:text-sm`}
                                placeholder="Min. 10 chars (A-z, 0-9, !@#$)"
                                required
                                minLength={10}
                                disabled={isLoading}
                            />
                        </div>
                        {passwordError && (
                            <p className="text-xs text-[var(--danger)] font-medium pl-1 animate-slide-right">{passwordError}</p>
                        )}
                        {!passwordError && (
                            <p className="text-[10px] text-[var(--text-muted)] pl-1 leading-normal">
                                Must be 10+ characters with uppercase, lowercase, numbers & symbols.
                            </p>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--text)] text-white font-bold rounded-xl active-scale transition-all hover:opacity-90 shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create secure account"
                        )}
                    </button>
                    {reference ? (
                        <p className="mt-4 text-center text-xs leading-5 text-[var(--text-muted)]">
                            After you confirm your email, LekkerLedger will finish paid activation and open your dashboard.
                        </p>
                    ) : null}
                    <p className="text-xs text-[var(--text-muted)] text-center mt-4">
                        By creating an account, you agree to our <Link href="/legal/terms" className="underline hover:text-[var(--text)]">Terms</Link> and <Link href="/legal/privacy" className="underline hover:text-[var(--text)]">Privacy Policy</Link>.
                    </p>
                </div>
            </form>

            {showLoginFooter ? (
                <div className="mt-8 pt-6 border-t border-[var(--border)]/50 text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline underline-offset-4">
                            Log in
                        </Link>
                    </p>
                </div>
            ) : null}
        </div>
    );
}
