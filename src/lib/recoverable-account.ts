import {
    exportAccountMasterKey,
    generateValidationPayload,
    type EncryptedPayload,
    type WrappedKeyPayload,
    wrapMasterKeyWithPassword,
} from "./crypto";

export interface RecoverableSetupArtifacts {
    rawMasterKey: string;
    cachedMasterKey: string;
    validationPayload: EncryptedPayload;
    wrappedMasterKeyUser: WrappedKeyPayload;
}

export async function buildRecoverableSetupArtifacts(
    masterKey: CryptoKey,
    password: string,
): Promise<RecoverableSetupArtifacts> {
    const [rawMasterKey, validationPayload, wrappedMasterKeyUser] = await Promise.all([
        exportAccountMasterKey(masterKey),
        generateValidationPayload(masterKey),
        wrapMasterKeyWithPassword(masterKey, password),
    ]);

    return {
        rawMasterKey,
        cachedMasterKey: rawMasterKey,
        validationPayload,
        wrappedMasterKeyUser,
    };
}

export async function sendRecoverableSetupRequest(input: {
    rawMasterKey: string;
    validationPayload: EncryptedPayload;
    wrappedMasterKeyUser: WrappedKeyPayload;
    source: "setup" | "migration";
}) {
    const response = await fetch("/api/encryption/recoverable/setup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "Recoverable setup could not be completed.");
    }
}

export async function requestRecoveredMasterKey(reason: "password_reset" | "manual_recovery" = "password_reset") {
    const response = await fetch("/api/encryption/recoverable/recover", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "Account recovery could not be completed.");
    }

    return response.json() as Promise<{ rawMasterKey: string }>;
}
