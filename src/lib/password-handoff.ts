const PASSWORD_HANDOFF_KEY = "lekkerledger:password-handoff";
const PASSWORD_HANDOFF_MAX_AGE_MS = 10 * 60 * 1000;

interface PasswordHandoffRecord {
    email: string;
    password: string;
    createdAt: number;
}

function readStoredRecord(): PasswordHandoffRecord | null {
    if (typeof globalThis.window === "undefined") {
        return null;
    }

    try {
        const raw = globalThis.window.sessionStorage.getItem(PASSWORD_HANDOFF_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as PasswordHandoffRecord;
        if (!parsed.email || !parsed.password || !parsed.createdAt) {
            clearPasswordHandoff();
            return null;
        }

        if (Date.now() - parsed.createdAt > PASSWORD_HANDOFF_MAX_AGE_MS) {
            clearPasswordHandoff();
            return null;
        }

        return parsed;
    } catch {
        clearPasswordHandoff();
        return null;
    }
}

export function storePasswordHandoff(email: string, password: string) {
    if (typeof globalThis.window === "undefined") {
        return;
    }

    try {
        globalThis.window.sessionStorage.setItem(PASSWORD_HANDOFF_KEY, JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            createdAt: Date.now(),
        } satisfies PasswordHandoffRecord));
    } catch {
        // Ignore sessionStorage failures and fall back to manual password confirmation.
    }
}

export function hasPasswordHandoff(email?: string | null): boolean {
    const record = readStoredRecord();
    if (!record) {
        return false;
    }

    if (!email) {
        return true;
    }

    return record.email === email.trim().toLowerCase();
}

export function consumePasswordHandoff(email?: string | null): string | null {
    const record = readStoredRecord();
    if (!record) {
        return null;
    }

    if (email && record.email !== email.trim().toLowerCase()) {
        return null;
    }

    clearPasswordHandoff();
    return record.password;
}

export function clearPasswordHandoff() {
    if (typeof globalThis.window === "undefined") {
        return;
    }

    try {
        globalThis.window.sessionStorage.removeItem(PASSWORD_HANDOFF_KEY);
    } catch {
        // Ignore sessionStorage cleanup failures.
    }
}
