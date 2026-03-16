"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home, LogIn, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function classifyError(message: string): "auth" | "data" | "network" | "unknown" {
    const lower = message.toLowerCase();
    if (lower.includes("session") || lower.includes("auth") || lower.includes("sign") || lower.includes("token") || lower.includes("login")) {
        return "auth";
    }
    if (lower.includes("filter") || lower.includes("map") || lower.includes("undefined") || lower.includes("null") || lower.includes("cannot read") || lower.includes("is not a function")) {
        return "data";
    }
    if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout") || lower.includes("connection")) {
        return "network";
    }
    return "unknown";
}

function getErrorGuidance(category: ReturnType<typeof classifyError>): { heading: string; body: string } {
    switch (category) {
        case "auth":
            return {
                heading: "Session issue detected",
                body: "Your login session may have expired or become invalid. Signing in again should resolve this.",
            };
        case "data":
            return {
                heading: "Local data issue detected",
                body: "This is likely caused by outdated data stored in your browser from a previous version. Clearing the app cache and signing in again will fix this. Your cloud-synced data is safe.",
            };
        case "network":
            return {
                heading: "Connection issue detected",
                body: "The app could not reach the server. Check your internet connection and try again.",
            };
        default:
            return {
                heading: "Unexpected error",
                body: "The app ran into an issue it did not expect. Reloading usually fixes this.",
            };
    }
}

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
    const category = classifyError(errorMessage);
    const guidance = getErrorGuidance(category);

    React.useEffect(() => {
        console.error("Global UI Crash:", error);
        try {
            globalThis.sessionStorage.setItem("ll_last_global_error", JSON.stringify({
                message: errorMessage,
                category,
                digest: error.digest || "local_crash",
                stack: typeof error?.stack === "string" ? error.stack : null,
                time: new Date().toISOString(),
            }));
        } catch {
            // Best-effort only. Debug info should never cause another crash.
        }
    }, [category, error, errorMessage]);

    const handleClearCacheAndReload = () => {
        try {
            // Clear all IndexedDB databases used by the app
            const dbNames = [
                "employees", "payslips", "leave", "leave_carry_over",
                "settings", "audit_logs", "pay_periods", "documents",
                "document_files", "contracts", "households",
            ];
            for (const name of dbNames) {
                try {
                    globalThis.indexedDB.deleteDatabase(`LekkerLedger/${name}`);
                } catch {
                    // Best-effort
                }
            }
            // Also try the localforage default pattern
            try {
                globalThis.indexedDB.deleteDatabase("LekkerLedger");
            } catch {
                // Best-effort
            }
        } catch {
            // If indexedDB is not available, continue anyway
        }
        globalThis.location.href = "/login";
    };

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
                <p className="text-sm font-semibold text-[var(--text)]">{guidance.heading}</p>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {guidance.body}
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                    onClick={() => reset()}
                    className="h-12 bg-[var(--warning)] hover:brightness-95 text-white font-bold gap-2"
                >
                    <RefreshCw className="h-4 w-4" /> Try Again
                </Button>

                {category === "auth" ? (
                    <Button
                        variant="outline"
                        onClick={() => globalThis.location.href = "/login"}
                        className="h-12 gap-2"
                    >
                        <LogIn className="h-4 w-4" /> Sign in again
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => globalThis.location.href = "/"}
                        className="h-12 gap-2"
                    >
                        <Home className="h-4 w-4" /> Back to Safety
                    </Button>
                )}

                {category === "data" && (
                    <Button
                        variant="outline"
                        onClick={handleClearCacheAndReload}
                        className="h-12 gap-2 border-[var(--danger-border)] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                    >
                        <Trash2 className="h-4 w-4" /> Clear local cache &amp; sign in
                    </Button>
                )}
            </div>

            <div className="pt-12 border-t border-[var(--border)] w-full max-w-xs space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Need a safer next step?</p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                    Your cloud-synced data is never affected by local errors. If the problem keeps happening, clear the local cache and sign in again — your records will be restored from the cloud.
                </p>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)]/60 p-4 text-left">
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--danger)]">Diagnostic</p>
                <p className="mt-2 break-words font-mono text-xs leading-5 text-[var(--text)]">
                    {errorMessage}
                </p>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] opacity-50">
                Error ID: {error.digest || "local_crash"}
            </p>
        </div>
    );
}
