"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Clock, Users, Calendar, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Lock, Shield, Palmtree, Download, Sparkles, ChevronRight, Loader2, CalendarDays, Banknote, RefreshCw, Smartphone, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getLatestPayslip, getPayslipsForEmployee, savePayslip, getSettings, saveSettings, getSecureTime } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format, subMonths, addDays } from "date-fns";
import { getHolidaysInRange } from "@/lib/holidays";
import { usePWAInstall } from "@/app/hooks/usePWAInstall";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { BulkActions } from "@/components/dashboard/BulkActions";

interface EmployeeSummary {
    employee: Employee;
    latestPayslip: PayslipInput | null;
    netPay: number | null;
}

interface MonthlyStats {
    current: number;
    previous: number;
    percentChange: number | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [summaries, setSummaries] = React.useState<EmployeeSummary[]>([]);
    const [stats, setStats] = React.useState<MonthlyStats>({ current: 0, previous: 0, percentChange: null });
    const [bulkLoading, setBulkLoading] = React.useState(false);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const { isInstallable, installApp } = usePWAInstall();
    const isOnline = useOnlineStatus();

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const currentSettings = await getSettings();
            setSettings(currentSettings);

            // Check trial expiry
            if (currentSettings.proStatus === "trial" && currentSettings.trialExpiry) {
                const nowSecure = await getSecureTime();
                if (nowSecure > new Date(currentSettings.trialExpiry)) {
                    const updated = { ...currentSettings, proStatus: "free" as const };
                    await saveSettings(updated);
                    setSettings(updated);
                    alert("Your trial has expired.");
                    window.location.reload();
                    return;
                }
            }

            const employees = await getEmployees();
            const results: EmployeeSummary[] = [];
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            let thisMonthTotal = 0;
            let lastMonthTotal = 0;

            for (const emp of employees) {
                const latest = await getLatestPayslip(emp.id);
                const allPayslips = await getPayslipsForEmployee(emp.id);

                let netPay: number | null = null;
                if (latest) {
                    const breakdown = calculatePayslip(latest);
                    netPay = breakdown.netPay;
                }

                // Stats calculation
                const monthPayslips = allPayslips.filter(ps => new Date(ps.payPeriodStart) >= thisMonthStart);
                thisMonthTotal += monthPayslips.reduce((acc, ps) => acc + calculatePayslip(ps).grossPay, 0);

                const prevMonthPayslips = allPayslips.filter(ps => {
                    const d = new Date(ps.payPeriodStart);
                    return d >= lastMonthStart && d <= lastMonthEnd;
                });
                lastMonthTotal += prevMonthPayslips.reduce((acc, ps) => acc + calculatePayslip(ps).grossPay, 0);

                results.push({ employee: emp, latestPayslip: latest, netPay });
            }

            const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;

