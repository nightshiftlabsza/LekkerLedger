import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    initialMode: "account_locked" as "local_guest" | "account_locked" | "account_unlocked",
    routerReplaceMock: vi.fn(),
    getUserMock: vi.fn(),
    userProfilesMaybeSingleMock: vi.fn(),
    syncedRecordsMaybeSingleMock: vi.fn(),
    upsertMock: vi.fn(),
    getLocalRecoveryProfileMock: vi.fn(),
    saveLocalRecoveryProfileMock: vi.fn(),
    deriveKeyMock: vi.fn(),
    generateValidationPayloadMock: vi.fn(),
    verifyValidationPayloadMock: vi.fn(),
    decryptDataMock: vi.fn(),
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
    type AppModeContextValue = {
        mode: AppMode;
        setMode: React.Dispatch<React.SetStateAction<AppMode>>;
        unlockAccount: (key: CryptoKey, userId: string) => Promise<void>;
        lockAccount: () => void;
    };

    const AppModeContext = React.createContext<AppModeContextValue | null>(null);

    function AppModeProvider({ children }: { children: React.ReactNode }) {
        const [mode, setMode] = React.useState<AppMode>(mocks.initialMode);

        const value: AppModeContextValue = {
            mode,
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
        from: (table: string) => {
            const maybeSingle =
                table === "synced_records"
                    ? mocks.syncedRecordsMaybeSingleMock
                    : mocks.userProfilesMaybeSingleMock;

            return {
                select: () => ({
                    eq: () => ({
                        limit: () => ({
                            maybeSingle,
                        }),
                        maybeSingle,
                    }),
                }),
                upsert: mocks.upsertMock,
            };
        },
    }),
}));

vi.mock("@/lib/recovery-profile-store", () => ({
    getLocalRecoveryProfile: mocks.getLocalRecoveryProfileMock,
    saveLocalRecoveryProfile: mocks.saveLocalRecoveryProfileMock,
}));

vi.mock("@/lib/crypto", () => ({
    decryptData: mocks.decryptDataMock,
    deriveKey: mocks.deriveKeyMock,
    generateValidationPayload: mocks.generateValidationPayloadMock,
    verifyValidationPayload: mocks.verifyValidationPayloadMock,
}));

vi.mock("./recovery-key-setup", () => ({
    RecoveryKeySetup: ({
        onComplete,
        errorMessage,
        isSubmitting,
    }: {
        onComplete: (key: string) => Promise<void> | void;
        errorMessage?: string | null;
        isSubmitting?: boolean;
    }) => (
        <div>
            <p>Mock Setup</p>
            {errorMessage ? <p>{errorMessage}</p> : null}
            <button
                type="button"
                onClick={() => void onComplete("B5YR-35DH-8L2R-WY6R-Z5XL-2KMZ-PQWA-7EUQ")}
                disabled={isSubmitting}
            >
                Complete setup
            </button>
        </div>
    ),
}));

