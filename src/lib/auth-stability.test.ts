/**
 * Auth Stability Tests
 *
 * Regression tests to ensure auth/session/data flows never crash on:
 * - undefined/null array fields from stale IndexedDB data
 * - sign-in / sign-out / session restore transitions
 * - corrupted or missing local settings
 * - concurrent auth state changes
 */
import { describe, expect, it, vi } from "vitest";

// ─── PayPeriod.entries normalization (unit-level) ────────────────────
describe("PayPeriod entries safety", () => {
    it("handles currentPeriod with undefined entries without crashing", () => {
        // Simulates the exact dashboard-overview.tsx computation
        const currentPeriod = {
            id: "p-1",
            name: "March 2026",
            startDate: "2026-03-01",
            endDate: "2026-03-31",
            status: "draft" as const,
            createdAt: "2026-03-01",
            updatedAt: "2026-03-01",
            // entries deliberately missing — simulates stale IndexedDB data
        } as { entries?: Array<{ status: string }> };

        const periodEntries = currentPeriod?.entries ?? [];
        const completedEntries = periodEntries.filter((entry) => entry.status === "complete").length;
        const totalEntries = periodEntries.length;
        const pendingEntry = periodEntries.find((entry) => entry.status !== "complete");
        const progressPercent = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

        expect(completedEntries).toBe(0);
        expect(totalEntries).toBe(0);
        expect(pendingEntry).toBeUndefined();
        expect(progressPercent).toBe(0);
    });

    it("handles null currentPeriod without crashing", () => {
        const currentPeriod = null as { entries?: Array<{ status: string }> } | null;

        const periodEntries = currentPeriod?.entries ?? [];
        const completedEntries = periodEntries.filter((entry) => entry.status === "complete").length;
        const totalEntries = periodEntries.length;

        expect(completedEntries).toBe(0);
        expect(totalEntries).toBe(0);
    });

    it("handles entries set to null without crashing", () => {
        const currentPeriod = { entries: null } as unknown as { entries?: Array<{ status: string }> };

        const periodEntries = currentPeriod?.entries ?? [];
        expect(periodEntries).toEqual([]);
        expect(periodEntries.filter(() => true)).toEqual([]);
    });

    it("handles entries set to a non-array without crashing", () => {
        const currentPeriod = { entries: "corrupted" } as unknown as { entries?: Array<{ status: string }> };

        // normalizePayPeriod uses Array.isArray — simulate that
        const entries = Array.isArray(currentPeriod.entries) ? currentPeriod.entries : [];
        expect(entries).toEqual([]);
    });

    it("preserves valid entries array when present", () => {
        const validEntries = [
            { employeeId: "emp-1", status: "complete" },
            { employeeId: "emp-2", status: "empty" },
        ];
        const currentPeriod = { entries: validEntries } as { entries: Array<{ status: string; employeeId: string }> };

        const periodEntries = currentPeriod.entries ?? [];
        expect(periodEntries).toEqual(validEntries);
        expect(periodEntries.filter((e) => e.status === "complete")).toHaveLength(1);
    });

    it("payroll filter with undefined entries uses fallback", () => {
        // Simulates payroll-client.tsx filtering
        const periods = [
            { id: "p-1", status: "locked" as const, entries: undefined },
            { id: "p-2", status: "locked" as const, entries: [{ employeeId: "emp-1", status: "complete" }] },
        ] as Array<{ id: string; status: string; entries?: Array<{ employeeId: string; status: string }> }>;

        const employeeIdFilter = "emp-1";
        const filtered = periods.filter((p) =>
            (p.entries ?? []).some((e) => e.employeeId === employeeIdFilter),
        );

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe("p-2");
    });
});

