"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Search, Phone, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getEmployees } from "@/lib/storage";
import { Employee } from "@/lib/schema";
import { CardSkeleton } from "@/components/ui/loading-skeleton";

export function EmployeesClient() {
    const router = useRouter();
    const SEARCH_VISIBILITY_THRESHOLD = 10;
    const [isClient, setIsClient] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        setIsClient(true);
        let active = true;
        async function load() {
            try {
                const data = await getEmployees();
                if (!active) return;
                setEmployees(data);
            } catch (err) {
                console.error("Failed to load employees:", err);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        load();
        return () => {
            active = false;
        };
    }, []);

    const showSearch = employees.length > SEARCH_VISIBILITY_THRESHOLD;
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const filteredEmployees = !showSearch || normalizedSearchQuery.length === 0
        ? employees
        : employees.filter(emp =>
            emp.name.toLowerCase().includes(normalizedSearchQuery) ||
            emp.role?.toLowerCase().includes(normalizedSearchQuery)
        );

    // Initial server render and pre-hydration: Show real Empty State as the default shell design
    if (!isClient || loading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Employees"
                    subtitle="Manage your household team and employment records"
                />
                <div className="adaptive-app-grid">
                    <div className="adaptive-main">
                        <Card className="glass-panel border-none shadow-[var(--shadow-1)]">
                            <CardContent className="space-y-5 p-6 md:p-8">
                                <div className="flex items-start gap-4">
                                    <div className="rounded-2xl bg-[var(--surface-2)] p-3 text-[var(--primary)]">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-[var(--text)]" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 600, lineHeight: 1.2 }}>Loading employee records</h2>
                                        <p className="type-body text-[var(--text-muted)] max-w-[60ch]">
                                            Your employee list loads in the browser because these records stay on this device by default.
                                            If this screen does not finish loading, refresh the page or add a worker manually.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row pt-2">
                                    <Link href="/employees/new">
                                        <Button className="font-bold px-6">Add employee</Button>
                                    </Link>
                                    <Link href="/dashboard">
                                        <Button variant="outline" className="font-bold px-6">Back to dashboard</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="adaptive-rail">
                        <CardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Employees"
                subtitle="Manage your household team and employment records"
                actions={employees.length > 0 && (
                    <Link href="/employees/new">
                        <Button className="bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] h-10 px-4 text-sm">
                            Add employee
                        </Button>
                    </Link>
                )}
            />
            
            <div className="adaptive-app-grid">
                {/* Main Content Area */}
                <div className="adaptive-main">
                    {employees.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No employees yet"
                            description="Add your first employee to start managing payroll and leave."
                            actionLabel="Add Employee"
                            actionHref="/employees/new"
                        />
                    ) : (
                        <div className="space-y-6">
                            {/* Mobile-only Search (if needed) */}
                            {showSearch && (
                                <div className="block lg:hidden">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                        <Input
                                            placeholder="Search employees..."
                                            className="pl-10 h-12 bg-[var(--surface-1)]"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <DataTable<Employee>
                                data={filteredEmployees}
                                keyField={(emp) => emp.id}
                                onRowClick={(emp) => router.push(`/employees/${emp.id}`)}
                                columns={[
                                    {
                                        key: "name",
                                        label: "Name",
                                        render: (emp) => (
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col text-left min-w-0">
                                                    <span className="type-body-bold text-[var(--text)] truncate">{emp.name}</span>
                                                    <span className="type-overline text-[var(--text-muted)] text-[9px] mt-0.5">{emp.role || "Domestic Worker"}</span>
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
                                                        <Phone className="h-3.5 w-3.5" />
                                                        <span className="font-medium">{emp.phone}</span>
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
                                            <div className="flex items-center justify-end">
                                                <Link href={`/employees/${emp.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-subtle)] transition-colors">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        )
                                    }
                                ]}
                                renderCard={(emp) => (
                                    <Link href={`/employees/${emp.id}`} className="block">
                                        <Card className="glass-panel hover-lift border-none overflow-hidden transition-all duration-200 active:scale-[0.99]">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center font-black text-[var(--primary)] text-base">
                                                            {emp.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="type-body-bold text-[var(--text)] truncate">{emp.name}</span>
                                                            <span className="type-overline text-[var(--text-muted)] text-[10px] mt-0.5">{emp.role || "Domestic Worker"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <StatusChip variant="complete" label="ACTIVE" className="scale-90" />
                                                        <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                                                    </div>
                                                </div>
                                                {emp.phone && (
                                                    <div className="mt-3 pt-3 border-t border-[var(--border)]/30 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        <span className="text-xs">{emp.phone}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                )}
                            />
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}

