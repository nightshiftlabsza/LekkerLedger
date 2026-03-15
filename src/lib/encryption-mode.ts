export type EncryptionMode = "recoverable" | "maximum_privacy";

export const DEFAULT_ENCRYPTION_MODE: EncryptionMode = "recoverable";
export const LEGACY_MAXIMUM_PRIVACY_MODE: EncryptionMode = "maximum_privacy";

export interface EncryptionModeOption {
    mode: EncryptionMode;
    badge: string;
    eyebrow: string;
    title: string;
    summary: string;
    bullets: string[];
    cta: string;
}

export function normalizeEncryptionMode(value: unknown): EncryptionMode {
    if (value === "recoverable") {
        return "recoverable";
    }

    return "maximum_privacy";
}

export function getEncryptionModeLabel(mode: EncryptionMode): string {
    return mode === "recoverable" ? "Recoverable Encryption" : "Maximum Privacy";
}

export function getEncryptionModeEyebrow(mode: EncryptionMode): string {
    return mode === "recoverable" ? "Recommended" : "Advanced privacy";
}

export function getEncryptionModeSummary(mode: EncryptionMode): string {
    return mode === "recoverable"
        ? "Your payroll records are encrypted before upload. You can recover access if you lose your login details."
        : "Your payroll records are encrypted with a key only you control. Lose the key, lose the data.";
}

export function getSettingsSummary(mode: EncryptionMode): string {
    return mode === "recoverable"
        ? "Encrypted and recoverable"
        : "Encrypted and only recoverable with your saved recovery key";
}

export function getActiveSyncSummary(mode: EncryptionMode | null): string {
    if (mode === "recoverable") {
        return "Your data is encrypted before upload. After the first backup completes, later changes sync automatically and you can recover access if you lose your login details.";
    }

    if (mode === "maximum_privacy") {
        return "Your data is encrypted with your recovery key before it leaves this device. After the first backup completes, later changes sync automatically and can be restored on your other devices after recovery-key unlock.";
    }

    return "Your data is securely encrypted and synced to the cloud.";
}

export function getLockedSummary(mode: EncryptionMode | null): string {
    if (mode === "recoverable") {
        return "You are signed in, but this device still needs one local password check before the encrypted records open.";
    }

    if (mode === "maximum_privacy") {
        return "Your records stay locked on this device until you enter your recovery key.";
    }

    return "Your records stay locked on this device until you complete the secure unlock step.";
}

export function getUnlockHelpText(mode: EncryptionMode): string {
    return mode === "recoverable"
        ? "You are signed in. Confirm your password once so this device can open the encrypted records locally."
        : "Your records are encrypted with your recovery key. Enter it to open them on this device.";
}

export function getLockedDeviceSummary(mode: EncryptionMode | null): string {
    if (mode === "recoverable") {
        return "Sign-in worked, but this device still needs one local password check before the encrypted records can open.";
    }

    if (mode === "maximum_privacy") {
        return "You are logged in, but this device stays locked until you enter your recovery key. The secure unlock screen appears before protected pages open.";
    }

    return "You are logged in, but this device stays locked until you complete the secure unlock step.";
}

export function getSignOutRestoreText(mode: EncryptionMode | null): string {
    if (mode === "recoverable") {
        return "You can still restore on the next login with your password and account recovery.";
    }

    if (mode === "maximum_privacy") {
        return "You can still restore on the next login with your recovery key.";
    }

    return "You can still restore on the next login through the secure unlock step.";
}

export function getRecoveryCompletedText(mode: EncryptionMode): string {
    return mode === "recoverable"
        ? "Recovery completed on this device. Your encrypted records are ready again."
        : "This device is connected to your encrypted records again.";
}

export function getAccountStatusSummary(mode: EncryptionMode | null): string {
    if (mode === "recoverable") {
        return "This account uses Recoverable Encryption. Records stay encrypted before upload, and each new device opens them by confirming your password locally.";
    }

    if (mode === "maximum_privacy") {
        return "This account uses Maximum Privacy. Records stay encrypted with a key only you control.";
    }

    return "This account uses encrypted sync with a secure unlock step on each new device.";
}

export const ENCRYPTION_MODE_OPTIONS: EncryptionModeOption[] = [
    {
        mode: "recoverable",
        badge: "Recommended",
        eyebrow: "Recoverable Encryption",
        title: "Recoverable Encryption",
        summary: "Your payroll records are encrypted before upload.",
        bullets: [
            "You can recover access if you lose your login details.",
            "Still encrypted before upload.",
            "Best for most households.",
        ],
        cta: "Use Recoverable Encryption",
    },
    {
        mode: "maximum_privacy",
        badge: "Advanced privacy",
        eyebrow: "Maximum Privacy",
        title: "Maximum Privacy",
        summary: "Your payroll records are encrypted with a key only you control.",
        bullets: [
            "We cannot reset that key for you.",
            "Strongest privacy option.",
            "Lose the key, lose the data.",
        ],
        cta: "Use Maximum Privacy",
    },
];
