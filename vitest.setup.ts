import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock localforage for JSDOM environment
vi.mock("localforage", () => ({
    default: {
        config: vi.fn(),
        createInstance: vi.fn().mockReturnValue({
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        }),
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    },
}));
