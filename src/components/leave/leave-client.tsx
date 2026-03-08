"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, ArrowRight, Loader2, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { FiltersBar, type FilterChip } from "@/components/ui/filters-bar";
import { StatusChip } from "@/components/ui/status-chip";
import { PLANS, type PlanConfig } from "@/config/plans";
import { filterRecordsForArchiveWindow, getArchiveUpgradeHref, getArchiveUpgradeLabel, getArchiveUpgradeMessage } from "@/lib/archive";
import { canBrowseLeaveHistory, canUseLeaveTracking, getUserPlan } from "@/lib/entitlements";
import { calculateAnnualLeaveSummary, formatLeaveRange, formatLeaveValue, getCarryOverNudge, getLeaveTypeLabel } from "@/lib/leave";
import { Contract, CustomLeaveType, Employee, LeaveRecord } from "@/lib/schema";
import { getAllLeaveRecords, getContractsForEmployee, getEmployees, getSettings, subscribeToDataChanges } from "@/lib/storage";

type LeaveStatus = "needs-attention" | "ok";

type EmployeeLeaveSummary = {
    employee: Employee;
    availableNow: number;
    usedThisCycle: number;
    carryOver: number;
    status: LeaveStatus;
    statusText: string;
    currentCycleLabel: string;
};

