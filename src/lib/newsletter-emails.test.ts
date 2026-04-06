import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDripEmail, sendDripEmail } from "./newsletter-emails";

describe("newsletter-emails", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    describe("getDripEmail", () => {
        it("returns the correct subject for drip 1", () => {
            const drip = getDripEmail(1);
            expect(drip.subject).toBe("The one UIF rule most household employers miss");
            expect(drip.html).toContain("Compliance tip");
            expect(drip.text).toContain("UIF");
        });

        it("returns the correct subject for drip 2", () => {
            const drip = getDripEmail(2);
            expect(drip.subject).toBe("5 things every domestic worker payslip should show");
            expect(drip.html).toContain("Payslip guide");
            expect(drip.text).toContain("Gross pay");
        });

        it("returns the correct subject for drip 3", () => {
            const drip = getDripEmail(3);
            expect(drip.subject).toContain("R29/month");
            expect(drip.html).toContain("Limited offer");
            expect(drip.text).toContain("cancel anytime");
        });

        it("includes CivicLedger branding in all drip HTML", () => {
            for (const n of [1, 2, 3] as const) {
                const drip = getDripEmail(n);
                expect(drip.html).toContain("#FAF7F0");
                expect(drip.html).toContain("#C47A1C");
                expect(drip.html).toContain("#007A4D");
                expect(drip.html).toContain("IBM Plex Serif");
                expect(drip.html).toContain("IBM Plex Sans");
                expect(drip.html).toContain("lekkerledger-logo.png");
            }
        });
    });

    describe("sendDripEmail", () => {
        it("sends via Resend with the correct payload", async () => {
            vi.stubEnv("RESEND_API_KEY", "re_test_key");
            vi.stubEnv("FREE_PAYSLIP_FROM_EMAIL", "noreply@lekkerledger.co.za");
            const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
            vi.stubGlobal("fetch", fetchMock);

            await sendDripEmail("owner@example.com", 1);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
            expect(url).toBe("https://api.resend.com/emails");
            const body = JSON.parse(String(init.body));
            expect(body.from).toBe("noreply@lekkerledger.co.za");
            expect(body.to).toEqual(["owner@example.com"]);
            expect(body.subject).toBe("The one UIF rule most household employers miss");
            expect(body.html).toBeTruthy();
            expect(body.text).toBeTruthy();
        });

        it("throws when Resend returns an error", async () => {
            vi.stubEnv("RESEND_API_KEY", "re_test_key");
            vi.stubEnv("FREE_PAYSLIP_FROM_EMAIL", "noreply@lekkerledger.co.za");
            const fetchMock = vi.fn(async () => ({
                ok: false,
                status: 422,
                json: async () => ({ error: { message: "Invalid email" } }),
            }));
            vi.stubGlobal("fetch", fetchMock);

            await expect(sendDripEmail("bad", 1)).rejects.toThrow("Invalid email");
        });
    });
});
