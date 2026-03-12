"use client";

import * as React from "react";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import { deriveKey } from "@/lib/crypto";

interface RecoveryKeyInputProps {
    onComplete: (key: string, cryptoKey: CryptoKey) => void;
    expectedValidationToken?: string; // TBD: used if we want to validate the key immediately
}

export function RecoveryKeyInput({ onComplete }: RecoveryKeyInputProps) {
    const [inputValue, setInputValue] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const cleanKey = inputValue.trim().replace(/\s+/g, '');
        if (!cleanKey || cleanKey.length < 32) {
            setError("Please enter a valid recovery key.");
            return;
        }

        setIsLoading(true);

        try {
            // Derive the actual Web Crypto key to ensure the format is technically somewhat valid
            const cryptoKey = await deriveKey(cleanKey);
            
            // Here we could technically decrypt a test payload from the server to validate it's the *correct* key.
            // For now, assume it's valid if derivation doesn't throw.
            onComplete(cleanKey, cryptoKey);
        } catch (err) {
            console.error("Key derivation error:", err);
            setError("Invalid key format. Please check your recovery key and try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-lg)] animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] mb-6 shadow-sm border border-[var(--primary)]/20">
                    <KeyRound className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <h1 className="font-serif text-2xl font-bold text-[var(--text)] mb-3 tracking-tight">
                    Enter Recovery Key
                </h1>
                <p className="text-[var(--text-muted)] text-[0.95rem] leading-relaxed max-w-[34ch] mx-auto">
                    To decrypt your synced data on this device, please enter your 256-bit recovery key.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)] rounded-2xl text-sm flex items-start space-x-3 animate-slide-down">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-[var(--text)]" htmlFor="recovery-key">
                        Recovery Key
                    </label>
                    <textarea
                        id="recovery-key"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-[var(--text)] font-mono text-sm leading-7 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                        placeholder="AAAA-BBBB-CCCC-DDDD..."
                        rows={3}
                        required
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="w-full flex justify-center items-center py-3.5 px-4 bg-[var(--primary)] text-white font-bold rounded-xl active-scale transition-all hover:bg-[var(--primary-hover)] shadow-[0_2px_10px_rgba(0,122,77,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Unlocking...
                        </>
                    ) : (
                        "Unlock Data"
                    )}
                </button>
            </form>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Tip</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    You can paste the recovery key with spaces or line breaks. LekkerLedger will clean the format before unlocking this device.
                </p>
            </div>
        </div>
    );
}
