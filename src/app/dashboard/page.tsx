"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Plus, Clock, Users, ArrowRight, AlertTriangle, Lock,
    Palmtree, Download, ChevronRight, Loader2, CalendarDays,
    Banknote, RefreshCw, CloudOff, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getLatestPayslip, getPayslipsForEmployee, savePayslip, getSettings, saveSettings, getSecureTime } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format, addDays } from "date-fns";
import { getHolidaysInRange } from "@/lib/holidays";
import { usePWAInstall } from "@/src/app/hooks/usePWAInstall";
import { useOnlineStatus } from "@/src/app/hooks/useOnlineStatus";
import { BulkRunModal } from "@/components/bulk-run-modal";

// Thresholds that unlock advanced features
const ADVANCED_EMPLOYEE_COUNT = 3;   // 3+ employees → show payroll trend chart
const SKILLS_DEV_LEVY_THRESHOLD = 500_000; // R500k annual payroll → SDL applies (SARS requirement)

interface EmployeeSummary {
    employee: Employee;
    latestPayslip: PayslipInput | null;
    netPay: number | null;
}

interface MonthlyBucket {
    label: string;
    total: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [summaries, setSummaries] = React.useState<EmployeeSummary[]>([]);
    const [thisMonthTotal, setThisMonthTotal] = React.useState(0);
    const [annualEstimate, setAnnualEstimate] = React.useState(0);
    const [monthlyBuckets, setMonthlyBuckets] = React.useState<MonthlyBucket[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false);
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

            let currentMonthTotal = 0;

