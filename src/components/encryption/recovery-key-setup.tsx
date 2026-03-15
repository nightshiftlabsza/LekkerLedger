"use client";

import * as React from "react";
import { generateRecoveryKey } from "@/lib/crypto";

interface RecoveryKeySetupProps {
    readonly onComplete: (key: string) => void;
    readonly errorMessage?: string | null;
    readonly isSubmitting?: boolean;
}

export function RecoveryKeySetup({
    onComplete,
    errorMessage,
    isSubmitting = false,
}: RecoveryKeySetupProps) {
    const [key, setKey] = React.useState<string | null>(null);
    const [confirmed, setConfirmed] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | null>(null);

    const handleGenerate = React.useCallback(() => {
        try {
            const newKey = generateRecoveryKey();
            setKey(newKey);
            setLocalError(null);
        } catch (error) {
            console.error("Recovery key generation failed.", error);
            setLocalError("We cannot create the secure recovery key on this device right now.");
        }
    }, []);

    const handleComplete = React.useCallback(() => {
        if (key && confirmed) {
            onComplete(key);
        }
    }, [key, confirmed, onComplete]);

    return (
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Maximum Privacy
                </p>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[var(--text)]">
                    Save your recovery key.
                </h2>
                <p className="text-sm leading-7 text-[var(--text-muted)]">
                    This key unlocks your encrypted records on later devices. LekkerLedger cannot replace it for you.
                </p>
            </div>

            {!key ? (
                <button
                    onClick={handleGenerate}
                    className="mt-6 w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-bold text-white transition-opacity hover:opacity-90"
                >
                    Generate Recovery Key
                </button>
            ) : (
                <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 text-center">
                        <p className="type-mono text-lg font-black tracking-widest break-all">
                            {key}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="confirm-key"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="h-4 w-4 rounded border-[var(--border)]"
                        />
                        <label htmlFor="confirm-key" className="text-sm font-medium">
                            I have saved this key in a safe place.
                        </label>
                    </div>

                    <button
                        onClick={handleComplete}
                        disabled={!confirmed || isSubmitting}
                        className="w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Continue securely"}
                    </button>
                </div>
            )}

            {localError || errorMessage ? (
                <p className="mt-4 text-sm font-medium text-[var(--danger)]">{localError ?? errorMessage}</p>
            ) : null}
        </div>
    );
}
