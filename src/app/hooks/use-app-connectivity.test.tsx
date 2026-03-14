import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    let syncSnapshot = {
        userId: null as string | null,
        ready: false,
        syncing: false,
        hasError: false,
        lastError: null as string | null,
    };
    const syncListeners = new Set<() => void>();

    return {
        getSessionMock: vi.fn(),
        unsubscribeMock: vi.fn(),
        syncSubscribeMock: vi.fn((listener: () => void) => {
            syncListeners.add(listener);
            return () => {
                syncListeners.delete(listener);
            };
        }),
        getSyncSnapshotMock: vi.fn(() => syncSnapshot),
        emitSyncSnapshot(nextSnapshot: typeof syncSnapshot) {
            syncSnapshot = nextSnapshot;
            syncListeners.forEach((listener) => listener());
        },
        resetSyncSnapshot() {
            syncSnapshot = {
                userId: null,
                ready: false,
                syncing: false,
                hasError: false,
                lastError: null,
            };
            syncListeners.clear();
        },
    };
});

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getSession: mocks.getSessionMock,
            onAuthStateChange: () => ({
                data: {
                    subscription: {
                        unsubscribe: mocks.unsubscribeMock,
                    },
                },
            }),
        },
    }),
}));

vi.mock("@/lib/sync-service", () => ({
    syncService: {
        subscribe: mocks.syncSubscribeMock,
        getSnapshot: mocks.getSyncSnapshotMock,
    },
}));

import { useAppConnectivity } from "./use-app-connectivity";

function Harness() {
    const { network, sync, syncErrorMessage } = useAppConnectivity();

    return (
        <div>
            <span data-testid="network">{network}</span>
            <span data-testid="sync">{sync}</span>
            <span data-testid="sync-error">{syncErrorMessage ?? ""}</span>
        </div>
    );
}

describe("useAppConnectivity", () => {
    beforeEach(() => {
        mocks.getSessionMock.mockReset();
        mocks.unsubscribeMock.mockReset();
        mocks.syncSubscribeMock.mockClear();
        mocks.getSyncSnapshotMock.mockClear();
        mocks.resetSyncSnapshot();

        Object.defineProperty(window.navigator, "onLine", {
            configurable: true,
            value: true,
        });

        vi.spyOn(window, "fetch").mockResolvedValue({
            ok: true,
        } as Response);
    });

    it("stays disabled without an authenticated session", async () => {
        mocks.getSessionMock.mockResolvedValue({
            data: {
                session: null,
            },
        });

        render(<Harness />);

        await waitFor(() => {
            expect(screen.getByTestId("network")).toHaveTextContent("online");
        });
        expect(screen.getByTestId("sync")).toHaveTextContent("disabled");
    });

    it("reports enabled when a signed-in user has unlocked sync", async () => {
        mocks.getSessionMock.mockResolvedValue({
            data: {
                session: {
                    user: {
                        id: "user-1",
                    },
                },
            },
        });
        mocks.emitSyncSnapshot({
            userId: "user-1",
            ready: true,
            syncing: false,
            hasError: false,
            lastError: null,
        });

        render(<Harness />);

        await waitFor(() => {
            expect(screen.getByTestId("sync")).toHaveTextContent("enabled");
        });
    });

    it("reports an error when the sync service exposes one", async () => {
        mocks.getSessionMock.mockResolvedValue({
            data: {
                session: {
                    user: {
                        id: "user-1",
                    },
                },
            },
        });
        mocks.emitSyncSnapshot({
            userId: "user-1",
            ready: true,
            syncing: false,
            hasError: true,
            lastError: "Push failed.",
        });

        render(<Harness />);

        await waitFor(() => {
            expect(screen.getByTestId("sync")).toHaveTextContent("error");
        });
        expect(screen.getByTestId("sync-error")).toHaveTextContent("Push failed.");
    });

    it("reports reconnecting when the browser is offline but sync is ready", async () => {
        Object.defineProperty(window.navigator, "onLine", {
            configurable: true,
            value: false,
        });
        vi.spyOn(window, "fetch").mockResolvedValue({
            ok: false,
        } as Response);

        mocks.getSessionMock.mockResolvedValue({
            data: {
                session: {
                    user: {
                        id: "user-1",
                    },
                },
            },
        });
        mocks.emitSyncSnapshot({
            userId: "user-1",
            ready: true,
            syncing: false,
            hasError: false,
            lastError: null,
        });

        render(<Harness />);

        await waitFor(() => {
            expect(screen.getByTestId("network")).toHaveTextContent("offline");
        });
        expect(screen.getByTestId("sync")).toHaveTextContent("reconnecting");
    });
});