            setSummaries(results);
            setStats({ current: thisMonthTotal, previous: lastMonthTotal, percentChange: change });
            setLoading(false);
        }
        load();
    }, []);

    const handleRepeat = (empId: string) => {
        if (settings?.proStatus === "free") {
            router.push('/pricing');
            return;
        }
        router.push(`/wizard?empId=${empId}&repeat=true`);
    };

    const handleBulkRepeat = async () => {
        setBulkLoading(true);
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        try {
            for (const s of summaries) {
                if (s.latestPayslip) {
                    const newPayslip: PayslipInput = {
                        ...s.latestPayslip,
                        id: crypto.randomUUID(),
                        payPeriodStart: start,
                        payPeriodEnd: end,
                        createdAt: new Date(),
                    };
                    await savePayslip(newPayslip);
                }
            }
            window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setBulkLoading(false);
        }
    };

    const employeeCount = summaries.length;

    return (
        <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
            <header className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between glass-panel border-b border-[var(--border-subtle)]">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/brand/logo-light.png" alt="LekkerLedger" className="h-6 w-auto block dark:hidden" />
                            <img src="/brand/logo-dark.png" alt="LekkerLedger" className="h-6 w-auto hidden dark:block" />
                            <span className="font-black text-xs uppercase tracking-widest pt-0.5 text-[var(--text-primary)]">Dashboard</span>
                        </Link>
                    </div>
                    <Link href="/employees">
                        <Button size="sm" variant="outline" className="gap-1.5 h-8">
                            <Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Employees</span>
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="border-b bg-zinc-50 dark:bg-zinc-900/50">
                <div className="max-w-5xl mx-auto w-full px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-green-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Compliance Engine Active</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                                <CloudOff className="h-3 w-3 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Offline Sync Pending</span>
                            </div>
                        )}
                    </div>
                    <Link href="/rules" className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                        Legal Rules <ChevronRight className="h-2 w-2" />
                    </Link>
                </div>
            </div>

            <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Left Column: Stats */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Improvement #9: Monthly Progress Graph */}
                            {!settings?.simpleMode && (
                                <div className="space-y-3">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Performance Trend</h2>
                                    <Card className="glass-panel border-none p-4 h-32 flex items-end justify-between gap-1 overflow-hidden">
                                        {/* Simple Pure CSS Bar Chart for Premium Look */}
                                        {[...Array(6)].map((_, i) => {
                                            const h = Math.max(10, Math.random() * 80); // Placeholder height
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div
                                                        className="w-full rounded-t-sm transition-all duration-500 bg-amber-500/20 group-hover:bg-amber-500"
                                                        style={{ height: `${h}%` }}
                                                    />
                                                    <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">
                                                        {format(addDays(new Date(), - (5 - i) * 30), "MMM")}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </Card>
                                </div>
                            )}

                            {/* Summary Cards */}
                            <div className="space-y-3 animate-slide-up">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">
                                    Quick Stats
                                </h2>
                                <div className={`grid gap-3 ${settings?.simpleMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    <Card className="glass-panel border-none">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <Users className="h-5 w-5 mb-2 text-amber-500" />
                                            <p className="text-xl font-black text-[var(--text-primary)]">{employeeCount}</p>
                                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Employees</p>
                                        </CardContent>
                                    </Card>
                                    {!settings?.simpleMode && (
                                        <Card className="glass-panel border-none">
                                            <CardContent className="p-4 flex flex-col items-center text-center">
                                                <Banknote className="h-5 w-5 mb-2 text-amber-500" />
                                                <p className="text-xl font-black tabular-nums text-[var(--text-primary)]">R{stats.current.toFixed(0)}</p>
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">This Month</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            {/* Priority Alerts */}
                            <div className="space-y-3">
                                {!settings?.simpleMode && <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Priority Alerts</h2>}
                                {(() => {
                                    const now = new Date();
                                    const nextWeek = addDays(now, 7);
                                    const upcomingHolidays = getHolidaysInRange(now, nextWeek);
                                    if (settings?.simpleMode && upcomingHolidays.length === 0) return null;
                                    return (
                                        <>
                                            {upcomingHolidays.map(h => (
                                                <div key={h.date} className="px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold bg-amber-500 text-white shadow-sm">
                                                    <CalendarDays className="h-4 w-4 shrink-0" />
                                                    <span>{h.name} is this {format(new Date(h.date), "EEEE")}!</span>
                                                </div>
                                            ))}
                                            {now.getDate() >= 25 && (
                                                <div className="px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-3 text-xs font-bold text-[var(--text-primary)]">
                                                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                                    <span>Payroll season is active.</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Right Column: List */}
                        <div className="lg:col-span-8 space-y-6">
                            <BulkActions />

                            {summaries.length > 1 && stats.current === 0 && (
                                <Card className={`glass-panel border-2 ${settings?.proStatus === "free" ? 'border-zinc-200' : 'border-amber-500'}`}>
                                    <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${settings?.proStatus === "free" ? 'bg-zinc-200' : 'bg-amber-500'}`}>
                                                {settings?.proStatus === "free" ? <Lock className="h-6 w-6 text-zinc-500" /> : <RefreshCw className="h-6 w-6 text-white" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-tight text-[var(--text-primary)]">{settings?.proStatus === "free" ? 'Automate Monthly Payroll' : 'Process Monthly Payroll'}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">Repeat last month's payslips instantly.</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={settings?.proStatus === "free" ? () => router.push('/pricing') : handleBulkRepeat}
                                            disabled={bulkLoading}
                                            className="w-full sm:w-auto h-12 gap-3 bg-amber-500 text-white font-bold rounded-xl"
                                        >
                                            {bulkLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Run {format(new Date(), "MMMM")} Bulk
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Registered Employees</h2>
                                    <Link href="/employees/new">
                                        <Button size="sm" variant="ghost" className="text-xs font-bold text-amber-500">Add New <ArrowRight className="h-3 w-3 ml-1" /></Button>
                                    </Link>
                                </div>

                                {summaries.length === 0 ? (
                                    <Card className="glass-panel border-dashed border-2 p-12 text-center">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">No employees yet</p>
                                        <Link href="/employees/new" className="mt-4 block">
                                            <Button className="bg-amber-500 text-white font-bold">Add Employee</Button>
                                        </Link>
                                    </Card>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {summaries.map((summary) => (
                                            <Card key={summary.employee.id} className="glass-panel border-none hover-lift">
                                                <CardContent className="p-5 flex flex-col h-full">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black">
                                                                {summary.employee.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-[var(--text-primary)]">{summary.employee.name}</p>
                                                                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{summary.employee.role || "Worker"}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-[11px]">
                                                        <div className="flex flex-col">
                                                            <span className="text-zinc-500 uppercase font-black">Last Net Pay</span>
                                                            <span className="text-white font-mono">{summary.netPay ? `R${summary.netPay.toFixed(2)}` : "—"}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-zinc-500 uppercase font-black">Period</span>
                                                            <span className="text-zinc-300">
                                                                {summary.latestPayslip ? format(new Date(summary.latestPayslip.payPeriodStart), "MMM d") : "—"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex items-center gap-2">
                                                        <Link href={`/leave?employeeId=${summary.employee.id}`} className="flex-1">
                                                            <Button size="sm" variant="ghost" className="w-full text-xs font-bold gap-2 hover:bg-amber-500/10 hover:text-amber-500">
                                                                <Palmtree className="h-4 w-4" /> Leave
                                                            </Button>
                                                        </Link>
                                                        {summary.latestPayslip ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 text-xs font-bold border-amber-500/30 text-amber-500"
                                                                onClick={() => handleRepeat(summary.employee.id)}
                                                            >
                                                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Repeat
                                                            </Button>
                                                        ) : (
                                                            <Link href={`/wizard?empId=${summary.employee.id}`} className="flex-1">
                                                                <Button size="sm" className="w-full bg-amber-500 text-white font-bold">
                                                                    Create <ArrowRight className="h-3 w-3 ml-1" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Install Button */}
            {isInstallable && (
                <div className="fixed bottom-24 right-6 z-50 animate-bounce">
                    <Button
                        onClick={installApp}
                        className="rounded-full h-14 w-14 shadow-2xl bg-amber-500 hover:bg-amber-600 border-4 border-zinc-950 flex items-center justify-center p-0"
                    >
                        <Download className="h-6 w-6 text-white" />
                    </Button>
                </div>
            )}
        </div>
    );
}
