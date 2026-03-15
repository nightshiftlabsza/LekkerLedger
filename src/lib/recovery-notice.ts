import { type EncryptionMode } from "./encryption-mode";

const RECOVERY_NOTICE_KEY = "lekkerledger:recovery-notice";

interface RecoveryNoticeRecord {
    mode: EncryptionMode;
    createdAt: number;
}

export function storeRecoveryNotice(mode: EncryptionMode) {
    if (typeof globalThis.window === "undefined") {
        return;
    }

    try {
        globalThis.window.sessionStorage.setItem(RECOVERY_NOTICE_KEY, JSON.stringify({
            mode,
            createdAt: Date.now(),
        } satisfies RecoveryNoticeRecord));
    } catch {
        // Ignore session storage failures.
    }
}

export function consumeRecoveryNotice(): RecoveryNoticeRecord | null {
    if (typeof globalThis.window === "undefined") {
        return null;
    }

    try {
        const raw = globalThis.window.sessionStorage.getItem(RECOVERY_NOTICE_KEY);
        if (!raw) {
            return null;
        }

        globalThis.window.sessionStorage.removeItem(RECOVERY_NOTICE_KEY);
        const parsed = JSON.parse(raw) as RecoveryNoticeRecord;
        if (!parsed.mode || !parsed.createdAt) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}
