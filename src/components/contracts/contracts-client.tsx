"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusChip, type ChipVariant } from "@/components/ui/status-chip";
import { getContracts, getEmployees } from "@/lib/storage";
import { Contract, Employee } from "@/lib/schema";
import { CardSkeleton } from "@/components/ui/loading-skeleton";

export function ContractsClient() {
    const [isClient, setIsClient] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);

    React.useEffect(() => {
        setIsClient(true);
        async function load() {
            try {
                const [c, e] = await Promise.all([getContracts(), getEmployees()]);
                setContracts(c);
                setEmployees(e);
            } catch (err) {
                console.error("Failed to load contracts:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const empName = (id: string) => employees.find(e => e.id === id)?.name ?? "Unknown";

    const getContractStatusVariant = (status: string): ChipVariant => {
        if (status === "active") return "complete";
        if (status === "replaced") return "needs-info"; // using this as a "muted/old" state
        return "draft";
    };

    if (!isClient || loading) {
        return (
            <EmptyState
                icon={FileText}
                title="Loading contracts..."
                description="Fetching your employment agreements."
                actionLabel="Generate Contract"
                actionHref="/contracts/new"
            />
        );
    }

    if (contracts.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="No contracts yet"
                description="Generate your first BCEA-compliant employment contract for a domestic worker."
                actionLabel={employees.length > 0 ? "Generate Contract" : "Add Employee First"}
                actionHref={employees.length > 0 ? "/contracts/new" : "/employees/new"}
            />
        );
    }

    return (
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
                            <span className="type-body-bold text-[var(--text)]">{empName(c.employeeId)}</span>
                        </div>
                    )
                },
                {
                    key: "role",
                    label: "Job Title",
                    render: (c) => <span className="type-body text-[var(--text-muted)]">{c.jobTitle}</span>
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--primary-hover)]">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    )
                }
            ]}
        />
    );
}
