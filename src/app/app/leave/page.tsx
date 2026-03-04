"use client";

import * as React from "react";
import Link from "next/link";
import { Palmtree, Plus, Calendar, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getAllLeaveRecords, getEmployees, getCurrentPayPeriod } from "@/lib/storage";
import { LeaveRecord, Employee, PayPeriod } from "@/lib/schema";

export default function LeavePage() {
    const [loading, setLoading] = React.useState(true);
    const [records, setRecords] = React.useState<LeaveRecord[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [currentPeriod, setCurrentPeriod] = React.useState<PayPeriod | null>(null);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const [recs, emps, cp] = await Promise.all([
                getAllLeaveRecords(),
                getEmployees(),
                getCurrentPayPeriod()
            ]);
            setRecords(recs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setEmployees(emps);
            setCurrentPeriod(cp);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <><PageHeader title="Leave" /><CardSkeleton /><CardSkeleton /></>;
    }

    const empName = (id: string) => employees.find(e => e.id === id)?.name ?? "Unknown";

    // Summary stats
    const annualTotal = records.filter(r => r.type === "annual").reduce((s, r) => s + r.days, 0);
    const sickTotal = records.filter(r => r.type === "sick").reduce((s, r) => s + r.days, 0);

    return (
        <>
            <PageHeader title="Leave" subtitle="Track annual and sick leave across employees" />

            {employees.length === 0 ? (
                <EmptyState
                    icon={Palmtree}
                    title="No employees yet"
                    description="Add employees first, then track their leave."
                    actionLabel="Add Employee"
                    actionHref="/app/employees/new"
                />
            ) : (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="glass-panel border-none overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                <Palmtree className="h-12 w-12 text-[var(--amber-500)]" />
                            </div>
                            <CardContent className="p-6">
                                <p className="text-3xl font-black text-[var(--text-primary)] mb-1">{annualTotal}</p>
                                <p className="type-overline text-[var(--text-muted)] flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" /> Annual Days Taken
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="glass-panel border-none overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                <Palmtree className="h-12 w-12 text-[var(--amber-500)]" />
                            </div>
                            <CardContent className="p-6">
                                <p className="text-3xl font-black text-[var(--text-primary)] mb-1">{sickTotal}</p>
                                <p className="type-overline text-[var(--text-muted)] flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" /> Sick Days Taken
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {currentPeriod && (
                        <Card className="bg-[var(--amber-500)] /10 border border-[var(--amber-500)] /20 rounded-2xl">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[var(--amber-500)] flex items-center justify-center shrink-0">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="type-body-bold text-[var(--text-primary)]">
                                            Payroll for {currentPeriod.name} is {currentPeriod.status}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            New leave records for this month will auto-populate into your payroll drafts.
                                        </p>
                                    </div>
                                </div>
                                <Link href={`/app/payroll/${currentPeriod.id}`}>
                                    <Button size="sm" variant="outline" className="h-9 px-4 border-[var(--amber-500)] text-[var(--amber-600)] hover:bg-[var(--amber-500)] hover:text-white transition-all font-bold">
                                        View Payroll
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="type-h3 text-[var(--text-primary)]">Recent Records</h2>
                            <Link href="/app/leave/new">
                                <Button size="sm" className="gap-2 bg-[var(--amber-500)] text-white hover:bg-[var(--amber-600)] h-9">
                                    <Plus className="h-4 w-4" /> Add Leave
                                </Button>
                            </Link>
                        </div>

                        <DataTable<LeaveRecord>
                            data={records}
                            keyField={(row) => row.id}
                            columns={[
                                {
                                    key: "employee",
                                    label: "Employee",
                                    render: (row) => (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] font-black text-[var(--text-secondary)]">
                                                {empName(row.employeeId).substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="type-body-bold text-[var(--text-primary)]">{empName(row.employeeId)}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: "type",
                                    label: "Type",
                                    render: (row) => (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${row.type === 'annual' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {row.type}
                                        </span>
                                    )
                                },
                                {
                                    key: "days",
                                    label: "Days",
                                    render: (row) => <span className="type-mono font-bold text-[var(--text-primary)]">{row.days}d</span>
                                },
                                {
                                    key: "date",
                                    label: "Date",
                                    render: (row) => <span className="type-body text-[var(--text-secondary)]">{format(new Date(row.date), "dd MMM yyyy")}</span>
                                },
                                {
                                    key: "actions",
                                    label: "",
                                    align: "right",
                                    render: (row) => (
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--amber-600)]">
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    )
                                }
                            ]}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
