"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Users, ChevronRight, RefreshCw, Loader2,
    CalendarDays, DollarSign, Clock, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getLatestPayslip } from "@/lib/storage";
import { Employee, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";
import { format } from "date-fns";

interface EmployeeSummary {
    employee: Employee;
    lastPayslip: PayslipInput | null;
    netPay: number | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [summaries, setSummaries] = React.useState<EmployeeSummary[]>([]);

    React.useEffect(() => {
        async function load() {
            const employees = await getEmployees();
            const results: EmployeeSummary[] = [];
            for (const emp of employees) {
                const lastPayslip = await getLatestPayslip(emp.id);
                let netPay: number | null = null;
                if (lastPayslip) {
                    const breakdown = calculatePayslip(lastPayslip);
                    netPay = breakdown.netPay;
                }
                results.push({ employee: emp, lastPayslip, netPay });
            }
            setSummaries(results);
            setLoading(false);
        }
        load();
    }, []);

    const totalMonthly = summaries.reduce((sum, s) => sum + (s.netPay ?? 0), 0);
    const employeeCount = summaries.length;

    const handleRepeat = (empId: string) => {
        router.push(`/wizard?employeeId=${empId}&repeat=true`);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
                style={{
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
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

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3 animate-slide-up">
                            <Card>
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
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <div
                                        className="h-10 w-10 rounded-xl flex items-center justify-center mb-2"
                                        style={{ backgroundColor: "rgba(196,122,28,0.12)" }}
                                    >
                                        <DollarSign className="h-5 w-5" style={{ color: "var(--amber-500)" }} />
                                    </div>
                                    <p className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                                        R {totalMonthly.toFixed(0)}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Last Payroll Total
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

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
                                <Card>
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
                                summaries.map(({ employee, lastPayslip, netPay }) => (
                                    <Card key={employee.id} className="animate-slide-up">
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

                                            {lastPayslip ? (
                                                <div className="flex items-center gap-2">
                                                    <p className="flex-1 text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        {format(new Date(lastPayslip.payPeriodStart), "d MMM")} –{" "}
                                                        {format(new Date(lastPayslip.payPeriodEnd), "d MMM yyyy")}
                                                    </p>
                                                    <Button
                                                        size="sm"
                                                        className="gap-1.5 text-xs"
                                                        onClick={() => handleRepeat(employee.id)}
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                        Repeat
                                                    </Button>
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
