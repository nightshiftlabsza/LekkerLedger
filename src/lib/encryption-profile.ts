import { type EncryptedPayload, type WrappedKeyPayload } from "./crypto";
import { type EncryptionMode, normalizeEncryptionMode } from "./encryption-mode";
import { getLocalRecoveryProfile } from "./recovery-profile-store";
import { createClient } from "./supabase/client";

export interface RemoteEncryptionProfile {
    encryptionMode: EncryptionMode;
    modeVersion: number;
    keySetupComplete: boolean;
    validationPayload: EncryptedPayload | null;
    wrappedMasterKeyUser: WrappedKeyPayload | null;
    recentRecoveryNoticeAt: string | null;
    recentRecoveryEventKind: string | null;
}

export interface EncryptionProfileState extends RemoteEncryptionProfile {
    source: "remote" | "legacy_local" | "cloud_data" | "none";
    fallbackEncryptedRecord: EncryptedPayload | null;
}

export interface SupabaseLikeClient {
    from: ReturnType<typeof createClient>["from"];
}

function buildRemoteProfile(data: Record<string, unknown>): RemoteEncryptionProfile {
    return {
        encryptionMode: normalizeEncryptionMode(data.encryption_mode),
        modeVersion: typeof data.mode_version === "number" ? data.mode_version : 1,
        keySetupComplete: Boolean(data.key_setup_complete),
        validationPayload: (data.validation_payload as EncryptedPayload | null) ?? null,
        wrappedMasterKeyUser: (data.wrapped_master_key_user as WrappedKeyPayload | null) ?? null,
        recentRecoveryNoticeAt: typeof data.recent_recovery_notice_at === "string" ? data.recent_recovery_notice_at : null,
        recentRecoveryEventKind: typeof data.recent_recovery_event_kind === "string" ? data.recent_recovery_event_kind : null,
    };
}

export async function loadEncryptionProfileState(
    userId: string,
    supabase: SupabaseLikeClient,
): Promise<EncryptionProfileState> {
    const { data, error } = await supabase
        .from("user_profiles")
        .select("encryption_mode, mode_version, key_setup_complete, validation_payload, wrapped_master_key_user, recent_recovery_notice_at, recent_recovery_event_kind")
        .eq("id", userId)
        .maybeSingle();

    if (data && typeof data === "object") {
        return {
            ...buildRemoteProfile(data as Record<string, unknown>),
            source: "remote",
            fallbackEncryptedRecord: null,
        };
    }

    if (error) {
        console.warn("Could not read encryption mode from Supabase. Falling back to legacy recovery checks.", error);
    }

    const localProfile = await getLocalRecoveryProfile(userId);

    if (localProfile?.keySetupComplete && localProfile.recoveryKey) {
        return {
            encryptionMode: "maximum_privacy",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: localProfile.validationPayload,
            wrappedMasterKeyUser: null,
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "legacy_local",
            fallbackEncryptedRecord: null,
        };
    }

    const { data: syncedRecord, error: syncedRecordError } = await supabase
        .from("synced_records")
        .select("encrypted_data")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    if (syncedRecord?.encrypted_data) {
        return {
            encryptionMode: "maximum_privacy",
            modeVersion: 1,
            keySetupComplete: true,
            validationPayload: null,
            wrappedMasterKeyUser: null,
            recentRecoveryNoticeAt: null,
            recentRecoveryEventKind: null,
            source: "cloud_data",
            fallbackEncryptedRecord: syncedRecord.encrypted_data as EncryptedPayload,
        };
    }

    if (syncedRecordError) {
        console.warn("Could not inspect encrypted cloud records while checking encryption mode.", syncedRecordError);
    }

    return {
        encryptionMode: "recoverable",
        modeVersion: 1,
        keySetupComplete: false,
        validationPayload: null,
        wrappedMasterKeyUser: null,
        recentRecoveryNoticeAt: null,
        recentRecoveryEventKind: null,
        source: "none",
        fallbackEncryptedRecord: null,
    };
}
