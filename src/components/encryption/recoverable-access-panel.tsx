"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Loader2, LockKeyhole, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecoverableAccessPanelProps {
    purpose: "setup" | "unlock";
    hasSavedPassword: boolean;
    onSubmit: (input: { password: string | null; useSavedPassword: boolean }) => Promise<void> | void;
    onRecover?: (input: { password: string | null; useSavedPassword: boolean }) => Promise<void> | void;
    isSubmitting?: boolean;
    isRecovering?: boolean;
    errorMessage?: string | null;
}

export function RecoverableAccessPanel({
    purpose,
    hasSavedPassword,
    onSubmit,
    onRecover,
    isSubmitting = false,
    isRecovering = false,
    errorMessage = null,
}: Readonly<RecoverableAccessPanelProps>) {
    const [password, setPassword] = React.useState("");

    const heading = purpose === "setup" ? "Finish secure setup" : "Unlock your records";
    const body = purpose === "setup"
        ? "Recoverable Encryption keeps your records encrypted before upload and lets you restore access later."
        : "This account uses Recoverable Encryption. Confirm your password to open the records on this device.";

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        await onSubmit({
            password: hasSavedPassword ? null : password,
            useSavedPassword: hasSavedPassword,
        });
    }

    return (
        <div className="w-full rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] animate-fade-in sm:p-8">
            <div className="text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]">
                    {purpose === "setup" ? <ShieldCheck className="h-8 w-8" /> : <LockKeyhole className="h-8 w-8" />}
                </div>
                <h1 className="mt-6 font-serif text-2xl font-bold tracking-tight text-[var(--text)]">{heading}</h1>
                <p className="mx-auto mt-3 max-w-[38ch] text-sm leading-7 text-[var(--text-muted)]">
                    {body}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {errorMessage ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                ) : null}

                {hasSavedPassword ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm leading-7 text-[var(--text-muted)]">
                        We can use the password you just entered in this tab for this one step. It will be cleared straight after use.
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[var(--text)]" htmlFor="recoverable-password">
                            {purpose === "setup" ? "Confirm your password" : "Password"}
                        </label>
                        <input
                            id="recoverable-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-[var(--focus)]"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isSubmitting || isRecovering}
                            required
                        />
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting || isRecovering || (!hasSavedPassword && !password.trim())}
                    className="min-h-[48px] w-full rounded-2xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {purpose === "setup" ? "Securing account..." : "Unlocking..."}
                        </>
                    ) : (
                        purpose === "setup" ? "Finish setup" : "Unlock records"
                    )}
                </Button>
            </form>

            {purpose === "unlock" ? (
                <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                    <p className="text-sm font-semibold text-[var(--text)]">Changed your password?</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                        If you already reset your password, you can restore this account securely here.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        {onRecover ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    void onRecover({
                                        password: hasSavedPassword ? null : password,
                                        useSavedPassword: hasSavedPassword,
                                    });
                                }}
                                disabled={isSubmitting || isRecovering}
                                className="min-h-[44px] rounded-2xl font-bold"
                            >
                                {isRecovering ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Recovering...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                        Recover this account
                                    </>
                                )}
                            </Button>
                        ) : null}
                        <Link href="/forgot-password" className="inline-flex">
                            <Button type="button" variant="outline" className="min-h-[44px] rounded-2xl font-bold">
                                Reset password first
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
