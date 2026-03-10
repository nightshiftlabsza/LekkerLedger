"use client";

import { env } from "@/lib/env";

import { useState, useEffect, useCallback } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { Cloud, Download, Upload, CheckCircle2, AlertCircle, Loader2, Shield, History, RefreshCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MINIMAL_SCOPES, DRIVE_SCOPE, syncDataToDrive, syncDataFromDrive, deleteDataFromDrive, getBackupMetadata, type BackupMetadata } from "@/lib/google-drive";
import { clearStoredGoogleSession, getStoredGoogleAccessToken, getStoredGoogleEmail, hasStoredGoogleDriveScope, setStoredGoogleDriveScope, storeGoogleAccessToken, storeGoogleIdentity } from "@/lib/google-session";
import { getSettings, saveSettings, hasMeaningfulLocalData, getLocalBackupPreview, resetAllData, type LocalBackupPreview } from "@/lib/storage";
interface SyncEvent {
    id: string;
    timestamp: string;
    success: boolean;
    action: "backup" | "restore" | "delete";
    details: string;
}

interface GoogleSyncProps {
    driveSyncAllowed?: boolean;
}

function getStoredToken(): string | null {
    return getStoredGoogleAccessToken();
}

function GoogleSyncUnavailable() {
    return (
        <Card className="border-[var(--border)] bg-[var(--surface-2)]/60">
            <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--focus)]">
                        <Cloud className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="text-base font-bold text-[var(--text)]">Google backup is unavailable in this local build</h3>
                        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                            Local payroll storage still works. Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google sign-in and private Drive backup testing.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function GoogleSyncContent({ driveSyncAllowed = false }: GoogleSyncProps) {
    const [token, setToken] = useState<string | null>(() => getStoredToken());
    const [email, setEmail] = useState<string | null>(() => getStoredGoogleEmail());
    const [hasDriveScope, setHasDriveScope] = useState<boolean>(() => hasStoredGoogleDriveScope());
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [pendingAction, setPendingAction] = useState<null | "restore" | "delete">(null);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
        if (typeof window !== "undefined") return localStorage.getItem("ll_last_sync");
        return null;
    });

    const [discoveryStatus, setDiscoveryStatus] = useState<"idle" | "discovering" | "decision_required" | "no_backup" | "local_empty_remote_exists">("idle");
    const [remoteMetadata, setRemoteMetadata] = useState<BackupMetadata | null>(null);
    const [localPreview, setLocalPreview] = useState<LocalBackupPreview | null>(null);

    const isMountedRef = useState(() => ({ current: true }))[0];
    const statusTimerRef = useState(() => ({ current: null as number | null }))[0];
    const reloadTimerRef = useState(() => ({ current: null as number | null }))[0];
    const [syncLogs, setSyncLogs] = useState<SyncEvent[]>(() => {
        if (typeof window !== "undefined") {
            try {
                const storedLogs = localStorage.getItem("ll_sync_logs");
                return storedLogs ? JSON.parse(storedLogs) : [];
            } catch {
                return [];
            }
        }
        return [];
    });

    const addLog = (event: Omit<SyncEvent, "id" | "timestamp">) => {
        if (!isMountedRef.current) return;
        const newLog: SyncEvent = {
            id: Math.random().toString(36).slice(2),
            timestamp: new Date().toISOString(),
            ...event,
        };
        setSyncLogs((prev) => {
            const updated = [newLog, ...prev].slice(0, 20);
            localStorage.setItem("ll_sync_logs", JSON.stringify(updated));
            return updated;
        });
        if (event.success && event.action !== "delete") {
            setLastSyncTime(newLog.timestamp);
            localStorage.setItem("ll_last_sync", newLog.timestamp);
        }
    };

    const refreshLocalTimestamp = useCallback(async () => {
        const settings = await getSettings();
        if (settings.lastBackupTimestamp) {
            setLastSyncTime(settings.lastBackupTimestamp);
            if (typeof window !== "undefined") {
                localStorage.setItem("ll_last_sync", settings.lastBackupTimestamp);
            }
        }
    }, []);

    const setTransientStatus = (nextStatus: "success" | "error", message: string, timeout = 4000) => {
        if (!isMountedRef.current) return;
        if (statusTimerRef.current) {
            window.clearTimeout(statusTimerRef.current);
        }
        setStatus(nextStatus);
        setStatusMessage(message);
        statusTimerRef.current = window.setTimeout(() => {
            if (!isMountedRef.current) return;
            setStatus("idle");
            statusTimerRef.current = null;
        }, timeout);
    };

    const fetchUserInfo = useCallback(async (accessToken: string): Promise<string | null> => {
        try {
            const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) return null;
            const data = await response.json();
            if (!data.email) return null;
            if (!isMountedRef.current) return data.email;
            setEmail(data.email);
            storeGoogleIdentity({ email: data.email, sub: data.sub });
            return data.email;
        } catch (error) {
            console.error("Failed to fetch user info", error);
            return null;
        }
    }, []);

    const persistAuth = useCallback((accessToken: string) => {
        setToken(accessToken);
        storeGoogleAccessToken(accessToken);
    }, []);

    const clearAuth = useCallback(async () => {
        googleLogout();
        if (!isMountedRef.current) return;
        setToken(null);
        setEmail(null);
        setHasDriveScope(false);
        clearStoredGoogleSession();
        const settings = await getSettings();
        await saveSettings({ ...settings, googleSyncEnabled: false });
        if (!isMountedRef.current) return;
        setPendingAction(null);
        setDiscoveryStatus("idle");
        setStatus("idle");
        setStatusMessage("");
    }, []);

    const handleLogoutAndWipe = useCallback(async () => {
        if (!confirm("This will log you out AND permanently remove all payroll records from this device. Remote backups in Google Drive remain. Proceed?")) return;
        await resetAllData();
        await clearAuth();
        window.location.reload();
    }, [clearAuth]);

    const runDiscovery = useCallback(async (accessToken: string) => {
        setDiscoveryStatus("discovering");
        try {
            const [remote, local, hasMeaningful] = await Promise.all([
                getBackupMetadata(accessToken),
                getLocalBackupPreview(),
                hasMeaningfulLocalData()
            ]);

            if (!isMountedRef.current) return;

            setRemoteMetadata(remote);
            setLocalPreview(local);

            if (!remote.exists) {
                if (hasMeaningful) {
                    setDiscoveryStatus("no_backup");
                } else {
                    setDiscoveryStatus("idle");
                }
            } else {
                if (!hasMeaningful) {
                    setDiscoveryStatus("local_empty_remote_exists");
                } else {
                    setDiscoveryStatus("decision_required");
                }
            }
        } catch (error) {
            console.error("Discovery failed", error);
            setDiscoveryStatus("idle");
        }
    }, [isMountedRef]);

    const handleBackup = useCallback(async (silent = false) => {
        const currentToken = token || getStoredToken();
        if (!currentToken || !hasDriveScope) return;

        if (!silent) {
            setStatus("loading");
            setStatusMessage("Backing up to the Google Drive app data area in your own Google account...");
        }

        const result = await syncDataToDrive(currentToken);
        if (result.success) {
            addLog({ success: true, action: "backup", details: "Uploaded lekkerledger_data.json" });
            const timestamp = new Date().toISOString();
            await refreshLocalTimestamp();
            if (!silent) setTransientStatus("success", "Backup saved to the Google Drive app data area in your Google account.");
        } else if (!silent && isMountedRef.current) {
            addLog({ success: false, action: "backup", details: result.error || "Network or permission error during upload" });
            setTransientStatus("error", result.error || "Backup failed. Check your Google connection or Drive permission and try again.", 5000);
        }
    }, [hasDriveScope, refreshLocalTimestamp, token]);

    const runRestore = useCallback(async (silent = false) => {
        const currentToken = token || getStoredToken();
        if (!currentToken) return;

        if (!silent) {
            setStatus("loading");
            setStatusMessage("Restoring from your Google backup...");
        }

        const result = await syncDataFromDrive(currentToken);
        if (result.success) {
            addLog({ success: true, action: "restore", details: "Downloaded remote data snapshot" });
            if (!silent && isMountedRef.current) {
                setStatus("success");
                setStatusMessage("Successfully restored data from your Google backup.");
                if (reloadTimerRef.current) {
                    window.clearTimeout(reloadTimerRef.current);
                }
                reloadTimerRef.current = window.setTimeout(() => {
                    if (isMountedRef.current) {
                        window.location.reload();
                    }
                }, 1500);
            }
        } else if (!silent && isMountedRef.current) {
            addLog({ success: false, action: "restore", details: result.error || "Failed to download snapshot" });
            setTransientStatus("error", result.error || "Restore failed or no Google backup was found.", 5000);
        }
    }, [token]);

    const runDeleteBackup = useCallback(async () => {
        const currentToken = token || getStoredToken();
        if (!currentToken) return;

        setStatus("loading");
        setStatusMessage("Deleting your Google Drive backup...");

        const success = await deleteDataFromDrive(currentToken);
        if (success) {
            addLog({ success: true, action: "delete", details: "Deleted lekkerledger_data.json from AppData folder" });
            if (!isMountedRef.current) return;
            setLastSyncTime(null);
            localStorage.removeItem("ll_last_sync");
            const settings = await getSettings();
            await saveSettings({ ...settings, lastBackupTimestamp: undefined });
            setTransientStatus("success", "Google backup deleted successfully.");
        } else if (isMountedRef.current) {
            addLog({ success: false, action: "delete", details: "Failed to delete backup from Drive" });
            setTransientStatus("error", "Failed to delete the Google backup. Please try again.", 5000);
        }
    }, [token]);

    const login = useGoogleLogin({
        scope: MINIMAL_SCOPES,
        onSuccess: async (tokenResponse) => {
            const accessToken = tokenResponse.access_token;
            const userEmail = await fetchUserInfo(accessToken);
            if (!userEmail) {
                setTransientStatus("error", "Sign-in failed. We could not verify your Google profile.", 5000);
                return;
            }
            if (!isMountedRef.current) return;
            persistAuth(accessToken);
            await runDiscovery(accessToken);
            setTransientStatus("success", "Google account connected.");
        },
        onError: () => setTransientStatus("error", "Google sign-in failed.", 5000),
    });

    const enableDrive = useGoogleLogin({
        scope: DRIVE_SCOPE,
        onSuccess: async (tokenResponse) => {
            const accessToken = tokenResponse.access_token;
            const verifiedEmail = email || await fetchUserInfo(accessToken);
            if (!verifiedEmail) {
                setTransientStatus("error", "Google Drive access was granted, but the Google account could not be verified.", 5000);
                return;
            }
            if (!isMountedRef.current) return;
            persistAuth(accessToken);
            setHasDriveScope(true);
            setStoredGoogleDriveScope(true);
            const settings = await getSettings();
            await saveSettings({ ...settings, googleSyncEnabled: true, autoBackupEnabled: true });
            if (!isMountedRef.current) return;
            await runDiscovery(accessToken);
            setTransientStatus("success", "Private Google Drive backup enabled.");
        },
        onError: () => {
            addLog({ success: false, action: "backup", details: "Drive scope permission denied" });
            setTransientStatus("error", "Google Drive permission was not enabled. Please try again.", 5000);
        },
    });

    useEffect(() => {
        isMountedRef.current = true;
        void (async () => {
            const settings = await getSettings();
            if (!isMountedRef.current) return;
            if (!lastSyncTime && settings.lastBackupTimestamp) {
                setLastSyncTime(settings.lastBackupTimestamp);
                if (typeof window !== "undefined") {
                    localStorage.setItem("ll_last_sync", settings.lastBackupTimestamp);
                }
            }
        })();
        return () => {
            isMountedRef.current = false;
            if (statusTimerRef.current) {
                window.clearTimeout(statusTimerRef.current);
            }
            if (reloadTimerRef.current) {
                window.clearTimeout(reloadTimerRef.current);
            }
        };
    }, [lastSyncTime]);

    if (!driveSyncAllowed) {
        return (
            <Card className="border-[var(--border)] bg-[var(--surface-2)]/50">
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="p-3 bg-[var(--primary)]/10 rounded-xl text-[var(--focus)]">
                            <Cloud className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="break-words text-lg font-bold text-[var(--text)]">Unlock Google-connected access</h3>
                            <p className="text-sm text-[var(--text)]/70 leading-relaxed">
                                LekkerLedger is local-first. Upgrade to connect Google and keep a backup in the Google Drive app data area in your own Google account so your records can travel with you across devices and browsers.
                            </p>
                            <Button className="mt-4 h-11 w-full sm:w-auto bg-[var(--primary)] hover:brightness-95 text-white font-bold" onClick={() => window.location.href = "/upgrade"}>
                                Upgrade for Google-connected access <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const statusAccent = !token
        ? "var(--text-muted)"
        : !hasDriveScope
            ? "var(--warning)"
            : status === "error"
                ? "var(--danger)"
                : "var(--success)";
    const statusSurface = !token
        ? "var(--surface-2)"
        : !hasDriveScope
            ? "var(--warning-soft)"
            : status === "error"
                ? "var(--danger-soft)"
                : "var(--success-soft)";
    const statusBorder = !token
        ? "var(--border)"
        : !hasDriveScope
            ? "var(--warning-border)"
            : status === "error"
                ? "var(--danger-border)"
                : "var(--success-border)";

    return (
        <div className="space-y-6">
            <Card className="border-2 transition-colors" style={{ borderColor: statusBorder }}>
                <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full p-4" style={{ backgroundColor: statusSurface, color: statusAccent }}>
                            {!token ? <Cloud className="h-8 w-8" /> : !hasDriveScope ? <Shield className="h-8 w-8" /> : status === "loading" ? <Loader2 className="h-8 w-8 animate-spin" /> : status === "error" ? <AlertCircle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--text)]">
                                {!token ? "Local only" : !hasDriveScope ? "Google connected" : status === "loading" ? "Working with Google backup..." : status === "error" ? "Google backup issue" : "Google backup active"}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                {!token ? "Your records remain on this device. Connect Google to restore paid access and optional backup." : !hasDriveScope ? `Google account connected as ${email}. Next, enable backup in the Google Drive app data area in your own Google account so your records can travel with you.` : `Google-connected backup active for ${email}`}
                            </p>
                            {token && hasDriveScope && lastSyncTime && (
                                <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                                    Last backup: {new Date(lastSyncTime).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {!token ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button onClick={() => login()} className="bg-[var(--info)] text-white font-bold whitespace-nowrap hover:brightness-95">
                                Connect Google account
                            </Button>
                        </div>
                    ) : !hasDriveScope ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={() => enableDrive()} className="h-12 rounded-xl bg-[var(--warning)] text-white font-bold whitespace-nowrap shadow-[var(--shadow-md)] hover:brightness-95">
                                <Cloud className="h-4 w-4 mr-2" /> Enable Google backup
                            </Button>
                            <Button variant="ghost" className="text-[var(--text-muted)]" onClick={clearAuth}>Sign out</Button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => handleBackup(false)} disabled={status === "loading"}>
                                <RefreshCcw className={`h-4 w-4 mr-2 ${status === "loading" ? "animate-spin" : ""}`} /> Backup now
                            </Button>
                            <Button variant="ghost" onClick={() => setPendingAction("restore")} disabled={status === "loading"}>
                                <Download className="h-4 w-4 mr-2" /> Restore backup
                            </Button>
                            <Button variant="ghost" className="text-[var(--danger)] hover:bg-[var(--danger-soft)]" onClick={clearAuth}>
                                Disconnect
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {discoveryStatus === "discovering" && (
                <div className="p-8 text-center bg-[var(--surface-2)]/50 rounded-2xl border-2 border-dashed border-[var(--border)]">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--primary)] mb-3" />
                    <p className="text-sm font-medium text-[var(--text)]">Checking for existing backups...</p>
                </div>
            )}

            {discoveryStatus === "local_empty_remote_exists" && remoteMetadata && (
                 <Card className="border-2" style={{ borderColor: "var(--success-border)", backgroundColor: "var(--success-soft)" }}>
                     <CardContent className="p-6">
                         <div className="flex flex-col sm:flex-row gap-6 items-center justify-between text-center sm:text-left">
                             <div className="space-y-2">
                                 <h3 className="text-lg font-bold text-[var(--text)]">Restore your backup?</h3>
                                 <p className="text-sm text-[var(--success)]">We found a backup from <b>{new Date(remoteMetadata.modifiedTime!).toLocaleString()}</b>. Would you like to restore it to this device?</p>
                             </div>
                             <div className="flex gap-3 shrink-0">
                                 <Button variant="ghost" onClick={() => setDiscoveryStatus("idle")}>Later</Button>
                                 <Button className="bg-[var(--success)] text-white font-bold hover:brightness-95" onClick={async () => {
                                     setDiscoveryStatus("idle");
                                     await runRestore(false);
                                 }}>Restore now</Button>
                             </div>
                         </div>
                     </CardContent>
                 </Card>
            )}

            {discoveryStatus === "no_backup" && (
                <Card className="border-[var(--border)] bg-[var(--surface-2)]/40">
                    <CardContent className="p-6">
                         <div className="flex flex-col sm:flex-row gap-6 items-center justify-between text-center sm:text-left">
                             <div className="space-y-2">
                                 <h3 className="text-lg font-bold text-[var(--text)]">No backup found yet</h3>
                                 <p className="text-sm text-[var(--text-muted)]">You can create your first private Google Drive backup from this device.</p>
                             </div>
                             <div className="flex gap-3 shrink-0">
                                 <Button variant="ghost" onClick={() => setDiscoveryStatus("idle")}>Dismiss</Button>
                                 <Button className="bg-[var(--primary)] hover:brightness-95 text-white font-bold" onClick={async () => {
                                     setDiscoveryStatus("idle");
                                     await handleBackup(false);
                                 }}>Backup this device</Button>
                             </div>
                         </div>
                    </CardContent>
                </Card>
            )}

            {discoveryStatus === "decision_required" && remoteMetadata && localPreview && (
                <Card className="border-2" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                            <RefreshCcw className="h-5 w-5" /> Sync decision required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--warning-border)" }}>
                                <p className="mb-2 text-xs font-black uppercase tracking-wider text-[var(--warning)]">This Device</p>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-[var(--text)]">{localPreview.employeeCount} employees, {localPreview.payslipCount} payslips</p>
                                    <p className="text-[10px] text-[var(--warning)]">Local snapshot on this browser</p>
                                </div>
                            </div>
                            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--success-border)" }}>
                                <p className="mb-2 text-xs font-black uppercase tracking-wider text-[var(--success)]">Google Backup</p>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-[var(--text)]">{new Date(remoteMetadata.modifiedTime!).toLocaleString()}</p>
                                    <p className="text-[10px] text-[var(--success)]">Remote snapshot in your private Drive area</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button className="flex-1 h-12 bg-[var(--success)] text-white font-bold hover:brightness-95" onClick={async () => {
                                setDiscoveryStatus("idle");
                                await runRestore(false);
                            }}>
                                <Download className="h-4 w-4 mr-2" /> Restore Google backup to this device
                            </Button>
                            <Button variant="outline" className="flex-1 h-12 font-bold text-[var(--warning)] hover:bg-[var(--warning-soft)]" style={{ borderColor: "var(--warning-border)" }} onClick={async () => {
                                setDiscoveryStatus("idle");
                                await handleBackup(false);
                            }}>
                                <Upload className="h-4 w-4 mr-2" /> Keep this device and upload to Google
                            </Button>
                            <Button variant="ghost" className="sm:w-24" onClick={() => setDiscoveryStatus("idle")}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {pendingAction && (
                <Card className="border-[var(--border)] bg-[var(--surface-2)]/70">
                    <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-bold text-[var(--text)]">
                                {pendingAction === "restore" ? "Restore from your Google backup?" : "Delete your Google backup?"}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                                {pendingAction === "restore"
                                    ? "This will replace the current local data with the latest backup from the Google Drive app data area in your own Google account."
                                    : "This removes the backup file from the Google Drive app data area in your own Google account."}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setPendingAction(null)}>Cancel</Button>
                            <Button
                                className={pendingAction === "delete" ? "bg-[var(--danger)] text-white hover:brightness-95" : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"}
                                onClick={async () => {
                                    const action = pendingAction;
                                    setPendingAction(null);
                                    if (action === "restore") await runRestore(false);
                                    if (action === "delete") await runDeleteBackup();
                                }}
                            >
                                Confirm
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {statusMessage && status !== "idle" && (
                <div
                    className="animate-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium"
                    style={{
                        backgroundColor: status === "error" ? "var(--danger-soft)" : status === "success" ? "var(--success-soft)" : "var(--info-soft)",
                        borderColor: status === "error" ? "var(--danger-border)" : status === "success" ? "var(--success-border)" : "var(--info-border)",
                        color: status === "error" ? "var(--danger)" : status === "success" ? "var(--success)" : "var(--info)",
                    }}
                >
                    {status === "error" && <AlertCircle className="h-5 w-5" />}
                    {status === "success" && <CheckCircle2 className="h-5 w-5" />}
                    {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
                    {statusMessage}
                </div>
            )}

            {token && (
                <div className="space-y-6">
                    <Card className="glass-panel border-none">
                        <CardHeader className="pb-3 border-b border-[var(--border)]">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[var(--primary)]" /> Privacy & Storage
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                LekkerLedger uses the Google Drive app data area in your own Google account. This is a hidden area for this app, not a central LekkerLedger payroll database.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-[10px] text-[var(--text-muted)] italic">
                                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--success)]" />
                                    LekkerLedger cannot browse your normal Google Drive files, photos, or emails.
                                </li>
                                <li className="flex items-start gap-2 text-[10px] text-[var(--text-muted)] italic">
                                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--success)]" />
                                    Payroll records are not uploaded into a central company-hosted employee database as part of this backup flow.
                                </li>
                                <li className="flex items-start gap-2 text-[10px] text-[var(--text-muted)] italic">
                                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--success)]" />
                                    The backup area is hidden from your normal Drive view and used only for this app.
                                </li>
                            </ul>
                            <div className="pt-4 border-t border-[var(--border)]">
                                <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--danger)]">Delete backup</h4>
                                <p className="text-[10px] text-[var(--text-muted)] mb-4">
                                    Use the button below to remove the Google backup file, or remove hidden app data from your Google account settings.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => setPendingAction("delete")} className="h-8 text-[10px] font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)]" style={{ borderColor: "var(--danger-border)" }}>
                                    Delete backup from Google Drive
                                </Button>
                            </div>

                            <div className="pt-4 border-t border-[var(--border)]">
                                <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--danger)]">Privacy & Device Reset</h4>
                                <p className="text-[10px] text-[var(--text-muted)] mb-4">
                                     Standard logout keeps your records on this device. Use the option below to clear everything from this browser.
                                </p>
                                <Button variant="ghost" size="sm" onClick={handleLogoutAndWipe} className="h-8 text-[10px] font-bold text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                                    Log out and clear records from this device
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel border-none">
                        <CardHeader className="pb-3 border-b border-[var(--border)] flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4 text-[var(--primary)]" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {syncLogs.length === 0 ? (
                                <div className="p-8 text-center text-sm text-[var(--text-muted)]">No recent activity.</div>
                            ) : (
                                <ul className="divide-y divide-[var(--border)]">
                                    {syncLogs.slice(0, 5).map((log) => (
                                        <li key={log.id} className="p-3 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full p-1.5" style={{ backgroundColor: log.success ? "var(--success-soft)" : "var(--danger-soft)", color: log.success ? "var(--success)" : "var(--danger)" }}>
                                                    {log.action === "backup" ? <Upload className="h-3 w-3" /> : log.action === "restore" ? <Download className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                                </div>
                                                <div className="text-[10px]">
                                                    <p className="font-bold text-[var(--text)]">{log.action.toUpperCase()} {log.success ? "SUCCESS" : "FAILED"}</p>
                                                    <p className="text-[var(--text-muted)] truncate max-w-[200px]">{log.details}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-mono text-[var(--text-muted)]">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export function GoogleSync({ driveSyncAllowed = false }: GoogleSyncProps) {
    const googleAuthConfigured = Boolean(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

    if (!googleAuthConfigured) {
        return <GoogleSyncUnavailable />;
    }

    return <GoogleSyncContent driveSyncAllowed={driveSyncAllowed} />;
}