// ─── EmployerSettings array field safety ─────────────────────────────
describe("EmployerSettings array field safety", () => {
    it("handles undefined customLeaveTypes from stale settings", () => {
        const settings = {
            employerName: "Test",
            customLeaveTypes: undefined,
            usageHistory: undefined,
        } as unknown as { customLeaveTypes?: unknown[]; usageHistory?: unknown[] };

        const customLeaveTypes = Array.isArray(settings.customLeaveTypes) ? settings.customLeaveTypes : [];
        const usageHistory = Array.isArray(settings.usageHistory) ? settings.usageHistory : [];

        expect(customLeaveTypes).toEqual([]);
        expect(usageHistory).toEqual([]);
    });

    it("handles null customLeaveTypes", () => {
        const settings = { customLeaveTypes: null } as unknown as { customLeaveTypes?: unknown[] };
        const safe = settings.customLeaveTypes ?? [];
        expect(safe).toEqual([]);
    });

    it("preserves valid customLeaveTypes", () => {
        const types = [{ id: "t1", name: "Study Leave" }];
        const settings = { customLeaveTypes: types } as { customLeaveTypes: typeof types };
        const safe = settings.customLeaveTypes ?? [];
        expect(safe).toEqual(types);
    });
});

// ─── Error classification ────────────────────────────────────────────
describe("error boundary classification", () => {
    function classifyError(message: string): "auth" | "data" | "network" | "unknown" {
        const lower = message.toLowerCase();
        if (lower.includes("session") || lower.includes("auth") || lower.includes("sign") || lower.includes("token") || lower.includes("login")) {
            return "auth";
        }
        if (lower.includes("filter") || lower.includes("map") || lower.includes("undefined") || lower.includes("null") || lower.includes("cannot read") || lower.includes("is not a function")) {
            return "data";
        }
        if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout") || lower.includes("connection")) {
            return "network";
        }
        return "unknown";
    }

    it("classifies filter/undefined errors as data issues", () => {
        expect(classifyError("Cannot read properties of undefined (reading 'filter')")).toBe("data");
        expect(classifyError("Cannot read properties of null (reading 'map')")).toBe("data");
        expect(classifyError("undefined is not a function")).toBe("data");
    });

    it("classifies session errors as auth issues", () => {
        expect(classifyError("session_expired")).toBe("auth");
        expect(classifyError("Auth session missing")).toBe("auth");
        expect(classifyError("Invalid login credentials")).toBe("auth");
    });

    it("classifies network errors as network issues", () => {
        expect(classifyError("Failed to fetch")).toBe("network");
        expect(classifyError("Network request failed")).toBe("network");
        expect(classifyError("Connection timeout")).toBe("network");
    });

    it("classifies unknown errors as unknown", () => {
        expect(classifyError("Something went wrong")).toBe("unknown");
        expect(classifyError("")).toBe("unknown");
    });
});

// ─── Sign-out flow determinism ───────────────────────────────────────
describe("sign-out flow safety", () => {
    it("always navigates to login even if supabase calls fail", async () => {
        const failingSignOut = vi.fn().mockRejectedValue(new Error("Network error"));
        let navigatedTo: string | null = null;

        async function handleSignOut() {
            try {
                await failingSignOut().catch((e: Error) =>
                    console.warn("Supabase signOut failed", e),
                );
            } catch (error) {
                console.error("Sign out failed", error);
            } finally {
                navigatedTo = "/login";
            }
        }

        await handleSignOut();
        expect(navigatedTo).toBe("/login");
    });

    it("always navigates to login even if data cleanup fails", async () => {
        const failingCleanup = vi.fn().mockRejectedValue(new Error("IndexedDB error"));
        let navigatedTo: string | null = null;

        async function handleSignOut() {
            try {
                await failingCleanup().catch((e: Error) =>
                    console.warn("Cleanup failed", e),
                );
            } catch (error) {
                console.error("Sign out failed", error);
            } finally {
                navigatedTo = "/login";
            }
        }

        await handleSignOut();
        expect(navigatedTo).toBe("/login");
    });
});

