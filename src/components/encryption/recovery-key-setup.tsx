"use client";

import * as React from "react";
import { Copy, Check, AlertTriangle, KeyRound } from "lucide-react";
import { generateRecoveryKey } from "@/lib/crypto";

interface RecoveryKeySetupProps {
    onComplete: (key: string) => void;
}

export function RecoveryKeySetup({ onComplete }: RecoveryKeySetupProps) {
    const [recoveryKey, setRecoveryKey] = React.useState<string>("");
    const [isCopied, setIsCopied] = React.useState(false);
    const [hasConfirmed, setHasConfirmed] = React.useState(false);

    React.useEffect(() => {
        // Generate once on mount
        setRecoveryKey(generateRecoveryKey());
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(recoveryKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleContinue = () => {
        if (!hasConfirmed) return;
        onComplete(recoveryKey);
    };

    if (!recoveryKey) {
        return <div className="p-8 text-center text-[var(--text-muted)]">Generating secure key...</div>;
    }

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 text-amber-600 mb-6 shadow-sm border border-amber-100">
                    <KeyRound className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
                    Your Recovery Key
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed max-w-[340px] mx-auto">
                    This key guarantees that only you can decrypt your data. We do not store this key and <strong>cannot recover it if lost.</strong>
                </p>
            </div>

            <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                    Save this key in a secure password manager. If you lose it, you lose access to all your synced data.
                </p>
            </div>

            <div className="relative mb-6">
                <div className="font-mono text-center text-lg sm:text-xl font-bold text-[var(--text)] tracking-wider p-5 bg-[var(--bg)] border border-[var(--border)] rounded-xl break-all">
                    {recoveryKey}
                </div>
                <button
                    onClick={handleCopy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)] rounded-lg transition-colors"
                    title="Copy to clipboard"
                >
                    {isCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
            </div>

            <label className="flex items-start space-x-3 mb-8 cursor-pointer group">
                <div className="flex-shrink-0 mt-0.5">
                    <input
                        type="checkbox"
                        checked={hasConfirmed}
                        onChange={(e) => setHasConfirmed(e.target.checked)}
                        className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                </div>
                <span className="text-sm text-[var(--text)] font-medium group-hover:text-black transition-colors">
                    I have securely saved my recovery key. I understand that LekkerLedger cannot recover my data if I lose this key.
                </span>
            </label>

            <button
                onClick={handleContinue}
                disabled={!hasConfirmed}
                className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--text)] text-white font-bold rounded-xl active-scale transition-all hover:opacity-90 shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Continue Setup
            </button>
        </div>
    );
}
