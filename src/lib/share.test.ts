import { beforeEach, describe, expect, it, vi } from "vitest";
import { openWhatsAppChat, shareViaWhatsApp } from "./share";

describe("WhatsApp share helpers", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.stubGlobal("open", vi.fn(() => ({ closed: false })));
        vi.stubGlobal("setTimeout", vi.fn(() => 1));
        vi.stubGlobal("clearTimeout", vi.fn());

        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            writable: true,
            value: vi.fn(() => "blob:test"),
        });

        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            writable: true,
            value: vi.fn(),
        });

        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });

    it("opens the employee chat when a phone number exists", async () => {
        const result = await shareViaWhatsApp(new Uint8Array([1, 2, 3]), "Thandi Dlamini", "0821111111", "Mar 2026");

        expect(result).toBe("opened");
        expect(globalThis.open).toHaveBeenCalledWith(
            "https://wa.me/27821111111?text=Hi%20Thandi%2C%20here%20is%20your%20payslip%20for%20Mar%202026.",
            "_blank",
            "noopener,noreferrer",
        );
        expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it("returns a truthful missing-phone result without opening WhatsApp", async () => {
        const result = await shareViaWhatsApp(new Uint8Array([1, 2, 3]), "Sipho Maseko", "", "Mar 2026");

        expect(result).toBe("missing-phone");
        expect(globalThis.open).not.toHaveBeenCalled();
        expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it("reports when the browser blocks the WhatsApp window", () => {
        vi.stubGlobal("open", vi.fn(() => null));

        const result = openWhatsAppChat("0821111111", "Hello");

        expect(result).toBe("blocked");
        expect(globalThis.open).toHaveBeenCalledWith(
            "https://wa.me/27821111111?text=Hello",
            "_blank",
            "noopener,noreferrer",
        );
    });
});
