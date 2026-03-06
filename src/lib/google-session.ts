"use client";

// Shared browser storage keys for Google identity and session state.
export const GOOGLE_ACCESS_TOKEN_STORAGE_KEY = "google_access_token";
export const GOOGLE_EMAIL_STORAGE_KEY = "google_email";
export const GOOGLE_SUB_STORAGE_KEY = "google_sub";
export const GOOGLE_DRIVE_SCOPE_STORAGE_KEY = "google_has_drive_scope";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isStorageLike(value: unknown): value is StorageLike {
    return !!value
        && typeof value === "object"
        && typeof (value as StorageLike).getItem === "function"
        && typeof (value as StorageLike).setItem === "function"
        && typeof (value as StorageLike).removeItem === "function";
}

function getSessionStorage(): StorageLike | null {
    if (typeof window === "undefined") return null;
    return isStorageLike(globalThis.sessionStorage) ? globalThis.sessionStorage : null;
}

function getLocalStorage(): StorageLike | null {
    if (typeof window === "undefined") return null;
    return isStorageLike(globalThis.localStorage) ? globalThis.localStorage : null;
}

export function getStoredGoogleAccessToken(): string | null {
    return getSessionStorage()?.getItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY)
        || getLocalStorage()?.getItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY)
        || null;
}

export function storeGoogleAccessToken(token: string) {
    getSessionStorage()?.setItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY, token);
    getLocalStorage()?.removeItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY);
}

export function clearStoredGoogleAccessToken() {
    getSessionStorage()?.removeItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY);
    getLocalStorage()?.removeItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredGoogleEmail(): string | null {
    return getLocalStorage()?.getItem(GOOGLE_EMAIL_STORAGE_KEY) || null;
}

export function getStoredGoogleSub(): string | null {
    return getLocalStorage()?.getItem(GOOGLE_SUB_STORAGE_KEY) || null;
}

export function storeGoogleIdentity(input: { email: string; sub?: string | null }) {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.setItem(GOOGLE_EMAIL_STORAGE_KEY, input.email);
    if (input.sub) {
        storage.setItem(GOOGLE_SUB_STORAGE_KEY, input.sub);
    }
}

export function clearStoredGoogleIdentity() {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.removeItem(GOOGLE_EMAIL_STORAGE_KEY);
    storage.removeItem(GOOGLE_SUB_STORAGE_KEY);
}

export function hasStoredGoogleDriveScope(): boolean {
    return getLocalStorage()?.getItem(GOOGLE_DRIVE_SCOPE_STORAGE_KEY) === "true";
}

export function setStoredGoogleDriveScope(enabled: boolean) {
    const storage = getLocalStorage();
    if (!storage) return;
    if (enabled) {
        storage.setItem(GOOGLE_DRIVE_SCOPE_STORAGE_KEY, "true");
        return;
    }
    storage.removeItem(GOOGLE_DRIVE_SCOPE_STORAGE_KEY);
}

export function clearStoredGoogleSession() {
    clearStoredGoogleAccessToken();
    clearStoredGoogleIdentity();
    setStoredGoogleDriveScope(false);
}

export function hasStoredGoogleSession(): boolean {
    return !!getStoredGoogleAccessToken();
}