export function LeaveClient() {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [records, setRecords] = React.useState<LeaveRecord[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [contractsByEmployee, setContractsByEmployee] = React.useState<Record<string, Contract[]>>({});
    const [customLeaveTypes, setCustomLeaveTypes] = React.useState<CustomLeaveType[]>([]);
    const [leaveTrackingEnabled, setLeaveTrackingEnabled] = React.useState(false);
    const [leaveHistoryEnabled, setLeaveHistoryEnabled] = React.useState(true);
    const [plan, setPlan] = React.useState<PlanConfig>(PLANS.free);
    const [search, setSearch] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState<"all" | "needs-attention" | "ok">("all");

    React.useEffect(() => {
        let active = true;

        async function load() {
            if (!active) return;
            setLoading(true);
            setError(null);
            try {
                const settings = await getSettings();
                const resolvedPlan = getUserPlan(settings);
                const leaveEnabled = canUseLeaveTracking(resolvedPlan);
                setLeaveTrackingEnabled(leaveEnabled);
                setLeaveHistoryEnabled(canBrowseLeaveHistory(resolvedPlan));
                setPlan(resolvedPlan);
                setCustomLeaveTypes(settings.customLeaveTypes ?? []);

                const [recordRows, employeeRows] = await Promise.all([
                    getAllLeaveRecords(),
                    getEmployees(),
                ]);
                const contractPairs = await Promise.all(
                    employeeRows.map(async (employee) => [employee.id, await getContractsForEmployee(employee.id)] as const),
                );

                if (!active) return;
                setRecords(recordRows.sort((a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime()));
                setEmployees(employeeRows);
                setContractsByEmployee(Object.fromEntries(contractPairs));
            } catch (loadError) {
                console.error("Failed to load leave hub", loadError);
                if (active) {
                    setError("We could not load leave data right now.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void load();
        const unsubscribe = subscribeToDataChanges(load);
        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const visibleRecordsResult = React.useMemo(
        () => filterRecordsForArchiveWindow(records, plan, (record) => record.endDate || record.startDate || record.date),
        [plan, records],
    );

    const employeeSummaries = React.useMemo<EmployeeLeaveSummary[]>(() => {
        return employees.map((employee) => {
            const employeeRecords = records.filter((record) => record.employeeId === employee.id);
            const employeeContracts = contractsByEmployee[employee.id] ?? [];
            const annualSummary = employee.startDate
                ? calculateAnnualLeaveSummary(employee.startDate, employeeRecords, employeeContracts, new Date())
                : null;

            const availableNow = annualSummary?.totalRemainingAvailable ?? 0;
            const usedThisCycle = annualSummary?.usedInCurrentCycle ?? 0;
            const carryOver = annualSummary?.remainingCarryOver ?? 0;
            const carryOverNudge = annualSummary ? getCarryOverNudge(annualSummary.carryOvers, new Date()) : null;

            let status: LeaveStatus = "ok";
            let statusText = "On track";

            if (!employee.startDate) {
                status = "needs-attention";
                statusText = "Start date missing";
            } else if (carryOverNudge) {
                status = "needs-attention";
                statusText = "Carry-over review";
            } else if (availableNow <= 2) {
                status = "needs-attention";
                statusText = "Low balance";
            }

            return {
                employee,
                availableNow,
                usedThisCycle,
                carryOver,
                status,
                statusText,
                currentCycleLabel: annualSummary?.currentCycle
                    ? `${format(annualSummary.currentCycle.start, "dd MMM yyyy")} to ${format(annualSummary.currentCycle.end, "dd MMM yyyy")}`
                    : "Cycle unavailable",
            };
        });
    }, [contractsByEmployee, employees, records]);

    const filterChips: FilterChip[] = React.useMemo(() => {
        const attentionCount = employeeSummaries.filter((item) => item.status === "needs-attention").length;
        const okCount = employeeSummaries.filter((item) => item.status === "ok").length;
        return [
            { key: "all", label: `All (${employeeSummaries.length})`, active: activeFilter === "all" },
            { key: "needs-attention", label: `Needs attention (${attentionCount})`, active: activeFilter === "needs-attention" },
            { key: "ok", label: `On track (${okCount})`, active: activeFilter === "ok" },
        ];
    }, [activeFilter, employeeSummaries]);

    const filteredSummaries = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        return employeeSummaries.filter((item) => {
            if (activeFilter !== "all" && item.status !== activeFilter) return false;
            if (!query) return true;
            return (
                item.employee.name.toLowerCase().includes(query)
                || (item.employee.role || "").toLowerCase().includes(query)
            );
        });
    }, [activeFilter, employeeSummaries, search]);

    const primaryTarget = filteredSummaries[0] ?? employeeSummaries[0] ?? null;
    const archiveUpgradeHref = getArchiveUpgradeHref(plan.id);
    const archiveUpgradeLabel = getArchiveUpgradeLabel(plan.id);

    if (loading) {
        return (
            <Card className="border border-[var(--border)] bg-[var(--surface-1)]">
                <CardContent className="flex items-center gap-3 p-6 text-[var(--text-muted)]">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                    Loading leave overview...
                </CardContent>
            </Card>
        );
    }

    if (!leaveHistoryEnabled) {
        return (
            <FeatureGateCard
                title="Leave history is not available right now"
                description="Reconnect your records or upgrade to browse leave history alongside payroll."
            />
        );
    }

    if (employees.length === 0) {
        return (
            <EmptyState
                icon={Palmtree}
                title="No employees yet"
                description="Add an employee first, then monitor leave across your household."
                actionLabel="Add employee"
                actionHref="/employees/new"
            />
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border border-[var(--border)] bg-[var(--surface-1)]">
                <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">
                                Use this page to monitor balances across employees. For edits, open the employee leave record.
                            </p>
                            {error ? (
                                <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
                            ) : null}
                        </div>
                        {primaryTarget ? (
                            <Link href={`/employees/${primaryTarget.employee.id}?tab=leave`}>
                                <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
                                    Open employee leave record <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        ) : null}
                    </div>

                    <FiltersBar
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search employees"
                        filters={filterChips}
                        onFilterToggle={(key) => setActiveFilter(key as "all" | "needs-attention" | "ok")}
                    />
                </CardContent>
            </Card>

            {filteredSummaries.length === 0 ? (
                <Card className="border border-[var(--border)] bg-[var(--surface-1)]">
                    <CardContent className="p-8 text-center">
                        <p className="text-sm font-bold text-[var(--text)]">No employees match this filter</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">Try a different search or switch filters.</p>
                    </CardContent>
                </Card>
            ) : (
                <DataTable<EmployeeLeaveSummary>
                    data={filteredSummaries}
                    keyField={(row) => row.employee.id}
                    columns={[
                        {
                            key: "employee",
                            label: "Employee",
                            render: (row) => (
                                <div>
                                    <p className="text-sm font-bold text-[var(--text)]">{row.employee.name}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{row.currentCycleLabel}</p>
                                </div>
                            ),
                        },
                        {
                            key: "available",
                            label: "Available now",
                            render: (row) => <span className="font-black text-[var(--text)]">{formatLeaveValue(row.availableNow)}d</span>,
                        },
                        {
                            key: "used",
                            label: "Used this cycle",
                            render: (row) => <span className="text-[var(--text)]">{formatLeaveValue(row.usedThisCycle)}d</span>,
                        },
                        {
                            key: "carry-over",
                            label: "Carry-over",
                            render: (row) => <span className="text-[var(--text)]">{formatLeaveValue(row.carryOver)}d</span>,
                        },
                        {
                            key: "status",
                            label: "Status",
                            render: (row) => (
                                <StatusChip
                                    variant={row.status === "needs-attention" ? "needs-info" : "complete"}
                                    label={row.statusText}
                                />
                            ),
                        },
                        {
                            key: "actions",
                            label: "",
                            align: "right",
                            render: (row) => (
                                <div className="flex items-center justify-end gap-2">
                                    <Link href={`/employees/${row.employee.id}?tab=leave`}>
                                        <Button size="sm" variant="outline">Open</Button>
                                    </Link>
                                    {leaveTrackingEnabled ? (
                                        <Link href={`/employees/${row.employee.id}/leave/new`}>
                                            <Button size="sm" className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Record leave</Button>
                                        </Link>
                                    ) : (
                                        <Link href="/upgrade?plan=standard">
                                            <Button size="sm" variant="outline">Upgrade</Button>
                                        </Link>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                    renderCard={(row) => (
                        <Card className="border border-[var(--border)] bg-[var(--surface-1)]">
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text)]">{row.employee.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{row.currentCycleLabel}</p>
                                    </div>
                                    <StatusChip variant={row.status === "needs-attention" ? "needs-info" : "complete"} label={row.statusText} />
                                </div>

                                <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/35 p-3 text-center">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Available</p>
                                        <p className="text-sm font-black text-[var(--text)]">{formatLeaveValue(row.availableNow)}d</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Used</p>
                                        <p className="text-sm font-black text-[var(--text)]">{formatLeaveValue(row.usedThisCycle)}d</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Carry-over</p>
                                        <p className="text-sm font-black text-[var(--text)]">{formatLeaveValue(row.carryOver)}d</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/employees/${row.employee.id}?tab=leave`} className="flex-1">
                                        <Button variant="outline" className="w-full">Open record</Button>
                                    </Link>
                                    {leaveTrackingEnabled ? (
                                        <Link href={`/employees/${row.employee.id}/leave/new`} className="flex-1">
                                            <Button className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Record leave</Button>
                                        </Link>
                                    ) : (
                                        <Link href="/upgrade?plan=standard" className="flex-1">
                                            <Button variant="outline" className="w-full">Upgrade</Button>
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                />
            )}

            {visibleRecordsResult.visible.length > 0 ? (
                <Card className="border border-[var(--border)] bg-[var(--surface-1)]">
                    <CardContent className="space-y-3 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Recent activity</p>
                        {visibleRecordsResult.visible.slice(0, 6).map((record) => {
                            const employeeName = employees.find((employee) => employee.id === record.employeeId)?.name ?? "Unknown employee";
                            return (
                                <div key={record.id} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/35 px-3 py-2">
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text)]">{employeeName}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {getLeaveTypeLabel(record.type, customLeaveTypes, record.typeLabel)} - {formatLeaveRange(record)}
                                        </p>
                                    </div>
                                    <p className="text-xs font-bold text-[var(--text)]">{formatLeaveValue(record.days)}d</p>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ) : null}

            {!leaveTrackingEnabled ? (
                <Card className="border border-[var(--primary)]/20 bg-[var(--primary)]/8">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-[var(--text)]">Recording new leave entries starts on Standard.</p>
                            <p className="text-xs text-[var(--text-muted)]">You can still monitor leave history here.</p>
                        </div>
                        <Link href="/upgrade?plan=standard">
                            <Button size="sm" className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Upgrade</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : null}

            {visibleRecordsResult.hiddenCount > 0 ? (
                <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
                            <p className="text-sm font-bold text-[var(--text)]">
                                {getArchiveUpgradeMessage(plan.id, visibleRecordsResult.hiddenCount, "leave record")}
                            </p>
                        </div>
                        <Link href={archiveUpgradeHref}>
                            <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{archiveUpgradeLabel}</Button>
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

