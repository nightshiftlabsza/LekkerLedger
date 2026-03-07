"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { ArrowRight, CheckCircle2, Cloud, HardDrive, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MINIMAL_SCOPES, DRIVE_SCOPE } from "@/lib/google-drive";
import { getStoredGoogleAccessToken, getStoredGoogleEmail, hasStoredGoogleDriveScope, storeGoogleAccessToken, storeGoogleIdentity, setStoredGoogleDriveScope } from "@/lib/google-session";

function OpenAppContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = React.useState<string | null>(null);
    const [hasDriveAccess, setHasDriveAccess] = React.useState(false);
    const [hasSession, setHasSession] = React.useState(false);
    const [status, setStatus] = React.useState<"idle" | "loading" | "error">("idle");
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        setEmail(getStoredGoogleEmail());
        setHasDriveAccess(hasStoredGoogleDriveScope());
        setHasSession(!!getStoredGoogleAccessToken());
    }, []);

    const fetchUserInfo = React.useCallback(async (accessToken: string) => {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error("Could not verify Google account.");
        }

        const data = await response.json();
        if (!data.email) {
            throw new Error("Google account email missing.");
        }

        storeGoogleIdentity({ email: data.email, sub: data.sub });
        setEmail(data.email);
    }, []);

    const completeGooglePath = React.useCallback((destination?: string | null) => {
        router.push(destination || "/dashboard");
    }, [router]);

    const login = useGoogleLogin({
        scope: MINIMAL_SCOPES,
        onSuccess: async (tokenResponse) => {
            try {
                setStatus("loading");
                setError("");
                storeGoogleAccessToken(tokenResponse.access_token);
                await fetchUserInfo(tokenResponse.access_token);
                setHasSession(true);
                setStatus("idle");
                const nextDestination = searchParams.get("next");
                if (nextDestination) {
                    completeGooglePath(nextDestination);
                    return;
                }
                router.push("/settings?tab=storage&source=open-app");
            } catch (loginError) {
                console.error(loginError);
                setStatus("error");
                setError("Google sign-in could not be completed. Please try again.");
            }
        },
        onError: () => {
            setStatus("error");
            setError("Google sign-in could not be completed. Please try again.");
        },
    });

    const reconnectGoogle = useGoogleLogin({
        scope: `${MINIMAL_SCOPES} ${DRIVE_SCOPE}`,
        onSuccess: async (tokenResponse) => {
            try {
                setStatus("loading");
                setError("");
                storeGoogleAccessToken(tokenResponse.access_token);
                await fetchUserInfo(tokenResponse.access_token);
                setStoredGoogleDriveScope(true);
                setHasDriveAccess(true);
                setHasSession(true);
                setStatus("idle");
                completeGooglePath(searchParams.get("next"));
            } catch (reconnectError) {
                console.error(reconnectError);
                setStatus("error");
                setError("Google reconnection could not be completed. Please try again.");
            }
        },
        onError: () => {
            setStatus("error");
            setError("Google reconnection could not be completed. Please try again.");
        },
    });
    const enableDrive = useGoogleLogin({
        scope: DRIVE_SCOPE,
        onSuccess: async (tokenResponse) => {
            try {
                setStatus("loading");
                setError("");
                storeGoogleAccessToken(tokenResponse.access_token);
                if (!getStoredGoogleEmail()) {
                    await fetchUserInfo(tokenResponse.access_token);
                }
                setStoredGoogleDriveScope(true);
                setHasDriveAccess(true);
                setHasSession(true);
                setStatus("idle");
                completeGooglePath(searchParams.get("next"));
            } catch (driveError) {
                console.error(driveError);
                setStatus("error");
                setError("Google Drive access could not be enabled. Please try again.");
            }
        },
        onError: () => {
            setStatus("error");
            setError("Google Drive access could not be enabled. Please try again.");
        },
    });

    const recommendedGoogle = searchParams.get("recommended") === "google";
    const showLoggedOutNotice = searchParams.get("source") === "logout";

    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
            <main className="content-container-wide px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-8">
                    <div className="max-w-3xl space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Open LekkerLedger
                        </p>
                        <h1 className="type-h1" style={{ color: "var(--text)" }}>
                            Open the app locally, or reconnect it through your Google account.
                        </h1>
                        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            Free can stay simple in one browser or device. Paid plans work best when connected to Google so you can restore your records across the Android app, the website, or another browser, while keeping backup storage in the Google Drive app data area in your own Google account.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "rgba(180,35,24,0.25)", backgroundColor: "rgba(180,35,24,0.06)", color: "var(--danger)" }}>
                            {error}
                        </div>
                    )}

                    {showLoggedOutNotice && (
                        <div className="rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "rgba(0,122,77,0.22)", backgroundColor: "rgba(0,122,77,0.06)", color: "var(--text)" }}>
                            You signed out of Google on this device. Your local records stay here, and your private Drive backup remains in your own Google account until you reconnect.
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border-[var(--border)] shadow-[var(--shadow-1)]">
                            <CardContent className="p-7 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-[var(--surface-raised)] p-3 text-[var(--primary)]">
                                        <HardDrive className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                            Local-first
                                        </p>
                                        <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
                                            Continue locally
                                        </h2>
                                    </div>
                                </div>

                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Use LekkerLedger in this browser or device without connecting Google. This is the simplest path for free use or first-time setup.
                                </p>

                                <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>Your records stay in this browser or device.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>Employee payroll records stay on this device by default.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>Best for free use in one browser or one device.</span>
                                    </li>
                                </ul>

                                <Button className="w-full font-bold" onClick={() => router.push(searchParams.get("next") || "/dashboard")}>
                                    Open locally <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className={`border shadow-[var(--shadow-2)] ${recommendedGoogle ? "border-[var(--primary)]" : "border-[var(--border)]"}`}>
                            <CardContent className="p-7 space-y-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                                            <Cloud className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                Google-connected
                                            </p>
                                            <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
                                                Continue with Google
                                            </h2>
                                        </div>
                                    </div>
                                    {recommendedGoogle && (
                                        <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                                            Recommended for paid
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Connect your Google account so paid plans can reconnect your records across the Android app, the website, or another browser. Backup files then live in the Google Drive app data area in your own Google account.
                                </p>

                                <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>Google sign-in identifies your Google account.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>Drive access stores your backup in the Google Drive app data area in your own Google account.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>LekkerLedger cannot browse your normal Drive files and does not use this flow to upload payroll records into a central company database.</span>
                                    </li>
                                </ul>

                                {!email ? (
                                    <Button className="w-full font-bold" onClick={() => login()} disabled={status === "loading"}>
                                        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Connect Google account
                                    </Button>
                                ) : !hasSession && hasDriveAccess ? (
                                    <div className="space-y-3">
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                            Previously connected as <strong style={{ color: "var(--text)" }}>{email}</strong>. Sign in again to use your private Drive backup on this device.
                                        </div>
                                        <Button className="w-full font-bold" onClick={() => reconnectGoogle()} disabled={status === "loading"}>
                                            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            Reconnect Google backup
                                        </Button>
                                    </div>
                                ) : !hasSession ? (
                                    <div className="space-y-3">
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                            Previously connected as <strong style={{ color: "var(--text)" }}>{email}</strong>. Sign in again to continue with Google on this device.
                                        </div>
                                        <Button className="w-full font-bold" onClick={() => login()} disabled={status === "loading"}>
                                            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            Reconnect Google account
                                        </Button>
                                    </div>
                                ) : !hasDriveAccess ? (
                                    <div className="space-y-3">
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                            Connected as <strong style={{ color: "var(--text)" }}>{email}</strong>. Next, enable private Drive backup so your records can travel with you.
                                        </div>
                                        <Button className="w-full font-bold" onClick={() => enableDrive()} disabled={status === "loading"}>
                                            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            Enable private Drive backup
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                            Connected as <strong style={{ color: "var(--text)" }}>{email}</strong> with private Drive backup enabled.
                                        </div>
                                        <Button className="w-full font-bold" onClick={() => completeGooglePath(searchParams.get("next"))}>
                                            Open app with Google-connected access <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-1)]">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="type-h3" style={{ color: "var(--text)" }}>
                                    Privacy, stated plainly
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    LekkerLedger is designed so employee payroll records stay on your device by default. If you enable Google backup, the backup file lives in the Google Drive app data area in your own Google account. We cannot browse your normal Drive files, and payroll records are not uploaded into a central company payroll database as part of this backup flow.
                                </p>
                                <Link href="/trust" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                                    Read the trust details <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function OpenAppPage() {
    return (
        <Suspense fallback={null}>
            <OpenAppContent />
        </Suspense>
    );
}
