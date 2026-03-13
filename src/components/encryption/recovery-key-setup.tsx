"use client";

import * as React from "react";
import { Copy, Check, AlertTriangle, KeyRound } from "lucide-react";
import { generateRecoveryKey } from "@/lib/crypto";

interface RecoveryKeySetupProps {
    onComplete: (key: string) => void;
    errorMessage?: string | null;
    isSubmitting?: boolean;
}

export function RecoveryKeySetup({
    onComplete,
    errorMessage = null,
    isSubmitting = false,
}: RecoveryKeySetupProps) {
    const [recoveryKey, setRecoveryKey] = React.useState<string>("");
    const [isCopied, setIsCopied] = React.useState(false);
    const [confirmationText, setConfirmationText] = React.useState("");
    const [generationError, setGenerationError] = React.useState<string | null>(null);
    const normalizedConfirmation = confirmationText.trim().toUpperCase();
    const isConfirmed = normalizedConfirmation === "I UNDERSTAND";
    const activeError = generationError ?? errorMessage;

    React.useEffect(() => {
        try {
            // Generate once on mount
            setRecoveryKey(generateRecoveryKey());
            setGenerationError(null);
        } catch (error) {
            console.error("Recovery key generation failed:", error);
            setGenerationError("This device cannot create the secure recovery key needed for encrypted login. Please update the browser or reopen the app in a normal secure tab.");
        }
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
        if (!isConfirmed) return;
        onComplete(recoveryKey);
    };

    if (!recoveryKey && !activeError) {
        return <div className="p-8 text-center text-[var(--text-muted)]">Generating secure key...</div>;
    }

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in">
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

            <div className="mb-8 rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            Save this key exactly as shown
                        </p>
                        <div className="mt-3 font-mono text-center text-lg font-bold tracking-[0.08em] text-[var(--text)] sm:text-[1.9rem] sm:leading-[1.45] break-words [overflow-wrap:anywhere]">
                            {recoveryKey || "Recovery key unavailable on this device"}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!recoveryKey}
                        className="mt-7 flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text)]"
                        title="Copy to clipboard"
                        aria-label="Copy recovery key"
                    >
                        {isCopied ? <Check className="h-5 w-5 text-[var(--success)]" /> : <Copy className="h-5 w-5" />}
                    </button>
                </div>
                <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
                    Store it in a password manager or another safe place before you continue.
                </p>
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
                        className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[#C47A1C] focus:border-transparent transition-all text-center font-bold tracking-[0.14em] uppercase"
                        placeholder="I UNDERSTAND"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                    />
                </div>
                <p className="text-[10px] text-center text-[var(--text-muted)] leading-tight px-4">
                    By typing this, I confirm I have securely saved my key and understand that my records cannot be recovered if this key is lost.
                </p>
                {activeError ? (
                    <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                        {activeError}
                    </div>
                ) : null}
            </div>

            <button
                type="button"
                onClick={handleContinue}
                disabled={!recoveryKey || !isConfirmed || isSubmitting}
                className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--primary)] text-white font-bold rounded-xl active-scale transition-all hover:bg-[var(--primary-hover)] shadow-[0_2px_10px_rgba(0,122,77,0.15)] disabled:bg-[var(--border-strong)] disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Finishing setup..." : "Continue to dashboard"}
            </button>
        </div>
    );
}
