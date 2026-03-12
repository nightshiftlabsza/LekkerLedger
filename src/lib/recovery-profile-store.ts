import localforage from "localforage";
import { type EncryptedPayload } from "./crypto";

interface RecoveryProfileRecord {
    keySetupComplete: boolean;
    validationPayload: EncryptedPayload | null;
    updatedAt: string;
}

const recoveryProfileStore = localforage.createInstance({
    name: "LekkerLedger",
    storeName: "recovery_profiles",
});

export async function getLocalRecoveryProfile(userId: string): Promise<RecoveryProfileRecord | null> {
    return (await recoveryProfileStore.getItem<RecoveryProfileRecord>(userId)) ?? null;
}

export async function saveLocalRecoveryProfile(userId: string, profile: RecoveryProfileRecord) {
    await recoveryProfileStore.setItem(userId, profile);
}

