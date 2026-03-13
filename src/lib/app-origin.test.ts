import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConfiguredAppOrigin, getRequestAppOrigin, normalizeAppOrigin } from "./app-origin";

describe("app origin helpers", () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
    });

    it("rewrites 0.0.0.0 to localhost", () => {
        expect(normalizeAppOrigin("https://0.0.0.0:3000")).toBe("https://localhost:3000");
    });

    it("accepts bare hostnames for configured public urls", () => {
        expect(normalizeAppOrigin("lekkerledger.co.za")).toBe("https://lekkerledger.co.za");
    });

    it("prefers NEXT_PUBLIC_APP_URL when configured", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lekkerledger.co.za");
        expect(getConfiguredAppOrigin()).toBe("https://lekkerledger.co.za");
    });

    it("sanitizes forwarded request hosts", () => {
        const request = new Request("https://0.0.0.0:3000/api/auth/callback?next=%2Fdashboard", {
            headers: {
                "x-forwarded-host": "0.0.0.0:3000",
                "x-forwarded-proto": "https",
            },
        });

        expect(getRequestAppOrigin(request)).toBe("https://localhost:3000");
    });

    it("keeps local http requests on http when no forwarded proto is present", () => {
        const request = new Request("http://localhost:3000/api/auth/callback?next=%2Fdashboard", {
            headers: {
                host: "localhost:3000",
            },
        });

        expect(getRequestAppOrigin(request)).toBe("http://localhost:3000");
    });
});
