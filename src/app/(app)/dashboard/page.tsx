"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { useAppBootstrap } from "@/components/app-bootstrap-provider";
import { SyncStatusBadge, type SyncState as SyncBadgeState } from "@/components/ui/sync-status-badge";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import {
    getEmployees,
    getCurrentPayPeriod,
    getDocuments,
    getAllPayslips,
    purgeDocumentMetas,
    saveSettings,
    subscribeToDataChanges,
    getPayPeriods,
} from "@/lib/storage";
import { filterRecordsForArchiveWindow, getStandardRetentionStatus, isUploadedDocument, type StandardRetentionStatus } from "@/lib/archive";
import { computeDashboardAlerts } from "@/lib/alerts";
import { getUserPlan } from "@/lib/entitlements";
import { PAID_LOGIN_SUCCESS_QUERY } from "@/lib/paid-activation";
import { endAppMetric, recordAppMetric } from "@/lib/app-performance";
import type { DocumentMeta, Employee, PayPeriod } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import type { EmployeeSummary } from "@/components/dashboard/dashboard-overview";

const netPayCache = new Map<string, number>();
function getCachedNetPay(payslip: { id: string } & Parameters<typeof calculatePayslip>[0]): number {
    const cached = netPayCache.get(payslip.id);
    if (cached !== undefined) return cached;
    const result = calculatePayslip(payslip).netPay;
    netPayCache.set(payslip.id, result);
    return result;
}

const DashboardOverview = dynamic(
    () => import("@/components/dashboard/dashboard-overview").then(mod => ({ default: mod.DashboardOverview })),
    { loading: () => (
        <div className="flex w-full flex-col gap-5">
            <CardSkeleton />
            <div className="dashboard-cq-grid">
                <div className="space-y-5">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        </div>
    )}
);

type DashboardSyncState = "disabled" | "enabled" | "error" | "reconnecting";
type DashboardNetworkState = "online" | "offline" | "flaky";

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

    if (sync === "reconnecting") {
        return {
            state: "offline" as const,
            summary: network === "offline"
                ? "Offline right now. Sync will resume when the connection returns."
                : "Cloud sync is not active on this device yet.",
        };
    }

    return {
        state: "disconnected" as const,
        summary: network === "offline"
            ? "Offline right now. Sync will resume when the connection returns."
            : "Cloud sync is not active on this device yet.",
    };
}

function getActivationAlertMessage(syncState: string | null) {
    if (syncState === "none") {
        return "Paid login is complete. No backup snapshot was needed on this device yet.";
    }

    return "Paid login is complete and your dashboard is ready to use.";
}

