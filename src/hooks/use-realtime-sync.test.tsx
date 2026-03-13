import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    let recordsCallback: ((payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => Promise<void> | void) | null = null;
    let filesCallback: ((payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => Promise<void> | void) | null = null;

    return {
        createClientMock: vi.fn(),
        removeChannelMock: vi.fn(),
        applyRemoteChangeMock: vi.fn(),
        applyRemoteFileChangeMock: vi.fn(),
        getRecordsCallback: () => recordsCallback,
        getFilesCallback: () => filesCallback,
        setRecordsCallback(callback: typeof recordsCallback) {
            recordsCallback = callback;
        },
        setFilesCallback(callback: typeof filesCallback) {
            filesCallback = callback;
        },
        resetCallbacks() {
            recordsCallback = null;
            filesCallback = null;
        },
    };
});

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => {
        mocks.createClientMock();

        return {
            channel: (_name: string) => ({
                on: (
                    _event: string,
                    config: { table: string },
                    callback: (payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => Promise<void> | void,
                ) => {
                    if (config.table === "synced_records") {
                        mocks.setRecordsCallback(callback);
                    } else {
                        mocks.setFilesCallback(callback);
                    }

                    return {
                        subscribe: () => ({ table: config.table }),
                    };
                },
            }),
            removeChannel: mocks.removeChannelMock,
        };
    },
}));

vi.mock("@/lib/sync-service", () => ({
    syncService: {
        applyRemoteChange: (...args: unknown[]) => mocks.applyRemoteChangeMock(...args),
        applyRemoteFileChange: (...args: unknown[]) => mocks.applyRemoteFileChangeMock(...args),
    },
}));

import { useRealtimeSync } from "./use-realtime-sync";

function Harness({ userId }: { userId?: string }) {
    const [renderCount, setRenderCount] = React.useState(0);

    useRealtimeSync(userId, () => {
        void renderCount;
    });

    return (
        <button type="button" onClick={() => setRenderCount((current) => current + 1)}>
            Re-render
        </button>
    );
}

describe("useRealtimeSync", () => {
    beforeEach(() => {
        mocks.createClientMock.mockReset();
        mocks.removeChannelMock.mockReset();
        mocks.applyRemoteChangeMock.mockReset();
        mocks.applyRemoteFileChangeMock.mockReset();
        mocks.resetCallbacks();
    });

    it("does not resubscribe when only the callback identity changes", () => {
        render(<Harness userId="user-1" />);

        expect(mocks.createClientMock).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Re-render" }));

        expect(mocks.createClientMock).toHaveBeenCalledTimes(1);
    });

    it("deduplicates repeated realtime payloads", async () => {
        render(<Harness userId="user-1" />);

        const callback = mocks.getRecordsCallback();
        expect(callback).toBeTruthy();

        const payload = {
            eventType: "UPDATE",
            new: {
                table_name: "employees",
                record_id: "emp-1",
                updated_at: "2026-03-13T12:00:00.000Z",
            },
        };

        await callback?.(payload);
        await callback?.(payload);

        expect(mocks.applyRemoteChangeMock).toHaveBeenCalledTimes(1);
    });
});
