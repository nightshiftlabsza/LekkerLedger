"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Loader2, Clock, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEmployees, getPayslipsForEmployee, getSettings } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { filterRecordsForArchiveWindow, getArchiveUpgradeHref, getArchiveUpgradeLabel, getArchiveUpgradeMessage } from "@/lib/archive";
import { calculatePayslip } from "@/lib/calculator";
import { track } from "@/lib/analytics";
import { getUserPlan } from "@/lib/entitlements";

export default function EmployeeHistoryPage() {
    const { id } = useParams<{ id: string }>();
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [payslips, setPayslips] = React.useState<PayslipInput[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [downloading, setDownloading] = React.useState<string | null>(null);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        let active = true;
        async function load() {
            try {
                const [emps, s] = await Promise.all([
                    getEmployees(),
                    getSettings(),
                ]);
                if (!active) return;
                const emp = emps.find((e: Employee) => e.id === id);
                if (!emp) {
                    setError("Employee not found.");
                    setLoading(false);
                    return;
                }
                const history = await getPayslipsForEmployee(id);
                if (!active) return;
                // Most recent first
                history.sort((a: PayslipInput, b: PayslipInput) =>
                    new Date(b.payPeriodStart).getTime() - new Date(a.payPeriodStart).getTime()
                );
                setEmployee(emp);
                setPayslips(history);
                setSettings(s);
            } catch (e) {
                console.error(e);
                if (active) {
                    setError("Failed to load history.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [id]);

    const archivePlan = settings ? getUserPlan(settings) : null;
    const archiveResult = React.useMemo(
        () => archivePlan ? filterRecordsForArchiveWindow(payslips, archivePlan, (record) => record.payPeriodEnd) : { visible: payslips, hidden: [], hiddenCount: 0 },
        [archivePlan, payslips],
    );
    const visiblePayslips = archiveResult.visible;
    const archiveUpgradeHref = archivePlan ? getArchiveUpgradeHref(archivePlan.id) : "/upgrade";
    const archiveUpgradeLabel = archivePlan ? getArchiveUpgradeLabel(archivePlan.id) : "Upgrade";

    const handleDownload = async (ps: PayslipInput) => {
        if (!employee || !settings) return;
        setDownloading(ps.id);
        try {
            const bytes: Uint8Array = await new Promise((resolve, reject) => {
                const worker = new globalThis.Worker(new URL("../../../../pdf.worker.ts", import.meta.url));
                worker.onmessage = (e) => {
                    const { bytes, error } = e.data;
                    if (error) reject(new Error(error));
                    else resolve(bytes);
                    worker.terminate();
                };
                worker.onerror = (e) => {
                    reject(new Error(e.message));
                    worker.terminate();
                };
                worker.postMessage({ employee, payslip: ps, settings, msgId: "hist" });
            });
            const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = globalThis.document.createElement("a");
            link.href = url;
            link.download = `Payslip_${employee.name.replace(/\s+/g, "_")}_${format(new Date(ps.payPeriodStart), "MMM_yyyy")}.pdf`;
            globalThis.document.body.appendChild(link);
            // GA4: fire before browser download
            track("payslip_export", { method: "download_pdf" });
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("PDF generation failed:", e);
            // Ignore non-blocking failure
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)]">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <Link href="/employees">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="font-bold text-base text-[var(--text)] truncate">
                            {employee ? `${employee.name}'s History` : "Payslip History"}
                        </h1>
                        {employee && (
                            <p className="text-xs text-[var(--text-muted)]">{employee.role}</p>
                        )}
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-3">
                {(() => {
                    if (loading) {
                        return (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--focus)]" />
                            </div>
                        );
                    }

                    if (error) {
                        return (
                            <Alert variant="error">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        );
                    }

                    if (visiblePayslips.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in">
                                <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(196,122,28,0.10)" }}>
                                    <Clock className="h-8 w-8" style={{ color: "var(--primary)" }} />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg" style={{ color: "var(--text)" }}>
                                        {archiveResult.hiddenCount > 0 ? "Older payslips are hidden on this plan" : "No payslips yet"}
                                    </p>
                                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                        {archiveResult.hiddenCount > 0
                                            ? "Upgrade to browse the full payslip archive here."
                                            : `Generate a payslip for ${employee?.name} to start building a document archive.`}
                                    </p>
                                </div>
                                {employee && (
                                    <Link href={`/wizard?empId=${employee.id}`}>
                                        <Button className="gap-2 mt-2 bg-[var(--primary)] text-white font-bold">
                                            <FileText className="h-4 w-4" /> Create Payslip
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        );
                    }

                    return (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">
                                {visiblePayslips.length} payslip{visiblePayslips.length !== 1 ? "s" : ""} on record
                            </p>
                            {visiblePayslips.map((ps, i) => {
                                const breakdown = calculatePayslip(ps);
                                return (
                                    <Card
                                        key={ps.id}
                                        className="glass-panel border-none animate-slide-up"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-[var(--text)]">
                                                        {format(new Date(ps.payPeriodStart), "d MMM")} – {format(new Date(ps.payPeriodEnd), "d MMM yyyy")}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-[var(--text-muted)]">
                                                            Gross: <span className="font-semibold text-[var(--text-muted)]">R{breakdown.grossPay.toFixed(2)}</span>
                                                        </span>
                                                        <span className="text-xs text-[var(--text-muted)]">·</span>
                                                        <span className="text-xs text-[var(--text-muted)]">
                                                            Net: <span className="font-bold text-[var(--focus)]">R{breakdown.netPay.toFixed(2)}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Link href={`/preview?payslipId=${ps.id}&empId=${id}`}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs font-bold border-[var(--focus)]/30 text-[var(--focus)]"
                                                        >
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        disabled={downloading === ps.id}
                                                        onClick={() => handleDownload(ps)}
                                                    >
                                                        {downloading === ps.id
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <Download className="h-4 w-4 text-[var(--text-muted)]" />
                                                        }
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            <Alert className="mt-4 bg-[var(--surface-2)] border-[var(--border)]">
                                <AlertDescription className="text-[11px] text-center text-[var(--text-muted)]">
                                    Keep payslip records for at least 3 years. This archive is stored privately on your device.
                                </AlertDescription>
                            </Alert>
                            {archiveResult.hiddenCount > 0 && (
                                <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)]">
                                                {(() => {
                                                    if (!archivePlan) {
                                                        const s = archiveResult.hiddenCount === 1 ? "" : "s";
                                                        return `You have ${archiveResult.hiddenCount} older payslip${s}.`;
                                                    }
                                                    return getArchiveUpgradeMessage(archivePlan.id, archiveResult.hiddenCount, "payslip");
                                                })()}
                                            </p>
                                        </div>
                                        <Link href={archiveUpgradeHref}>
                                            <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{archiveUpgradeLabel}</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </main>
        </div>
    );
}
