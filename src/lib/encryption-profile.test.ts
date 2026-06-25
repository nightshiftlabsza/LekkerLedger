import { describe, expect, it, vi } from "vitest";
import { loadEncryptionProfileState, type SupabaseLikeClient } from "./encryption-profile";

vi.mock("./recovery-profile-store", () => ({
    getLocalRecoveryProfile: vi.fn(async () => null),
}));

function buildSupabaseClient(profileData: Record<string, unknown> | null): SupabaseLikeClient {
    return {
        from: (table: string) => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: async () => {
                        if (table === "user_profiles") {
                            return { data: profileData, error: null };
                        }

                        return { data: null, error: null };
                    },
                    limit: () => ({
                        maybeSingle: async () => ({ data: null, error: null }),
                    }),
                }),
            }),
        }),
    } as unknown as SupabaseLikeClient;
}

describe("loadEncryptionProfileState", () => {
    it("keeps completed legacy Maximum Privacy accounts on the recovery-key path", async () => {
        const profile = await loadEncryptionProfileState("user-1", buildSupabaseClient({
            encryption_mode: "maximum_privacy",
            mode_version: 1,
            key_setup_complete: true,
            validation_payload: { ciphertext: "ciphertext", iv: "iv" },
        }));

        expect(profile.encryptionMode).toBe("maximum_privacy");
        expect(profile.keySetupComplete).toBe(true);
        expect(profile.source).toBe("remote");
    });

    it("treats incomplete old/default profile rows as Recoverable setup", async () => {
        const profile = await loadEncryptionProfileState("user-1", buildSupabaseClient({
            encryption_mode: "maximum_privacy",
            mode_version: 1,
            key_setup_complete: false,
        }));

        expect(profile.encryptionMode).toBe("recoverable");
        expect(profile.keySetupComplete).toBe(false);
        expect(profile.source).toBe("remote");
    });
});
