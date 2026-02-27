"use client";

import { useState, useEffect } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { Cloud, Download, Upload, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GOOGLE_SCOPES, syncDataToDrive, syncDataFromDrive } from "@/lib/google-drive";

interface GoogleSyncProps {
    proStatus?: string;
}

export function GoogleSync({ proStatus = "free" }: GoogleSyncProps) {
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [statusMessage, setStatusMessage] = useState("");

    // Look for existing token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("google_access_token");
        const storedEmail = localStorage.getItem("google_email");
        if (storedToken) setToken(storedToken);
        if (storedEmail) setEmail(storedEmail);
    }, []);

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
        },
        onError: () => {
            setStatus("error");
            setStatusMessage("Login failed.");
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

    const handleBackup = async () => {
        if (!token) return;
        setStatus("loading");
        setStatusMessage("Backing up to Google Drive...");
        const success = await syncDataToDrive(token);
        if (success) {
            setStatus("success");
            setStatusMessage("Successfully backed up to Drive!");
        } else {
            setStatus("error");
            setStatusMessage("Failed to backup. You may need to log in again.");
        }
        setTimeout(() => setStatus("idle"), 4000);
    };

    const handleRestore = async () => {
        if (!token) return;

        if (!confirm("This will overwrite your local data with the version from Google Drive. Are you sure?")) {
            return;
        }

        setStatus("loading");
        setStatusMessage("Restoring from Google Drive...");
        const success = await syncDataFromDrive(token);
        if (success) {
            setStatus("success");
            setStatusMessage("Successfully restored data!");
            // Reload page to reflect new data
            setTimeout(() => window.location.reload(), 2000);
        } else {
            setStatus("error");
            setStatusMessage("Failed to restore or no backup found.");
            setTimeout(() => setStatus("idle"), 4000);
        }
    };


    return (
        <Card className="animate-slide-up mt-5">
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Cloud className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
                    <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        Google Drive Sync
                    </h2>
                    {proStatus !== "pro" && proStatus !== "annual" && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                            Pro/Annual
                        </span>
                    )}
                </div>

                {(proStatus !== "pro" && proStatus !== "annual") ? (
                    <div className="space-y-4">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger is a local-only app. Upgrade to securely save your data in a private folder on your own Google Drive.
                        </p>
                        <a href="/pricing" className="block p-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-amber-800">Unlock Cloud Backups</p>
                                    <p className="text-[10px] text-amber-700/70 leading-relaxed max-w-[200px]">Never lose your data. Secure, automated syncing to your personal Google Drive.</p>
                                </div>
                                <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </a>
                    </div>
                ) : (
                    <>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger is a local-only app. Keep your data safe by securely saving it in a private folder on your own Google Drive.
                        </p>

                        {status !== "idle" && (
                            <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${status === "error" ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" :
                                status === "success" ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" :
                                    "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                                }`}>
                                {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                                {status === "error" && <AlertCircle className="h-4 w-4" />}
                                {status === "success" && <CheckCircle2 className="h-4 w-4" />}
                                {statusMessage}
                            </div>
                        )}

                        {!token ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 h-11"
                                onClick={() => login()}
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </Button>
                        ) : (
                            <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[var(--text-secondary)]">
                                        Logged in as <span className="font-bold">{email || "Google User"}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="text-red-500 hover:underline flex items-center gap-1"
                                    >
                                        <LogOut className="h-3 w-3" /> Sign Out
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        className="flex-1 gap-2"
                                        onClick={handleBackup}
                                        disabled={status === "loading"}
                                    >
                                        <Upload className="h-4 w-4" /> Backup to Cloud
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 gap-2 border-[var(--border-subtle)]"
                                        onClick={handleRestore}
                                        disabled={status === "loading"}
                                    >
                                        <Download className="h-4 w-4" /> Restore from Cloud
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
