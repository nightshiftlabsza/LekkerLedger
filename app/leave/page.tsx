"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft, Loader2, Palmtree, Thermometer, Heart, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployee, getLeaveForEmployee } from "@/lib/storage";
import { Employee, LeaveRecord } from "@/lib/schema";
import { calculateLeaveBalances, LeaveBalances } from "@/lib/leave";

function LeaveCard({
    icon: Icon,
    label,
    accrued,
    taken,
    remaining,
    color,
}: {
    icon: React.ElementType;
    label: string;
    accrued: number;
    taken: number;
    remaining: number;
    color: string;
}) {
    const pct = accrued > 0 ? Math.min(100, (remaining / accrued) * 100) : 0;
    return (
        <Card className="animate-slide-up">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}18` }}
                    >
                        <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {remaining.toFixed(1)} days remaining
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: "var(--bg-subtle)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                </div>

                <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Accrued: {accrued.toFixed(1)}d</span>
                    <span>Taken: {taken.toFixed(1)}d</span>
                </div>
            </CardContent>
        </Card>
    );
}

function LeaveContent() {
    const searchParams = useSearchParams();
    const employeeId = searchParams.get("employeeId") || "";
    const [loading, setLoading] = React.useState(true);
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [balances, setBalances] = React.useState<LeaveBalances | null>(null);
    const [records, setRecords] = React.useState<LeaveRecord[]>([]);

    React.useEffect(() => {
        async function load() {
            if (!employeeId) { setLoading(false); return; }
            const emp = await getEmployee(employeeId);
            setEmployee(emp);
            if (emp) {
                const leaveRecords = await getLeaveForEmployee(employeeId);
                setRecords(leaveRecords);
                const bal = calculateLeaveBalances(emp.startDate || "", leaveRecords);
                setBalances(bal);
            }
            setLoading(false);
        }
        load();
    }, [employeeId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="text-center py-20">
                <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Employee not found</p>
                <Link href="/employees"><Button variant="outline">Back to Employees</Button></Link>
            </div>
        );
    }

    if (!employee.startDate) {
        return (
            <div className="text-center py-20 px-4 space-y-4">
                <CalendarDays className="h-12 w-12 mx-auto" style={{ color: "var(--text-muted)" }} />
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No Start Date Set</p>
                <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                    To calculate leave balances, we need to know when {employee.name} started working.
                    Edit their profile to add a start date.
                </p>
                <Link href="/employees">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Employees
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Employee header */}
            <div className="flex items-center gap-3 mb-2">
                <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: "var(--amber-500)", color: "var(--text-inverse)" }}
                >
                    {employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-bold" style={{ color: "var(--text-primary)" }}>{employee.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Employed since {new Date(employee.startDate).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
            </div>

            {/* Leave balance cards */}
            {balances && (
                <div className="space-y-3">
                    <LeaveCard
                        icon={Palmtree}
                        label="Annual Leave"
                        accrued={balances.annual.accrued}
                        taken={balances.annual.taken}
                        remaining={balances.annual.remaining}
                        color="#c47a1c"
                    />
                    <LeaveCard
                        icon={Thermometer}
                        label="Sick Leave"
                        accrued={balances.sick.accrued}
                        taken={balances.sick.taken}
                        remaining={balances.sick.remaining}
                        color="#3b82f6"
                    />
                    <LeaveCard
                        icon={Heart}
                        label="Family Responsibility"
                        accrued={balances.family.accrued}
                        taken={balances.family.taken}
                        remaining={balances.family.remaining}
                        color="#10b981"
                    />
                </div>
            )}

            {/* Leave history */}
            {records.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                            Leave History
                        </h3>
                        <div className="space-y-2">
                            {records.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between py-2 text-sm"
                                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    r.type === "annual" ? "#c47a1c" :
                                                        r.type === "sick" ? "#3b82f6" : "#10b981",
                                            }}
                                        />
                                        <span style={{ color: "var(--text-primary)" }}>
                                            {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                                        <span>{r.days}d</span>
                                        <span>{new Date(r.date).toLocaleDateString("en-ZA")}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Leave is calculated per BCEA &amp; Sectoral Determination 7.
                Leave taken via the payslip wizard is automatically logged here.
            </p>
        </div>
    );
}

export default function LeavePage() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            <header
                className="sticky top-0 z-30 px-4 py-3"
                style={{
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <SideDrawer />
                    <Link href="/employees">
                        <button
                            aria-label="Back"
                            className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--bg-subtle)]"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Leave Tracker
                    </h1>
                </div>
            </header>
            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
                <React.Suspense
                    fallback={
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
                        </div>
                    }
                >
                    <LeaveContent />
                </React.Suspense>
            </main>
        </div>
    );
}
