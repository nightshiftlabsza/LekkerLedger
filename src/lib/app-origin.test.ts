import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBrowserAppOrigin, getCanonicalAppOrigin, getConfiguredAppOrigin, getRequestAppOrigin, normalizeAppOrigin } from "./app-origin";

describe("app origin helpers", () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
    });

    it("rewrites 0.0.0.0 to localhost", () => {
        expect(normalizeAppOrigin("https://0.0.0.0:3002")).toBe("https://localhost:3002");
    });

    it("accepts bare hostnames for configured public urls", () => {
        expect(normalizeAppOrigin("lekkerledger.co.za")).toBe("https://lekkerledger.co.za");
    });

    it("rewrites the legacy www hostname to the canonical app origin", () => {
        expect(getCanonicalAppOrigin("https://www.lekkerledger.co.za")).toBe("https://lekkerledger.co.za");
    });

    it("prefers NEXT_PUBLIC_APP_URL when configured", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");
        expect(getConfiguredAppOrigin()).toBe("https://lekkerledger.co.za");
    });

    it("sanitizes forwarded request hosts", () => {
        const request = new Request("https://0.0.0.0:3002/api/auth/callback?next=%2Fdashboard", {
            headers: {
                "x-forwarded-host": "0.0.0.0:3002",
                "x-forwarded-proto": "https",
            },
        });

        expect(getRequestAppOrigin(request)).toBe("https://localhost:3002");
    });

    it("keeps local http requests on http when no forwarded proto is present", () => {
        const request = new Request("http://localhost:3002/api/auth/callback?next=%2Fdashboard", {
            headers: {
                host: "localhost:3002",
            },
        });

        expect(getRequestAppOrigin(request)).toBe("http://localhost:3002");
    });

    it("prefers the live site for non-local requests when configured", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");

        const request = new Request("https://lekkerledger.co.za/api/auth/callback?next=%2Fdashboard", {
            headers: {
                host: "lekkerledger.co.za",
            },
        });

        expect(getRequestAppOrigin(request)).toBe("https://lekkerledger.co.za");
    });

    it("keeps the active preview origin instead of forcing production", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");

        const request = new Request("https://preview-123.up.railway.app/api/auth/callback?next=%2Fdashboard", {
            headers: {
                host: "preview-123.up.railway.app",
            },
        });

        expect(getRequestAppOrigin(request)).toBe("https://preview-123.up.railway.app");
    });

    it("keeps localhost requests local even when the live site is configured", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");

        const request = new Request("http://localhost:3002/api/auth/callback?next=%2Fdashboard", {
            headers: {
                host: "localhost:3002",
            },
        });

        expect(getRequestAppOrigin(request)).toBe("http://localhost:3002");
    });

    it("uses the browser origin for previews instead of forcing production", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");
        const originalWindow = globalThis.window;

        vi.stubGlobal("window", {
            location: {
                origin: "https://preview-123.up.railway.app",
            },
        });

        expect(getBrowserAppOrigin()).toBe("https://preview-123.up.railway.app");

        vi.stubGlobal("window", originalWindow);
    });
});
