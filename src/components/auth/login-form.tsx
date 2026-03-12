"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
    title?: string;
    description?: string;
    forgotPasswordHref?: string;
    showSignupFooter?: boolean;
};

export function LoginForm({
    title = "Welcome back",
    description = "Log in to restore your paid access and unlock secure sync on this device.",
    forgotPasswordHref = "/forgot-password",
    showSignupFooter = true,
}: LoginFormProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState<string | null>(
        searchParams.get("error") === "Invalid_or_expired_magic_link"
            ? "That reset or confirmation link is no longer valid. Please request a fresh link."
            : null
    );
    const [isLoading, setIsLoading] = React.useState(false);
    const signupHref = React.useMemo(() => {
        const reference = searchParams.get("reference")?.trim() || "";
        return reference ? `/signup?reference=${encodeURIComponent(reference)}` : "/signup";
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setIsLoading(false);
            return;
        }

        const reference = searchParams.get("reference")?.trim() || "";
        const next = searchParams.get("next")?.trim() || "";
        const destination = reference
            ? `/billing/success?reference=${encodeURIComponent(reference)}`
            : next || "/dashboard";

        router.push(destination);
        router.refresh();
    };

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)]">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-[var(--text)] mb-2 tracking-tight">
                    {title}
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem]">
                    {description}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)] rounded-xl text-sm mb-4 animate-slide-down">
                        {error}
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
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-[var(--text)]" htmlFor="password">
                                Password
                            </label>
                            <Link 
                                href={forgotPasswordHref}
                                className="text-sm font-medium text-[var(--primary)] hover:underline underline-offset-4"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]/60" strokeWidth={1.5} />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[#C47A1C] focus:border-transparent transition-all sm:text-sm"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--primary)] text-white font-bold rounded-xl active-scale transition-all hover:bg-[var(--primary-hover)] shadow-[0_2px_10px_rgba(0,122,77,0.15)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign in"
                    )}
                </button>
            </form>

            {showSignupFooter ? (
                <div className="mt-8 text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                        First time after payment?{" "}
                        <Link href={signupHref} className="font-semibold text-[var(--primary)] hover:underline underline-offset-4">
                            Create an account
                        </Link>
                    </p>
                </div>
            ) : null}
        </div>
    );
}
