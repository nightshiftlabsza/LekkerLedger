"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { SyncStatusBadge, type SyncState as SyncBadgeState } from "@/components/ui/sync-status-badge";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import {
    getEmployees,
    getSettings,
    getCurrentPayPeriod,
    getDocuments,
    getLatestPayslip,
    subscribeToDataChanges,
    getPayPeriods,
} from "@/lib/storage";
import { filterRecordsForArchiveWindow, isUploadedDocument } from "@/lib/archive";
import { computeDashboardAlerts } from "@/lib/alerts";
import { confirmBillingTransaction, confirmGuestBillingTransaction } from "@/lib/billing-client";
import { getUserPlan } from "@/lib/entitlements";
import { clearPendingBillingHandoff, readPendingBillingReference, writePendingBillingReference } from "@/lib/billing-handoff";
import { buildPaidDashboardHref, PAID_LOGIN_SUCCESS_QUERY } from "@/lib/paid-activation";
import type { DocumentMeta, Employee, EmployerSettings, PayPeriod } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { DashboardOverview, type EmployeeSummary } from "@/components/dashboard/dashboard-overview";

type DashboardSyncState = "disabled" | "enabled" | "error" | "reconnecting";
type DashboardNetworkState = "online" | "offline";

function waitForRetry(delayMs: number) {
    return new Promise((resolve) => {
        globalThis.setTimeout(resolve, delayMs);
    });
}

async function confirmPaidAccountWithRetries(paymentReference: string) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const account = await confirmBillingTransaction(paymentReference);
            return { account, lastError };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Paid activation could not be completed.");
            if (attempt < 2) {
                await waitForRetry(900);
            }
        }
    }

    return { account: null, lastError };
}

async function completePaidLoginFlow(paymentReference: string): Promise<string> {
    if (!paymentReference) {
        throw new Error("We could not find your payment reference. Please log in again from the payment handoff.");
    }

    writePendingBillingReference(paymentReference);
    const { account, lastError } = await confirmPaidAccountWithRetries(paymentReference);

    if (!account) {
        const guestStatus = await confirmGuestBillingTransaction(paymentReference).catch(() => null);
        if (guestStatus?.paid) {
            throw new Error(lastError?.message || "Your payment was found, but the paid account could not be activated yet.");
        }

        throw lastError || new Error("Paid activation could not be completed.");
    }

    if (account.entitlements.planId === "free" || !account.entitlements.isActive) {
        throw new Error(account.account.lastError || "Your payment was found, but paid access is not active yet.");
    }

    clearPendingBillingHandoff();
    return buildPaidDashboardHref({ activation: PAID_LOGIN_SUCCESS_QUERY });
}

function getDashboardSyncDetails(sync: DashboardSyncState, network: DashboardNetworkState) {
    if (sync === "enabled") {
        return {
            state: "synced" as const,
            summary: "Cloud sync is active on this device.",
        };
    }

    if (sync === "error") {
        return {
            state: "error" as const,
            summary: "Sync needs attention in Settings.",
        };
    }

    if (network === "offline") {
        return {
            state: "offline" as const,
            summary: "Offline right now. Sync will resume when the connection returns.",
        };
    }

    return {
        state: sync === "reconnecting" ? "offline" as const : "disconnected" as const,
        summary: "Cloud sync is not active on this device yet.",
    };
}

function getActivationAlertMessage(syncState: string | null) {
    if (syncState === "none") {
        return "Paid login is complete. No backup snapshot was needed on this device yet.";
    }

    return "Paid login is complete and your dashboard is ready to use.";
}

