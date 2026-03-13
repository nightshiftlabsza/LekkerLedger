import { beforeEach, describe, expect, it, vi } from "vitest";

function createStore(overrides: Partial<{
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    iterate: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
}> = {}) {
    return {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
        iterate: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

const failingHouseholdStore = createStore({
    getItem: vi.fn().mockRejectedValue(new Error("household store failed")),
});
const failingSettingsStore = createStore({
    getItem: vi.fn().mockRejectedValue(new Error("settings store failed")),
});
const failingRecoveryStore = createStore({
    getItem: vi.fn().mockRejectedValue(new Error("recovery store failed")),
    setItem: vi.fn().mockRejectedValue(new Error("recovery store failed")),
});

vi.mock("localforage", () => ({
    default: {
        createInstance: vi.fn(({ storeName }: { storeName: string }) => {
            if (storeName === "households") return failingHouseholdStore;
            if (storeName === "settings") return failingSettingsStore;
            if (storeName === "recovery_profiles") return failingRecoveryStore;
            return createStore();
        }),
    },
}));

vi.mock("./sync-service", () => ({
    syncService: {
        isReady: () => false,
        pushLocalChange: vi.fn(),
        pushLocalDelete: vi.fn(),
        pushLocalFile: vi.fn(),
        pushLocalFileDelete: vi.fn(),
    },
}));

const getSessionMock = vi.fn().mockResolvedValue({
    data: {
        session: null,
    },
});

vi.mock("./supabase/client", () => ({
    createClient: () => ({
        auth: {
            getSession: getSessionMock,
        },
    }),
}));

vi.mock("./billing-client", () => ({
    fetchVerifiedEntitlements: vi.fn(),
}));

describe("storage resilience", () => {
    beforeEach(() => {
        vi.resetModules();
        getSessionMock.mockClear();
    });

    it("returns safe defaults when local household and settings stores fail", async () => {
        const { getHouseholds, getSettings, getEmployees, getDocuments, getPayPeriods } = await import("./storage");

        await expect(getHouseholds()).resolves.toEqual([
            expect.objectContaining({ id: "default", name: "Main household" }),
        ]);
        await expect(getSettings()).resolves.toEqual(
            expect.objectContaining({
                activeHouseholdId: "default",
                employerName: "",
                proStatus: "free",
            })
        );
        await expect(getEmployees()).resolves.toEqual([]);
        await expect(getDocuments()).resolves.toEqual([]);
        await expect(getPayPeriods()).resolves.toEqual([]);
    });

    it("treats recovery profile cache failures as non-fatal", async () => {
        const { getLocalRecoveryProfile, saveLocalRecoveryProfile } = await import("./recovery-profile-store");

        await expect(getLocalRecoveryProfile("user-1")).resolves.toBeNull();
        await expect(saveLocalRecoveryProfile("user-1", {
            keySetupComplete: true,
            validationPayload: null,
            updatedAt: "2026-03-13T12:00:00.000Z",
        })).resolves.toBeUndefined();
    });
});
