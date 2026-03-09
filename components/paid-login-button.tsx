"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { fetchVerifiedEntitlements } from "@/lib/billing-client";
import { GOOGLE_SCOPES, getBackupMetadata, syncDataFromDrive, syncDataToDrive } from "@/lib/google-drive";
import {
    getStoredGoogleAccessToken,
    hasStoredGoogleDriveScope,
    setStoredGoogleDriveScope,
    storeGoogleAccessToken,
    storeGoogleIdentity,
} from "@/lib/google-session";
import { getSettings, hasMeaningfulLocalData, saveSettings } from "@/lib/storage";

type SyncOutcome = "backup" | "restore" | "none";

interface PaidLoginButtonProps {
    label?: string;
    className?: string;
    variant?: "default" | "ghost" | "outline";
    nextPath?: string | null;
    showInlineError?: boolean;
}

function normalizeDestination(raw: string | null | undefined): string {
    if (!raw) return "/dashboard";
    return raw.startsWith("/") ? raw : "/dashboard";
}

function withActivationState(path: string, sync: SyncOutcome): string {
    const [pathname, search = ""] = path.split("?");
    if (pathname !== "/dashboard") return path;
    const params = new URLSearchParams(search);
    params.set("activation", "paid-login-success");
    params.set("sync", sync);
    return `/dashboard?${params.toString()}`;
}

function routeToPricing(router: ReturnType<typeof useRouter>, reason: "free" | "config" | "billing") {
    const params = new URLSearchParams({
        source: "paid-login",
        reason,
    });
    router.push(`/pricing?${params.toString()}`);
}

function buildConflictPrompt(): boolean {
    return window.confirm(
        "We found payroll data on this device and in your Google backup.\n\nOK: Restore Google backup to this device.\nCancel: Keep this device data and upload it to Google now.",
    );
}

function usePaidLoginActivation() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [statusMessage, setStatusMessage] = React.useState("");
    const [error, setError] = React.useState("");

    const oauthPendingRef = React.useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null);

    const googleLogin = useGoogleLogin({
        scope: GOOGLE_SCOPES,
        onSuccess: (tokenResponse) => {
            oauthPendingRef.current?.resolve(tokenResponse.access_token);
            oauthPendingRef.current = null;
        },
        onError: () => {
            oauthPendingRef.current?.reject(new Error("Google sign-in was cancelled or blocked."));
            oauthPendingRef.current = null;
        },
        onNonOAuthError: (nonOAuthError) => {
            const blocked = nonOAuthError?.type === "popup_failed_to_open";
            const message = blocked
                ? "Google popup was blocked. Please allow popups and try Paid login again."
                : "Google sign-in did not complete. Please try again.";
            oauthPendingRef.current?.reject(new Error(message));
            oauthPendingRef.current = null;
        },
    });

    const requestGoogleToken = React.useCallback(() => {
        return new Promise<string>((resolve, reject) => {
            oauthPendingRef.current = { resolve, reject };
            googleLogin();
        });
    }, [googleLogin]);

    const fetchUserInfo = React.useCallback(async (accessToken: string) => {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return null;
        const data = await response.json() as { email?: string; sub?: string };
        if (!data.email) return null;
        return data;
    }, []);

    const persistBackupTimestamp = React.useCallback(async () => {
        const timestamp = new Date().toISOString();
        const settings = await getSettings();
        await saveSettings({
            ...settings,
            googleSyncEnabled: true,
            lastBackupTimestamp: timestamp,
        });
        if (typeof window !== "undefined") {
            window.localStorage.setItem("ll_last_sync", timestamp);
        }
    }, []);

    const resolveFirstSync = React.useCallback(async (accessToken: string): Promise<SyncOutcome> => {
        const [remote, hasLocal] = await Promise.all([
            getBackupMetadata(accessToken),
            hasMeaningfulLocalData(),
        ]);

        if (hasLocal && !remote.exists) {
            const backup = await syncDataToDrive(accessToken);
            if (!backup.success) {
                throw new Error(backup.error || "Backup failed while activating paid login.");
            }
            await persistBackupTimestamp();
            return "backup";
        }

        if (!hasLocal && remote.exists) {
            const restore = await syncDataFromDrive(accessToken);
            if (!restore.success) {
                throw new Error(restore.error || "Restore failed while activating paid login.");
            }
            await persistBackupTimestamp();
            return "restore";
        }

        if (hasLocal && remote.exists) {
            const restoreRemote = buildConflictPrompt();
            if (restoreRemote) {
                const restore = await syncDataFromDrive(accessToken);
                if (!restore.success) {
                    throw new Error(restore.error || "Restore failed while activating paid login.");
                }
                await persistBackupTimestamp();
                return "restore";
            }

            const backup = await syncDataToDrive(accessToken);
            if (!backup.success) {
                throw new Error(backup.error || "Backup failed while activating paid login.");
            }
            await persistBackupTimestamp();
            return "backup";
        }

        const settings = await getSettings();
        await saveSettings({ ...settings, googleSyncEnabled: true });
        return "none";
    }, [persistBackupTimestamp]);

    const start = React.useCallback(async (nextPath?: string | null, options?: { skipPaidChecks?: boolean }) => {
        setLoading(true);
        setError("");
        setStatusMessage("Connecting your Google account...");

        try {
            let accessToken = getStoredGoogleAccessToken();
            const hasDriveScope = hasStoredGoogleDriveScope();
            let identity = accessToken && hasDriveScope ? await fetchUserInfo(accessToken) : null;

            if (!identity) {
                accessToken = await requestGoogleToken();
                identity = await fetchUserInfo(accessToken);
            }

            if (!accessToken || !identity?.email) {
                throw new Error("Google account verification failed.");
            }

            storeGoogleAccessToken(accessToken);
            storeGoogleIdentity({ email: identity.email, sub: identity.sub });
            setStoredGoogleDriveScope(true);

            if (options?.skipPaidChecks) {
                router.push(normalizeDestination(nextPath));
                return;
            }

            setStatusMessage("Verifying paid access...");
            let entitlements: Awaited<ReturnType<typeof fetchVerifiedEntitlements>> = null;
            try {
                entitlements = await fetchVerifiedEntitlements(accessToken, true);
            } catch (billingError) {
                const message = billingError instanceof Error ? billingError.message : "";
                const missingConfig = /(CLOUDFLARE_|PAYSTACK_).+is missing/i.test(message);
                routeToPricing(router, missingConfig ? "config" : "billing");
                return;
            }
            if (!entitlements?.isActive || entitlements.planId === "free") {
                routeToPricing(router, "free");
                return;
            }

            const settings = await getSettings();
            await saveSettings({ ...settings, googleSyncEnabled: true });

            setStatusMessage("Finalising first backup sync...");
            const sync = await resolveFirstSync(accessToken);
            const target = withActivationState(normalizeDestination(nextPath), sync);
            router.push(target);
        } catch (activationError) {
            const message = activationError instanceof Error
                ? activationError.message
                : "Sign in could not be completed.";
            const missingConfig = /(CLOUDFLARE_|PAYSTACK_).+is missing/i.test(message);
            if (missingConfig) {
                routeToPricing(router, "config");
                return;
            }
            setError(message);
        } finally {
            setLoading(false);
            setStatusMessage("");
        }
    }, [fetchUserInfo, requestGoogleToken, resolveFirstSync, router]);

    return { start, loading, statusMessage, error };
}

