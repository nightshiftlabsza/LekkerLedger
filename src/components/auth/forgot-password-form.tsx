"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
    const supabase = createClient();
    
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/api/auth/callback?redirect_to=/dashboard/settings/password`,
        });

        if (resetError) {
            setError(resetError.message);
            setIsLoading(false);
            return;
        }

        setIsSuccess(true);
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] text-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[--primary]" />
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-[var(--primary)] mb-6 shadow-sm border border-green-100">
                    <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
                </div>
                
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
                    Reset email sent
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed mb-8 max-w-[280px] mx-auto">
                    If an account exists for <span className="font-semibold text-[var(--text)]">{email}</span>, you will receive a password reset link shortly.
                </p>
                
                <div className="mt-6 pt-5 border-t border-[var(--border)]/50">
                    <Link 
                        href="/login"
                        className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    >
                        Return to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-[var(--text)] mb-2 tracking-tight">
                    Reset password
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem] max-w-[260px] mx-auto">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

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

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--primary)] text-white font-bold rounded-xl active-scale transition-all hover:bg-[#006640] shadow-[0_2px_10px_rgba(0,122,77,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send reset link"
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--border)]/50 text-center">
                <Link href="/login" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                    Back to log in
                </Link>
            </div>
        </div>
    );
}
