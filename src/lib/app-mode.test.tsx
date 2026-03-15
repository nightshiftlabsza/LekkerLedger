import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getUserMock: vi.fn(),
    unsubscribeMock: vi.fn(),
    setCryptoKeyMock: vi.fn(),
    syncInitMock: vi.fn(),
    reconcileAfterUnlockMock: vi.fn(),
    restoreFromCloudMock: vi.fn(),
    clearSessionMock: vi.fn(),
    getLocalRecoveryProfileMock: vi.fn(),
    deriveKeyMock: vi.fn(),
    importAccountMasterKeyMock: vi.fn(),
    loadEncryptionProfileStateMock: vi.fn(),
    authStateChangeHandler: null as ((event: string, session: { user?: { id: string } } | null) => void) | null,
}));

vi.mock("../hooks/use-realtime-sync", () => ({
    useRealtimeSync: () => undefined,
}));

vi.mock("./supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: mocks.getUserMock,
            onAuthStateChange: (callback: (event: string, session: { user?: { id: string } } | null) => void) => {
                mocks.authStateChangeHandler = callback;
                return {
                    data: {
                        subscription: {
                            unsubscribe: mocks.unsubscribeMock,
                        },
                    },
                };
            },
        },
    }),
}));

vi.mock("./sync-engine", () => ({
    syncEngine: {
        setCryptoKey: mocks.setCryptoKeyMock,
    },
}));

vi.mock("./sync-service", () => ({
    syncService: {
        init: mocks.syncInitMock,
        reconcileAfterUnlock: mocks.reconcileAfterUnlockMock,
        restoreFromCloud: mocks.restoreFromCloudMock,
        clearSession: mocks.clearSessionMock,
    },
}));

vi.mock("./recovery-profile-store", () => ({
    getLocalRecoveryProfile: mocks.getLocalRecoveryProfileMock,
}));

vi.mock("./crypto", () => ({
    deriveKey: mocks.deriveKeyMock,
    importAccountMasterKey: mocks.importAccountMasterKeyMock,
}));

vi.mock("./encryption-profile", () => ({
    loadEncryptionProfileState: mocks.loadEncryptionProfileStateMock,
}));

import { AppModeProvider, useAppMode } from "./app-mode";

function Harness() {
    const { mode, encryptionMode, unlockAccount } = useAppMode();

    return (
        <div>
            <p data-testid="mode">{mode}</p>
            <p data-testid="encryption-mode">{encryptionMode ?? "none"}</p>
            <button type="button" onClick={() => void unlockAccount({} as CryptoKey, "user-1").catch(() => undefined)}>
                Unlock
            </button>
        </div>
    );
}

describe("AppModeProvider", () => {
    beforeEach(() => {
        mocks.getUserMock.mockReset();
        mocks.unsubscribeMock.mockReset();
        mocks.setCryptoKeyMock.mockReset();
        mocks.syncInitMock.mockReset();
        mocks.reconcileAfterUnlockMock.mockReset();
        mocks.restoreFromCloudMock.mockReset();
        mocks.clearSessionMock.mockReset();
        mocks.getLocalRecoveryProfileMock.mockReset();
        mocks.deriveKeyMock.mockReset();
        mocks.importAccountMasterKeyMock.mockReset();
        mocks.loadEncryptionProfileStateMock.mockReset();
        mocks.authStateChangeHandler = null;

        mocks.getUserMock.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                },
            },
        });
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
        mocks.deriveKeyMock.mockResolvedValue({} as CryptoKey);
        mocks.importAccountMasterKeyMock.mockResolvedValue({} as CryptoKey);
        mocks.reconcileAfterUnlockMock.mockResolvedValue(undefined);
        mocks.restoreFromCloudMock.mockResolvedValue(undefined);
    });

    it("stays unlocked after a successful unlock and ignores same-user sign-in events", async () => {
        render(
            <AppModeProvider>
                <Harness />
            </AppModeProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("mode").textContent).toBe("account_locked");
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
        });

        await waitFor(() => {
            expect(screen.getByTestId("mode").textContent).toBe("account_unlocked");
        });

        act(() => {
            mocks.authStateChangeHandler?.("SIGNED_IN", {
                user: {
                    id: "user-1",
                },
            });
        });

        expect(screen.getByTestId("mode").textContent).toBe("account_unlocked");
    });

    it("stays locked when the initial cloud reconcile fails", async () => {
        mocks.reconcileAfterUnlockMock.mockRejectedValueOnce(new Error("List failed"));

        render(
            <AppModeProvider>
                <Harness />
            </AppModeProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("mode").textContent).toBe("account_locked");
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
        });

        await waitFor(() => {
            expect(screen.getByTestId("mode").textContent).toBe("account_locked");
        });
    });

    it("auto-unlocks and reconciles when a saved recovery key is present for Maximum Privacy", async () => {
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "maximum_privacy",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: null,
            wrappedMasterKeyUser: null,
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "remote",
            fallbackEncryptedRecord: null,
        });
        mocks.getLocalRecoveryProfileMock.mockResolvedValue({
            recoveryKey: "saved-recovery-key",
        });

        render(
            <AppModeProvider>
                <Harness />
            </AppModeProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("mode").textContent).toBe("account_unlocked");
        });

        expect(screen.getByTestId("encryption-mode").textContent).toBe("maximum_privacy");
        expect(mocks.deriveKeyMock).toHaveBeenCalledWith("saved-recovery-key");
        expect(mocks.importAccountMasterKeyMock).not.toHaveBeenCalled();
        expect(mocks.syncInitMock).toHaveBeenCalledWith("user-1", expect.any(Object));
        expect(mocks.reconcileAfterUnlockMock).toHaveBeenCalledTimes(1);
    });

    it("auto-unlocks and reconciles when a cached master key is present for Recoverable Encryption", async () => {
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "recoverable",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: null,
            wrappedMasterKeyUser: null,
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "remote",
            fallbackEncryptedRecord: null,
        });
        mocks.getLocalRecoveryProfileMock.mockResolvedValue({
            cachedMasterKey: "saved-master-key",
        });

        render(
            <AppModeProvider>
                <Harness />
            </AppModeProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("mode").textContent).toBe("account_unlocked");
        });

        expect(screen.getByTestId("encryption-mode").textContent).toBe("recoverable");
        expect(mocks.importAccountMasterKeyMock).toHaveBeenCalledWith("saved-master-key");
        expect(mocks.deriveKeyMock).not.toHaveBeenCalled();
    });

    it("keeps the remote encryption mode as the source of truth when local cache disagrees", async () => {
        mocks.loadEncryptionProfileStateMock.mockResolvedValue({
            encryptionMode: "recoverable",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: null,
            wrappedMasterKeyUser: { ciphertext: "cipher", iv: "iv", salt: "salt", kdf: "PBKDF2-SHA-256-310000", algorithm: "AES-GCM" },
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "remote",
            fallbackEncryptedRecord: null,
        });
        mocks.getLocalRecoveryProfileMock.mockResolvedValue({
            recoveryKey: "stale-legacy-key",
        });

        render(
            <AppModeProvider>
                <Harness />
            </AppModeProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("mode").textContent).toBe("account_locked");
        });

        expect(screen.getByTestId("encryption-mode").textContent).toBe("recoverable");
        expect(mocks.deriveKeyMock).not.toHaveBeenCalled();
        expect(mocks.importAccountMasterKeyMock).not.toHaveBeenCalled();
    });
});
