import { describe, expect, it } from "vitest";
import {
    REFERRAL_REWARD_PENDING_SUMMARY,
    REFUND_POLICY_SENTENCE,
    REFUND_POLICY_SHORT_LABEL,
    REFUND_POLICY_SUMMARY,
    REFUND_WINDOW_DAYS,
    REFUND_WINDOW_LABEL,
} from "./plans";

describe("refund policy constants", () => {
    it("keeps copy and timing aligned at 7 days", () => {
        expect(REFUND_WINDOW_DAYS).toBe(7);
        expect(REFUND_WINDOW_LABEL).toBe("7-day");
        expect(REFUND_POLICY_SHORT_LABEL).toContain("7-day");
        expect(REFUND_POLICY_SENTENCE).toContain("7 days");
        expect(REFUND_POLICY_SUMMARY).toContain("7-day");
        expect(REFERRAL_REWARD_PENDING_SUMMARY).toContain("7-day");
    });
});
