"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppMode } from "@/lib/app-mode";
import { clearCredentialHandoff, consumeCredentialHandoff, hasCredentialHandoff } from "@/lib/credential-handoff";
import { buildRecoverableSetupArtifacts, requestRecoveredMasterKey, sendRecoverableSetupRequest } from "@/lib/recoverable-account";
import { RecoveryKeyInput } from "./recovery-key-input";
import { RecoverableAccessPanel } from "./recoverable-access-panel";
import { createClient } from "@/lib/supabase/client";
import {
    decryptData,
    exportAccountMasterKey,
    generateAccountMasterKey,
    generateValidationPayload,
    importAccountMasterKey,
    unwrapMasterKeyWithPassword,
    verifyValidationPayload,
    wrapMasterKeyWithPassword,
    type WrappedKeyPayload,
} from "@/lib/crypto";
import { loadEncryptionProfileState, type EncryptionProfileState } from "@/lib/encryption-profile";
import {
    getAccountStatusSummary,
    getEncryptionModeLabel,
    getEncryptionModeSummary,
    getLockedSummary,
    normalizeEncryptionMode,
} from "@/lib/encryption-mode";
import { getLocalRecoveryProfile, saveLocalRecoveryProfile } from "@/lib/recovery-profile-store";
import { storeRecoveryNotice } from "@/lib/recovery-notice";

type RecoveryGateStep =
    | "checking"
    | "opening_device"
    | "max_privacy_input"
    | "recoverable_setup"
    | "recoverable_input"
    | "ready";

function isWrappedKeyPayload(value: unknown): value is WrappedKeyPayload {
    return Boolean(
        value
        && typeof value === "object"
        && "ciphertext" in value
        && "iv" in value
        && "salt" in value
        && "kdf" in value,
    );
}

function redirectToLoginForExpiredSession(
    router: ReturnType<typeof useRouter>,
    sessionExpiredLoginHref: string,
    setStatus: React.Dispatch<React.SetStateAction<RecoveryGateStep>>,
    setErrorMessage: (message: string) => void,
    fallbackStatus: RecoveryGateStep,
) {
    setErrorMessage("Your session expired. Please sign in again.");
    setStatus(fallbackStatus);
    router.replace(sessionExpiredLoginHref);
}

function resolvePasswordForCurrentUser(
    userEmail: string | null | undefined,
    input: { password: string | null; useSavedPassword: boolean },
) {
    if (input.useSavedPassword) {
        return consumeCredentialHandoff(userEmail ?? null);
    }

    return input.password?.trim() || null;
}

