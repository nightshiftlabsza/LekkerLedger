"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetAllData } from "@/lib/storage";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    React.useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global UI Crash:", error);
    }, [error]);

    const [confirmReset, setConfirmReset] = React.useState(false);

    const handleHardReset = async () => {
        if (confirm("This will PERMANENTLY delete all your local employees and payslips. Use this ONLY as a last resort if the app won't open. Proceed?")) {
            await resetAllData();
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 bg-[var(--bg-base)]">
            <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                <div className="relative h-20 w-20 rounded-3xl bg-red-500 flex items-center justify-center text-white shadow-2xl">
                    <AlertTriangle className="h-10 w-10" />
                </div>
            </div>

            <div className="space-y-3 max-w-sm">
                <h1 className="text-2xl font-black text-[var(--text-primary)]">Something went wrong</h1>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    The application encountered an unexpected error. This is usually caused by a corrupted local cache or a network glitch.
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                    onClick={() => reset()}
                    className="h-12 bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-bold gap-2"
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

            <div className="pt-12 border-t border-[var(--border-subtle)] w-full max-w-xs">
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] mb-4">Master Emergency Tool</p>
                {!confirmReset ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 bg-red-500/5 hover:bg-red-500/10 w-full text-xs font-bold gap-2"
                        onClick={() => setConfirmReset(true)}
                    >
                        <ShieldAlert className="h-3 w-3" /> Fix "White Screen" Loop
                    </Button>
                ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-[11px] font-bold text-red-600">DANGER: This wipes ALL data.</p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmReset(false)}>Cancel</Button>
                            <Button size="sm" className="flex-1 bg-red-600 text-white font-bold" onClick={handleHardReset}>Wipe Data</Button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-[10px] text-[var(--text-muted)] opacity-50">
                Error ID: {error.digest || 'local_crash'}
            </p>
        </div>
    );
}
