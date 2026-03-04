"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip, type ChipVariant } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getEmployees } from "@/lib/storage";
import { Employee } from "@/lib/schema";

function getCompleteness(emp: Employee): ChipVariant {
    if (!emp.idNumber || !emp.startDate) return "needs-info";
    return "complete";
}

export default function EmployeesPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [search, setSearch] = React.useState("");

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const emps = await getEmployees();
            setEmployees(emps);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = search
        ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
        : employees;

    if (loading) {
        return (
            <>
                <PageHeader title="Employees" />
                <div className="space-y-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Employees"
                subtitle={`${employees.length} active employee${employees.length !== 1 ? "s" : ""}`}
                actions={
                    <Link href="/app/employees/new">
                        <Button className="gap-1.5 bg-[var(--amber-500)] text-white font-bold hover:bg-[var(--amber-600)]">
                            <Plus className="h-4 w-4" /> Add Employee
                        </Button>
                    </Link>
                }
            />

            {employees.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No employees yet"
                    description="Add your first domestic worker to get started with payroll."
                    actionLabel="Add Employee"
                    actionHref="/app/employees/new"
                />
            ) : (
                <div className="grid-cols-12-desktop gap-6 space-y-6 lg:space-y-0">
                    <div className="col-span-9-desktop space-y-4">
                        {/* Search bar */}
                        {employees.length > 0 && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                                />
                            </div>
                        )}

                        {/* Employee list */}
                        <DataTable<Employee>
                            data={filtered}
                            keyField={(emp) => emp.id}
                            onRowClick={(emp) => router.push(`/app/employees/${emp.id}`)}
                            columns={[
                                {
                                    key: "name",
                                    label: "Employee",
                                    render: (emp) => (
                                        <div className="flex items-center gap-3 py-1">
                                            <div className="hidden sm:flex h-10 w-10 rounded-xl bg-[var(--amber-500)] items-center justify-center text-white font-black shrink-0">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="type-body-bold text-[var(--text-primary)]">{emp.name}</p>
                                                <p className="type-label text-[var(--text-secondary)] lg:hidden">{emp.role}</p>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: "role",
                                    label: "Role",
                                    className: "hidden lg:table-cell",
                                    render: (emp) => <span className="type-body text-[var(--text-primary)]">{emp.role}</span>,
                                },
                                {
                                    key: "rate",
                                    label: "Rate",
                                    className: "hidden lg:table-cell",
                                    render: (emp) => <span className="type-body font-mono text-[var(--text-primary)]">R{emp.hourlyRate.toFixed(2)}/hr</span>,
                                },
                                {
                                    key: "status",
                                    label: "Status",
                                    align: "right",
                                    render: (emp) => <StatusChip variant={getCompleteness(emp)} />,
                                },
                            ]}
                        />

                        {filtered.length === 0 && search && (
                            <p className="text-center type-body text-[var(--text-muted)] py-8">
                                No employees matching &ldquo;{search}&rdquo;
                            </p>
                        )}
                    </div>

                    {/* Summary Sidebar (Desktop Only) */}
                    <div className="hidden lg:block col-span-3-desktop space-y-4">
                        <Card className="glass-panel border-none p-5">
                            <h3 className="type-overline text-[var(--text-muted)] mb-3">Workforce Summary</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">{employees.length}</p>
                                    <p className="text-[10px] uppercase font-black text-[var(--text-muted)]">Active Workers</p>
                                </div>
                                <div className="pt-4 border-t border-[var(--border-subtle)]">
                                    <p className="text-lg font-bold text-[var(--amber-500)]">
                                        {employees.filter(e => getCompleteness(e) === "needs-info").length}
                                    </p>
                                    <p className="text-[10px] uppercase font-black text-[var(--text-muted)]">Needs Info</p>
                                </div>
                                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed italic">
                                    Compliance records are verified using SD7 schedules for 2026.
                                </p>
                            </div>
                        </Card>

                        <Link href="/app/help/compliance">
                            <Button variant="outline" className="w-full justify-between h-12 rounded-xl text-xs font-bold border-dashed">
                                BCEA Compliance Guide
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