vi.mock("./recovery-key-input", () => ({
    RecoveryKeyInput: ({
        onComplete,
        errorMessage,
        isSubmitting,
    }: {
        onComplete: (key: string, cryptoKey: CryptoKey) => Promise<void> | void;
        errorMessage?: string | null;
        isSubmitting?: boolean;
    }) => (
        <div>
            <p>Mock Input</p>
            {errorMessage ? <p>{errorMessage}</p> : null}
            <button
                type="button"
                onClick={() => void onComplete("B5YR-35DH-8L2R-WY6R-Z5XL-2KMZ-PQWA-7EUQ", {} as CryptoKey)}
                disabled={isSubmitting}
            >
                Unlock
            </button>
        </div>
    ),
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
        mocks.userProfilesMaybeSingleMock.mockReset();
        mocks.syncedRecordsMaybeSingleMock.mockReset();
        mocks.upsertMock.mockReset();
        mocks.getLocalRecoveryProfileMock.mockReset();
        mocks.saveLocalRecoveryProfileMock.mockReset();
        mocks.deriveKeyMock.mockReset();
        mocks.generateValidationPayloadMock.mockReset();
        mocks.verifyValidationPayloadMock.mockReset();
        mocks.decryptDataMock.mockReset();

        mocks.getUserMock.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                },
            },
        });
        mocks.getLocalRecoveryProfileMock.mockResolvedValue(null);
        mocks.upsertMock.mockResolvedValue({ error: null });
        mocks.deriveKeyMock.mockResolvedValue({} as CryptoKey);
        mocks.generateValidationPayloadMock.mockResolvedValue({
            ciphertext: "ciphertext",
            iv: "iv",
        });
        mocks.verifyValidationPayloadMock.mockResolvedValue(true);
        mocks.decryptDataMock.mockResolvedValue({
            magicWord: "ok",
        });
        mocks.userProfilesMaybeSingleMock.mockResolvedValue({
            data: null,
            error: null,
        });
        mocks.syncedRecordsMaybeSingleMock.mockResolvedValue({
            data: null,
            error: null,
        });
    });

    it("unlocks directly after first-device setup without showing the recovery-key input again", async () => {
        mocks.userProfilesMaybeSingleMock.mockResolvedValue({
            data: null,
            error: {
                message: "user_profiles table not available",
            },
        });
        mocks.syncedRecordsMaybeSingleMock.mockResolvedValue({
            data: null,
            error: null,
        });

        renderGate();

        await waitFor(() => {
            expect(screen.getByText("Mock Setup")).toBeTruthy();
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Complete setup" }));
        });

        await waitFor(() => {
            expect(screen.getByText("Protected child")).toBeTruthy();
        });

        expect(screen.queryByText("Mock Input")).toBeNull();
        expect(mocks.saveLocalRecoveryProfileMock).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({
                keySetupComplete: true,
            }),
        );
        expect(mocks.routerReplaceMock).not.toHaveBeenCalled();
    });

    it("asks for the recovery key on later logins when the profile already exists", async () => {
        mocks.userProfilesMaybeSingleMock.mockResolvedValue({
            data: {
                key_setup_complete: true,
                validation_payload: {
                    ciphertext: "ciphertext",
                    iv: "iv",
                },
            },
            error: null,
        });

        renderGate();

        await waitFor(() => {
            expect(screen.getByText("Mock Input")).toBeTruthy();
        });

        expect(screen.queryByText("Mock Setup")).toBeNull();
        expect(screen.queryByText("Protected child")).toBeNull();
    });

    it("asks for the existing recovery key when cloud data exists but the profile row is missing", async () => {
        mocks.userProfilesMaybeSingleMock.mockResolvedValue({
            data: null,
            error: null,
        });
        mocks.syncedRecordsMaybeSingleMock.mockResolvedValue({
            data: {
                encrypted_data: {
                    ciphertext: "ciphertext",
                    iv: "iv",
                },
            },
            error: null,
        });

        renderGate();

        await waitFor(() => {
            expect(screen.getByText("Mock Input")).toBeTruthy();
        });

        expect(screen.queryByText("Mock Setup")).toBeNull();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
        });

        await waitFor(() => {
            expect(screen.getByText("Protected child")).toBeTruthy();
        });

        expect(mocks.decryptDataMock).toHaveBeenCalledWith(
            expect.objectContaining({
                ciphertext: "ciphertext",
                iv: "iv",
            }),
            expect.anything(),
        );
        expect(mocks.upsertMock).toHaveBeenCalled();
    });

    it("repairs the missing remote recovery profile from an already unlocked device", async () => {
        mocks.initialMode = "account_unlocked";
        mocks.getLocalRecoveryProfileMock.mockResolvedValue({
            keySetupComplete: true,
            validationPayload: {
                ciphertext: "ciphertext",
                iv: "iv",
            },
            updatedAt: new Date().toISOString(),
        });
        mocks.userProfilesMaybeSingleMock.mockResolvedValue({
            data: null,
            error: null,
        });

        renderGate();

        await waitFor(() => {
            expect(screen.getByText("Protected child")).toBeTruthy();
        });

        await waitFor(() => {
            expect(mocks.upsertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "user-1",
                    key_setup_complete: true,
                    validation_payload: {
                        ciphertext: "ciphertext",
                        iv: "iv",
                    },
                }),
                expect.objectContaining({
                    onConflict: "id",
                }),
            );
        });
    });
});
