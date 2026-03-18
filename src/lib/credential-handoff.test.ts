import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearCredentialHandoff,
    consumeCredentialHandoff,
    hasCredentialHandoff,
    storeCredentialHandoff,
} from "./credential-handoff";

describe("credential handoff", () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        vi.useRealTimers();
    });

    it("stores the handoff in sessionStorage and clears it after one use", () => {
        storeCredentialHandoff("Owner@example.com", "Password123!");

        expect(hasCredentialHandoff("owner@example.com")).toBe(true);
        expect(consumeCredentialHandoff("owner@example.com")).toBe("Password123!");
        expect(hasCredentialHandoff("owner@example.com")).toBe(false);
        expect(consumeCredentialHandoff("owner@example.com")).toBeNull();
    });

    it("ignores the handoff for a different email", () => {
        storeCredentialHandoff("owner@example.com", "Password123!");

        expect(hasCredentialHandoff("other@example.com")).toBe(false);
        expect(consumeCredentialHandoff("other@example.com")).toBeNull();
        expect(hasCredentialHandoff("owner@example.com")).toBe(true);
    });

    it("expires old handoff entries automatically", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-15T05:00:00Z"));

        storeCredentialHandoff("owner@example.com", "Password123!");
        vi.setSystemTime(new Date("2026-03-15T05:11:00Z"));

        expect(hasCredentialHandoff("owner@example.com")).toBe(false);
        expect(consumeCredentialHandoff("owner@example.com")).toBeNull();
    });

    it("can be cleared explicitly", () => {
        storeCredentialHandoff("owner@example.com", "Password123!");

        clearCredentialHandoff();

        expect(hasCredentialHandoff("owner@example.com")).toBe(false);
    });
});
