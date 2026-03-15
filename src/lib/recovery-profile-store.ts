import localforage from "localforage";
import { type EncryptedPayload } from "./crypto";
import { type EncryptionMode } from "./encryption-mode";

export interface RecoveryProfileRecord {
    encryptionMode?: EncryptionMode;
    keySetupComplete: boolean;
    validationPayload: EncryptedPayload | null;
    recoveryKey?: string; // Legacy Maximum Privacy cache for auto-unlock
    cachedMasterKey?: string; // Recoverable mode cache for same-device auto-unlock
    updatedAt: string;
}

const recoveryProfileStore = localforage.createInstance({
    name: "LekkerLedger",
    storeName: "recovery_profiles",
});

export async function getLocalRecoveryProfile(userId: string): Promise<RecoveryProfileRecord | null> {
    try {
        return (await recoveryProfileStore.getItem<RecoveryProfileRecord>(userId)) ?? null;
    } catch (error) {
        console.warn("Recovery profile storage is unavailable on this device. Falling back to cloud-only lookup.", error);
        return null;
    }
}

export async function saveLocalRecoveryProfile(userId: string, profile: RecoveryProfileRecord) {
    try {
        await recoveryProfileStore.setItem(userId, profile);
    } catch (error) {
        console.warn("Recovery profile could not be saved on this device. Continuing without the local cache.", error);
    }
}

export async function deleteLocalRecoveryProfile(userId: string) {
    try {
        await recoveryProfileStore.removeItem(userId);
    } catch (error) {
        console.warn("Recovery profile could not be removed from this device. Continuing sign-out anyway.", error);
    }
}

export async function clearAllLocalRecoveryProfiles() {
    try {
        await recoveryProfileStore.clear();
    } catch (error) {
        console.warn("Recovery profiles could not be cleared from this device. Continuing local reset anyway.", error);
    }
}