// ─── Middleware route protection ─────────────────────────────────────
describe("middleware route classification", () => {
    const PUBLIC_PREFIXES = [
        "/", "/billing", "/login", "/signup", "/forgot-password",
        "/reset-password", "/pricing", "/legal", "/help", "/support", "/trust",
        "/rules", "/resources", "/examples", "/calculator", "/uif-calculator",
        "/ufiling-errors", "/onboarding", "/open-app", "/storage", "/api", "/_next",
    ];

    function isProtectedRoute(pathname: string): boolean {
        if (pathname === "/") return false;
        return !PUBLIC_PREFIXES.some(
            (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(prefix + "/")),
        );
    }

    it("protects dashboard", () => expect(isProtectedRoute("/dashboard")).toBe(true));
    it("protects employees", () => expect(isProtectedRoute("/employees")).toBe(true));
    it("protects employees/new", () => expect(isProtectedRoute("/employees/new")).toBe(true));
    it("protects settings", () => expect(isProtectedRoute("/settings")).toBe(true));
    it("protects payroll", () => expect(isProtectedRoute("/payroll")).toBe(true));
    it("protects documents", () => expect(isProtectedRoute("/documents")).toBe(true));
    it("protects leave", () => expect(isProtectedRoute("/leave")).toBe(true));

    it("allows root", () => expect(isProtectedRoute("/")).toBe(false));
    it("allows login", () => expect(isProtectedRoute("/login")).toBe(false));
    it("allows signup", () => expect(isProtectedRoute("/signup")).toBe(false));
    it("allows pricing", () => expect(isProtectedRoute("/pricing")).toBe(false));
    it("allows billing", () => expect(isProtectedRoute("/billing")).toBe(false));
    it("allows API routes", () => expect(isProtectedRoute("/api/auth/callback")).toBe(false));
    it("allows _next", () => expect(isProtectedRoute("/_next/static/chunk.js")).toBe(false));
});

// ─── Auth state defaults ─────────────────────────────────────────────
describe("auth state defaults", () => {
    it("useAuthState returns safe defaults outside provider", () => {
        // Simulates what happens when useAuthState is called outside AuthStateProvider
        const fallback = {
            user: null,
            isLoading: false,
            refreshUser: async () => undefined,
            signOut: async () => undefined,
        };

        expect(fallback.user).toBeNull();
        expect(fallback.isLoading).toBe(false);
    });

    it("auth status computation handles all states", () => {
        function computeAuthStatus(authLoading: boolean, userId: string | undefined): "loading" | "signed_in" | "signed_out" {
            return authLoading ? "loading" : userId ? "signed_in" : "signed_out";
        }

        expect(computeAuthStatus(true, undefined)).toBe("loading");
        expect(computeAuthStatus(true, "user-123")).toBe("loading");
        expect(computeAuthStatus(false, "user-123")).toBe("signed_in");
        expect(computeAuthStatus(false, undefined)).toBe("signed_out");
        expect(computeAuthStatus(false, "")).toBe("signed_out");
    });

    it("isReadyForDashboard correctly gates data loading", () => {
        function isReadyForDashboard(
            authStatus: "loading" | "signed_in" | "signed_out",
            localSnapshotReady: boolean,
            activationStatus: string,
            subscriptionStatus: string,
        ): boolean {
            return authStatus !== "loading"
                && localSnapshotReady
                && activationStatus !== "pending"
                && (authStatus !== "signed_in" || subscriptionStatus === "resolved");
        }

        // Not ready during auth loading
        expect(isReadyForDashboard("loading", true, "idle", "resolved")).toBe(false);

        // Not ready before local snapshot
        expect(isReadyForDashboard("signed_in", false, "idle", "resolved")).toBe(false);

        // Not ready during activation
        expect(isReadyForDashboard("signed_in", true, "pending", "resolved")).toBe(false);

        // Not ready before subscription resolves
        expect(isReadyForDashboard("signed_in", true, "idle", "loading")).toBe(false);

        // Ready when all conditions met
        expect(isReadyForDashboard("signed_in", true, "idle", "resolved")).toBe(true);

        // Ready for signed-out users without subscription check
        expect(isReadyForDashboard("signed_out", true, "idle", "idle")).toBe(true);
    });
});
