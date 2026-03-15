import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearPasswordHandoff, consumePasswordHandoff, hasPasswordHandoff, storePasswordHandoff } from "./password-handoff";

describe("password handoff", () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        vi.useRealTimers();
    });

    it("stores the handoff in sessionStorage and clears it after one use", () => {
        storePasswordHandoff("Owner@example.com", "Password123!");

        expect(hasPasswordHandoff("owner@example.com")).toBe(true);
        expect(consumePasswordHandoff("owner@example.com")).toBe("Password123!");
        expect(hasPasswordHandoff("owner@example.com")).toBe(false);
        expect(consumePasswordHandoff("owner@example.com")).toBeNull();
    });

    it("ignores the handoff for a different email", () => {
        storePasswordHandoff("owner@example.com", "Password123!");

        expect(hasPasswordHandoff("other@example.com")).toBe(false);
        expect(consumePasswordHandoff("other@example.com")).toBeNull();
        expect(hasPasswordHandoff("owner@example.com")).toBe(true);
    });

    it("expires old handoff entries automatically", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-15T05:00:00Z"));

        storePasswordHandoff("owner@example.com", "Password123!");
        vi.setSystemTime(new Date("2026-03-15T05:11:00Z"));

        expect(hasPasswordHandoff("owner@example.com")).toBe(false);
        expect(consumePasswordHandoff("owner@example.com")).toBeNull();
    });

    it("can be cleared explicitly", () => {
        storePasswordHandoff("owner@example.com", "Password123!");

        clearPasswordHandoff();

        expect(hasPasswordHandoff("owner@example.com")).toBe(false);
    });
});
