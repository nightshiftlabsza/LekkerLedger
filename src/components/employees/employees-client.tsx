"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Search, Mail, Phone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { getEmployees } from "@/lib/storage";
import { Employee } from "@/lib/schema";
import { CardSkeleton } from "@/components/ui/loading-skeleton";

export function EmployeesClient() {
    const [isClient, setIsClient] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        setIsClient(true);
        async function load() {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (err) {
                console.error("Failed to load employees:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Initial server render and pre-hydration: Show real Empty State as the default shell design
    if (!isClient || loading) {
        return (
            <div className="ultrawide-grid grid-cols-12-desktop gap-6 space-y-6 lg:space-y-0">
                <div className="ultrawide-main col-span-8-desktop">
                    <EmptyState
                        icon={Users}
                        title="No employees yet"
                        description="Add your first employee to start managing payroll and leave."
                        actionLabel="Add Employee"
                        actionHref="/employees/new"
                    />
                </div>
                <div className="ultrawide-panel col-span-4-desktop space-y-6">
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="ultrawide-grid grid-cols-12-desktop gap-6 space-y-6 lg:space-y-0">
            {/* Main Content Area */}
            <div className="ultrawide-main col-span-8-desktop">
                {employees.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No employees yet"
                        description="Add your first employee to start managing payroll and leave."
                        actionLabel="Add Employee"
                        actionHref="/employees/new"
                    />
                ) : (
                    <DataTable<Employee>
                        data={filteredEmployees}
                        keyField={(emp) => emp.id}
                        columns={[
                            {
                                key: "name",
                                label: "Name",
                                render: (emp) => (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[var(--amber-100)] flex items-center justify-center text-xs font-black text-[var(--amber-700)]">
                                            {emp.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <div className="type-body-bold text-[var(--text)] leading-tight block">{emp.name}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mt-0.5 block">{emp.role || "Domestic Worker"}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: "contact",
                                label: "Contact",
                                render: (emp) => (
                                    <div className="space-y-1">
                                        {emp.phone && (
                                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                                <Phone className="h-3 w-3" /> {emp.phone}
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: "status",
                                label: "Status",
                                render: () => <StatusChip variant="complete" label="ACTIVE" />
                            },
                            {
                                key: "actions",
                                label: "",
                                align: "right",
                                render: (emp) => (
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/employees/${emp.id}`}>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-[var(--text-muted)] hover:text-[var(--primary-hover)]">
                                                <ChevronRight className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                )
                            }
                        ]}
                    />
                )}
            </div>

            {/* Sidebar Panel - Ultrawide optimized */}
            <div className="ultrawide-panel col-span-4-desktop space-y-6">
                <Card className="glass-panel border-none sticky top-24">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1">Search & Filter</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <Input
                                    placeholder="Find employee..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[var(--border)] space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)] font-medium">Total Active</span>
                                <span className="font-bold text-[var(--text)]">{employees.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)] font-medium">Compliance Check</span>
                                <StatusChip variant="complete" label="ALL GOOD" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-none opacity-80">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-[var(--text)]">Compliance Tip</p>
                            <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">Ensure all employees have a signed contract and valid ID on record for BCEA compliance.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
