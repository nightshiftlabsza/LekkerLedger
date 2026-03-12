"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck, X } from "lucide-react";
import { LoginForm } from "./login-form";
import { SignUpForm } from "./signup-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { Button } from "@/components/ui/button";

export function AuthModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const panelRef = React.useRef<HTMLElement | null>(null);
    
    const mode = searchParams.get("auth");
    const isOpen = mode === "login" || mode === "signup" || mode === "reset";

    const close = React.useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("auth");
        const query = params.toString();
        router.push(pathname + (query ? `?${query}` : ""), { scroll: false });
    }, [searchParams, router, pathname]);

    const setMode = React.useCallback((newMode: "login" | "signup" | "reset") => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("auth", newMode);
        router.push(pathname + `?${params.toString()}`, { scroll: false });
    }, [searchParams, router, pathname]);

    React.useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };

        window.addEventListener("keydown", handleEsc);
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, close]);

    React.useEffect(() => {
        if (!isOpen) return;
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <section
            ref={panelRef}
            id="homepage-auth-panel"
            aria-label="Paid user login area"
            className="border-b border-[var(--border)] animate-slide-down"
            style={{ backgroundColor: "var(--surface-2)" }}
        >
            <div className="content-container-wide px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <div className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-lg)]">
                    <div className="absolute inset-x-0 top-0 h-px bg-[var(--border)]" />
                    <div className="absolute right-4 top-4 z-10 sm:right-5 sm:top-5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={close}
                            className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                            aria-label="Close login area"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,31rem)]">
                        <div
                            className="border-b border-[var(--border)] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 xl:border-b-0 xl:border-r"
                            style={{
                                background:
                                    "linear-gradient(180deg, rgba(0, 122, 77, 0.08) 0%, rgba(196, 122, 28, 0.06) 100%)",
                            }}
                        >
                            <div className="max-w-[42rem] space-y-6 pr-12 sm:pr-14 lg:pr-16">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                                    Paid account access
                                </div>

                                <div className="space-y-3">
                                    <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                                        {mode === "reset" ? "Reset your password without leaving this page." : "Log in and restore your paid workspace on this device."}
                                    </h2>
                                    <p className="measure-readable text-base leading-7" style={{ color: "var(--text-muted)" }}>
                                        {mode === "reset"
                                            ? "Use the same email address linked to your paid plan. We will email a secure reset link and then return you to the account recovery step."
                                            : "This login area is for paid households returning to their account. Use the email and password linked to your paid plan to unlock cloud sync and restore records on this browser."}
                                    </p>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-3">
                                    <InfoCard
                                        icon={<ShieldCheck className="h-4 w-4 text-[var(--primary)]" />}
                                        title="Stays in browser"
                                        body="Login and password reset happen here in the page, with no extra pop-up window."
                                    />
                                    <InfoCard
                                        icon={<KeyRound className="h-4 w-4 text-[var(--focus)]" />}
                                        title="Recovery follows"
                                        body="After sign-in, your recovery key unlocks encrypted records on this device."
                                    />
                                    <InfoCard
                                        icon={<ArrowRight className="h-4 w-4 text-[var(--primary)]" />}
                                        title="New here?"
                                        body="Use Start free if you want to try the local-first app before paying."
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                                    {mode === "login" ? (
                                        <button
                                            type="button"
                                            onClick={() => setMode("reset")}
                                            className="font-semibold text-[var(--primary)] hover:underline underline-offset-4"
                                        >
                                            Need a password reset?
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setMode("login")}
                                            className="font-semibold text-[var(--primary)] hover:underline underline-offset-4"
                                        >
                                            Back to paid account login
                                        </button>
                                    )}
                                    <span className="hidden text-[var(--border-strong)] sm:inline">•</span>
                                    <Link href="/pricing" className="font-semibold text-[var(--text)] hover:text-[var(--primary)]">
                                        See plan details
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                            {mode === "login" ? (
                                <LoginForm
                                    title="Paid account login"
                                    description="Use the email and password linked to your paid plan. Password reset stays in this browser."
                                    forgotPasswordHref="/?auth=reset"
                                    showSignupFooter={false}
                                />
                            ) : mode === "reset" ? (
                                <ForgotPasswordForm
                                    title="Password reset"
                                    description="Enter the email address tied to your paid plan and we will send a secure reset link."
                                    returnHref="/?auth=login"
                                    returnLabel="Back to paid login"
                                />
                            ) : (
                                <SignUpForm />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function InfoCard({
    icon,
    title,
    body,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
}) {
    return (
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)]">
                    {icon}
                </span>
                <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
        </div>
    );
}
