import localforage from "localforage";
import { type EncryptedPayload } from "./crypto";

    interface RecoveryProfileRecord {
    keySetupComplete: boolean;
    validationPayload: EncryptedPayload | null;
    recoveryKey?: string; // Optional: stored locally for auto-unlock
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
