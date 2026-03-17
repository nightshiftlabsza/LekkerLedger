/**
 * Encryption helpers built on the native Web Crypto API.
 * Uses AES-GCM for protected payloads and PBKDF2 for password-based key wrapping.
 */

function getWebCrypto(): Crypto {
    if (typeof globalThis === "undefined" || !globalThis.crypto) {
        throw new Error("Secure encryption is not available on this device.");
    }

    return globalThis.crypto;
}

function getSubtleCrypto(): SubtleCrypto {
    const webCrypto = getWebCrypto();
    if (!webCrypto.subtle) {
        throw new Error("Secure encryption is not available on this device.");
    }

    return webCrypto.subtle;
}

function getRandomBytes(length: number): Uint8Array {
    const webCrypto = getWebCrypto();
    const randomBytes = new Uint8Array(length);
    webCrypto.getRandomValues(randomBytes);
    return randomBytes;
}

function normalizeRecoveryKey(recoveryKey: string): string {
    return recoveryKey.replaceAll(/[^A-Z2-9]/gi, "").toUpperCase();
}

function toArrayBuffer(buffer: ArrayBuffer | ArrayBufferView): ArrayBuffer {
    if (buffer instanceof ArrayBuffer) {
        return buffer;
    }

    const { byteOffset, byteLength } = buffer;
    const sourceBuffer = buffer.buffer;
    if (sourceBuffer instanceof ArrayBuffer && byteOffset === 0 && byteLength === sourceBuffer.byteLength) {
        return sourceBuffer;
    }

    return sourceBuffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
}

async function importAesKey(rawKey: ArrayBuffer | ArrayBufferView, extractable: boolean) {
    const subtleCrypto = getSubtleCrypto();
    return subtleCrypto.importKey(
        "raw",
        toArrayBuffer(rawKey),
        { name: "AES-GCM" },
        extractable,
        ["encrypt", "decrypt"],
    );
}

async function deriveWrappingKey(
    secret: string,
    salt: Uint8Array,
    iterations: number,
) {
    const subtleCrypto = getSubtleCrypto();
    const encoder = new TextEncoder();

    const baseKey = await subtleCrypto.importKey(
        "raw",
        encoder.encode(secret),
        "PBKDF2",
        false,
        ["deriveKey"],
    );

    return subtleCrypto.deriveKey(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: toArrayBuffer(salt),
            iterations,
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );
}

async function encryptBytes(
    bytes: ArrayBuffer | ArrayBufferView,
    key: CryptoKey,
): Promise<EncryptedPayload> {
    const subtleCrypto = getSubtleCrypto();
    const iv = getRandomBytes(12);
    const encryptedBuffer = await subtleCrypto.encrypt(
        {
            name: "AES-GCM",
            iv: toArrayBuffer(iv),
        },
        key,
        toArrayBuffer(bytes),
    );

    return {
        ciphertext: bufferToBase64(encryptedBuffer),
        iv: bufferToBase64(iv),
    };
}

async function decryptBytes(
    payload: EncryptedPayload,
    key: CryptoKey,
): Promise<ArrayBuffer> {
    const subtleCrypto = getSubtleCrypto();
    const ivBuffer = base64ToBuffer(payload.iv);
    const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

    return subtleCrypto.decrypt(
        {
            name: "AES-GCM",
            iv: ivBuffer,
        },
        key,
        ciphertextBuffer,
    );
}

function getIterationsFromKdf(kdf: string | null | undefined, fallback: number): number {
    if (!kdf) return fallback;
    const match = kdf.match(/(\d+)$/);
    const parsed = match ? Number.parseInt(match[1] ?? "", 10) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
}

const USER_WRAP_ITERATIONS = 310000;
const SERVER_WRAP_ITERATIONS = 180000;
const VALIDATION_MAGIC_WORD = "LEKKER_LEDGER_RECOVERY_OK";
export const USER_WRAP_KDF = ["PBKDF2", "SHA", "256", String(USER_WRAP_ITERATIONS)].join("-");
export const SERVER_WRAP_KDF = ["PBKDF2", "SHA", "256", String(SERVER_WRAP_ITERATIONS)].join("-");

// Generate a random 256-bit recovery key encoded as a readable string
export function generateRecoveryKey(): string {
    const randomBytes = getRandomBytes(32);

    // Convert to a base32-like alphabet to avoid ambiguous characters
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < randomBytes.length; i += 1) {
        result += alphabet[randomBytes[i] % alphabet.length];
        if ((i + 1) % 4 === 0 && i !== randomBytes.length - 1) {
            result += "-";
        }
    }
    return result;
}

// Convert string recovery key to a CryptoKey via SHA-256
export async function deriveKey(recoveryKey: string): Promise<CryptoKey> {
    const subtleCrypto = getSubtleCrypto();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(normalizeRecoveryKey(recoveryKey));

    const hash = await subtleCrypto.digest("SHA-256", keyData);

    return subtleCrypto.importKey(
        "raw",
        hash,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
    );
}

// Convert ArrayBuffer to Base64 string
export function bufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
    let binary = "";
    const bytes = new Uint8Array(toArrayBuffer(buffer));
    for (let i = 0; i < bytes.byteLength; i += 1) {
        binary += String.fromCodePoint(bytes[i]);
    }
    return btoa(binary);
}

// Convert Base64 string to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.codePointAt(i) ?? 0;
    }
    return bytes.buffer;
}

