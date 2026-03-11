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
    const [confirmationText, setConfirmationText] = React.useState("");

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
        if (confirmationText !== "I UNDERSTAND") return;
        onComplete(recoveryKey);
    };

    if (!recoveryKey) {
        return <div className="p-8 text-center text-[var(--text-muted)]">Generating secure key...</div>;
    }

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in max-w-md mx-auto">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--warning-soft)] text-[var(--warning)] mb-6 shadow-sm border border-[var(--warning-border)]">
                    <KeyRound className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
                    Your Recovery Key
                </h1>
                
                <div className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 space-y-3 px-2 measure-readable max-w-[40ch] mx-auto">
                    <p>
                        To ensure your household payroll records remain completely private, we use a security method that makes it literally impossible for LekkerLedger to see your data.
                    </p>
                    <p>
                        Because we cannot see it, <strong className="text-[var(--text)]">we cannot recover it for you</strong>. You must save this key somewhere safe. If you ever want to log in on a second device and sync your records, you will be required to enter this key.
                    </p>
                </div>
            </div>

            <div className="mb-6 p-4 bg-[var(--warning-soft)] rounded-2xl border border-[var(--warning-border)] flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--warning)] leading-relaxed font-semibold">
                    LekkerLedger does not store your key. If you lose this key, your data is permanently lost and we cannot recover it for you.
                </p>
            </div>

            <div className="relative mb-8">
                <div className="font-mono text-center text-lg sm:text-xl font-bold text-[var(--text)] tracking-wider p-5 bg-[var(--bg)] border border-[var(--border)] rounded-xl break-all">
                    {recoveryKey}
                </div>
                <button
                    onClick={handleCopy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Copy to clipboard"
                >
                    {isCopied ? <Check className="w-5 h-5 text-[var(--success)]" /> : <Copy className="w-5 h-5" />}
                </button>
            </div>

            <div className="space-y-4 mb-8">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider pl-1" htmlFor="confirm-understand">
                        Type &quot;I UNDERSTAND&quot; to continue
                    </label>
                    <input
                        id="confirm-understand"
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[#C47A1C] focus:border-transparent transition-all text-center font-bold tracking-widest"
                        placeholder="I UNDERSTAND"
                        autoComplete="off"
                    />
                </div>
                <p className="text-[10px] text-center text-[var(--text-muted)] leading-tight px-4">
                    By typing this, I confirm I have securely saved my key and understand that my records cannot be recovered if this key is lost.
                </p>
            </div>

            <button
                onClick={handleContinue}
                disabled={confirmationText !== "I UNDERSTAND"}
                className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--text)] text-white font-bold rounded-xl active-scale transition-all hover:opacity-90 shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Continue Setup
            </button>
        </div>
    );
}
