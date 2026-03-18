import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    initialMode: "account_locked" as "local_guest" | "account_locked" | "account_unlocked",
    routerReplaceMock: vi.fn(),
    getUserMock: vi.fn(),
    upsertMock: vi.fn(),
    userProfilesMaybeSingleMock: vi.fn(),
    loadEncryptionProfileStateMock: vi.fn(),
    getLocalRecoveryProfileMock: vi.fn(),
    saveLocalRecoveryProfileMock: vi.fn(),
    hasCredentialHandoffMock: vi.fn(),
    consumeCredentialHandoffMock: vi.fn(),
    clearCredentialHandoffMock: vi.fn(),
    buildRecoverableSetupArtifactsMock: vi.fn(),
    sendRecoverableSetupRequestMock: vi.fn(),
    requestRecoveredMasterKeyMock: vi.fn(),
    decryptDataMock: vi.fn(),
    deriveKeyMock: vi.fn(),
    exportAccountMasterKeyMock: vi.fn(),
    generateAccountMasterKeyMock: vi.fn(),
    generateValidationPayloadMock: vi.fn(),
    importAccountMasterKeyMock: vi.fn(),
    unwrapMasterKeyWithPasswordMock: vi.fn(),
    verifyValidationPayloadMock: vi.fn(),
    wrapMasterKeyWithPasswordMock: vi.fn(),
    storeRecoveryNoticeMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: mocks.routerReplaceMock,
    }),
    usePathname: () => "/dashboard",
}));

vi.mock("@/lib/app-mode", async () => {
    const React = await import("react");

    type AppMode = "local_guest" | "account_locked" | "account_unlocked";
    type EncryptionMode = "recoverable" | "maximum_privacy" | null;
    type AppModeContextValue = {
        mode: AppMode;
        encryptionMode: EncryptionMode;
        setEncryptionMode: React.Dispatch<React.SetStateAction<EncryptionMode>>;
        setMode: React.Dispatch<React.SetStateAction<AppMode>>;
        unlockAccount: (key: CryptoKey, userId: string) => Promise<void>;
        lockAccount: () => void;
    };

    const AppModeContext = React.createContext<AppModeContextValue | null>(null);

    function AppModeProvider({ children }: { children: React.ReactNode }) {
        const [mode, setMode] = React.useState<AppMode>(mocks.initialMode);
        const [encryptionMode, setEncryptionMode] = React.useState<EncryptionMode>(null);

        const value: AppModeContextValue = {
            mode,
            encryptionMode,
            setEncryptionMode,
            setMode,
            unlockAccount: async () => {
                setMode("account_unlocked");
            },
            lockAccount: () => {
                setMode("account_locked");
            },
        };

        return (
            <AppModeContext.Provider value={value}>
                {children}
            </AppModeContext.Provider>
        );
    }

    function useAppMode() {
        const context = React.useContext(AppModeContext);
        if (!context) {
            throw new Error("useAppMode must be used within an AppModeProvider");
        }
        return context;
    }

    return {
        AppModeProvider,
        useAppMode,
    };
});

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: mocks.getUserMock,
        },
        from: (table: string) => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: table === "user_profiles" ? mocks.userProfilesMaybeSingleMock : vi.fn(),
                }),
            }),
            upsert: mocks.upsertMock,
        }),
    }),
}));

vi.mock("@/lib/encryption-profile", () => ({
    loadEncryptionProfileState: mocks.loadEncryptionProfileStateMock,
}));

vi.mock("@/lib/recovery-profile-store", () => ({
    getLocalRecoveryProfile: mocks.getLocalRecoveryProfileMock,
    saveLocalRecoveryProfile: mocks.saveLocalRecoveryProfileMock,
}));

vi.mock("@/lib/credential-handoff", () => ({
    hasCredentialHandoff: mocks.hasCredentialHandoffMock,
    consumeCredentialHandoff: mocks.consumeCredentialHandoffMock,
    clearCredentialHandoff: mocks.clearCredentialHandoffMock,
}));

vi.mock("@/lib/recoverable-account", () => ({
    buildRecoverableSetupArtifacts: mocks.buildRecoverableSetupArtifactsMock,
    sendRecoverableSetupRequest: mocks.sendRecoverableSetupRequestMock,
    requestRecoveredMasterKey: mocks.requestRecoveredMasterKeyMock,
}));

vi.mock("@/lib/crypto", () => ({
    decryptData: mocks.decryptDataMock,
    deriveKey: mocks.deriveKeyMock,
    exportAccountMasterKey: mocks.exportAccountMasterKeyMock,
    generateAccountMasterKey: mocks.generateAccountMasterKeyMock,
    generateValidationPayload: mocks.generateValidationPayloadMock,
    importAccountMasterKey: mocks.importAccountMasterKeyMock,
    unwrapMasterKeyWithPassword: mocks.unwrapMasterKeyWithPasswordMock,
    verifyValidationPayload: mocks.verifyValidationPayloadMock,
    wrapMasterKeyWithPassword: mocks.wrapMasterKeyWithPasswordMock,
}));

