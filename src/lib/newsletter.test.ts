import { beforeEach, describe, expect, it, vi } from "vitest";
import { addNewsletterSubscriber, getSubscribersDueForDrip, markDripSent } from "./newsletter";

function mockD1Response(rows: Array<Record<string, unknown>> = []) {
    return async () => ({
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: [{ results: rows }] }),
    });
}

describe("newsletter", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account");
        vi.stubEnv("CLOUDFLARE_D1_DATABASE_ID", "test-db");
        vi.stubEnv("CLOUDFLARE_D1_API_TOKEN", "test-token");
    });

    describe("addNewsletterSubscriber", () => {
        it("inserts a subscriber into D1 with a normalized email", async () => {
            const fetchMock = vi.fn(mockD1Response());
            vi.stubGlobal("fetch", fetchMock);

            await addNewsletterSubscriber("  Owner@Example.COM  ");

            // First call is CREATE TABLE, second is INSERT
            expect(fetchMock).toHaveBeenCalledTimes(2);
            const [, insertInit] = fetchMock.mock.calls[1] as [string, RequestInit];
            const body = JSON.parse(String(insertInit.body));
            expect(body.sql).toContain("INSERT OR IGNORE");
            expect(body.params[0]).toBe("owner@example.com");
            expect(typeof body.params[1]).toBe("number");
        });

        it("does not throw for a duplicate email (INSERT OR IGNORE)", async () => {
            const fetchMock = vi.fn(mockD1Response());
            vi.stubGlobal("fetch", fetchMock);

            await addNewsletterSubscriber("owner@example.com");
            const callsBefore = fetchMock.mock.calls.length;

            await addNewsletterSubscriber("owner@example.com");

            // Second call should only INSERT (schema already cached)
            expect(fetchMock.mock.calls.length - callsBefore).toBe(1);
        });
    });

    describe("getSubscribersDueForDrip", () => {
        it("queries for drip 1 subscribers not yet sent after 3 days", async () => {
            const fetchMock = vi.fn(mockD1Response([{ email: "a@b.com", subscribed_at: 1000 }]));
            vi.stubGlobal("fetch", fetchMock);

            const result = await getSubscribersDueForDrip(1);

            expect(result).toEqual([{ email: "a@b.com", subscribed_at: 1000 }]);
            const [, selectInit] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
            const body = JSON.parse(String(selectInit.body));
            expect(body.sql).toContain("drip_1_sent_at IS NULL");
            expect(body.sql).not.toContain("drip_1_sent_at IS NOT NULL");
        });

        it("queries for drip 2 subscribers requiring drip 1 already sent", async () => {
            const fetchMock = vi.fn(mockD1Response([]));
            vi.stubGlobal("fetch", fetchMock);

            await getSubscribersDueForDrip(2);

            const [, selectInit] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
            const body = JSON.parse(String(selectInit.body));
            expect(body.sql).toContain("drip_2_sent_at IS NULL");
            expect(body.sql).toContain("drip_1_sent_at IS NOT NULL");
        });

        it("queries for drip 3 subscribers requiring drip 2 already sent", async () => {
            const fetchMock = vi.fn(mockD1Response([]));
            vi.stubGlobal("fetch", fetchMock);

            await getSubscribersDueForDrip(3);

            const [, selectInit] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
            const body = JSON.parse(String(selectInit.body));
            expect(body.sql).toContain("drip_3_sent_at IS NULL");
            expect(body.sql).toContain("drip_2_sent_at IS NOT NULL");
        });
    });

    describe("markDripSent", () => {
        it("updates the correct drip column for the given email", async () => {
            const fetchMock = vi.fn(mockD1Response());
            vi.stubGlobal("fetch", fetchMock);

            await markDripSent("owner@example.com", 2);

            const [, updateInit] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
            const body = JSON.parse(String(updateInit.body));
            expect(body.sql).toContain("drip_2_sent_at");
            expect(body.params[1]).toBe("owner@example.com");
        });
    });
});
