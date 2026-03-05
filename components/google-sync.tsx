"use client";

import { useState, useEffect, useCallback } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { Cloud, Download, Upload, CheckCircle2, AlertCircle, Loader2, Folder, FileJson, Database, Shield, History, RefreshCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MINIMAL_SCOPES, DRIVE_SCOPE, syncDataToDrive, syncDataFromDrive, deleteDataFromDrive } from "@/lib/google-drive";
import { getSettings, saveSettings, subscribeToDataChanges } from "@/lib/storage";

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

const ACCESS_TOKEN_KEY = "google_access_token";

function getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function setStoredToken(token: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function clearStoredToken() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function GoogleSync({ driveSyncAllowed = false }: GoogleSyncProps) {
    const [token, setToken] = useState<string | null>(() => getStoredToken());
    const [email, setEmail] = useState<string | null>(() => {
        if (typeof window !== "undefined") return localStorage.getItem("google_email");
        return null;
    });
    const [hasDriveScope, setHasDriveScope] = useState<boolean>(() => {
        if (typeof window !== "undefined") return localStorage.getItem("google_has_drive_scope") === "true";
        return false;
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [pendingAction, setPendingAction] = useState<null | "restore" | "delete">(null);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
        if (typeof window !== "undefined") return localStorage.getItem("ll_last_sync");
        return null;
    });
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

    const setTransientStatus = (nextStatus: "success" | "error", message: string, timeout = 4000) => {
        setStatus(nextStatus);
        setStatusMessage(message);
        window.setTimeout(() => setStatus("idle"), timeout);
    };

    const fetchUserInfo = useCallback(async (accessToken: string): Promise<string | null> => {
        try {
            const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) return null;
            const data = await response.json();
            if (!data.email) return null;
            setEmail(data.email);
            localStorage.setItem("google_email", data.email);
            return data.email;
        } catch (error) {
            console.error("Failed to fetch user info", error);
            return null;
        }
    }, []);

    const persistAuth = useCallback((accessToken: string) => {
        setToken(accessToken);
        setStoredToken(accessToken);
    }, []);

    const clearAuth = useCallback(async () => {
        googleLogout();
        setToken(null);
        setEmail(null);
        setHasDriveScope(false);
        clearStoredToken();
        localStorage.removeItem("google_email");
        localStorage.removeItem("google_has_drive_scope");
        const settings = await getSettings();
        await saveSettings({ ...settings, googleSyncEnabled: false });
        setPendingAction(null);
        setStatus("idle");
        setStatusMessage("");
    }, []);

    const handleBackup = useCallback(async (silent = false) => {
        const currentToken = token || getStoredToken();
        if (!currentToken || !hasDriveScope) return;

        if (!silent) {
            setStatus("loading");
            setStatusMessage("Backing up to Google Sync...");
        }

        const success = await syncDataToDrive(currentToken);
        if (success) {
            addLog({ success: true, action: "backup", details: "Uploaded lekkerledger_data.json" });
            if (!silent) setTransientStatus("success", "Successfully backed up to Drive!");
        } else if (!silent) {
            addLog({ success: false, action: "backup", details: "Network or permission error during upload" });
            setTransientStatus("error", "Failed to backup. Check connection or sign in again.", 5000);
        }
    }, [hasDriveScope, token]);

    const runRestore = useCallback(async (silent = false) => {
        const currentToken = token || getStoredToken();
        if (!currentToken) return;

        if (!silent) {
            setStatus("loading");
            setStatusMessage("Restoring from Google Sync...");
        }

        const success = await syncDataFromDrive(currentToken);
        if (success) {
            addLog({ success: true, action: "restore", details: "Downloaded remote data snapshot" });
            if (!silent) {
                setStatus("success");
                setStatusMessage("Successfully restored data!");
                window.setTimeout(() => window.location.reload(), 1500);
            }
        } else if (!silent) {
            addLog({ success: false, action: "restore", details: "Failed to download snapshot" });
            setTransientStatus("error", "Failed to restore or no backup was found.", 5000);
        }
    }, [token]);

    const runDeleteBackup = useCallback(async () => {
        const currentToken = token || getStoredToken();
        if (!currentToken) return;

        setStatus("loading");
        setStatusMessage("Deleting Drive backup...");

        const success = await deleteDataFromDrive(currentToken);
        if (success) {
            addLog({ success: true, action: "delete", details: "Deleted lekkerledger_data.json from AppData folder" });
            setLastSyncTime(null);
            localStorage.removeItem("ll_last_sync");
            setTransientStatus("success", "Backup deleted successfully.");
        } else {
            addLog({ success: false, action: "delete", details: "Failed to delete backup from Drive" });
            setTransientStatus("error", "Failed to delete backup. Please try again.", 5000);
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
            persistAuth(accessToken);
            setTransientStatus("success", "Signed in successfully!");
        },
        onError: () => setTransientStatus("error", "Sign-in failed.", 5000),
    });

    const enableDrive = useGoogleLogin({
        scope: DRIVE_SCOPE,
        onSuccess: async (tokenResponse) => {
            const accessToken = tokenResponse.access_token;
            const verifiedEmail = email || await fetchUserInfo(accessToken);
            if (!verifiedEmail) {
                setTransientStatus("error", "Drive permission was granted, but the account could not be verified.", 5000);
                return;
            }
            persistAuth(accessToken);
            setHasDriveScope(true);
            localStorage.setItem("google_has_drive_scope", "true");
            const settings = await getSettings();
            await saveSettings({ ...settings, googleSyncEnabled: true });
            await runRestore(true);
            setTransientStatus("success", "Drive backup enabled.");
        },
        onError: () => {
            addLog({ success: false, action: "backup", details: "Drive scope permission denied" });
            setTransientStatus("error", "Failed to enable Drive. Please try again.", 5000);
        },
    });

    useEffect(() => {
        const unsubscribe = subscribeToDataChanges(() => {
            const currentToken = getStoredToken();
            if (currentToken && driveSyncAllowed && hasDriveScope) {
                void handleBackup(true);
            }
        });
        return () => unsubscribe();
    }, [driveSyncAllowed, handleBackup, hasDriveScope]);

    if (!driveSyncAllowed) {
        return (
            <Card className="border-[var(--border)] bg-[var(--surface-2)]/50">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-[var(--primary)]/10 rounded-xl text-[var(--focus)]">
                            <Cloud className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3 className="font-bold text-lg text-amber-950">Unlock Cloud Sync</h3>
                            <p className="text-sm text-[var(--text)]/70 leading-relaxed">
                                LekkerLedger is a local-first app. Upgrade to enable Drive backup and keep your data safe across devices.
                            </p>
                            <Button className="mt-4 bg-[var(--primary)] hover:brightness-95 text-white font-bold" onClick={() => window.location.href = "/upgrade"}>
                                Upgrade to enable Drive backup <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className={`border-2 transition-colors ${!token ? "border-[var(--border)]" : !hasDriveScope ? "border-amber-500/50" : status === "error" ? "border-rose-500/50" : "border-emerald-500/50"}`}>
                <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-full ${!token ? "bg-[var(--surface-2)] text-[var(--text-muted)]" : !hasDriveScope ? "bg-amber-500/10 text-amber-500" : status === "error" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                            {!token ? <Cloud className="h-8 w-8" /> : !hasDriveScope ? <Shield className="h-8 w-8" /> : status === "loading" ? <Loader2 className="h-8 w-8 animate-spin" /> : status === "error" ? <AlertCircle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--text)]">
                                {!token ? "Sign in for Sync" : !hasDriveScope ? "Enable Drive Permission" : status === "loading" ? "Syncing..." : status === "error" ? "Sync Issue" : "Cloud Backup Active"}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                {!token ? "Connect your Google account to get started." : !hasDriveScope ? `Signed in as ${email}. Awaiting Drive permission.` : `Syncing with ${email}`}
                            </p>
                            {token && hasDriveScope && lastSyncTime && (
                                <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                                    Last backup: {new Date(lastSyncTime).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {!token ? (
                        <Button onClick={() => login()} className="bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold whitespace-nowrap">
                            Sign in with Google
                        </Button>
                    ) : !hasDriveScope ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={() => enableDrive()} className="bg-amber-500 hover:bg-amber-600 text-white font-bold whitespace-nowrap h-12 rounded-xl shadow-lg shadow-amber-500/20">
                                <Cloud className="h-4 w-4 mr-2" /> Enable Drive Backup
                            </Button>
                            <Button variant="ghost" className="text-[var(--text-muted)]" onClick={clearAuth}>Sign out</Button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => handleBackup(false)} disabled={status === "loading"}>
                                <RefreshCcw className={`h-4 w-4 mr-2 ${status === "loading" ? "animate-spin" : ""}`} /> Backup Now
                            </Button>
                            <Button variant="ghost" onClick={() => setPendingAction("restore")} disabled={status === "loading"}>
                                <Download className="h-4 w-4 mr-2" /> Restore
                            </Button>
                            <Button variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={clearAuth}>
                                Disconnect
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {pendingAction && (
                <Card className="border-[var(--border)] bg-[var(--surface-2)]/70">
                    <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-bold text-[var(--text)]">
                                {pendingAction === "restore" ? "Restore from Drive?" : "Delete Drive backup?"}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                                {pendingAction === "restore"
                                    ? "This will replace the current local data with the latest Drive snapshot."
                                    : "This removes the hidden Drive backup file for this app."}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setPendingAction(null)}>Cancel</Button>
                            <Button
                                className={pendingAction === "delete" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"}
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
                <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 ${status === "error" ? "bg-rose-50 text-rose-700 border border-rose-200" : status === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                    {status === "error" && <AlertCircle className="h-5 w-5" />}
                    {status === "success" && <CheckCircle2 className="h-5 w-5" />}
                    {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
                    {statusMessage}
                </div>
            )}

            {token && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass-panel border-none">
                        <CardHeader className="pb-3 border-b border-[var(--border)]">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[var(--primary)]" /> Privacy & Storage
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                LekkerLedger uses Google Drive AppData. This is a private hidden folder dedicated to this app.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-[10px] text-[var(--text-muted)] italic">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                    We cannot see or access your personal files or photos.
                                </li>
                                <li className="flex items-start gap-2 text-[10px] text-[var(--text-muted)] italic">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                    The backup folder is invisible in your normal Drive view.
                                </li>
                            </ul>
                            <div className="pt-4 border-t border-[var(--border)]">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Delete backup</h4>
                                <p className="text-[10px] text-[var(--text-muted)] mb-4">
                                    Use the button below to remove the AppData backup file, or remove hidden app data from Google Drive settings.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => setPendingAction("delete")} className="h-8 text-[10px] border-rose-200 text-rose-500 hover:bg-rose-50 font-bold">
                                    Delete Backup from Drive
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel border-none">
                        <CardHeader className="pb-3 border-b border-[var(--border)]">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Database className="h-4 w-4 text-[var(--primary)]" /> Storage Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="font-mono text-[10px] text-[var(--text-muted)] space-y-2">
                                <div className="flex items-center gap-2"><Folder className="h-3 w-3" fill="currentColor" /> appDataFolder/</div>
                                <div className="flex items-center gap-2 ml-4"><Folder className="h-3 w-3 text-[var(--focus)]" fill="currentColor" /> LekkerLedger/</div>
                                <div className="flex items-center gap-2 ml-8 text-[var(--text)]"><FileJson className="h-3 w-3 text-blue-400" /> <span className="font-semibold">lekkerledger_data.json</span></div>
                                <div className="mt-4 pt-4 border-t border-[var(--border)] text-[9px] opacity-70">
                                    Access token scope: session only
                                    <br />
                                    Encryption: Google Drive at rest
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel border-none md:col-span-2">
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
                                                <div className={`p-1.5 rounded-full ${log.success ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
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

