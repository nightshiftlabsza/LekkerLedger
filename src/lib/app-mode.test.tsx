import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    unsubscribeMock: vi.fn(),
    setCryptoKeyMock: vi.fn(),
    syncInitMock: vi.fn(),
    reconcileAfterUnlockMock: vi.fn(),
    clearSessionMock: vi.fn(),
    authStateChangeHandler: null as ((event: string, session: { user?: { id: string } } | null) => void) | null,
}));

vi.mock("./supabase/client", () => ({
    createClient: () => ({
        auth: {
            getSession: mocks.getSessionMock,
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
        clearSession: mocks.clearSessionMock,
    },
}));

import { AppModeProvider, useAppMode } from "./app-mode";

function Harness() {
    const { mode, unlockAccount } = useAppMode();

    return (
        <div>
            <p data-testid="mode">{mode}</p>
            <button type="button" onClick={() => void unlockAccount({} as CryptoKey, "user-1").catch(() => undefined)}>
                Unlock
            </button>
        </div>
    );
}

describe("AppModeProvider", () => {
    beforeEach(() => {
        mocks.getSessionMock.mockReset();
        mocks.unsubscribeMock.mockReset();
        mocks.setCryptoKeyMock.mockReset();
        mocks.syncInitMock.mockReset();
        mocks.reconcileAfterUnlockMock.mockReset();
        mocks.clearSessionMock.mockReset();
        mocks.authStateChangeHandler = null;

        mocks.getSessionMock.mockResolvedValue({
            data: {
                session: {
                    user: {
                        id: "user-1",
                    },
                },
            },
        });
        mocks.reconcileAfterUnlockMock.mockResolvedValue(undefined);
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

        expect(mocks.getSessionMock).toHaveBeenCalledTimes(1);

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
        mocks.reconcileAfterUnlockMock.mockRejectedValueOnce(new Error("List failed: relation \"synced_records\" does not exist"));

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
});
