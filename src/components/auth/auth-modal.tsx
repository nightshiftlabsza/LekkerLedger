"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { LoginForm } from "./login-form";
import { SignUpForm } from "./signup-form";
import { Button } from "@/components/ui/button";

export function AuthModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const mode = searchParams.get("auth");
    const isOpen = mode === "login" || mode === "signup";

    const close = React.useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("auth");
        const query = params.toString();
        router.push(pathname + (query ? `?${query}` : ""), { scroll: false });
    }, [searchParams, router, pathname]);

    const setMode = React.useCallback((newMode: "login" | "signup") => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("auth", newMode);
        router.push(pathname + `?${params.toString()}`, { scroll: false });
    }, [searchParams, router, pathname]);

    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [isOpen, close]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={close}
            />
            
            <div className="relative w-full max-w-md bg-[var(--bg)] rounded-[32px] border border-[var(--border)] shadow-[var(--shadow-xl)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="absolute top-4 right-4 z-10">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={close}
                        className="rounded-full hover:bg-[var(--surface-raised)]"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 sm:p-8">
                    {mode === "login" ? (
                        <>
                            <LoginForm />
                            <div className="mt-6 text-center">
                                <p className="text-sm text-[var(--text-muted)]">
                                    Don&apos;t have an account?{" "}
                                    <button 
                                        onClick={() => setMode("signup")}
                                        className="font-bold text-[var(--primary)] hover:underline"
                                    >
                                        Start free
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <SignUpForm />
                            <div className="mt-6 text-center">
                                <p className="text-sm text-[var(--text-muted)]">
                                    Already have an account?{" "}
                                    <button 
                                        onClick={() => setMode("login")}
                                        className="font-bold text-[var(--primary)] hover:underline"
                                    >
                                        Log in
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
