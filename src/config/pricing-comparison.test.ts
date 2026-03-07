import { describe, expect, it } from "vitest";
import { PRICING_COMPARISON_GROUPS } from "./pricing-comparison";

describe("pricing comparison config", () => {
    it("derives the signed contract upload row from plan entitlements", () => {
        const signedUploadRow = PRICING_COMPARISON_GROUPS
            .flatMap((group) => group.rows)
            .find((row) => row.label === "Upload signed contract copies");

        expect(signedUploadRow).toEqual({
            label: "Upload signed contract copies",
            values: {
                free: false,
                standard: true,
                pro: true,
            },
        });
    });
});
