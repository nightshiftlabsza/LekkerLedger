"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { LoginForm } from "./login-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { Button } from "@/components/ui/button";

export function AuthModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const mode = searchParams.get("auth");
    const isOpen = mode === "login" || mode === "signup" || mode === "reset";

    const close = React.useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("auth");
        const query = params.toString();
        router.push(pathname + (query ? `?${query}` : ""), { scroll: false });
    }, [searchParams, router, pathname]);

    const setMode = React.useCallback((newMode: "login" | "reset") => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("auth", newMode);
        router.push(pathname + `?${params.toString()}`, { scroll: false });
    }, [searchParams, router, pathname]);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        globalThis.addEventListener("keydown", handleEsc);
        document.body.style.overflow = "hidden";
        return () => {
            globalThis.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [isOpen, close]);

    if (!isOpen) return null;

    return (
        <dialog
            open
            className="fixed inset-0 z-50 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-transparent p-4"
            aria-label="Paid user login"
        >
            <button
                type="button"
                aria-label="Close login dialog"
                className="absolute inset-0 border-0 bg-black/40 p-0 backdrop-blur-sm"
                onClick={close}
            />

            <div className="relative w-full max-w-[32rem] rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_24px_64px_rgba(16,24,40,0.18)] animate-in fade-in zoom-in-95 duration-200">
                <div
                    className="rounded-t-[28px] border-b border-[var(--border)] px-6 py-5"
                    style={{ background: "linear-gradient(135deg, rgba(0,122,77,0.08) 0%, rgba(196,122,28,0.06) 100%)" }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                                LekkerLedger
                            </p>
                            <p className="mt-1 text-base font-bold" style={{ color: "var(--text)" }}>
                                {mode === "reset" ? "Reset password" : "Paid account login"}
                            </p>
                            <p className="mt-1 text-sm leading-5" style={{ color: "var(--text-muted)" }}>
                                {mode === "reset"
                                    ? "We'll email a secure reset link to your account address."
                                    : "Log in to restore your cloud-synced records on this device."}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={close}
                            className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="px-6 py-5">
                    {mode === "reset" ? (
                        <ForgotPasswordForm
                            returnHref="/?auth=login"
                            returnLabel="Back to login"
                            embedded
                        />
                    ) : (
                        <LoginForm
                            forgotPasswordHref="/?auth=reset"
                            showSignupFooter={false}
                            embedded
                        />
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[var(--border)] pt-4 text-sm">
                        {mode === "reset" && (
                            <button
                                type="button"
                                onClick={() => setMode("login")}
                                className="font-semibold text-[var(--primary)] hover:underline underline-offset-4"
                            >
                                Back to login
                            </button>
                        )}
                        {mode === "reset" && <span className="text-[var(--border-strong)]">·</span>}
                        <Link href="/pricing" onClick={close} className="font-semibold text-[var(--text)] hover:text-[var(--primary)] transition-colors">
                            See plan details
                        </Link>
                    </div>
                </div>
            </div>
        </dialog>
    );
}
