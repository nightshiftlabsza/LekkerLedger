"use client";

import * as React from "react";
import Link from "next/link";
import { Palmtree, Plus, Clock, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { getAllLeaveRecords, getContractsForEmployee, getCurrentPayPeriod, getEmployees, getSettings, subscribeToDataChanges } from "@/lib/storage";
import { filterRecordsForArchiveWindow, getArchiveUpgradeHref, getArchiveUpgradeLabel, getArchiveUpgradeMessage } from "@/lib/archive";
import { formatLeaveRange, formatLeaveValue, getLeaveAllowanceForType, getLeaveTypeLabel } from "@/lib/leave";
import { Contract, CustomLeaveType, Employee, LeaveRecord, PayPeriod } from "@/lib/schema";
import { canBrowseLeaveHistory, canUseLeaveTracking, getUserPlan } from "@/lib/entitlements";
import { PLANS, type PlanConfig } from "@/config/plans";

export function LeaveClient() {
    const [isClient, setIsClient] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [records, setRecords] = React.useState<LeaveRecord[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [currentPeriod, setCurrentPeriod] = React.useState<PayPeriod | null>(null);
    const [contractsByEmployee, setContractsByEmployee] = React.useState<Record<string, Contract[]>>({});
    const [customLeaveTypes, setCustomLeaveTypes] = React.useState<CustomLeaveType[]>([]);
    const [leaveTrackingEnabled, setLeaveTrackingEnabled] = React.useState(false);
    const [leaveHistoryEnabled, setLeaveHistoryEnabled] = React.useState(true);
    const [plan, setPlan] = React.useState<PlanConfig>(PLANS.free);

    React.useEffect(() => {
        setIsClient(true);
        async function load() {
            try {
                const settings = await getSettings();
                const resolvedPlan = getUserPlan(settings);
                const leaveEnabled = canUseLeaveTracking(resolvedPlan);
                setLeaveTrackingEnabled(leaveEnabled);
                setLeaveHistoryEnabled(canBrowseLeaveHistory(resolvedPlan));
                setPlan(resolvedPlan);
                setCustomLeaveTypes(settings.customLeaveTypes ?? []);

                const [recs, emps, cp] = await Promise.all([
                    getAllLeaveRecords(),
                    getEmployees(),
                    getCurrentPayPeriod(),
                ]);
                const contractPairs = await Promise.all(emps.map(async (employee) => [employee.id, await getContractsForEmployee(employee.id)] as const));
                setRecords(recs.sort((a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime()));
                setEmployees(emps);
                setCurrentPeriod(cp);
                setContractsByEmployee(Object.fromEntries(contractPairs));
            } catch (error) {
                console.error("Failed to load leave records:", error);
            } finally {
                setLoading(false);
            }
        }
        void load();
        return subscribeToDataChanges(load);
    }, []);

    const employeeName = (id: string) => employees.find((employee) => employee.id === id)?.name ?? "Unknown";
    const visibleRecordsResult = React.useMemo(
        () => filterRecordsForArchiveWindow(records, plan, (record) => record.endDate || record.startDate || record.date),
        [plan, records],
    );
    const visibleRecords = visibleRecordsResult.visible;
    const archiveUpgradeHref = getArchiveUpgradeHref(plan.id);
    const archiveUpgradeLabel = getArchiveUpgradeLabel(plan.id);
    const annualTaken = visibleRecords.filter((record) => record.type === "annual").reduce((sum, record) => sum + record.days, 0);
    const selectedEmployee = employees[0];
    const selectedEmployeeRecords = selectedEmployee ? visibleRecords.filter((record) => record.employeeId === selectedEmployee.id) : [];
    const selectedEmployeeContracts = selectedEmployee ? contractsByEmployee[selectedEmployee.id] || [] : [];
    const annualBalance = selectedEmployee
        ? getLeaveAllowanceForType("annual", selectedEmployeeRecords, selectedEmployeeContracts, new Date(), customLeaveTypes, selectedEmployee.startDate)
        : null;

    if (!isClient || loading) {
        return (
            <EmptyState
                icon={Palmtree}
                title="No employees yet"
                description="Add employees first, then track their leave."
                actionLabel="Add employee"
                actionHref="/employees/new"
            />
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
                description="Add employees first, then track their leave."
                actionLabel="Add employee"
                actionHref="/employees/new"
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-panel border-none">
                    <CardContent className="p-6">
                        <p className="text-3xl font-black text-[var(--text)] mb-1">{annualTaken}</p>
                        <p className="type-overline text-[var(--text-muted)]">Annual leave days recorded</p>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-none">
                    <CardContent className="p-6">
                        <p className="text-3xl font-black text-[var(--text)] mb-1">{formatLeaveValue(annualBalance?.remaining ?? 0)}</p>
                        <p className="type-overline text-[var(--text-muted)]">
                            {selectedEmployee ? `${selectedEmployee.name.split(" ")[0]}'s annual days left` : "Annual days remaining"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-none">
                    <CardContent className="p-6">
                        <p className="text-3xl font-black text-[var(--text)] mb-1">{visibleRecords.length}</p>
                        <p className="type-overline text-[var(--text-muted)]">Leave records on file</p>
                    </CardContent>
                </Card>
            </div>

            {!leaveTrackingEnabled && (
                <Card className="border border-[var(--primary)]/20 bg-[var(--primary)]/8 rounded-2xl">
                    <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="type-body-bold text-[var(--text)]">Leave browsing is available, but new leave entries start on Standard.</p>
                            <p className="text-xs text-[var(--text-muted)]">Upgrade when you want dedicated annual, sick, and family leave records.</p>
                        </div>
                        <Link href="/upgrade?plan=standard">
                            <Button size="sm" className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
                                Upgrade to Standard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {currentPeriod && (
                <Card className="border border-[var(--primary)]/20 bg-[var(--primary)]/8 rounded-2xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="type-body-bold text-[var(--text)]">
                                    {currentPeriod.name} payroll is still in progress
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Leave recorded here will flow into this month&apos;s payroll before you finalise it.
                                </p>
                            </div>
                        </div>
                        <Link href={`/payroll/${currentPeriod.id}`}>
                            <Button size="sm" variant="outline" className="h-9 px-4 border-[var(--primary)] text-[var(--primary-hover)] hover:bg-[var(--primary)] hover:text-white transition-all font-bold shrink-0">
                                Open payroll
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div>
                        <h2 className="type-h3 text-[var(--text)]">Leave history</h2>
                        <p className="text-sm text-[var(--text-muted)]">Keep one clean record of annual, sick, and family leave.</p>
                    </div>
                    {leaveTrackingEnabled ? (
                        <Link href="/leave/new">
                            <Button size="sm" className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] h-9">
                                <Plus className="h-4 w-4" /> Add leave
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/upgrade?plan=standard">
                            <Button size="sm" variant="outline" className="gap-2 h-9 font-bold">
                                <Plus className="h-4 w-4" /> Upgrade to add leave
                            </Button>
                        </Link>
                    )}
                </div>

                {visibleRecords.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface-1)]">
                        <p className="text-sm font-bold text-[var(--text-muted)]">
                            {visibleRecordsResult.hiddenCount > 0 ? "Older leave records are hidden on this plan." : "No leave records yet."}
                        </p>
                    </div>
                ) : (
                    <DataTable<LeaveRecord>
                        data={visibleRecords}
                        keyField={(row) => row.id}
                        columns={[
                            {
                                key: "employee",
                                label: "Employee",
                                render: (row) => <span className="type-body-bold text-[var(--text)]">{employeeName(row.employeeId)}</span>,
                            },
                            {
                                key: "type",
                                label: "Type",
                                render: (row) => <span className="type-body text-[var(--text-muted)]">{getLeaveTypeLabel(row.type, customLeaveTypes, row.typeLabel)}</span>,
                            },
                            {
                                key: "range",
                                label: "Dates",
                                render: (row) => (
                                    <div className="flex items-center gap-2 text-[var(--text)]">
                                        <CalendarRange className="h-4 w-4 text-[var(--primary)]" />
                                        <span>{formatLeaveRange(row)}</span>
                                    </div>
                                ),
                            },
                            {
                                key: "days",
                                label: "Days",
                                render: (row) => <span className="type-mono font-bold text-[var(--text)]">{row.days}d</span>,
                            },
                            {
                                key: "note",
                                label: "Notes",
                                render: (row) => <span className="type-body text-[var(--text-muted)]">{row.note || "-"}</span>,
                            },
                        ]}
                    />
                )}

                {visibleRecordsResult.hiddenCount > 0 && (
                    <Card className="border border-[var(--primary)]/20 bg-[var(--primary)]/8 rounded-2xl">
                        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="type-body-bold text-[var(--text)]">{getArchiveUpgradeMessage(plan.id, visibleRecordsResult.hiddenCount, "leave record")}</p>
                            </div>
                            <Link href={archiveUpgradeHref}>
                                <Button size="sm" className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
                                    {archiveUpgradeLabel}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
