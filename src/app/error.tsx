"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const errorMessage = typeof error?.message === "string" && error.message.trim()
        ? error.message.trim()
        : "Unknown client error";

    React.useEffect(() => {
        console.error("Global UI Crash:", error);
        try {
            globalThis.sessionStorage.setItem("ll_last_global_error", JSON.stringify({
                message: errorMessage,
                digest: error.digest || "local_crash",
                stack: typeof error?.stack === "string" ? error.stack : null,
                time: new Date().toISOString(),
            }));
        } catch {
            // Best-effort only. Debug info should never cause another crash.
        }
    }, [error, errorMessage]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 bg-[var(--bg)]">
            <div className="relative">
                <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: "var(--danger-soft)" }} />
                <div className="relative h-20 w-20 rounded-3xl flex items-center justify-center text-white shadow-2xl" style={{ backgroundColor: "var(--danger)" }}>
                    <AlertTriangle className="h-10 w-10" />
                </div>
            </div>

            <div className="space-y-3 max-w-sm">
                <h1 className="text-2xl font-black text-[var(--text)]">Something went wrong</h1>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    The application encountered an unexpected error. This is usually caused by a corrupted local cache or a network glitch.
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                    onClick={() => reset()}
                    className="h-12 bg-[var(--warning)] hover:brightness-95 text-white font-bold gap-2"
                >
                    <RefreshCw className="h-4 w-4" /> Try Again
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.href = "/"}
                    className="h-12"
                >
                    <Home className="h-4 w-4 mr-2" /> Back to Safety
                </Button>
            </div>

            <div className="pt-12 border-t border-[var(--border)] w-full max-w-xs space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Need a safer next step?</p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                    Local data is not deleted automatically. If the problem keeps happening, reopen the app and use Settings &gt; Storage &amp; backup to export first before using the Danger Zone.
                </p>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)]/60 p-4 text-left">
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--danger)]">Diagnostic</p>
                <p className="mt-2 break-words font-mono text-xs leading-5 text-[var(--text)]">
                    {errorMessage}
                </p>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] opacity-50">
                Error ID: {error.digest || 'local_crash'}
            </p>
        </div>
    );
}
