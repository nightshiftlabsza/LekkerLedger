import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

const stores = new Map<string, Map<string, unknown>>();

function getStore(storeName: string) {
    if (!stores.has(storeName)) {
        stores.set(storeName, new Map());
    }
    return stores.get(storeName)!;
}

vi.mock("localforage", () => ({
    default: {
        config: vi.fn(),
        createInstance: vi.fn((options?: { storeName?: string }) => {
            const store = getStore(options?.storeName ?? "default");
            return {
                getItem: vi.fn(async (key: string) => store.get(key) ?? null),
                setItem: vi.fn(async (key: string, value: unknown) => {
                    store.set(key, value);
                    return value;
                }),
                removeItem: vi.fn(async (key: string) => {
                    store.delete(key);
                }),
                clear: vi.fn(async () => {
                    store.clear();
                }),
                iterate: vi.fn(async (iterator: (value: unknown, key: string) => void | Promise<void>) => {
                    for (const [key, value] of store.entries()) {
                        await iterator(value, key);
                    }
                }),
            };
        }),
    },
}));

beforeEach(() => {
    stores.clear();
    vi.restoreAllMocks();
});