            const bucketMap = new Map<string, number>();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                bucketMap.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
            }

            for (const emp of employees) {
                const latest = await getLatestPayslip(emp.id);
                const allPayslips = await getPayslipsForEmployee(emp.id);

                let netPay: number | null = null;
                if (latest) {
                    netPay = calculatePayslip(latest).netPay;
                }

                const monthPayslips = allPayslips.filter(ps => new Date(ps.payPeriodStart) >= thisMonthStart);
                currentMonthTotal += monthPayslips.reduce((acc, ps) => acc + calculatePayslip(ps).grossPay, 0);

                for (const ps of allPayslips) {
                    const d = new Date(ps.payPeriodStart);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (bucketMap.has(key)) {
                        bucketMap.set(key, (bucketMap.get(key) || 0) + calculatePayslip(ps).grossPay);
                    }
                }

                results.push({ employee: emp, latestPayslip: latest, netPay });
            }

            const buckets: MonthlyBucket[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                buckets.push({ label: format(d, "MMM"), total: bucketMap.get(key) || 0 });
            }

            setSummaries(results);
            setThisMonthTotal(currentMonthTotal);
            setAnnualEstimate(currentMonthTotal * 12); // rough SDL trigger estimate
            setMonthlyBuckets(buckets);
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

    const handleConfirmBulk = async (selectedEmpIds: string[]) => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        try {
            for (const s of summaries) {
                if (selectedEmpIds.includes(s.employee.id) && s.latestPayslip) {
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
        }
    };

    // Computed flags for conditional feature visibility
    const employeeCount = summaries.length;
    const showAdvancedStats = employeeCount >= ADVANCED_EMPLOYEE_COUNT;
    const showSDLWarning = annualEstimate >= SKILLS_DEV_LEVY_THRESHOLD;
    const showBulkRun = employeeCount > 1 && summaries.some(s => s.latestPayslip);
    const showChart = showAdvancedStats && monthlyBuckets.some(b => b.total > 0);

    // Upcoming holidays (always show — immediately useful)
    const now = new Date();
    const nextWeek = addDays(now, 7);
    const upcomingHolidays = getHolidaysInRange(now, nextWeek);

    return (
        <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
            <header className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between glass-panel border-b border-[var(--border-subtle)]">
                <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/brand/logo-light.png" alt="LekkerLedger" width={80} height={24} className="h-6 w-auto block dark:hidden" />
                            <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={80} height={24} className="h-6 w-auto hidden dark:block" />
                            <span className="font-black text-xs uppercase tracking-widest pt-0.5 text-[var(--text-primary)]">Dashboard</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">

                        <Link href="/employees/new">
                            <Button size="sm" className="gap-1.5 h-8 bg-amber-500 text-white font-bold hover:bg-amber-600">
                                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Employee</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                ) : (
                    <>
                        {/* Holiday alerts — always visible, immediately useful */}
                        {upcomingHolidays.map(h => (
                            <div key={h.date} className="px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold bg-amber-500 text-white shadow-sm">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span>{h.name} is this {format(new Date(h.date), "EEEE")} — check leave records.</span>
                            </div>
                        ))}

                        {/* SDL warning — only shown when annual payroll estimate exceeds R500k */}
                        {showSDLWarning && (
                            <div className="px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold border border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>Your estimated annual payroll exceeds R500 000 — Skills Development Levy (SDL) may apply. <Link href="/rules" className="underline font-bold">Learn more</Link></span>
                            </div>
                        )}

                        {/* Employee list — this is THE primary action */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
                                    {employeeCount === 0 ? "Get Started" : `Your Employees (${employeeCount})`}
                                </h2>
                                {employeeCount > 0 && (
                                    <Link href="/employees/new">
                                        <Button size="sm" variant="ghost" className="text-xs font-bold text-amber-500">
                                            Add New <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {employeeCount === 0 ? (
                                <Card className="glass-panel border-dashed border-2 p-12 text-center overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--amber-500)]/5 to-transparent pointer-events-none" />
                                    <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-[var(--amber-500)]/10 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-[var(--amber-500)]/20 blur-xl rounded-full" />
                                        <Users className="h-10 w-10 text-[var(--amber-500)] relative z-10" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-2 tracking-tight">No employees yet</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-[250px] mx-auto leading-relaxed">Add your first employee to start generating legally compliant payslips in seconds.</p>
                                    <Link href="/employees/new">
                                        <Button className="h-12 px-6 rounded-xl bg-[var(--amber-500)] text-white font-bold hover:bg-[var(--amber-600)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all">
                                            <Plus className="h-5 w-5 mr-2" /> Add First Employee
                                        </Button>
                                    </Link>
                                </Card>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {summaries.map((summary) => (
                                        <Card key={summary.employee.id} className="glass-panel border-none hover-lift">
                                            <CardContent className="p-5 flex flex-col h-full">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-lg">
                                                        {summary.employee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[var(--text-primary)]">{summary.employee.name}</p>
                                                        <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{summary.employee.role || "Worker"}</p>
                                                    </div>
                                                </div>

                                                {summary.latestPayslip ? (
                                                    <div className="mb-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                                                        <div>
                                                            <span className="text-[var(--text-muted)] uppercase font-black block">Last Net Pay</span>
                                                            <span className="text-[var(--text-primary)] font-mono text-sm">
                                                                {summary.netPay !== null ? `R${summary.netPay.toFixed(2)}` : "—"}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[var(--text-muted)] uppercase font-black block">Period</span>
                                                            <span className="text-[var(--text-secondary)]">
                                                                {format(new Date(summary.latestPayslip.payPeriodStart), "MMM yyyy")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mb-4 pt-3 border-t border-[var(--border-subtle)]">
                                                        <p className="text-xs text-[var(--text-muted)]">No payslips yet</p>
                                                    </div>
                                                )}

                                                <div className="mt-auto flex items-center gap-2">
                                                    {summary.latestPayslip ? (
                                                        <>
                                                            <Link href={`/employees/${summary.employee.id}/history`} className="flex-1">
                                                                <Button size="sm" variant="ghost" className="w-full text-xs font-bold gap-1.5 hover:bg-amber-500/10 hover:text-amber-500">
                                                                    <Clock className="h-3.5 w-3.5" /> History
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/leave?employeeId=${summary.employee.id}`} className="flex-1">
                                                                <Button size="sm" variant="ghost" className="w-full text-xs font-bold gap-1.5 hover:bg-amber-500/10 hover:text-amber-500">
                                                                    <Palmtree className="h-3.5 w-3.5" /> Leave
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600"
                                                                onClick={() => handleRepeat(summary.employee.id)}
                                                            >
                                                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> New Payslip
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Link href={`/wizard?empId=${summary.employee.id}`} className="flex-1">
                                                            <Button size="sm" className="w-full bg-amber-500 text-white font-bold hover:bg-amber-600">
                                                                Create First Payslip <ArrowRight className="h-3.5 w-3.5 ml-2" />
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

                        {/* Bulk month run — only shown when 2+ employees have existing payslips */}
                        {showBulkRun && thisMonthTotal === 0 && (
                            <Card className={`glass-panel border-2 ${settings?.proStatus === "free" ? 'border-zinc-200 dark:border-zinc-700' : 'border-amber-500/40'}`}>
                                <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${settings?.proStatus === "free" ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-amber-500'}`}>
                                            {settings?.proStatus === "free" ? <Lock className="h-6 w-6 text-zinc-400" /> : <RefreshCw className="h-6 w-6 text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-[var(--text-primary)]">Run {format(new Date(), "MMMM")} Payroll</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Repeat last month&apos;s payslips for all {employeeCount} employees at once.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={settings?.proStatus === "free" ? () => router.push('/pricing') : () => setIsBulkModalOpen(true)}
                                        className="w-full sm:w-auto h-10 gap-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        {settings?.proStatus === "free" ? "Upgrade to Automate" : "Run Bulk"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Advanced stats — only shown when 3+ employees */}
                        {showAdvancedStats && (
                            <div className="space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">
                                    This Month&apos;s Payroll
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="glass-panel border-none">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <Users className="h-5 w-5 mb-2 text-amber-500" />
                                            <p className="text-xl font-black text-[var(--text-primary)]">{employeeCount}</p>
                                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Employees</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-panel border-none">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <Banknote className="h-5 w-5 mb-2 text-amber-500" />
                                            <p className="text-xl font-black tabular-nums text-[var(--text-primary)]">R{thisMonthTotal.toFixed(0)}</p>
                                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Gross This Month</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Trend chart — only shown when 3+ employees AND chart has data */}
                        {showChart && (
                            <div className="space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">6-Month Trend</h2>
                                <Card className="glass-panel border-none p-4 h-36 flex items-end justify-between gap-1.5 overflow-hidden">
                                    {(() => {
                                        const maxVal = Math.max(...monthlyBuckets.map(b => b.total), 1);
                                        return monthlyBuckets.map((bucket, i) => {
                                            const h = bucket.total > 0 ? Math.max(12, (bucket.total / maxVal) * 85) : 6;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${bucket.total > 0 ? 'bg-amber-500/25 group-hover:bg-amber-500' : 'bg-[var(--border-subtle)]'}`}
                                                        style={{ height: `${h}%` }}
                                                    />
                                                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                                                        {bucket.label}
                                                    </span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </Card>
                            </div>
                        )}

                        {/* Compliance footer — subtle, not a banner */}
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] px-1 pt-2 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>SARS-compliant payslips</span>
                            </div>
                            <Link href="/rules" className="font-bold hover:text-amber-600 flex items-center gap-0.5">
                                Tax Rules <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </>
                )}
            </main>

            {/* PWA install prompt */}
            {isInstallable && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
                    <Button
                        onClick={installApp}
                        className="rounded-full h-14 w-14 shadow-[var(--shadow-xl)] bg-[var(--amber-500)] hover:bg-[var(--amber-600)] border-[3px] border-[var(--bg-base)] flex items-center justify-center p-0 transition-transform active:scale-95"
                    >
                        <Download className="h-6 w-6 text-white" />
                    </Button>
                </div>
            )}
            <BulkRunModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                summaries={summaries}
                onConfirm={handleConfirmBulk}
            />
        </div>
    );
}