export function RecoveryGate({ children }: { children: React.ReactNode }) {
    const { mode, encryptionMode, setEncryptionMode, unlockAccount } = useAppMode();
    const [status, setStatus] = React.useState<RecoveryGateStep>("checking");
    const [profileState, setProfileState] = React.useState<EncryptionProfileState | null>(null);
    const [setupError, setSetupError] = React.useState<string | null>(null);
    const [inputError, setInputError] = React.useState<string | null>(null);
    const [isSubmittingSetup, setIsSubmittingSetup] = React.useState(false);
    const [isSubmittingInput, setIsSubmittingInput] = React.useState(false);
    const [isRecovering, setIsRecovering] = React.useState(false);
    const [savedPasswordReady, setSavedPasswordReady] = React.useState(false);
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

    const effectiveMode = profileState?.encryptionMode ?? encryptionMode;

    const getAuthenticatedUser = React.useCallback(async () => {
        let { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const retry = await supabase.auth.getUser();
            user = retry.data.user;
        }
        return user;
    }, [supabase]);

    React.useEffect(() => {
        if (mode !== "account_locked") {
            setSetupError(null);
            setInputError(null);
            setStatus("ready");
            return;
        }

        let mounted = true;

        async function checkState() {
            setStatus("checking");
            try {
                const user = await getAuthenticatedUser();
                if (!mounted) return;

                if (!user) {
                    redirectToLoginForExpiredSession(router, sessionExpiredLoginHref, setStatus, setInputError, "recoverable_input");
                    return;
                }

                const nextProfileState = await loadEncryptionProfileState(user.id, supabase);
                if (!mounted) return;

                const canUseSavedPassword = hasCredentialHandoff(user.email ?? null);

                setProfileState(nextProfileState);
                setSetupError(null);
                setInputError(null);
                setEncryptionMode(nextProfileState.source === "none" ? null : nextProfileState.encryptionMode);
                setSavedPasswordReady(canUseSavedPassword);

                if (!nextProfileState.keySetupComplete) {
                    setStatus("recoverable_setup");
                    return;
                }

                if (nextProfileState.encryptionMode === "recoverable") {
                    setStatus(canUseSavedPassword ? "opening_device" : "recoverable_input");
                    return;
                }

                setStatus("max_privacy_input");
            } catch (error) {
                if (!mounted) return;
                console.error("Could not check encrypted account state.", error);
                setInputError("We could not verify the secure unlock step on this device. Please sign in again.");
                setStatus("recoverable_input");
            }
        }

        checkState().catch(() => undefined);

        return () => {
            mounted = false;
        };
    }, [getAuthenticatedUser, mode, router, sessionExpiredLoginHref, setEncryptionMode, supabase]);

    React.useEffect(() => {
        if (mode !== "account_unlocked" || encryptionMode !== "maximum_privacy") {
            return;
        }

        let mounted = true;

        async function repairLegacyMaximumPrivacyProfile() {
            try {
                const user = await getAuthenticatedUser();
                if (!mounted || !user) return;

                const localProfile = await getLocalRecoveryProfile(user.id);
                if (!mounted || !localProfile?.validationPayload) {
                    return;
                }

                const { data, error } = await supabase
                    .from("user_profiles")
                    .select("key_setup_complete, encryption_mode")
                    .eq("id", user.id)
                    .maybeSingle();

                if (!mounted) return;

                if (error) {
                    console.warn("Could not verify the legacy remote profile while repairing Maximum Privacy setup.", error);
                }

                if (data?.key_setup_complete && normalizeEncryptionMode(data.encryption_mode) === "maximum_privacy") {
                    return;
                }

                const { error: upsertError } = await supabase
                    .from("user_profiles")
                    .upsert({
                        id: user.id,
                        encryption_mode: "maximum_privacy",
                        mode_version: 1,
                        key_setup_complete: true,
                        validation_payload: localProfile.validationPayload,
                    }, {
                        onConflict: "id",
                    });

                if (upsertError) {
                    console.warn("Could not repair the missing Maximum Privacy profile from this device.", upsertError);
                }
            } catch (error) {
                if (!mounted) return;
                console.warn("Could not repair the missing Maximum Privacy profile from the unlocked device.", error);
            }
        }

        repairLegacyMaximumPrivacyProfile().catch(() => undefined);

        return () => {
            mounted = false;
        };
    }, [encryptionMode, getAuthenticatedUser, mode, supabase]);

    const handleMaximumPrivacyUnlock = React.useCallback(async (keyString: string, cryptoKey: CryptoKey) => {
        setInputError(null);
        setIsSubmittingInput(true);
        try {
            const user = await getAuthenticatedUser();
            if (!user) {
                redirectToLoginForExpiredSession(router, sessionExpiredLoginHref, setStatus, setInputError, "max_privacy_input");
                return;
            }

            const nextProfileState = await loadEncryptionProfileState(user.id, supabase);

            if (!nextProfileState.keySetupComplete) {
                setInputError("This account's secure setup looks incomplete. Please sign in again.");
                return;
            }

            if (nextProfileState.validationPayload) {
                const isValid = await verifyValidationPayload(nextProfileState.validationPayload, cryptoKey);
                if (!isValid) {
                    setInputError("That recovery key does not match this account. Please try again.");
                    return;
                }
            } else if (nextProfileState.fallbackEncryptedRecord) {
                try {
                    await decryptData(nextProfileState.fallbackEncryptedRecord, cryptoKey);
                } catch {
                    setInputError("That recovery key does not match this account. Please try again.");
                    return;
                }
            }

            await saveLocalRecoveryProfile(user.id, {
                encryptionMode: "maximum_privacy",
                keySetupComplete: true,
                validationPayload: nextProfileState.validationPayload,
                recoveryKey: keyString,
                updatedAt: new Date().toISOString(),
            });

            setProfileState(nextProfileState);
            setEncryptionMode("maximum_privacy");
            await unlockAccount(cryptoKey, user.id);
        } catch (error) {
            console.error(error);
            setInputError(formatRecoveryUnlockError(error));
            setStatus("max_privacy_input");
        } finally {
            setIsSubmittingInput(false);
        }
    }, [getAuthenticatedUser, router, sessionExpiredLoginHref, setEncryptionMode, supabase, unlockAccount]);

    const unlockRecoverableAccount = React.useCallback(async ({
        user,
        password,
        nextProfileState,
    }: {
        user: { id: string; email?: string | null };
        password: string;
        nextProfileState?: EncryptionProfileState | null;
    }) => {
        const resolvedProfileState = nextProfileState ?? await loadEncryptionProfileState(user.id, supabase);
        if (!isWrappedKeyPayload(resolvedProfileState.wrappedMasterKeyUser)) {
            setInputError("Recoverable setup is incomplete for this account. Please complete setup again.");
            setStatus("recoverable_setup");
            return false;
        }

        const masterKey = await unwrapMasterKeyWithPassword(resolvedProfileState.wrappedMasterKeyUser, password);

        if (resolvedProfileState.validationPayload) {
            const isValid = await verifyValidationPayload(resolvedProfileState.validationPayload, masterKey);
            if (!isValid) {
                throw new Error("PASSWORD_WRAP_FAILED");
            }
        }

        await saveLocalRecoveryProfile(user.id, {
            encryptionMode: "recoverable",
            keySetupComplete: true,
            validationPayload: resolvedProfileState.validationPayload,
            cachedMasterKey: await exportAccountMasterKey(masterKey),
            updatedAt: new Date().toISOString(),
        });

        clearCredentialHandoff();
        setSavedPasswordReady(false);
        setEncryptionMode("recoverable");
        setProfileState(resolvedProfileState);
        await unlockAccount(masterKey, user.id);
        return true;
    }, [setEncryptionMode, supabase, unlockAccount]);

    const recoverRecoverableAccount = React.useCallback(async ({
        user,
        password,
    }: {
        user: { id: string; email?: string | null };
        password: string;
    }) => {
        if (!user.email) {
            throw new Error("Account email is unavailable. Please sign in again before recovery.");
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password,
        });

        if (signInError) {
            throw new Error("That password did not match your account. Please enter the current password you use to sign in.");
        }

        const { rawMasterKey } = await requestRecoveredMasterKey("password_reset");
        const masterKey = await importAccountMasterKey(rawMasterKey);
        const wrappedMasterKeyUser = await wrapMasterKeyWithPassword(masterKey, password);
        const validationPayload = await generateValidationPayload(masterKey);

        const { error } = await supabase
            .from("user_profiles")
            .upsert({
                id: user.id,
                encryption_mode: "recoverable",
                mode_version: 1,
                key_setup_complete: true,
                validation_payload: validationPayload,
                wrapped_master_key_user: wrappedMasterKeyUser,
                user_wrap_salt: wrappedMasterKeyUser.salt,
                user_wrap_kdf: wrappedMasterKeyUser.kdf,
            }, {
                onConflict: "id",
            });

        if (error) {
            throw error;
        }

        await saveLocalRecoveryProfile(user.id, {
            encryptionMode: "recoverable",
            keySetupComplete: true,
            validationPayload,
            cachedMasterKey: rawMasterKey,
            updatedAt: new Date().toISOString(),
        });

        clearCredentialHandoff();
        setSavedPasswordReady(false);
        setEncryptionMode("recoverable");
        setProfileState({
            encryptionMode: "recoverable",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload,
            wrappedMasterKeyUser,
            recentRecoveryNoticeAt: new Date().toISOString(),
            recentRecoveryEventKind: "password_reset",
            source: "remote",
            fallbackEncryptedRecord: null,
        });
        storeRecoveryNotice("recoverable");
        await unlockAccount(masterKey, user.id);
    }, [setEncryptionMode, supabase, unlockAccount]);

    React.useEffect(() => {
        if (mode !== "account_locked" || status !== "opening_device") {
            return;
        }

        let mounted = true;

        async function autoOpenRecoverableDevice() {
            setInputError(null);
            setIsSubmittingInput(true);
            let savedPassword: string | null = null;
            try {
                const user = await getAuthenticatedUser();
                if (!mounted) return;

                if (!user) {
                    redirectToLoginForExpiredSession(router, sessionExpiredLoginHref, setStatus, setInputError, "recoverable_input");
                    return;
                }

                savedPassword = consumeCredentialHandoff(user.email ?? null);
                if (!savedPassword) {
                    setSavedPasswordReady(false);
                    setInputError("Sign-in worked, but this device still needs your password to open the encrypted records.");
                    setStatus("recoverable_input");
                    return;
                }

                const nextProfileState = profileState ?? await loadEncryptionProfileState(user.id, supabase);
                if (!mounted) return;

                await unlockRecoverableAccount({
                    user,
                    password: savedPassword,
                    nextProfileState,
                });
            } catch (error) {
                if (!mounted) return;
                console.error(error);
                if (!savedPassword) {
                    clearCredentialHandoff();
                    setSavedPasswordReady(false);
                    setInputError("Sign-in worked, but this device still needs your password to open the encrypted records.");
                    setStatus("recoverable_input");
                    return;
                }

                setIsRecovering(true);
                try {
                    const user = await getAuthenticatedUser();
                    if (!mounted) return;

                    if (!user) {
                        redirectToLoginForExpiredSession(router, sessionExpiredLoginHref, setStatus, setInputError, "recoverable_input");
                        return;
                    }

                    await recoverRecoverableAccount({ user, password: savedPassword });
                } catch (recoveryError) {
                    if (!mounted) return;
                    console.error(recoveryError);
                    clearCredentialHandoff();
                    setSavedPasswordReady(false);
                    setInputError("Sign-in worked, but we could not finish account recovery automatically. Enter your current password and open records again.");
                    setStatus("recoverable_input");
                } finally {
                    if (mounted) {
                        setIsRecovering(false);
                    }
                }
            } finally {
                if (mounted) {
                    setIsSubmittingInput(false);
                }
            }
        }

        autoOpenRecoverableDevice().catch(() => undefined);

        return () => {
            mounted = false;
        };
    }, [getAuthenticatedUser, mode, profileState, recoverRecoverableAccount, router, sessionExpiredLoginHref, status, supabase, unlockRecoverableAccount]);

    const handleRecoverableSubmit = React.useCallback(async (input: { password: string | null; useSavedPassword: boolean }) => {
        const isSetupFlow = status === "recoverable_setup";
        const setError = isSetupFlow ? setSetupError : setInputError;
        let recoveryUser: { id: string; email?: string | null } | null = null;
        let recoveryPassword: string | null = null;

        setError(null);
        if (isSetupFlow) {
            setIsSubmittingSetup(true);
        } else {
            setIsSubmittingInput(true);
        }

        try {
            const user = await getAuthenticatedUser();
            if (!user) {
                redirectToLoginForExpiredSession(router, sessionExpiredLoginHref, setStatus, setError, status);
                return;
            }
            recoveryUser = user;

            const password = resolvePasswordForCurrentUser(user.email ?? null, input);
            if (!password) {
                setSavedPasswordReady(false);
                setError("Enter your password to continue on this device.");
                return;
            }
            recoveryPassword = password;

            if (isSetupFlow) {
                const masterKey = await generateAccountMasterKey();
                const artifacts = await buildRecoverableSetupArtifacts(masterKey, password);
                const setupResult = await sendRecoverableSetupRequest({
                    rawMasterKey: artifacts.rawMasterKey,
                    validationPayload: artifacts.validationPayload,
                    wrappedMasterKeyUser: artifacts.wrappedMasterKeyUser,
                    source: "setup",
                });

                if (setupResult.alreadyComplete) {
                    // The previous request reached Supabase but the browser
                    // did not finish saving its local cache. Reload so the
                    // normal recovery path can use the authoritative profile.
                    window.location.reload();
                    return;
                }

                await saveLocalRecoveryProfile(user.id, {
                    encryptionMode: "recoverable",
                    keySetupComplete: true,
                    validationPayload: artifacts.validationPayload,
                    cachedMasterKey: artifacts.cachedMasterKey,
                    updatedAt: new Date().toISOString(),
                });

                clearCredentialHandoff();
                setSavedPasswordReady(false);
                setEncryptionMode("recoverable");
                setProfileState({
                    encryptionMode: "recoverable",
                    modeVersion: 1,
                    keySetupComplete: true,
                    validationPayload: artifacts.validationPayload,
                    wrappedMasterKeyUser: artifacts.wrappedMasterKeyUser,
                    recentRecoveryNoticeAt: null,
                    recentRecoveryEventKind: null,
                    source: "remote",
                    fallbackEncryptedRecord: null,
                });
                await unlockAccount(masterKey, user.id);
                return;
            }

            await unlockRecoverableAccount({ user, password });
        } catch (error) {
            console.error(error);
            if (!isSetupFlow && recoveryUser && recoveryPassword) {
                setIsRecovering(true);
                try {
                    await recoverRecoverableAccount({ user: recoveryUser, password: recoveryPassword });
                    return;
                } catch (recoveryError) {
                    console.error(recoveryError);
                    if (input.useSavedPassword) {
                        clearCredentialHandoff();
                        setSavedPasswordReady(false);
                    }
                    setInputError(formatRecoverableRecoveryError(recoveryError));
                    setStatus("recoverable_input");
                    return;
                } finally {
                    setIsRecovering(false);
                }
            }

            if (input.useSavedPassword) {
                clearCredentialHandoff();
                setSavedPasswordReady(false);
            }
            setInputError(formatRecoverableUnlockError(error));
            setStatus(isSetupFlow ? "recoverable_setup" : "recoverable_input");
        } finally {
            if (isSetupFlow) {
                setIsSubmittingSetup(false);
            } else {
                setIsSubmittingInput(false);
            }
        }
    }, [getAuthenticatedUser, recoverRecoverableAccount, router, sessionExpiredLoginHref, setEncryptionMode, status, unlockRecoverableAccount, unlockAccount]);

    let gateHeading = "Unlock your encrypted records.";
    if (status === "opening_device") {
        gateHeading = "Opening your encrypted workspace.";
    } else if (status === "recoverable_input") {
        gateHeading = "Finish opening this device.";
    } else if (status === "recoverable_setup") {
        gateHeading = "Finish secure setup.";
    }

    let gateSummary = "Finish the secure unlock step on this device so your encrypted records can open.";
    if (status === "opening_device") {
        gateSummary = "Sign-in worked. We are opening or recovering the encrypted records on this device now.";
    } else if (status === "recoverable_setup") {
        gateSummary = "Set up Recoverable Encryption with your password so this device can open your encrypted records.";
    } else if (status === "recoverable_input") {
        gateSummary = "Sign-in worked, but this device still needs one local password check before your records can open.";
    } else if (effectiveMode) {
        gateSummary = getEncryptionModeSummary(effectiveMode);
    }

    if (mode === "local_guest" || mode === "account_unlocked") {
        return <>{children}</>;
    }

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
                                    {gateHeading}
                                </h2>
                                <p className="mt-3 max-w-[54ch] text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                                    {gateSummary}
                                </p>
                            </div>

                            {status === "checking" ? (
                                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-12 text-center shadow-[var(--shadow-lg)]">
                                    <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-[var(--primary)]" />
                                    <h2 className="font-serif text-2xl font-bold text-[var(--text)]">Checking your secure access</h2>
                                    <p className="mt-2 text-[var(--text-muted)]">We&apos;re checking how this account unlocks on this device.</p>
                                </div>
                            ) : null}

                            {status === "opening_device" ? (
                                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-12 text-center shadow-[var(--shadow-lg)]">
                                    <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-[var(--primary)]" />
                                    <h2 className="font-serif text-2xl font-bold text-[var(--text)]">Opening this device</h2>
                                    <p className="mt-2 text-[var(--text-muted)]">
                                        We&apos;re using the password you just entered to open your encrypted records locally. If you just reset your password, this may take a few seconds.
                                    </p>
                                </div>
                            ) : null}

                            {status === "max_privacy_input" ? (
                                <RecoveryKeyInput
                                    onComplete={handleMaximumPrivacyUnlock}
                                    errorMessage={inputError}
                                    isSubmitting={isSubmittingInput}
                                />
                            ) : null}

                            {status === "recoverable_setup" ? (
                                <RecoverableAccessPanel
                                    purpose="setup"
                                    hasSavedPassword={savedPasswordReady}
                                    onSubmit={handleRecoverableSubmit}
                                    errorMessage={setupError}
                                    isSubmitting={isSubmittingSetup}
                                />
                            ) : null}

                            {status === "recoverable_input" ? (
                                <RecoverableAccessPanel
                                    purpose="unlock"
                                    hasSavedPassword={savedPasswordReady}
                                    onSubmit={handleRecoverableSubmit}
                                    errorMessage={inputError}
                                    isSubmitting={isSubmittingInput}
                                    isRecovering={isRecovering}
                                />
                            ) : null}
                        </div>

                        <aside className="space-y-5 xl:sticky xl:top-6">
                            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                                <h3 className="text-lg font-bold text-[var(--text)]">
                                    What this means
                                </h3>
                                <div className="mt-3 space-y-4 text-sm leading-7 text-[var(--text-muted)]">
                                    <p>{getLockedSummary(effectiveMode ?? "recoverable")}</p>
                                    {effectiveMode ? (
                                        <p className="font-semibold text-[var(--text)]">
                                            {getEncryptionModeLabel(effectiveMode)} keeps the sync flow encrypted before upload.
                                        </p>
                                    ) : (
                                        <p className="font-semibold text-[var(--text)]">
                                            Recoverable Encryption keeps the sync flow encrypted before upload.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                    Current setup
                                </p>
                                <p className="mt-3 text-lg font-bold text-[var(--text)]">
                                    {effectiveMode ? getEncryptionModeLabel(effectiveMode) : "Recoverable Encryption"}
                                </p>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                    {getAccountStatusSummary(effectiveMode ?? "recoverable")}
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatRecoveryUnlockError(error: unknown) {
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
        const message = error.message;
        if (message.includes("expired") || message.includes("session")) {
            return "Your session expired. Please sign in again.";
        }
        return message;
    }

    return "The secure unlock step could not be completed. Please try again.";
}

function formatRecoverableUnlockError(error: unknown) {
    if (error instanceof Error) {
        if (error.message === "PASSWORD_WRAP_FAILED") {
            return "That password did not unlock this account. Please try again.";
        }

        if (error.message.includes("permission")) {
            return "This account could not read its recoverable setup just now. Please try again.";
        }

        return error.message;
    }

    return "We could not unlock this recoverable account right now.";
}

function formatRecoverableRecoveryError(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return "Account recovery could not be completed on this device.";
}
