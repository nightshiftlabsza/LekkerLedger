"use client";

import * as React from "react";
import { useAppMode } from "@/lib/app-mode";
import { RecoveryKeySetup } from "./recovery-key-setup";
import { RecoveryKeyInput } from "./recovery-key-input";
import { createClient } from "@/lib/supabase/client";
import { deriveKey, generateValidationPayload, verifyValidationPayload, type EncryptedPayload } from "@/lib/crypto";
import { getLocalRecoveryProfile, saveLocalRecoveryProfile } from "@/lib/recovery-profile-store";
import { Loader2 } from "lucide-react";

interface RecoveryProfileState {
    keySetupComplete: boolean;
    validationPayload: EncryptedPayload | null;
    source: "remote" | "local" | "none";
}

export function RecoveryGate({ children }: { children: React.ReactNode }) {
    const { mode, unlockAccount } = useAppMode();
    const [status, setStatus] = React.useState<'checking' | 'needs_setup' | 'needs_input' | 'ready'>('ready');
    const [setupError, setSetupError] = React.useState<string | null>(null);
    const [isSubmittingSetup, setIsSubmittingSetup] = React.useState(false);
    const supabase = createClient();

    React.useEffect(() => {
        if (mode !== "account_locked") {
            setStatus('ready');
            return;
        }

        let mounted = true;

        async function checkState() {
            setStatus('checking');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !mounted) return;

            const profile = await loadRecoveryProfileState(user.id, supabase);
            
            if (!mounted) return;

            if (!profile.keySetupComplete) {
                setSetupError(null);
                setStatus('needs_setup');
            } else {
                setStatus('needs_input');
            }
        }

        checkState();

        return () => { mounted = false; };
    }, [mode, supabase]);

    const handleSetupComplete = async (keyString: string) => {
        setSetupError(null);
        setIsSubmittingSetup(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const cryptoKey = await deriveKey(keyString);
            const payload = await generateValidationPayload(cryptoKey);

            await saveLocalRecoveryProfile(user.id, {
                keySetupComplete: true,
                validationPayload: payload,
                updatedAt: new Date().toISOString(),
            });

            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    key_setup_complete: true,
                    validation_payload: payload,
                }, {
                    onConflict: 'id',
                });

            if (error) {
                console.warn("Could not save recovery profile to Supabase. Continuing with local device copy only.", error);
            }

            await unlockAccount(cryptoKey, user.id);
        } catch (err) {
            console.error(err);
            setSetupError(formatRecoverySetupError(err));
            setStatus('needs_setup');
        } finally {
            setIsSubmittingSetup(false);
        }
    };

    const handleInputComplete = async (keyString: string, cryptoKey: CryptoKey) => {
        setStatus('checking');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const profile = await loadRecoveryProfileState(user.id, supabase);

            if (profile.validationPayload) {
                 const isValid = await verifyValidationPayload(profile.validationPayload, cryptoKey);
                 if (!isValid) {
                     alert("Incorrect Recovery Key. Please try again.");
                     setStatus('needs_input');
                     return;
                 }
            }

            await unlockAccount(cryptoKey, user.id);
        } catch (err) {
             console.error(err);
             alert("Error validating key.");
             setStatus('needs_input');
        }
    };

    if (mode === "local_guest" || mode === "account_unlocked" || status === "ready") {
        return <>{children}</>;
    }

    // Modal takeover for locked state
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg)] animate-fade-in selection:bg-[var(--primary)]/20">
            <div className="min-h-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <div className="content-container-wide mx-auto">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,44rem)_minmax(22rem,30rem)] xl:items-start 2xl:grid-cols-[minmax(0,48rem)_minmax(24rem,32rem)]">
                        <div className="mx-auto w-full max-w-[44rem] xl:mx-0">
                            <div className="mb-5 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] px-5 py-5 shadow-[var(--shadow-sm)] sm:px-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                    Secure sync unlock
                                </p>
                                <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[var(--text)] sm:text-[2rem]">
                                    Keep this device connected to your encrypted payroll records.
                                </h2>
                                <p className="mt-3 max-w-[54ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                                    This step protects your cloud sync with a recovery key only you control. The main action stays in one clear column, while the supporting guidance sits beside it on larger screens and stacks cleanly on smaller ones.
                                </p>
                            </div>

                            <div className="w-full">
                        {status === 'checking' && (
                            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-3xl p-12 text-center shadow-[var(--shadow-lg)]">
                                <Loader2 className="w-12 h-12 animate-spin mb-6 text-[var(--primary)] mx-auto" />
                                <h2 className="font-serif text-2xl font-bold text-[var(--text)] mb-2">Verifying Vault</h2>
                                <p className="text-[var(--text-muted)] animate-pulse">Establishing secure connection...</p>
                            </div>
                        )}
                        
                        {status === 'needs_setup' && (
                            <RecoveryKeySetup
                                onComplete={handleSetupComplete}
                                errorMessage={setupError}
                                isSubmitting={isSubmittingSetup}
                            />
                        )}

                        {status === 'needs_input' && (
                            <RecoveryKeyInput onComplete={handleInputComplete} />
                        )}
                            </div>
                        </div>

                        <div className="space-y-5 xl:sticky xl:top-6 animate-slide-right delay-200">
                            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                                <div className="border-l-4 border-[var(--focus)] pl-5">
                            <h3 className="font-serif text-xl font-bold text-[var(--text)] mb-4">Why is this locked?</h3>
                            <div className="space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
                                <p>
                                    LekkerLedger uses <strong>Zero-Knowledge Encryption</strong>. This means your data is &quot;scrambled&quot; with your recovery key before it ever leaves your device.
                                </p>
                                <p>
                                    Even if our servers were compromised, your payroll records would be unreadable to anyone without your key. Not even our team can see your data.
                                </p>
                                <p>
                                    You only need to enter this key once per device to &quot;unlock&quot; the cloud sync.
                                </p>
                            </div>
                        </div>
                            </div>

                            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                                <div className="flex items-center gap-3 text-[var(--primary)] font-bold uppercase tracking-widest text-[10px]">
                                    <span className="w-8 h-px bg-[var(--primary)]/30" />
                                    Security Standards
                                </div>
                                <ul className="mt-5 space-y-4 text-xs sm:text-sm">
                                    <li className="flex gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">✓</div>
                                        <span className="text-[var(--text-muted)]">AES-256-GCM encryption for protected record payloads</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">✓</div>
                                        <span className="text-[var(--text-muted)]">PBKDF2 key derivation before sync secrets are used</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">✓</div>
                                        <span className="text-[var(--text-muted)]">POPIA-aware design for South African household payroll records</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatRecoverySetupError(error: unknown) {
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        const message = error.message;
        if (message.includes("user_profiles")) {
            return "Cloud sync could not finish setting up your recovery key. The sync profile table is not available yet.";
        }
        if (message.includes("row-level security") || message.includes("permission")) {
            return "Cloud sync could not save your recovery-key setup because this account does not have permission to write the profile record yet.";
        }
        return message;
    }

    return "Cloud sync could not finish setting up your recovery key. Please try again.";
}

async function loadRecoveryProfileState(
    userId: string,
    supabase: ReturnType<typeof createClient>,
): Promise<RecoveryProfileState> {
    const localProfile = await getLocalRecoveryProfile(userId);

    const { data, error } = await supabase
        .from("user_profiles")
        .select("key_setup_complete, validation_payload")
        .eq("id", userId)
        .maybeSingle();

    if (data?.key_setup_complete) {
        return {
            keySetupComplete: true,
            validationPayload: (data.validation_payload as EncryptedPayload | null) ?? null,
            source: "remote",
        };
    }

    if (error) {
        console.warn("Could not read recovery profile from Supabase. Falling back to local device state.", error);
    }

    if (localProfile?.keySetupComplete) {
        return {
            keySetupComplete: true,
            validationPayload: localProfile.validationPayload,
            source: "local",
        };
    }

    return {
        keySetupComplete: false,
        validationPayload: null,
        source: "none",
    };
}
