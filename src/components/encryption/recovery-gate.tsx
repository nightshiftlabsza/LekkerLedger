"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppMode } from "@/lib/app-mode";
import { RecoveryKeySetup } from "./recovery-key-setup";
import { RecoveryKeyInput } from "./recovery-key-input";
import { createClient } from "@/lib/supabase/client";
import { decryptData, deriveKey, generateValidationPayload, verifyValidationPayload, type EncryptedPayload } from "@/lib/crypto";
import { getLocalRecoveryProfile, saveLocalRecoveryProfile } from "@/lib/recovery-profile-store";
import { Loader2 } from "lucide-react";

interface RecoveryProfileState {
    keySetupComplete: boolean;
    validationPayload: EncryptedPayload | null;
    fallbackEncryptedRecord: EncryptedPayload | null;
    source: "remote" | "local" | "cloud_data" | "none";
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
            setStatus("checking");
            try {
                // Initial check
                let { data: { user } } = await supabase.auth.getUser();
                
                // If no user is found immediately, wait a moment and try one more time.
                // This accounts for slow cookie/storage synchronization after a login navigation.
                if (!user && mounted) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                    const retry = await supabase.auth.getUser();
                    user = retry.data.user;
                }

                if (!mounted) return;

                if (!user) {
                    redirectToLoginForExpiredSession(setInputError, "needs_input");
                    return;
                }

                const profile = await loadRecoveryProfileState(user.id, supabase);
                if (!mounted) return;

                if (profile.keySetupComplete) {
                    setSetupError(null);
                    setInputError(null);
                    setStatus("needs_input");
                } else {
                    setSetupError(null);
                    setInputError(null);
                    setStatus("needs_setup");
                }
            } catch (error) {
                if (!mounted) return;
                console.error("Could not check recovery-key status.", error);
                setInputError("We could not verify your encrypted login on this device. Please sign in again.");
                setStatus("needs_input");
            }
        }

        checkState();

        return () => { mounted = false; };
    }, [mode, redirectToLoginForExpiredSession, supabase]);

    React.useEffect(() => {
        if (mode !== "account_unlocked") {
            return;
        }

        let mounted = true;

        async function repairRemoteProfileFromLocal() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!mounted || !user) return;

                const localProfile = await getLocalRecoveryProfile(user.id);
                if (!mounted || !localProfile?.keySetupComplete || !localProfile.validationPayload) {
                    return;
                }

                const { data, error } = await supabase
                    .from("user_profiles")
                    .select("key_setup_complete, validation_payload")
                    .eq("id", user.id)
                    .maybeSingle();

                if (!mounted) return;

                if (error) {
                    console.warn("Could not verify the remote recovery profile while repairing sync setup.", error);
                }

                if (data?.key_setup_complete && data.validation_payload) {
                    return;
                }

                const { error: upsertError } = await supabase
                    .from("user_profiles")
                    .upsert({
                        id: user.id,
                        key_setup_complete: true,
                        validation_payload: localProfile.validationPayload,
                    }, {
                        onConflict: "id",
                    });

                if (upsertError) {
                    console.warn("Could not repair the missing remote recovery profile from this device.", upsertError);
                }
            } catch (error) {
                if (!mounted) return;
                console.warn("Could not repair the missing remote recovery profile from the unlocked device.", error);
            }
        }

        void repairRemoteProfileFromLocal();

        return () => {
            mounted = false;
        };
    }, [mode, supabase]);

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
                recoveryKey: keyString, // Store locally for auto-unlock
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
                throw error;
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
            } else if (profile.fallbackEncryptedRecord) {
                try {
                    await decryptData(profile.fallbackEncryptedRecord, cryptoKey);
                } catch {
                    setInputError("That recovery key does not match this account. Please try again.");
                    return;
                }
            }

            if (profile.source === "cloud_data") {
                await repairRemoteRecoveryProfile(user.id, cryptoKey, supabase);
            }

            // Save the valid key locally for future auto-unlocks
            await saveLocalRecoveryProfile(user.id, {
                keySetupComplete: true,
                validationPayload: profile.validationPayload,
                recoveryKey: keyString,
                updatedAt: new Date().toISOString(),
            });

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
                                    Privacy & Security
                                </p>
                                <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[var(--text)] sm:text-[2rem]">
                                    Unlock your encrypted records.
                                </h2>
                                <p className="mt-3 max-w-[54ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                                    LekkerLedger uses <strong>Zero-Knowledge Encryption</strong>. This means your data is scrambled with your recovery key before it ever leaves your device. Even if our servers were compromised, your records would be unreadable to anyone without your key.
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
                                <h3 className="text-lg font-bold text-[var(--text)]">
                                    Important Security Note
                                </h3>
                                <div className="mt-3 space-y-4 text-sm leading-7 text-[var(--text-muted)]">
                                    <p>
                                        Because we cannot see your key, <strong>we cannot reset it for you</strong>. If you lose your recovery key, you will lose access to your synced data permanently.
                                    </p>
                                    <p>
                                        We recommend storing your recovery key in a safe place, like a password manager or a secure physical location.
                                    </p>
                                    <p className="font-semibold text-[var(--text)]">
                                        Once unlocked, this device will stay connected to your records unless you manually sign out.
                                    </p>
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
            fallbackEncryptedRecord: null,
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
            fallbackEncryptedRecord: null,
            source: "local",
        };
    }

    const { data: syncedRecord, error: syncedRecordError } = await supabase
        .from("synced_records")
        .select("encrypted_data")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    if (syncedRecord?.encrypted_data) {
        return {
            keySetupComplete: true,
            validationPayload: null,
            fallbackEncryptedRecord: syncedRecord.encrypted_data as EncryptedPayload,
            source: "cloud_data",
        };
    }

    if (syncedRecordError) {
        console.warn("Could not inspect encrypted cloud records while checking recovery-key status.", syncedRecordError);
    }

    return {
        keySetupComplete: false,
        validationPayload: null,
        fallbackEncryptedRecord: null,
        source: "none",
    };
}

async function repairRemoteRecoveryProfile(
    userId: string,
    cryptoKey: CryptoKey,
    supabase: ReturnType<typeof createClient>,
) {
    const payload = await generateValidationPayload(cryptoKey);

    await saveLocalRecoveryProfile(userId, {
        keySetupComplete: true,
        validationPayload: payload,
        updatedAt: new Date().toISOString(),
    });

    const { error } = await supabase
        .from("user_profiles")
        .upsert({
            id: userId,
            key_setup_complete: true,
            validation_payload: payload,
        }, {
            onConflict: "id",
        });

    if (error) {
        console.warn("Could not repair the missing recovery profile in Supabase after a successful unlock.", error);
    }
}
