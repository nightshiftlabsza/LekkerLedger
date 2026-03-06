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

const ACCESS_TOKEN_KEY = "google_access_token";

function getStoredEmail() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("google_email");
}

function hasStoredDriveScope() {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("google_has_drive_scope") === "true";
}

function storeAccessToken(token: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function OpenAppContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = React.useState<string | null>(null);
    const [hasDriveAccess, setHasDriveAccess] = React.useState(false);
    const [status, setStatus] = React.useState<"idle" | "loading" | "error">("idle");
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        setEmail(getStoredEmail());
        setHasDriveAccess(hasStoredDriveScope());
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

        localStorage.setItem("google_email", data.email);
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
                storeAccessToken(tokenResponse.access_token);
                await fetchUserInfo(tokenResponse.access_token);
                setStatus("idle");
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

    const enableDrive = useGoogleLogin({
        scope: DRIVE_SCOPE,
        onSuccess: async (tokenResponse) => {
            try {
                setStatus("loading");
                setError("");
                storeAccessToken(tokenResponse.access_token);
                if (!getStoredEmail()) {
                    await fetchUserInfo(tokenResponse.access_token);
                }
                localStorage.setItem("google_has_drive_scope", "true");
                setHasDriveAccess(true);
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
                            Free can stay simple in one browser or device. Paid plans work best when connected to Google so you can restore your records across the Android app, the website, or another browser, while keeping payroll data private from LekkerLedger.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "rgba(180,35,24,0.25)", backgroundColor: "rgba(180,35,24,0.06)", color: "var(--danger)" }}>
                            {error}
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
                                        <span>No central LekkerLedger employee database is created.</span>
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
                                    Connect your Google account so paid plans can reconnect your records across the Android app, the website, or another browser. Your payroll data remains private from LekkerLedger.
                                </p>

                                <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>Google sign-in identifies your Google account.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>Drive access stores your backup in your own private Google Drive app data area.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>LekkerLedger cannot browse your normal Drive files and does not keep your payroll records in a central company database.</span>
                                    </li>
                                </ul>

                                {!email ? (
                                    <Button className="w-full font-bold" onClick={() => login()} disabled={status === "loading"}>
                                        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Connect Google account
                                    </Button>
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
                                    LekkerLedger does not keep a central database of employee payroll records. If you enable Google backup, the backup file lives in your own Google account, in Google Drive&apos;s private app data area. We cannot browse your normal Drive files, and your payroll records stay private from us.
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
