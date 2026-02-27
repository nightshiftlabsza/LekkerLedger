"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Users, ChevronRight, RefreshCw, Loader2,
    CalendarDays, DollarSign, Clock, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Lock, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getLatestPayslip, getPayslipsForEmployee, savePayslip, getSettings, saveSettings, getSecureTime } from "@/lib/storage";
import { Employee, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { getHolidaysInRange } from "@/lib/holidays";
import { EmployerSettings } from "@/lib/schema";

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

    React.useEffect(() => {
        async function load() {
            const s = await getSettings();

            // Check trial expiry securely against monotonic world time to prevent local-clock tampering
            if (s.proStatus === "trial" && s.trialExpiry) {
                const nowSecure = await getSecureTime();
                if (nowSecure > new Date(s.trialExpiry)) {
                    const updated = { ...s, proStatus: "free" as const };
                    await saveSettings(updated);
                    setSettings(updated);
                    alert("Your 1-month trial has expired. You've been moved to the Free plan.");
                    load(); // Reload with new status
                    return;
                }
            }

            const employees = await getEmployees();
            const results: EmployeeSummary[] = [];
            for (const emp of employees) {
                const latestPayslip = await getLatestPayslip(emp.id);
                let netPay: number | null = null;
                if (latestPayslip) {
                    const breakdown = calculatePayslip(latestPayslip);
                    netPay = breakdown.netPay;
                }
                results.push({ employee: emp, latestPayslip, netPay });
            }
            setSummaries(results);

            // Monthly breakdown
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            const [allPayslips, currentSettings] = await Promise.all([
                getEmployees().then(emps =>
                    Promise.all(emps.map(e => getPayslipsForEmployee(e.id)))
                ).then(nested => nested.flat()),
                getSettings()
            ]);

            const isFullPro = currentSettings.proStatus === "pro" || currentSettings.proStatus === "trial";
            const isAnnual = currentSettings.proStatus === "annual";
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);

            const filteredPayslips = isFullPro
                ? allPayslips
                : isAnnual
                    ? allPayslips.filter((ps: PayslipInput) => new Date(ps.createdAt) >= oneYearAgo)
                    : allPayslips.filter((ps: PayslipInput) => new Date(ps.createdAt) >= threeMonthsAgo);

            const thisMonthTotal = filteredPayslips
                .filter((ps: PayslipInput) => new Date(ps.payPeriodStart) >= thisMonthStart)
                .reduce((acc: number, ps: PayslipInput) => acc + calculatePayslip(ps).grossPay, 0);

            const lastMonthTotal = filteredPayslips
                .filter((ps: PayslipInput) => {
                    const d = new Date(ps.payPeriodStart);
                    return d >= lastMonthStart && d <= lastMonthEnd;
                })
                .reduce((acc: number, ps: PayslipInput) => acc + calculatePayslip(ps).grossPay, 0);

            const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;

            const allEmps = await getEmployees();
            const summariesItems: EmployeeSummary[] = await Promise.all(
                allEmps.map(async (emp) => {
                    const latest = isFullPro
                        ? await getLatestPayslip(emp.id)
                        : (await getPayslipsForEmployee(emp.id))
                            .filter(ps => {
                                const d = new Date(ps.createdAt);
                                return isAnnual ? d >= oneYearAgo : d >= threeMonthsAgo;
                            })
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

                    let netPay: number | null = null;
                    if (latest) {
                        const breakdown = calculatePayslip(latest);
                        netPay = breakdown.netPay;
                    }
                    return { employee: emp, latestPayslip: latest, netPay };
                })
            );

            setSummaries(summariesItems);
            setStats({ current: thisMonthTotal, previous: lastMonthTotal, percentChange: change });
            setSettings(currentSettings);
            setLoading(false);
        }
        load();
    }, []);

    const totalMonthly = summaries.reduce((sum, s) => sum + (s.netPay ?? 0), 0);
    const employeeCount = summaries.length;

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
            router.refresh();
            // Reload local state
            window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setBulkLoading(false);
        }
    };

    const canBulkRepeat = summaries.filter(s => s.latestPayslip).length > 1 && stats.current === 0;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between glass-panel shadow-[var(--shadow-sm)]"
                style={{
                    borderBottom: "1px solid var(--border-subtle)",
                }}
            >
                <div className="flex items-center gap-3">
                    <SideDrawer />
                    <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Dashboard
                    </h1>
                </div>
                <Link href="/employees">
                    <Button size="sm" variant="outline" className="gap-1.5">
                        <Users className="h-4 w-4" /> Employees
                    </Button>
                </Link>
            </header>

            <div className="px-4 py-2 border-b bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-green-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Compliance Engine Active
                    </span>
                </div>
                <Link href="/rules" className="text-[10px] font-black text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-widest flex items-center gap-1">
                    Legal Rules <ChevronRight className="h-2 w-2" />
                </Link>
            </div>

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
                    </div>
                ) : (
                    <>
                        {/* Lekker Alerts */}
                        {(() => {
                            const now = new Date();
                            const nextWeek = addDays(now, 7);
                            const upcomingHolidays = getHolidaysInRange(now, nextWeek);
                            const isPayrollSeason = now.getDate() >= 25;

                            if (upcomingHolidays.length === 0 && !isPayrollSeason) return null;

                            return (
                                <div className="space-y-2 animate-slide-up">
                                    {upcomingHolidays.map(h => (
                                        <div
                                            key={h.date}
                                            className="px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium"
                                            style={{ backgroundColor: "var(--amber-500)", color: "var(--text-inverse)" }}
                                        >
                                            <CalendarDays className="h-4 w-4" />
                                            <span>
                                                {h.name} is this {format(new Date(h.date), "EEEE")}!
                                            </span>
                                        </div>
                                    ))}
                                    {isPayrollSeason && (
                                        <div
                                            className="px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-3 text-sm font-medium"
                                            style={{ color: "var(--text-primary)" }}
                                        >
                                            <Clock className="h-4 w-4 text-[var(--amber-500)]" />
                                            <span>Payroll window is open for {format(now, "MMMM")}.</span>
                                        </div>
                                    )}
                                    {settings?.proStatus === "free" && (
                                        <Link href="/pricing" className="block">
                                            <div
                                                className="px-4 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] flex items-center justify-between text-[11px] font-bold transition-all hover:bg-amber-500/[0.06] hover:scale-[1.01]"
                                                style={{ color: "var(--amber-800)" }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                                                    </div>
                                                    <span>Free Tier: History visibility limited to 3 months.</span>
                                                </div>
                                                <span className="font-black flex items-center gap-1 uppercase tracking-tighter">Upgrade <ChevronRight className="h-3 w-3" /></span>
                                            </div>
                                        </Link>
                                    )}
                                    {settings?.proStatus === "annual" && (
                                        <Link href="/pricing" className="block">
                                            <div
                                                className="px-4 py-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] flex items-center justify-between text-[11px] font-bold transition-all hover:bg-blue-500/[0.06] hover:scale-[1.01]"
                                                style={{ color: "var(--blue-800)" }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                                                    </div>
                                                    <span>Annual Tier: History visibility limited to 1 year.</span>
                                                </div>
                                                <span className="font-black flex items-center gap-1 uppercase tracking-tighter text-blue-800/80">Go Lifetime <ChevronRight className="h-3 w-3" /></span>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3 animate-slide-up">
                            <Card className="glass-panel hover-lift active-scale">
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <div
                                        className="h-10 w-10 rounded-xl flex items-center justify-center mb-2"
                                        style={{ backgroundColor: "rgba(196,122,28,0.12)" }}
                                    >
                                        <Users className="h-5 w-5" style={{ color: "var(--amber-500)" }} />
                                    </div>
                                    <p className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                                        {employeeCount}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Employee{employeeCount !== 1 ? "s" : ""}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="glass-panel hover-lift active-scale">
                                <CardContent className="p-4 flex flex-col items-start text-left relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">This Month</span>
                                    </div>
                                    <p className="text-2xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
                                        R {stats.current.toFixed(0)}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1">
                                        {stats.percentChange !== null ? (
                                            <>
                                                {stats.percentChange > 0 ? (
                                                    <TrendingUp className="h-3 w-3 text-red-500" />
                                                ) : stats.percentChange < 0 ? (
                                                    <TrendingDown className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <Minus className="h-3 w-3 text-[var(--text-muted)]" />
                                                )}
                                                <span className={`text-[10px] font-bold ${stats.percentChange > 0 ? 'text-red-500' : stats.percentChange < 0 ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                                                    {Math.abs(stats.percentChange).toFixed(0)}%
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] font-bold text-[var(--text-muted)]">New records</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bulk Action Banner */}
                        {summaries.length > 1 && stats.current === 0 && (
                            <Card className={`animate-slide-up glass-panel hover-lift active-scale border-2 ${settings?.proStatus === "free" ? 'border-zinc-200' : 'border-[var(--amber-500)]'}`}>
                                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${settings?.proStatus === "free" ? 'bg-zinc-200' : 'bg-[var(--amber-500)]'}`}>
                                            {settings?.proStatus === "free" ? <Lock className="h-5 w-5 text-zinc-500" /> : <RefreshCw className="h-5 w-5 text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{settings?.proStatus === "free" ? 'Automate Monthly Payroll' : 'Process Monthly Payroll'}</p>
                                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                                {settings?.proStatus === "free"
                                                    ? 'Pro Feature: Repeat last month\'s payslip for everyone instantly.'
                                                    : `Repeat last month's data for all ${employeeCount} employees.`}
                                            </p>
                                        </div>
                                    </div>
                                    {settings?.proStatus === "free" ? (
                                        <Link href="/pricing" className="w-full sm:w-auto">
                                            <Button className="w-full gap-2 bg-zinc-900 hover:bg-zinc-800 text-white">
                                                <Lock className="h-3.5 w-3.5" /> Unlock Feature
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button
                                            onClick={handleBulkRepeat}
                                            disabled={bulkLoading}
                                            className="w-full sm:w-auto gap-2 bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white"
                                        >
                                            {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                            Run {format(new Date(), "MMMM")} Bulk Payroll
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Employee list with repeat */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                    Quick Payroll
                                </h2>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    Repeat last month&apos;s payslip
                                </p>
                            </div>

                            {summaries.length === 0 ? (
                                <Card className="glass-panel hover-lift active-scale">
                                    <CardContent className="p-8 text-center">
                                        <Users className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                                        <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No employees yet</p>
                                        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                                            Add an employee to start generating payslips.
                                        </p>
                                        <Link href="/employees/new">
                                            <Button className="gap-2">
                                                Add Employee <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ) : (
                                summaries.map(({ employee, latestPayslip, netPay }) => (
                                    <Card key={employee.id} className="animate-slide-up glass-panel hover-lift active-scale">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                                                        style={{ backgroundColor: "var(--amber-500)", color: "var(--text-inverse)" }}
                                                    >
                                                        {employee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                                            {employee.name}
                                                        </p>
                                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                            {employee.role} · R{employee.hourlyRate.toFixed(2)}/hr
                                                        </p>
                                                    </div>
                                                </div>
                                                {netPay !== null && (
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                                                            R {netPay.toFixed(2)}
                                                        </p>
                                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>last net</p>
                                                    </div>
                                                )}
                                            </div>

                                            {latestPayslip ? (
                                                <div className="flex items-center gap-2">
                                                    <p className="flex-1 text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        {format(new Date(latestPayslip.payPeriodStart), "d MMM")} –{" "}
                                                        {format(new Date(latestPayslip.payPeriodEnd), "d MMM yyyy")}
                                                    </p>
                                                    {settings?.proStatus === "free" ? (
                                                        <Link href="/pricing">
                                                            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-amber-600 border-amber-200 bg-amber-50">
                                                                <Lock className="h-3 w-3" /> 1-Click Repeat
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="gap-1.5 text-xs"
                                                            onClick={() => handleRepeat(employee.id)}
                                                        >
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                            Repeat
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <Link href={`/wizard?employeeId=${employee.id}`}>
                                                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                                                        Create First Payslip <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
