"use client";

import { useState, useEffect, useCallback } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { Cloud, Download, Upload, CheckCircle2, AlertCircle, Loader2, Folder, FileJson, Database, Shield, History, RefreshCcw, ArrowRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GOOGLE_SCOPES, syncDataToDrive, syncDataFromDrive } from "@/lib/google-drive";
import { subscribeToDataChanges } from "@/lib/storage";

interface SyncEvent {
    id: string;
    timestamp: string;
    success: boolean;
    action: "backup" | "restore";
    details: string;
}

interface GoogleSyncProps {
    proStatus?: string;
}

export function GoogleSync({ proStatus = "free" }: GoogleSyncProps) {
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window !== "undefined") return localStorage.getItem("google_access_token");
        return null;
    });
    const [email, setEmail] = useState<string | null>(() => {
        if (typeof window !== "undefined") return localStorage.getItem("google_email");
        return null;
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "conflict">("idle");
    const [statusMessage, setStatusMessage] = useState("");
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
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString(),
            ...event
        };
        setSyncLogs(prev => {
            const up = [newLog, ...prev].slice(0, 20);
            localStorage.setItem("ll_sync_logs", JSON.stringify(up));
            return up;
        });
        if (event.success) {
            setLastSyncTime(newLog.timestamp);
            localStorage.setItem("ll_last_sync", newLog.timestamp);
        }
    };

    const fetchUserInfo = async (accessToken: string) => {
        try {
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await res.json();
            if (data.email) {
                setEmail(data.email);
                localStorage.setItem("google_email", data.email);
            }
        } catch (e) {
            console.error("Failed to fetch user info", e);
        }
    };

    const login = useGoogleLogin({
        scope: GOOGLE_SCOPES,
        onSuccess: async (tokenResponse) => {
            const accessToken = tokenResponse.access_token;
            setToken(accessToken);
            localStorage.setItem("google_access_token", accessToken);
            await fetchUserInfo(accessToken);
            await handleRestore(false);
        },
        onError: () => {
            setStatus("error");
            setStatusMessage("Login failed.");
            addLog({ success: false, action: "backup", details: "Login authentication failed" });
        }
    });

    const logout = () => {
        googleLogout();
        setToken(null);
        setEmail(null);
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_email");
        setStatus("idle");
    };

    const handleBackup = useCallback(async (silent = false) => {
        const currentToken = token || localStorage.getItem("google_access_token");
        if (!currentToken) return;

        if (!silent) {
            setStatus("loading");
            setStatusMessage("Backing up to Google Sync...");
        }

        const success = await syncDataToDrive(currentToken);

        if (success) {
            addLog({ success: true, action: "backup", details: "Uploaded lekkerledger_data.json" });
            if (!silent) {
                setStatus("success");
                setStatusMessage("Successfully backed up to Drive!");
                setTimeout(() => setStatus("idle"), 4000);
            }
        } else {
            addLog({ success: false, action: "backup", details: "Network or permission error during upload" });
            if (!silent) {
                setStatus("error");
                setStatusMessage("Failed to backup. Check connection or log in again.");
                setTimeout(() => setStatus("idle"), 5000);
            }
        }
    }, [token]);

    const handleRestore = async (silent = false) => {
        const currentToken = token || localStorage.getItem("google_access_token");
        if (!currentToken) return;

        if (!silent) {
            // Placeholder for conflict resolution modal logic
            if (!confirm("Conflict Warning: Your local data and drive data differ. Download latest from Drive & overwrite local?")) {
                return;
            }
            setStatus("loading");
            setStatusMessage("Restoring from Google Sync...");
        }

        const success = await syncDataFromDrive(currentToken);

        if (success) {
            addLog({ success: true, action: "restore", details: "Downloaded remote data snapshot" });
            if (!silent) {
                setStatus("success");
                setStatusMessage("Successfully restored data!");
                setTimeout(() => window.location.reload(), 2000);
            }
        } else {
            addLog({ success: false, action: "restore", details: "Failed to download snapshot" });
            if (!silent) {
                setStatus("error");
                setStatusMessage("Failed to restore or no backup found.");
                setTimeout(() => setStatus("idle"), 5000);
            }
        }
    };

    useEffect(() => {
        const unsubscribe = subscribeToDataChanges(() => {
            const currentToken = localStorage.getItem("google_access_token");
            if (currentToken && proStatus !== "free") {
                handleBackup(true);
            }
        });
        return () => unsubscribe();
    }, [proStatus, handleBackup]);

    if (proStatus === "free") {
        return (
            <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
                            <Cloud className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3 className="font-bold text-lg text-amber-950">Unlock Cloud Sync</h3>
                            <p className="text-sm text-amber-900/70 leading-relaxed">
                                LekkerLedger is a local-only app. Upgrade to seamlessly back up your data to a private, encrypted folder in your own Google Drive.
                            </p>
                            <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={() => window.location.href = '/pricing'}>
                                View Pro Plans <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Header */}
            <Card className={`border-2 transition-colors ${!token ? "border-[var(--border-subtle)]" : status === "error" ? "border-rose-500/50" : "border-emerald-500/50"}`}>
                <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-full ${!token ? "bg-[var(--bg-subtle)] text-[var(--text-muted)]" : status === "error" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                            {!token ? <Cloud className="h-8 w-8" /> : status === "loading" ? <Loader2 className="h-8 w-8 animate-spin" /> : status === "error" ? <AlertCircle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--text-primary)]">
                                {!token ? "Drive Sync Paused" : status === "loading" ? "Syncing..." : status === "error" ? "Sync Issue Detected" : "Drive Sync Active"}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                {!token ? "Backup is OFF. Your data stays on this device." : `Connected as ${email}`}
                            </p>
                            {token && lastSyncTime && (
                                <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                                    Last synced: {new Date(lastSyncTime).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {!token ? (
                        <Button onClick={() => login()} className="bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold whitespace-nowrap">
                            <svg className="h-4 w-4 mr-2 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Connect Google Drive
                        </Button>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => handleBackup(false)} disabled={status === "loading"}>
                                <RefreshCcw className={`h-4 w-4 mr-2 ${status === 'loading' ? 'animate-spin' : ''}`} /> Run sync now
                            </Button>
                            <Button variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={logout}>
                                Disconnect
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error state notification */}
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
                    {/* What's stored where */}
                    <Card className="glass-panel border-none">
                        <CardHeader className="pb-3 border-b border-[var(--border-subtle)]">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Database className="h-4 w-4 text-[var(--amber-500)]" /> Data Architecture
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-sm">
                                    <Cloud className="h-4 w-4 text-emerald-500" /> In Google Drive
                                </div>
                                <p className="text-xs text-[var(--text-muted)] pl-6">
                                    Encrypted backup file containing your complete employee roster, leave records, and payroll history. Stored in a hidden app-data folder.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-sm">
                                    <Smartphone className="h-4 w-4 text-blue-500" /> On this device
                                </div>
                                <p className="text-xs text-[var(--text-muted)] pl-6">
                                    Fast local cache of the database with immediate offline read/write access. Generates PDFs locally.
                                </p>
                            </div>
                            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                                <div className="flex items-start gap-2 text-xs">
                                    <Shield className="h-4 w-4 text-[var(--amber-500)] shrink-0 mt-0.5" />
                                    <p className="text-[var(--text-secondary)]">
                                        <strong>Least-Privilege Access:</strong> LekkerLedger can <span className="underline decoration-amber-500/50">only</span> read and write files it creates itself. We cannot see any of your other Google Drive files.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Folder Structure */}
                    <Card className="glass-panel border-none">
                        <CardHeader className="pb-3 border-b border-[var(--border-subtle)]">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Folder className="h-4 w-4 text-[var(--amber-500)]" /> Drive Structure Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="font-mono text-xs text-[var(--text-secondary)] space-y-2">
                                <div className="flex items-center gap-2 opacity-60"><Folder className="h-4 w-4" fill="currentColor" /> Hidden AppData Root</div>
                                <div className="flex items-center gap-2 ml-4"><Folder className="h-4 w-4 text-amber-500" fill="currentColor" /> LekkerLedger (App Folder)</div>
                                <div className="flex items-center gap-2 ml-8 text-[var(--text-primary)]"><FileJson className="h-4 w-4 text-blue-400" /> <span className="font-semibold">lekkerledger_data.json</span></div>
                                <div className="flex items-center gap-2 ml-12 opacity-50"><span className="text-[10px]">&uarr; Continuous background sync</span></div>

                                <div className="flex items-center gap-2 ml-8 mt-4"><Folder className="h-4 w-4 text-amber-500" fill="currentColor" /> Households</div>
                                <div className="flex items-center gap-2 ml-12"><Folder className="h-4 w-4" /> Default</div>
                                <div className="flex items-center gap-2 ml-16"><Folder className="h-4 w-4 text-zinc-400" /> Payslips (PDFs - coming soon)</div>
                                <div className="flex items-center gap-2 ml-16"><Folder className="h-4 w-4 text-zinc-400" /> Contracts (PDFs - coming soon)</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sync Log */}
                    <Card className="glass-panel border-none md:col-span-2">
                        <CardHeader className="pb-3 border-b border-[var(--border-subtle)] flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4 text-[var(--amber-500)]" /> Recent Sync Events
                            </CardTitle>
                            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-black">Last 20</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            {syncLogs.length === 0 ? (
                                <div className="p-8 text-center text-sm text-[var(--text-muted)]">No sync events recorded yet.</div>
                            ) : (
                                <ul className="divide-y divide-[var(--border-subtle)]">
                                    {syncLogs.map(log => (
                                        <li key={log.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${log.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {log.action === "backup" ? <Upload className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                                        {log.action === "backup" ? "Cloud Backup" : "Cloud Restore"} {log.success ? "Successful" : "Failed"}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px] sm:max-w-md">{log.details}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
