import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-key";

const stores = new Map<string, Map<string, unknown>>();

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

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
