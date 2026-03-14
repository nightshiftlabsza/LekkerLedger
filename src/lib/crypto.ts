/**
 * Zero-Knowledge Encryption Utilities using the native Web Crypto API.
 * Uses AES-GCM for authenticated encryption.
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

// Generate a random 256-bit recovery key encoded as a readable string
export function generateRecoveryKey(): string {
    const webCrypto = getWebCrypto();
    const randomBytes = new Uint8Array(32);
    webCrypto.getRandomValues(randomBytes);
    
    // Convert to a base32-like alphabet to avoid ambiguous characters
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < randomBytes.length; i++) {
        result += alphabet[randomBytes[i] % alphabet.length];
        if ((i + 1) % 4 === 0 && i !== randomBytes.length - 1) {
            result += '-';
        }
    }
    return result;
}

// Convert string recovery key to a CryptoKey via SHA-256 for Key Derivation
export async function deriveKey(recoveryKey: string): Promise<CryptoKey> {
    const subtleCrypto = getSubtleCrypto();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(recoveryKey.replaceAll("-", "").toUpperCase());
    
    const hash = await subtleCrypto.digest('SHA-256', keyData);
    
    return subtleCrypto.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

// Convert ArrayBuffer to Base64 string
export function bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCodePoint(bytes[i]);
    }
    return btoa(binary);
}

// Convert Base64 string to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.codePointAt(i) ?? 0;
    }
    return bytes.buffer;
}

export interface EncryptedPayload {
    ciphertext: string;
    iv: string;
}

// Encrypt a JSON object
export async function encryptData(data: unknown, key: CryptoKey): Promise<EncryptedPayload> {
    const webCrypto = getWebCrypto();
    const subtleCrypto = getSubtleCrypto();
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    
    // Generate a random 12-byte IV (96 bits is recommended for AES-GCM)
    const iv = new Uint8Array(12);
    webCrypto.getRandomValues(iv);
    
    const encryptedBuffer = await subtleCrypto.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encodedData
    );
    
    return {
        ciphertext: bufferToBase64(encryptedBuffer),
        iv: bufferToBase64(iv.buffer)
    };
}

// Decrypt back to JSON object
export async function decryptData<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
    const subtleCrypto = getSubtleCrypto();
    const ivBuffer = base64ToBuffer(payload.iv);
    const ciphertextBuffer = base64ToBuffer(payload.ciphertext);
    
    const decryptedBuffer = await subtleCrypto.decrypt(
        {
            name: 'AES-GCM',
            iv: ivBuffer
        },
        key,
        ciphertextBuffer
    );
    
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
}

/**
 * Encrypt a file (Blob or File) for cloud storage.
 * Note: Keeps it in memory. For huge files, chunking would be required,
 * but household ledger receipts shouldn't exceed memory limits.
 */
export async function encryptFile(file: File, key: CryptoKey): Promise<{ encryptedBlob: Blob; iv: string }> {
    const webCrypto = getWebCrypto();
    const subtleCrypto = getSubtleCrypto();
    const arrayBuffer = await file.arrayBuffer();
    
    const iv = new Uint8Array(12);
    webCrypto.getRandomValues(iv);
    
    const encryptedBuffer = await subtleCrypto.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        arrayBuffer
    );
    
    return {
        encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
        iv: bufferToBase64(iv.buffer)
    };
}

/**
 * Decrypt a file previously encrypted with encryptFile.
 */
export async function decryptFile(encryptedBlob: Blob, ivBase64: string, key: CryptoKey, originalMimeType: string): Promise<Blob> {
    const subtleCrypto = getSubtleCrypto();
    const ivBuffer = base64ToBuffer(ivBase64);
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    
    const decryptedBuffer = await subtleCrypto.decrypt(
        {
            name: 'AES-GCM',
            iv: ivBuffer
        },
        key,
        encryptedBuffer
    );
    
    return new Blob([decryptedBuffer], { type: originalMimeType });
}

const VALIDATION_MAGIC_WORD = "LEKKER_LEDGER_RECOVERY_OK";

/**
 * Generates an encrypted validation payload.
 * This should be stored in the database alongside the user's account (e.g., in user_profiles).
 * When the user logs in on a new device and enters their recovery key,
 * they decrypt this payload to prove the key is correct.
 */
export async function generateValidationPayload(key: CryptoKey): Promise<EncryptedPayload> {
    return encryptData({ magicWord: VALIDATION_MAGIC_WORD }, key);
}

/**
 * Attempts to decrypt the validation payload. If it succeeds and the magic word matches,
 * the recovery key is correct.
 */
export async function verifyValidationPayload(payload: EncryptedPayload, key: CryptoKey): Promise<boolean> {
    try {
        const decrypted = await decryptData<{ magicWord: string }>(payload, key);
        return decrypted.magicWord === VALIDATION_MAGIC_WORD;
    } catch {
        return false;
    }
}