function PaidLoginButtonConfigured(props: PaidLoginButtonProps) {
    const { start, loading, statusMessage, error } = usePaidLoginActivation();

    return (
        <div className="space-y-2">
            <Button
                variant={props.variant || "ghost"}
                className={props.className}
                disabled={loading}
                onClick={() => {
                    void start(props.nextPath);
                }}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? (statusMessage || "Working...") : (props.label || "Sign in")}
            </Button>
            {props.showInlineError && error && (
                <p className="text-xs font-medium text-rose-600">{error}</p>
            )}
        </div>
    );
}

export function PaidLoginButton(props: PaidLoginButtonProps) {
    const googleConfigured = Boolean(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

    if (!googleConfigured) {
        return (
            <Button
                variant={props.variant || "ghost"}
                className={props.className}
                disabled
                title="Google login is not configured for this build."
            >
                {props.label || "Sign in"}
            </Button>
        );
    }

    return <PaidLoginButtonConfigured {...props} />;
}

function PaidLoginGateConfigured({ nextPath, skipPaidChecks = false }: { nextPath?: string | null; skipPaidChecks?: boolean }) {
    const { start, loading, statusMessage, error } = usePaidLoginActivation();
    const hasStartedRef = React.useRef(false);

    React.useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;
        void start(nextPath, { skipPaidChecks });
    }, [nextPath, skipPaidChecks, start]);

    return (
        <div className="glass-panel border-none rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
            <div className="space-y-4 p-6">
                <h2 className="text-xl font-black text-[var(--text)]">Completing sign in</h2>
                <p className="text-sm text-[var(--text-muted)]">
                    This flow will finish Google auth, verify your paid access, enable private Drive backup, and resolve first sync before opening the app.
                </p>
                <Button
                    className="h-11 w-full font-bold"
                    onClick={() => {
                        void start(nextPath, { skipPaidChecks });
                    }}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? (statusMessage || "Working...") : "Continue sign in"}
                </Button>
                {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
            </div>
        </div>
    );
}

export function PaidLoginGate({ nextPath, skipPaidChecks = false }: { nextPath?: string | null; skipPaidChecks?: boolean }) {
    const googleConfigured = Boolean(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

    if (!googleConfigured) {
        return (
            <div className="glass-panel border-none rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
                <div className="p-6">
                    <p className="text-sm text-[var(--text-muted)]">
                        Google login is not configured in this build. You can still continue with local-only access.
                    </p>
                </div>
            </div>
        );
    }

    return <PaidLoginGateConfigured nextPath={nextPath} skipPaidChecks={skipPaidChecks} />;
}

