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

    const handleGenerate = React.useCallback(() => {
        const newKey = generateRecoveryKey();
        setKey(newKey);
    }, []);

    const handleComplete = React.useCallback(() => {
        if (key && confirmed) {
            onComplete(key);
        }
    }, [key, confirmed, onComplete]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-bold">Secure your account</h2>
                <p className="text-sm text-[var(--text-muted)]">
                    This recovery key is the only way to access your encrypted data if you lose your password or change devices. Store it somewhere safe.
                </p>
            </div>

            {!key ? (
                <button
                    onClick={handleGenerate}
                    className="w-full rounded-lg bg-[var(--primary)] px-4 py-3 font-bold text-white transition-opacity hover:opacity-90"
                >
                    Generate Recovery Key
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-[var(--primary)] bg-[var(--surface-2)] p-6 text-center">
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
                        className="w-full rounded-lg bg-[var(--primary)] px-4 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Continue to Dashboard"}
                    </button>
                </div>
            )}

            {errorMessage && (
                <p className="text-sm font-medium text-[var(--danger)]">{errorMessage}</p>
            )}
        </div>
    );
}
