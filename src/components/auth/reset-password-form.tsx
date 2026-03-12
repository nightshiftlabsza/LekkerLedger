"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
    const supabase = createClient();
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isReady, setIsReady] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;

        async function checkRecoverySession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;
            if (!session) {
                setError("This password reset link is no longer active. Please request a new reset email.");
                setIsReady(false);
                return;
            }
            setIsReady(true);
        }

        void checkRecoverySession();
        return () => {
            mounted = false;
        };
    }, [supabase]);

    const validatePassword = React.useCallback((value: string) => {
        if (value.length < 10) return "Password must be at least 10 characters long.";
        if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
        if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
        if (!/[0-9]/.test(value)) return "Password must include at least one number.";
        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(value)) return "Password must include at least one special character.";
        return null;
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const validationError = validatePassword(password);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (password !== confirmPassword) {
            setError("The passwords do not match yet.");
            return;
        }

        setIsLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            setError(updateError.message);
            setIsLoading(false);
            return;
        }

        setIsSuccess(true);
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-center shadow-[var(--shadow-lg)] sm:p-8">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]">
                    <CheckCircle2 className="h-7 w-7" />
                </div>
                <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-[var(--text)]">Password updated</h1>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    Your password has been changed. You can return to login and continue with your account normally.
                </p>
                <div className="mt-8">
                    <Link href="/login" className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[var(--primary)] px-6 py-3 font-bold text-white transition-colors hover:bg-[var(--primary-hover)]">
                        Return to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <div className="text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Lock className="h-7 w-7" />
                </div>
                <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-[var(--text)]">Choose a new password</h1>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    Set a fresh password for your LekkerLedger account. This screen only works from a valid password reset link.
                </p>
            </div>

            {error ? (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-[var(--text)]" htmlFor="new-password">New password</label>
                    <input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-transparent"
                        placeholder="Min. 10 chars (A-z, 0-9, !@#$)"
                        autoComplete="new-password"
                        disabled={!isReady || isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-[var(--text)]" htmlFor="confirm-password">Confirm password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-transparent"
                        placeholder="Repeat your new password"
                        autoComplete="new-password"
                        disabled={!isReady || isLoading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isReady || isLoading}
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-3 font-bold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Updating password...
                        </>
                    ) : (
                        "Save new password"
                    )}
                </button>
            </form>

            <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
                <Link href="/login" className="text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text)]">
                    Back to login
                </Link>
            </div>
        </div>
    );
}
