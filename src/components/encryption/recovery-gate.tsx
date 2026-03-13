"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
    const [inputError, setInputError] = React.useState<string | null>(null);
    const [isSubmittingInput, setIsSubmittingInput] = React.useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = React.useMemo(() => createClient(), []);
    const sessionExpiredLoginHref = React.useMemo(() => {
        const params = new URLSearchParams({ error: "session_expired" });
        if (pathname) {
            params.set("next", pathname);
        }
        return `/login?${params.toString()}`;
    }, [pathname]);

    const redirectToLoginForExpiredSession = React.useCallback((setErrorMessage: (message: string) => void, fallbackStatus: "needs_setup" | "needs_input") => {
        setErrorMessage("Your session expired. Please sign in again.");
        setStatus(fallbackStatus);
        router.replace(sessionExpiredLoginHref);
    }, [router, sessionExpiredLoginHref]);

    React.useEffect(() => {
        if (mode !== "account_locked") {
            setSetupError(null);
            setInputError(null);
            setStatus('ready');
            return;
        }

        let mounted = true;

        async function checkState() {
            setStatus('checking');
            const { data: { user } } = await supabase.auth.getUser();
            if (!mounted) return;

            if (!user) {
                redirectToLoginForExpiredSession(setInputError, "needs_input");
                return;
            }

            const profile = await loadRecoveryProfileState(user.id, supabase);
            
            if (!mounted) return;

            if (!profile.keySetupComplete) {
                setSetupError(null);
                setInputError(null);
                setStatus('needs_setup');
            } else {
                setSetupError(null);
                setInputError(null);
                setStatus('needs_input');
            }
        }

        checkState();

        return () => { mounted = false; };
    }, [mode, redirectToLoginForExpiredSession, supabase]);

    const handleSetupComplete = async (keyString: string) => {
        setSetupError(null);
        setInputError(null);
        setIsSubmittingSetup(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                redirectToLoginForExpiredSession(setSetupError, "needs_setup");
                return;
            }

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

    const handleInputComplete = async (_keyString: string, cryptoKey: CryptoKey) => {
        setInputError(null);
        setIsSubmittingInput(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                redirectToLoginForExpiredSession(setInputError, "needs_input");
                return;
            }

            const profile = await loadRecoveryProfileState(user.id, supabase);

            if (!profile.keySetupComplete) {
                setStatus("needs_setup");
                setSetupError("This account still needs a recovery key on this device. Save the new key once, then continue.");
                return;
            }

            if (profile.validationPayload) {
                 const isValid = await verifyValidationPayload(profile.validationPayload, cryptoKey);
                 if (!isValid) {
                     setInputError("That recovery key does not match this account. Please try again.");
                     return;
                 }
            }

            await unlockAccount(cryptoKey, user.id);
        } catch (err) {
             console.error(err);
             setInputError(formatRecoveryUnlockError(err));
             setStatus('needs_input');
        } finally {
            setIsSubmittingInput(false);
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
                            <RecoveryKeyInput
                                onComplete={handleInputComplete}
                                errorMessage={inputError}
                                isSubmitting={isSubmittingInput}
                            />
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
                                    <span>Security Standards</span>
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
        if (message.includes("expired") || message.includes("session")) {
            return "Your session expired. Please sign in again.";
        }
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

function formatRecoveryUnlockError(error: unknown) {
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        const message = error.message;
        if (message.includes("expired") || message.includes("session")) {
            return "Your session expired. Please sign in again.";
        }
        if (message.includes("permission") || message.includes("row-level security")) {
            return "Cloud sync could not verify your recovery key because this account cannot read the sync profile yet.";
        }
        if (message.includes("user_profiles")) {
            return "Cloud sync could not verify your recovery key because the sync profile is not available yet.";
        }
        return message;
    }

    return "Cloud sync could not unlock your encrypted data just now. Please try again.";
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
