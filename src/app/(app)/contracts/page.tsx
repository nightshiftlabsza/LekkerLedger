"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Plus, ChevronRight, Clock, FileBadge, Palmtree } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusChip, type ChipVariant } from "@/components/ui/status-chip";
import { getContracts, getEmployees } from "@/lib/storage";
import { Contract, Employee } from "@/lib/schema";
import { format } from "date-fns";

export default function ContractsPage() {
    const [loading, setLoading] = React.useState(true);
    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);

    React.useEffect(() => {
        async function load() {
            const [c, e] = await Promise.all([getContracts(), getEmployees()]);
            setContracts(c);
            setEmployees(e);
            setLoading(false);
        }
        load();
    }, []);

    const empName = (id: string) => employees.find(e => e.id === id)?.name ?? "Unknown";

    const getContractStatusVariant = (status: string): ChipVariant => {
        if (status === "active") return "complete";
        if (status === "replaced") return "needs-info"; // using this as a "muted/old" state
        return "draft";
    };

    if (loading) return null; // Or skeleton

    return (
        <div className="space-y-6">
            <PageHeader
                title="Contracts"
                subtitle="Manage employment agreements and BCEA compliance"
                actions={
                    employees.length > 0 && (
                        <Link href="/contracts/new">
                            <Button className="gap-2 bg-[var(--amber-500)] text-white hover:bg-[var(--amber-600)] font-bold">
                                <Plus className="h-4 w-4" /> New Contract
                            </Button>
                        </Link>
                    )
                }
            />

            {contracts.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No contracts yet"
                    description="Generate your first BCEA-compliant employment contract for a domestic worker."
                    actionLabel={employees.length > 0 ? "Generate Contract" : "Add Employee First"}
                    actionHref={employees.length > 0 ? "/contracts/new" : "/employees/new"}
                />
            ) : (
                <DataTable<Contract>
                    data={contracts}
                    keyField={(c) => c.id}
                    columns={[
                        {
                            key: "employee",
                            label: "Employee",
                            render: (c) => (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-[var(--amber-100)] flex items-center justify-center text-[10px] font-black text-[var(--amber-700)]">
                                        {empName(c.employeeId).substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="type-body-bold text-[var(--text-primary)]">{empName(c.employeeId)}</span>
                                </div>
                            )
                        },
                        {
                            key: "role",
                            label: "Job Title",
                            render: (c) => <span className="type-body text-[var(--text-secondary)]">{c.jobTitle}</span>
                        },
                        {
                            key: "version",
                            label: "Version",
                            render: (c) => <span className="type-mono text-[var(--text-muted)] text-xs">v{c.version}</span>
                        },
                        {
                            key: "status",
                            label: "Status",
                            align: "right",
                            render: (c) => <StatusChip variant={getContractStatusVariant(c.status)} label={c.status.toUpperCase()} />
                        },
                        {
                            key: "actions",
                            label: "",
                            align: "right",
                            render: (c) => (
                                <Link href={`/contracts/${c.id}`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--amber-600)]">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )
                        }
                    ]}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="glass-panel border-none">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <FileBadge className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">BCEA Compliant</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Templates follow Sectoral Determination 7 guidelines.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-none">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">Version Control</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Keep track of changes and signed agreements over time.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-none">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                            <Palmtree className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">Auto-sync Leave</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Contracts define entitlements that feed into payroll.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
