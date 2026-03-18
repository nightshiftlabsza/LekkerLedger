const CREDENTIAL_HANDOFF_STORAGE_KEY = "lekkerledger:credential-handoff";
const CREDENTIAL_HANDOFF_MAX_AGE_MS = 10 * 60 * 1000;

interface CredentialHandoffRecord {
    email: string;
    password: string;
    createdAt: number;
}

function readStoredRecord(): CredentialHandoffRecord | null {
    if (typeof globalThis.window === "undefined") {
        return null;
    }

    try {
        const raw = globalThis.window.sessionStorage.getItem(CREDENTIAL_HANDOFF_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as CredentialHandoffRecord;
        if (!parsed.email || !parsed.password || !parsed.createdAt) {
            clearCredentialHandoff();
            return null;
        }

        if (Date.now() - parsed.createdAt > CREDENTIAL_HANDOFF_MAX_AGE_MS) {
            clearCredentialHandoff();
            return null;
        }

        return parsed;
    } catch {
        clearCredentialHandoff();
        return null;
    }
}

export function storeCredentialHandoff(email: string, password: string) {
    if (typeof globalThis.window === "undefined") {
        return;
    }

    try {
        globalThis.window.sessionStorage.setItem(CREDENTIAL_HANDOFF_STORAGE_KEY, JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            createdAt: Date.now(),
        } satisfies CredentialHandoffRecord));
    } catch {
        // Ignore sessionStorage failures and fall back to manual password confirmation.
    }
}

export function hasCredentialHandoff(email?: string | null): boolean {
    const record = readStoredRecord();
    if (!record) {
        return false;
    }

    if (!email) {
        return true;
    }

    return record.email === email.trim().toLowerCase();
}

export function consumeCredentialHandoff(email?: string | null): string | null {
    const record = readStoredRecord();
    if (!record) {
        return null;
    }

    if (email && record.email !== email.trim().toLowerCase()) {
        return null;
    }

    clearCredentialHandoff();
    return record.password;
}

export function clearCredentialHandoff() {
    if (typeof globalThis.window === "undefined") {
        return;
    }

    try {
        globalThis.window.sessionStorage.removeItem(CREDENTIAL_HANDOFF_STORAGE_KEY);
    } catch {
        // Ignore sessionStorage cleanup failures.
    }
}