export interface EncryptedPayload {
    ciphertext: string;
    iv: string;
}

export interface WrappedKeyPayload extends EncryptedPayload {
    salt: string;
    kdf: string;
    algorithm: "AES-GCM";
}

export async function generateAccountMasterKey(): Promise<CryptoKey> {
    const subtleCrypto = getSubtleCrypto();
    return subtleCrypto.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"],
    );
}

export async function exportAccountMasterKey(masterKey: CryptoKey): Promise<string> {
    const subtleCrypto = getSubtleCrypto();
    const rawKey = await subtleCrypto.exportKey("raw", masterKey);
    return bufferToBase64(rawKey);
}

export async function importAccountMasterKey(rawKeyBase64: string): Promise<CryptoKey> {
    return importAesKey(base64ToBuffer(rawKeyBase64), true);
}

export async function wrapMasterKeyWithPassword(
    masterKey: CryptoKey,
    password: string,
): Promise<WrappedKeyPayload> {
    const subtleCrypto = getSubtleCrypto();
    const salt = getRandomBytes(16);
    const wrappingKey = await deriveWrappingKey(password, salt, USER_WRAP_ITERATIONS);
    const rawMasterKey = await subtleCrypto.exportKey("raw", masterKey);
    const wrapped = await encryptBytes(rawMasterKey, wrappingKey);

    return {
        ...wrapped,
        salt: bufferToBase64(salt),
        kdf: USER_WRAP_KDF,
        algorithm: "AES-GCM",
    };
}

export async function unwrapMasterKeyWithPassword(
    wrappedKey: WrappedKeyPayload,
    password: string,
): Promise<CryptoKey> {
    const salt = new Uint8Array(base64ToBuffer(wrappedKey.salt));
    const iterations = getIterationsFromKdf(wrappedKey.kdf, USER_WRAP_ITERATIONS);
    const wrappingKey = await deriveWrappingKey(password, salt, iterations);
    const rawMasterKey = await decryptBytes(wrappedKey, wrappingKey);
    return importAesKey(rawMasterKey, true);
}

export async function wrapMasterKeyWithServerSecret(
    masterKey: CryptoKey,
    serverSecret: string,
    userId: string,
): Promise<WrappedKeyPayload> {
    const subtleCrypto = getSubtleCrypto();
    const salt = getRandomBytes(16);
    const wrappingKey = await deriveWrappingKey(
        `${serverSecret}:${userId}`,
        salt,
        SERVER_WRAP_ITERATIONS,
    );
    const rawMasterKey = await subtleCrypto.exportKey("raw", masterKey);
    const wrapped = await encryptBytes(rawMasterKey, wrappingKey);

    return {
        ...wrapped,
        salt: bufferToBase64(salt),
        kdf: SERVER_WRAP_KDF,
        algorithm: "AES-GCM",
    };
}

export async function unwrapMasterKeyWithServerSecret(
    wrappedKey: WrappedKeyPayload,
    serverSecret: string,
    userId: string,
): Promise<CryptoKey> {
    const salt = new Uint8Array(base64ToBuffer(wrappedKey.salt));
    const iterations = getIterationsFromKdf(wrappedKey.kdf, SERVER_WRAP_ITERATIONS);
    const wrappingKey = await deriveWrappingKey(
        `${serverSecret}:${userId}`,
        salt,
        iterations,
    );
    const rawMasterKey = await decryptBytes(wrappedKey, wrappingKey);
    return importAesKey(rawMasterKey, true);
}

// Encrypt a JSON object
export async function encryptData(data: unknown, key: CryptoKey): Promise<EncryptedPayload> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    return encryptBytes(encodedData, key);
}

// Decrypt back to JSON object
export async function decryptData<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
    const decryptedBuffer = await decryptBytes(payload, key);
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
}

/**
 * Encrypt a file (Blob or File) for cloud storage.
 * Keeps it in memory because household payroll files should remain small.
 */
export async function encryptFile(file: File, key: CryptoKey): Promise<{ encryptedBlob: Blob; iv: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const encryptedPayload = await encryptBytes(arrayBuffer, key);

    return {
        encryptedBlob: new Blob([base64ToBuffer(encryptedPayload.ciphertext)], { type: "application/octet-stream" }),
        iv: encryptedPayload.iv,
    };
}

/**
 * Decrypt a file previously encrypted with encryptFile.
 */
export async function decryptFile(encryptedBlob: Blob, ivBase64: string, key: CryptoKey, originalMimeType: string): Promise<Blob> {
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    const decryptedBuffer = await decryptBytes(
        {
            ciphertext: bufferToBase64(encryptedBuffer),
            iv: ivBase64,
        },
        key,
    );

    return new Blob([decryptedBuffer], { type: originalMimeType });
}

/**
 * Generates an encrypted validation payload.
 * Stored alongside the user's account profile so the app can verify the unlock key.
 */
export async function generateValidationPayload(key: CryptoKey): Promise<EncryptedPayload> {
    return encryptData({ magicWord: VALIDATION_MAGIC_WORD }, key);
}

/**
 * Attempts to decrypt the validation payload. If it succeeds and the magic word matches,
 * the key is correct.
 */
export async function verifyValidationPayload(payload: EncryptedPayload, key: CryptoKey): Promise<boolean> {
    try {
        const decrypted = await decryptData<{ magicWord: string }>(payload, key);
        return decrypted.magicWord === VALIDATION_MAGIC_WORD;
    } catch {
        return false;
    }
}
