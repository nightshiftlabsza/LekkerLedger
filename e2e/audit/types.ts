export type AuditGroup =
    | "marketing"
    | "onboarding-shell"
    | "employees-leave-contracts"
    | "payroll-documents-history"
    | "compliance-storage-billing";

export type AuditDevice = "mobile" | "tablet" | "desktop";
export type SeedMode = "empty" | "starter" | "full";

export type AuditStep =
    | { type: "clickByRole"; role: "button" | "link" | "tab"; name: string; exact?: boolean }
    | { type: "clickTestId"; testId: string }
    | { type: "clickSelector"; selector: string }
    | { type: "fill"; selector: string; value: string }
    | { type: "press"; key: string }
    | { type: "waitForUrl"; pattern: string }
    | { type: "assertText"; text: string };

export interface AuditAction {
    id: string;
    group: AuditGroup;
    label: string;
    route: string;
    device: AuditDevice;
    seed: SeedMode;
    steps?: AuditStep[];
}

export interface AuditMetrics {
    innerWidth: number;
    docScrollWidth: number;
    overflow: boolean;
    tinyTextCount: number;
    undersizedTargetsCount: number;
    visibleFixedBottomBars: number;
}

export interface AuditResult {
    action: AuditAction;
    status: "passed" | "failed";
    finalUrl: string;
    screenshotPath: string;
    consoleErrors: string[];
    pageErrors: string[];
    issues: string[];
    metrics: AuditMetrics;
}
