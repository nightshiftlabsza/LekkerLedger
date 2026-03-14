"use client";

import * as React from "react";
import { ShieldCheck, Loader2, AlertCircle, Info } from "lucide-react";
import { deriveKey } from "@/lib/crypto";

interface RecoveryKeyInputProps {
    onComplete: (key: string, cryptoKey: CryptoKey) => Promise<void> | void;
    errorMessage?: string | null;
    isSubmitting?: boolean;
}

export function RecoveryKeyInput({
    onComplete,
    errorMessage = null,
    isSubmitting = false,
}: RecoveryKeyInputProps) {
    const [inputValue, setInputValue] = React.useState("");
    const [localError, setLocalError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        const cleanKey = inputValue.trim().replaceAll(/[^A-Z2-9]/gi, "").toUpperCase();
        if (!cleanKey || cleanKey.length < 32) {
            setLocalError("Please enter your full recovery key. It should be 32 characters long.");
            return;
        }

        try {
            const cryptoKey = await deriveKey(cleanKey);
            await onComplete(cleanKey, cryptoKey);
        } catch (err) {
            console.error("Key derivation error:", err);
            setLocalError("We couldn't process this key. Please double-check it and try again.");
        }
    };

    const activeError = localError ?? errorMessage;

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] mb-6 shadow-sm border border-[var(--primary)]/20">
                    <ShieldCheck className="w-8 h-8" strokeWidth={2} />
                </div>
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
                    Unlock Your Records
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed max-w-[38ch] mx-auto">
                    To keep your data private, your records are locked with your unique recovery key. Please enter it below to continue.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {activeError && (
                    <div className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)] rounded-2xl text-sm flex items-start space-x-3 animate-slide-down">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{activeError}</span>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-sm font-semibold text-[var(--text)]" htmlFor="recovery-key">
                            Your Recovery Key
                        </label>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            32 Characters
                        </span>
                    </div>
                    <textarea
                        id="recovery-key"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            if (localError) {
                                setLocalError(null);
                            }
                        }}
                        className="w-full p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-[var(--text)] font-mono text-base leading-7 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all placeholder:text-[var(--text-muted)]/30"
                        placeholder="ABCD-EFGH-JKLM-NPQR..."
                        rows={3}
                        required
                        disabled={isSubmitting}
                        spellCheck={false}
                        autoCapitalize="characters"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !inputValue.trim()}
                    className="w-full flex justify-center items-center py-4 px-6 bg-[var(--primary)] text-white font-bold rounded-xl active-scale transition-all hover:bg-[var(--primary-hover)] shadow-[0_4px_12px_rgba(0,122,77,0.2)] disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Unlocking...
                        </>
                    ) : (
                        "Unlock & Continue"
                    )}
                </button>
            </form>

            <div className="mt-8 p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl flex items-start space-x-3">
                <Info className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Quick Tip</p>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                        You can paste your key directly from your password manager. We'll automatically clean up any extra spaces or dashes for you.
                    </p>
                </div>
            </div>
        </div>
    );
}
