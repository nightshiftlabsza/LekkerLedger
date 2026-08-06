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
}): Promise<{ ok: true; alreadyComplete?: boolean }> {
    const response = await fetch("/api/encryption/recoverable/setup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
    });

    const result = await response.json().catch(() => null) as { ok?: boolean; alreadyComplete?: boolean; error?: string } | null;
    if (!response.ok) {
        throw new Error(result?.error || "Recoverable setup could not be completed.");
    }

    return { ok: true, alreadyComplete: result?.alreadyComplete };
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