function DashboardContent() {
    const router = useRouter();
    const { network, sync } = useAppConnectivity();
    const [loading, setLoading] = React.useState(true);
    const [activationError, setActivationError] = React.useState<string | null>(null);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [currentPeriod, setCurrentPeriod] = React.useState<PayPeriod | null>(null);
    const [recentDocs, setRecentDocs] = React.useState<DocumentMeta[]>([]);
    const [summaries, setSummaries] = React.useState<EmployeeSummary[]>([]);
    const [allPeriods, setAllPeriods] = React.useState<PayPeriod[]>([]);
    const searchParams = useSearchParams();
    const paidLoginRequested = searchParams.get("paidLogin") === "1";
    const paymentReference = searchParams.get("reference")?.trim() || readPendingBillingReference() || "";
    const activationSuccess = searchParams.get("activation") === "paid-login-success";
    const activationSync = searchParams.get("sync");

    React.useEffect(() => {
        if (!paidLoginRequested) return;

        let active = true;

        async function handlePaidLoginCompletion() {
            setActivationError(null);

            try {
                const nextHref = await completePaidLoginFlow(paymentReference);
                if (!active) return;
                globalThis.location.replace(nextHref);
            } catch (error) {
                if (!active) return;
                setActivationError(error instanceof Error ? error.message : "Paid activation could not be completed.");
            }
        }

        handlePaidLoginCompletion().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [paidLoginRequested, paymentReference]);

    React.useEffect(() => {
        if (paidLoginRequested) return;

        let active = true;

        async function load() {
            if (active) {
                setLoading(true);
            }

            const [loadedEmployees, loadedSettings, period, docs, periods] = await Promise.all([
                getEmployees(),
                getSettings(),
                getCurrentPayPeriod(),
                getDocuments(),
                getPayPeriods(),
            ]);

            const nextSummaries: EmployeeSummary[] = [];
            for (const employee of loadedEmployees) {
                const latestPayslip = await getLatestPayslip(employee.id);
                nextSummaries.push({
                    employee,
                    latestPayslip,
                    netPay: latestPayslip ? calculatePayslip(latestPayslip).netPay : null,
                });
            }

            if (!active) return;

            const plan = getUserPlan(loadedSettings);
            const visibleRecentDocs = filterRecordsForArchiveWindow(docs, plan, (doc) => doc.createdAt, {
                alwaysVisible: isUploadedDocument,
            }).visible;

            setEmployees(loadedEmployees);
            setSettings(loadedSettings);
            setCurrentPeriod(period);
            setAllPeriods(periods);
            setRecentDocs(visibleRecentDocs.slice(0, 5));
            setSummaries(nextSummaries);
            setLoading(false);
        }

        void load();
        const unsubscribe = subscribeToDataChanges(load);

        return () => {
            active = false;
            unsubscribe();
        };
    }, [paidLoginRequested]);

    if (paidLoginRequested) {
        return (
            <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4 py-2">
                {activationError ? (
                    <Card className="border-[var(--danger-border)] bg-[var(--danger-soft)]">
                        <CardContent className="space-y-4 p-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
                                <div className="space-y-2">
                                    <p className="text-base font-bold text-[var(--text)]">Paid activation needs attention</p>
                                    <p className="text-sm leading-6 text-[var(--text-muted)]">{activationError}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button onClick={() => router.refresh()}>
                                    Try again
                                </Button>
                                <Link href="/pricing">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        View plans
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-[var(--border)] bg-[var(--surface-1)]">
                        <CardContent className="space-y-3 p-6">
                            <div className="flex items-center gap-3 text-[var(--primary)]">
                                <div className="rounded-full bg-[var(--primary)]/10 p-2">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h1 className="text-lg font-black tracking-tight text-[var(--text)]">Completing your paid setup</h1>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">Please wait while LekkerLedger activates your paid dashboard access.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
                <CardSkeleton />
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                    <div className="hidden space-y-5 xl:block">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    const now = new Date();
    const alerts = computeDashboardAlerts({ employees, summaries, settings, now });
    const syncDetails = getDashboardSyncDetails(sync, network);
    const syncBadgeState: SyncBadgeState = syncDetails.state;
    const syncSummary = syncDetails.summary;

    return (
        <div className="pb-6">
            {activationSuccess ? <ActivationAlert syncState={activationSync} syncBadgeState={syncBadgeState} /> : null}
            <DashboardOverview
                employees={employees}
                settings={settings}
                currentPeriod={currentPeriod}
                recentDocs={recentDocs}
                summaries={summaries}
                allPeriods={allPeriods}
                alerts={alerts}
                syncBadgeState={syncBadgeState}
                syncSummary={syncSummary}
            />
        </div>
    );
}

function ActivationAlert({
    syncState,
    syncBadgeState,
}: Readonly<{
    syncState: string | null;
    syncBadgeState: SyncBadgeState;
}>) {
    return (
        <Card className="mx-auto mb-5 w-full max-w-[1180px] overflow-hidden border-[var(--primary)]/20 bg-[var(--surface-1)]">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[var(--primary)]/10 p-2 text-[var(--primary)]">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">Paid access active</p>
                        <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--text)]">Your dashboard is ready</h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                            {getActivationAlertMessage(syncState)}
                        </p>
                    </div>
                </div>
                <SyncStatusBadge state={syncBadgeState} />
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    return (
        <React.Suspense fallback={<CardSkeleton />}>
            <DashboardContent />
        </React.Suspense>
    );
}