function DashboardContent() {
    const { network, sync } = useAppConnectivity();
    const {
        activationError,
        activationStatus,
        effectiveSettings,
        isReadyForDashboard,
        subscriptionStatus,
    } = useAppBootstrap();
    const [loading, setLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [currentPeriod, setCurrentPeriod] = React.useState<PayPeriod | null>(null);
    const [recentDocs, setRecentDocs] = React.useState<DocumentMeta[]>([]);
    const [summaries, setSummaries] = React.useState<EmployeeSummary[]>([]);
    const [allPeriods, setAllPeriods] = React.useState<PayPeriod[]>([]);
    const [retentionStatus, setRetentionStatus] = React.useState<StandardRetentionStatus | null>(null);
    const [feedbackNoticeDismissedOptimistically, setFeedbackNoticeDismissedOptimistically] = React.useState(false);
    const [feedbackNoticeDismissPending, setFeedbackNoticeDismissPending] = React.useState(false);
    const [feedbackNoticeDismissError, setFeedbackNoticeDismissError] = React.useState<string | null>(null);
    const searchParams = useSearchParams();
    const paidLoginRequested = searchParams.get("paidLogin") === "1";
    const activationSuccess = searchParams.get("activation") === PAID_LOGIN_SUCCESS_QUERY;
    const activationSync = searchParams.get("sync");
    const renderCountRef = React.useRef(0);
    const recordedMountRef = React.useRef(false);

    React.useEffect(() => {
        renderCountRef.current += 1;
    });

    React.useEffect(() => {
        setFeedbackNoticeDismissedOptimistically(false);
        setFeedbackNoticeDismissPending(false);
        setFeedbackNoticeDismissError(null);
    }, [effectiveSettings?.paidDashboardFeedbackNoticeDismissedAt]);

    React.useEffect(() => {
        if (paidLoginRequested || !isReadyForDashboard || !effectiveSettings) {
            setLoading(true);
            return;
        }

        let active = true;

        async function load() {
            if (active) {
                setLoading(true);
            }

            const [loadedEmployees, period, docs, periods, allPayslips] = await Promise.all([
                getEmployees(),
                getCurrentPayPeriod(),
                getDocuments(),
                getPayPeriods(),
                getAllPayslips(),
            ]);
            const plan = getUserPlan(effectiveSettings);
            let nextDocs = docs;
            let nextRetentionStatus = getStandardRetentionStatus({
                plan,
                documents: nextDocs,
                dismissedAt: effectiveSettings.standardRetentionNoticeDismissedAt,
                planDowngradedAt: effectiveSettings.planDowngradedAt,
            });

            if (nextRetentionStatus.purgeCount > 0) {
                await purgeDocumentMetas(nextRetentionStatus.purgeCandidates.map((document) => document.id));
                nextDocs = await getDocuments();
                nextRetentionStatus = getStandardRetentionStatus({
                    plan,
                    documents: nextDocs,
                    dismissedAt: effectiveSettings.standardRetentionNoticeDismissedAt,
                    planDowngradedAt: effectiveSettings.planDowngradedAt,
                });
            }

            const nextSummaries: EmployeeSummary[] = loadedEmployees.map((employee) => {
                const latestPayslip = allPayslips.find((p) => p.employeeId === employee.id) ?? null;
                return {
                    employee,
                    latestPayslip,
                    netPay: latestPayslip ? getCachedNetPay(latestPayslip) : null,
                };
            });

            if (!active) return;

            const visibleRecentDocs = filterRecordsForArchiveWindow(nextDocs, plan, (doc) => doc.createdAt, {
                alwaysVisible: isUploadedDocument,
            }).visible;

            setEmployees(loadedEmployees);
            setCurrentPeriod(period);
            setAllPeriods(periods);
            setRecentDocs(visibleRecentDocs.slice(0, 5));
            setSummaries(nextSummaries);
            setRetentionStatus(nextRetentionStatus);
            setLoading(false);
            endAppMetric("login_to_interactive", {
                route: "dashboard",
            });
        }

        void load();
        const unsubscribe = subscribeToDataChanges(load);

        return () => {
            active = false;
            unsubscribe();
        };
    }, [effectiveSettings, isReadyForDashboard, paidLoginRequested]);

    React.useEffect(() => {
        if (loading || recordedMountRef.current) {
            return;
        }

        recordedMountRef.current = true;
        recordAppMetric("dashboard_mount_renders", {
            render_count: renderCountRef.current,
            subscription_status: subscriptionStatus,
        });
    }, [loading, subscriptionStatus]);

    const handleDismissRetentionReminder = async () => {
        if (!effectiveSettings || retentionStatus?.isStandard !== true) return;
        const dismissedAt = new Date().toISOString();

        await saveSettings({
            ...effectiveSettings,
            standardRetentionNoticeDismissedAt: dismissedAt,
        });
        setRetentionStatus((current) => current ? {
            ...current,
            showReminder: false,
        } : current);
    };

    const handleDismissPaidFeedbackNotice = async () => {
        if (!effectiveSettings || feedbackNoticeDismissPending) return;
        const dismissedAt = new Date().toISOString();

        setFeedbackNoticeDismissPending(true);
        setFeedbackNoticeDismissError(null);

        try {
            await saveSettings({
                ...effectiveSettings,
                paidDashboardFeedbackNoticeDismissedAt: dismissedAt,
            });
            setFeedbackNoticeDismissedOptimistically(true);
        } catch (error) {
            console.error("Failed to save paid dashboard feedback notice dismissal", error);
            setFeedbackNoticeDismissError("Could not save that preference right now.");
        } finally {
            setFeedbackNoticeDismissPending(false);
        }
    };

    if (paidLoginRequested || activationStatus === "pending") {
        return (
            <div className="workspace-shell workspace-shell--wide flex w-full flex-col gap-4 py-2">
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
                                <Button onClick={() => globalThis.location.reload()}>
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

    if (loading || !effectiveSettings) {
        return (
            <div className="flex w-full flex-col gap-5">
                <CardSkeleton />
                <div className="dashboard-cq-grid">
                    <div className="space-y-5">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                    <div className="dashboard-cq-rail hidden space-y-5">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    const now = new Date();
    const plan = getUserPlan(effectiveSettings);
    const alerts = computeDashboardAlerts({ employees, summaries, settings: effectiveSettings, now });
    const syncDetails = getDashboardSyncDetails(sync, network);
    const syncBadgeState: SyncBadgeState = syncDetails.state;
    const syncSummary = syncDetails.summary;
    const showPaidFeedbackNotice = plan.id !== "free"
        && !effectiveSettings.paidDashboardFeedbackNoticeDismissedAt
        && !feedbackNoticeDismissedOptimistically;

    return (
        <div className="pb-6">
            {activationSuccess ? <ActivationAlert syncState={activationSync} syncBadgeState={syncBadgeState} /> : null}
            {showPaidFeedbackNotice ? (
                <PaidFeedbackNoticeCard
                    dismissError={feedbackNoticeDismissError}
                    dismissing={feedbackNoticeDismissPending}
                    onDismiss={() => {
                        handleDismissPaidFeedbackNotice().catch(console.error);
                    }}
                />
            ) : null}
            {retentionStatus?.graceActive ? (
                <RetentionAlertCard
                    title="30-day grace period — save your older records now"
                    body="You recently changed to Standard. Generated payslips and exports older than 12 months will be permanently removed when this grace period ends. Download or export them now from the Documents page."
                    actionHref="/documents"
                    actionLabel="Open Documents"
                    tone="warning"
                />
            ) : null}
            {retentionStatus?.showElevenMonthWarning ? (
                <RetentionAlertCard
                    title="Some payroll documents are nearing the 12-month limit"
                    body="One or more generated payslips or exports are now 11 months old. Save offline or printed copies now. On Standard, generated payroll documents are permanently deleted once they pass 12 months."
                    actionHref="/documents"
                    actionLabel="Open Documents"
                    tone="warning"
                />
            ) : null}
            {retentionStatus?.showReminder ? (
                <RetentionAlertCard
                    title="Standard keeps 12 months in-app"
                    body="Save generated payroll documents as you go. Older generated payslips and exports are not kept in-app on Standard after 12 months."
                    actionLabel="Hide for 30 days"
                    onAction={() => {
                        handleDismissRetentionReminder().catch(console.error);
                    }}
                    tone="info"
                />
            ) : null}
            <DashboardOverview
                employees={employees}
                settings={effectiveSettings}
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
        <Card className="mb-5 w-full overflow-hidden border-[var(--primary)]/20 bg-[var(--surface-1)]">
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

function PaidFeedbackNoticeCard({
    dismissing,
    dismissError,
    onDismiss,
}: Readonly<{
    dismissing: boolean;
    dismissError: string | null;
    onDismiss: () => void;
}>) {
    return (
        <Card
            className="mb-5 w-full overflow-hidden border-[var(--primary)]/20 bg-[var(--surface-1)]"
            role="region"
            aria-labelledby="paid-dashboard-feedback-notice-title"
        >
            <CardContent className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-[72ch]">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-[var(--primary)]/10 p-2 text-[var(--primary)]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">Paid dashboard note</p>
                            <h2 id="paid-dashboard-feedback-notice-title" className="mt-1 text-lg font-black tracking-tight text-[var(--text)]">
                                Help us keep LekkerLedger polished
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                We&apos;ve put a lot of care into making LekkerLedger both functional and beautifully designed across devices. If you notice anything that looks off or isn&apos;t working properly, please email us at{" "}
                                <a
                                    href="mailto:support@lekkerledger.co.za"
                                    className="font-semibold text-[var(--primary)] underline decoration-[var(--primary)]/35 underline-offset-4 transition-colors hover:text-[var(--primary-hover)]"
                                >
                                    support@lekkerledger.co.za
                                </a>{" "}
                                so we can fix and improve it.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 lg:pl-4">
                    <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <Button
                                variant="outline"
                                className="min-w-[112px] font-bold"
                                onClick={onDismiss}
                                disabled={dismissing}
                            >
                                Dismiss
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[var(--primary)] hover:text-[var(--primary-hover)]"
                                onClick={onDismiss}
                                disabled={dismissing}
                                aria-label="Dismiss paid dashboard feedback notice"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {dismissError ? (
                            <output className="text-sm leading-6 text-[var(--danger)] sm:max-w-[18rem]" aria-live="polite">
                                {dismissError}
                            </output>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RetentionAlertCard({
    title,
    body,
    actionLabel,
    actionHref,
    onAction,
    tone,
}: Readonly<{
    title: string;
    body: string;
    actionLabel: string;
    actionHref?: string;
    onAction?: () => void;
    tone: "info" | "warning";
}>) {
    const toneClasses = tone === "warning"
        ? {
            border: "var(--warning-border)",
            background: "var(--warning-soft)",
        }
        : {
            border: "var(--focus)",
            background: "var(--focus-soft, rgba(196,122,28,0.08))",
        };

    const actionButton = actionHref ? (
        <Link href={actionHref}>
            <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{actionLabel}</Button>
        </Link>
    ) : (
        <Button variant="outline" className="font-bold" onClick={onAction}>
            {actionLabel}
        </Button>
    );

    return (
        <Card
            className="mb-5 w-full overflow-hidden"
            style={{
                borderColor: toneClasses.border,
                backgroundColor: toneClasses.background,
            }}
        >
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-[75ch]">
                    <p className="text-base font-bold text-[var(--text)]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
                </div>
                <div className="shrink-0">{actionButton}</div>
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