vi.mock("@/lib/recovery-notice", () => ({
    storeRecoveryNotice: mocks.storeRecoveryNoticeMock,
}));

import { AppModeProvider } from "@/lib/app-mode";
import { RecoveryGate } from "./recovery-gate";

function renderGate() {
    return render(
        <AppModeProvider>
            <RecoveryGate>
                <div>Protected child</div>
            </RecoveryGate>
        </AppModeProvider>,
    );
}

describe("RecoveryGate", () => {
    beforeEach(() => {
        mocks.initialMode = "account_locked";
        mocks.routerReplaceMock.mockReset();
        mocks.getUserMock.mockReset();
        mocks.upsertMock.mockReset();
        mocks.userProfilesMaybeSingleMock.mockReset();
        mocks.loadEncryptionProfileStateMock.mockReset();
        mocks.getLocalRecoveryProfileMock.mockReset();
        mocks.saveLocalRecoveryProfileMock.mockReset();
        mocks.hasCredentialHandoffMock.mockReset();
        mocks.consumeCredentialHandoffMock.mockReset();
        mocks.clearCredentialHandoffMock.mockReset();
        mocks.buildRecoverableSetupArtifactsMock.mockReset();
        mocks.sendRecoverableSetupRequestMock.mockReset();
        mocks.requestRecoveredMasterKeyMock.mockReset();
        mocks.decryptDataMock.mockReset();
        mocks.deriveKeyMock.mockReset();
        mocks.exportAccountMasterKeyMock.mockReset();
        mocks.generateAccountMasterKeyMock.mockReset();
        mocks.generateValidationPayloadMock.mockReset();
        mocks.importAccountMasterKeyMock.mockReset();
        mocks.unwrapMasterKeyWithPasswordMock.mockReset();
        mocks.verifyValidationPayloadMock.mockReset();
        mocks.wrapMasterKeyWithPasswordMock.mockReset();
        mocks.storeRecoveryNoticeMock.mockReset();

        mocks.getUserMock.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                    email: "owner@example.com",
                },
            },
        });
        mocks.upsertMock.mockResolvedValue({ error: null });
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "recoverable",
            modeVersion: 1,
            keySetupComplete: false,
            validationPayload: null,
            wrappedMasterKeyUser: null,
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "none",
            fallbackEncryptedRecord: null,
        });
        mocks.getLocalRecoveryProfileMock.mockResolvedValue(null);
        mocks.hasCredentialHandoffMock.mockReturnValue(false);
        mocks.consumeCredentialHandoffMock.mockReturnValue("Password123!");
        mocks.generateAccountMasterKeyMock.mockResolvedValue({} as CryptoKey);
        mocks.buildRecoverableSetupArtifactsMock.mockResolvedValue({
            rawMasterKey: "raw-master-key",
            cachedMasterKey: "cached-master-key",
            validationPayload: {
                ciphertext: "ciphertext",
                iv: "iv",
            },
            wrappedMasterKeyUser: {
                ciphertext: "ciphertext",
                iv: "iv",
                salt: "salt",
                kdf: "PBKDF2-SHA-256-310000",
                algorithm: "AES-GCM",
            },
        });
        mocks.sendRecoverableSetupRequestMock.mockResolvedValue(undefined);
        mocks.unwrapMasterKeyWithPasswordMock.mockResolvedValue({} as CryptoKey);
        mocks.verifyValidationPayloadMock.mockResolvedValue(true);
        mocks.exportAccountMasterKeyMock.mockResolvedValue("cached-master-key");
        mocks.requestRecoveredMasterKeyMock.mockResolvedValue({ rawMasterKey: "recovered-master-key" });
        mocks.importAccountMasterKeyMock.mockResolvedValue({} as CryptoKey);
        mocks.wrapMasterKeyWithPasswordMock.mockResolvedValue({
            ciphertext: "new-ciphertext",
            iv: "new-iv",
            salt: "new-salt",
            kdf: "PBKDF2-SHA-256-310000",
            algorithm: "AES-GCM",
        });
        mocks.generateValidationPayloadMock.mockResolvedValue({
            ciphertext: "validation-ciphertext",
            iv: "validation-iv",
        });
    });

    it("shows the mode chooser for a new encrypted account", async () => {
        renderGate();

        await waitFor(() => {
            expect(screen.getByText("Choose how you want account recovery to work.")).toBeTruthy();
        });

        expect(screen.getByRole("button", { name: "Use Recoverable Encryption" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Use Maximum Privacy" })).toBeTruthy();
    });

    it("shows the Maximum Privacy unlock path for existing legacy accounts", async () => {
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "maximum_privacy",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: {
                ciphertext: "ciphertext",
                iv: "iv",
            },
            wrappedMasterKeyUser: null,
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "remote",
            fallbackEncryptedRecord: null,
        });

        renderGate();

        await waitFor(() => {
            expect(screen.getByText("This account uses Maximum Privacy. Enter your recovery key to open the encrypted records on this device.")).toBeTruthy();
        });

        expect(screen.queryByText("Choose how you want account recovery to work.")).toBeNull();
    });

    it("falls back to manual password entry for recoverable unlock when no handoff exists", async () => {
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "recoverable",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: {
                ciphertext: "ciphertext",
                iv: "iv",
            },
            wrappedMasterKeyUser: {
                ciphertext: "ciphertext",
                iv: "iv",
                salt: "salt",
                kdf: "PBKDF2-SHA-256-310000",
                algorithm: "AES-GCM",
            },
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "remote",
            fallbackEncryptedRecord: null,
        });

        renderGate();

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Finish opening this device" })).toBeTruthy();
        });

        await act(async () => {
            fireEvent.change(screen.getByLabelText("Confirm your password"), { target: { value: "Password123!" } });
            fireEvent.click(screen.getByRole("button", { name: "Open records on this device" }));
        });

        await waitFor(() => {
            expect(screen.getByText("Protected child")).toBeTruthy();
        });

        expect(mocks.unwrapMasterKeyWithPasswordMock).toHaveBeenCalledWith(
            expect.objectContaining({
                ciphertext: "ciphertext",
                iv: "iv",
            }),
            "Password123!",
        );
        expect(mocks.exportAccountMasterKeyMock).toHaveBeenCalled();
        expect(mocks.saveLocalRecoveryProfileMock).toHaveBeenCalledWith("user-1", expect.objectContaining({
            encryptionMode: "recoverable",
            cachedMasterKey: "cached-master-key",
        }));
    });

    it("auto-opens recoverable accounts when the login password handoff is available", async () => {
        mocks.hasCredentialHandoffMock.mockReturnValue(true);
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "recoverable",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: {
                ciphertext: "ciphertext",
                iv: "iv",
            },
            wrappedMasterKeyUser: {
                ciphertext: "ciphertext",
                iv: "iv",
                salt: "salt",
                kdf: "PBKDF2-SHA-256-310000",
                algorithm: "AES-GCM",
            },
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "remote",
            fallbackEncryptedRecord: null,
        });

        renderGate();

        await waitFor(() => {
            expect(screen.getByText("Protected child")).toBeTruthy();
        });

        expect(mocks.consumeCredentialHandoffMock).toHaveBeenCalledWith("owner@example.com");
        expect(screen.queryByRole("heading", { name: "Finish opening this device" })).toBeNull();
    });

    it("completes recoverable recovery after a password reset", async () => {
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "recoverable",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: {
                ciphertext: "ciphertext",
                iv: "iv",
            },
            wrappedMasterKeyUser: {
                ciphertext: "ciphertext",
                iv: "iv",
                salt: "salt",
                kdf: "PBKDF2-SHA-256-310000",
                algorithm: "AES-GCM",
            },
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "remote",
            fallbackEncryptedRecord: null,
        });

        renderGate();

        const passwordInput = await screen.findByLabelText("Confirm your password");
        const recoverButton = await screen.findByRole("button", { name: "Recover this account" });

        await act(async () => {
            fireEvent.change(passwordInput, { target: { value: "Password123!" } });
            fireEvent.click(recoverButton);
        });

        await waitFor(() => {
            expect(screen.getByText("Protected child")).toBeTruthy();
        });

        expect(mocks.requestRecoveredMasterKeyMock).toHaveBeenCalledWith("password_reset");
        expect(mocks.wrapMasterKeyWithPasswordMock).toHaveBeenCalledWith(expect.any(Object), "Password123!");
        expect(mocks.upsertMock).toHaveBeenCalledWith(expect.objectContaining({
            encryption_mode: "recoverable",
            validation_payload: {
                ciphertext: "validation-ciphertext",
                iv: "validation-iv",
            },
            wrapped_master_key_user: expect.objectContaining({
                ciphertext: "new-ciphertext",
                iv: "new-iv",
            }),
            user_wrap_salt: "new-salt",
            user_wrap_kdf: "PBKDF2-SHA-256-310000",
        }), expect.objectContaining({
            onConflict: "id",
        }));
        expect(mocks.storeRecoveryNoticeMock).toHaveBeenCalledWith("recoverable");
    });
});
