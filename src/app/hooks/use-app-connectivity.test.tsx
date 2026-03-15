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
        authUser: null as { id: string } | null,
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

vi.mock("@/components/auth/auth-state-provider", () => ({
    useAuthState: () => ({
        user: mocks.authUser,
        isLoading: false,
        refreshUser: vi.fn(),
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
        mocks.authUser = null;
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
        render(<Harness />);

        await waitFor(() => {
            expect(screen.getByTestId("network")).toHaveTextContent("online");
        });
        expect(screen.getByTestId("sync")).toHaveTextContent("disabled");
    });

    it("reports enabled when a signed-in user has unlocked sync", async () => {
        mocks.authUser = { id: "user-1" };
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
        mocks.authUser = { id: "user-1" };
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

        mocks.authUser = { id: "user-1" };
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
