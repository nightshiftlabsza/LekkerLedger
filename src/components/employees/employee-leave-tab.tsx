"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarRange, Lock, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { filterRecordsForArchiveWindow, getArchiveUpgradeHref, getArchiveUpgradeLabel, getArchiveUpgradeMessage } from "@/lib/archive";
import { canUseLeaveTracking } from "@/lib/entitlements";
import { calculateAnnualLeaveSummary, formatLeaveRange, formatLeaveValue, getCarryOverNudge, getLeaveAllowanceForType, getLeaveTypeLabel } from "@/lib/leave";
import { Contract, CustomLeaveType, Employee, LeaveCarryOver, LeaveRecord } from "@/lib/schema";
import type { PlanConfig } from "@/config/plans";

type EmployeeLeaveTabProps = {
    variant?: "default" | "embedded";
    employee: Employee;
    leaveRecords: LeaveRecord[];
    leaveCarryOvers: LeaveCarryOver[];
    contracts: Contract[];
    customLeaveTypes: CustomLeaveType[];
    currentPlan: PlanConfig;
    advancedLeaveEnabled: boolean;
};

function SupportingMetric({ label, value, cardClass }: { label: string; value: string; cardClass: string }) {
    return (
        <Card className={cardClass}>
            <CardContent className="p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[var(--text)]">{value}</p>
            </CardContent>
        </Card>
    );
}

export function EmployeeLeaveTab({
    employee,
    leaveRecords,
    leaveCarryOvers,
    contracts,
    customLeaveTypes,
    currentPlan,
    advancedLeaveEnabled,
    variant = "default",
}: EmployeeLeaveTabProps) {
    const leaveArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(leaveRecords, currentPlan, (record) => record.endDate || record.startDate || record.date),
        [currentPlan, leaveRecords],
    );

    const visibleLeaveRecords = React.useMemo(
        () => [...leaveArchiveResult.visible].sort((a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime()),
        [leaveArchiveResult.visible],
    );

    const annualSummary = employee.startDate
        ? calculateAnnualLeaveSummary(employee.startDate, leaveRecords, contracts, new Date())
        : null;

    const annualBalance = getLeaveAllowanceForType("annual", leaveRecords, contracts, new Date(), customLeaveTypes, employee.startDate);
    const availableNow = annualSummary?.totalRemainingAvailable ?? annualBalance.remaining;
    const entitlementThisCycle = annualSummary?.currentCycleAllowance ?? annualBalance.allowance;
    const usedThisCycle = annualSummary?.usedInCurrentCycle ?? annualBalance.used;
    const carryOverRemaining = annualSummary?.remainingCarryOver ?? annualBalance.carryOverRemaining ?? 0;

    const carryOverBuckets = leaveCarryOvers.length > 0 ? leaveCarryOvers : annualSummary?.carryOvers ?? [];
    const visibleCarryOvers = carryOverBuckets.filter((carryOver) => Math.max(carryOver.daysCarried - carryOver.daysUsedFromCarry, 0) > 0);
    const carryOverNudge = getCarryOverNudge(carryOverBuckets, new Date());

    const archiveUpgradeHref = getArchiveUpgradeHref(currentPlan.id);
    const cardClass = variant === "embedded"
        ? "rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        : "border border-[var(--border)] bg-[var(--surface-1)]";
    const archiveUpgradeLabel = getArchiveUpgradeLabel(currentPlan.id);

    return (
        <div className="space-y-4">
            <Card className={cardClass}>
                <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Available now</p>
                            <p className="mt-2 text-4xl font-black tracking-tight text-[var(--text)]">{formatLeaveValue(availableNow)} days</p>
                            <p className="mt-2 text-sm text-[var(--text-muted)]">Annual leave available for {employee.name} right now.</p>
                            {annualSummary?.currentCycle ? (
                                <p className="mt-2 text-xs text-[var(--text-muted)]">
                                    Current cycle: {format(annualSummary.currentCycle.start, "dd MMM yyyy")} to {format(annualSummary.currentCycle.end, "dd MMM yyyy")}
                                </p>
                            ) : (
                                <p className="mt-2 text-xs text-[var(--text-muted)]">Add a start date on the profile to calculate leave cycle boundaries.</p>
                            )}
                        </div>

                        <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[220px]">
                            {canUseLeaveTracking(currentPlan) ? (
                                <Link href={`/employees/${employee.id}/leave/new`}>
                                    <Button className="w-full gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
                                        <Palmtree className="h-4 w-4" /> Record leave
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/upgrade?plan=standard">
                                    <Button className="w-full gap-2" variant="outline">
                                        <Lock className="h-4 w-4" /> Upgrade to record leave
                                    </Button>
                                </Link>
                            )}
                            <Link href="/leave">
                                <Button className="w-full" variant="outline">Open leave overview</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <SupportingMetric label="Entitlement this cycle" value={formatLeaveValue(entitlementThisCycle)} cardClass={cardClass} />
                        <SupportingMetric label="Used this cycle" value={formatLeaveValue(usedThisCycle)} cardClass={cardClass} />
                        <SupportingMetric label="Carry-over" value={formatLeaveValue(carryOverRemaining)} cardClass={cardClass} />
                    </div>
                </CardContent>
            </Card>

            {advancedLeaveEnabled ? (
                <Card className={cardClass}>
                    <CardContent className="space-y-3 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Carry-over detail</p>
                        {visibleCarryOvers.length > 0 ? (
                            visibleCarryOvers.map((carryOver) => {
                                const remaining = Math.max(carryOver.daysCarried - carryOver.daysUsedFromCarry, 0);
                                return (
                                    <div key={carryOver.fromCycleEnd} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/45 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)]">From cycle ending {format(new Date(carryOver.fromCycleEnd), "dd MMM yyyy")}</p>
                                            <p className="text-xs text-[var(--text-muted)]">Used first when new annual leave is recorded.</p>
                                        </div>
                                        <p className="text-sm font-black text-[var(--text)]">{formatLeaveValue(remaining)} days</p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-[var(--text-muted)]">No carry-over days are currently on record.</p>
                        )}
                        {carryOverNudge ? (
                            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/45 px-3 py-2 text-xs text-[var(--text-muted)]">
                                Review carry-over from {format(new Date(carryOverNudge.carryOver.fromCycleEnd), "dd MMM yyyy")}. Remaining: {formatLeaveValue(carryOverNudge.remainingDays)} days.
                            </p>
                        ) : null}
                    </CardContent>
                </Card>
            ) : null}

            <Card className={cardClass}>
                <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Leave records</p>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">Audit trail of leave entries for this employee.</p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text)]">{visibleLeaveRecords.length}</p>
                    </div>

                    {visibleLeaveRecords.length > 0 ? (
                        <div className="space-y-2">
                            {visibleLeaveRecords.map((record) => (
                                <div key={record.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/35 px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)]">
                                                {getLeaveTypeLabel(record.type, customLeaveTypes, record.typeLabel)}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">{formatLeaveRange(record)}{record.note ? ` - ${record.note}` : ""}</p>
                                        </div>
                                        <p className="text-sm font-black text-[var(--text)]">{formatLeaveValue(record.days)}d</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/25 px-4 py-8 text-center">
                            <CalendarRange className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
                            <p className="mt-3 text-sm font-bold text-[var(--text)]">
                                {leaveArchiveResult.hiddenCount > 0 ? "Older leave records are hidden on this plan" : "No leave records yet"}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                {leaveArchiveResult.hiddenCount > 0 ? "Upgrade to view the full leave history for this employee." : "Record the first leave entry to start the audit trail."}
                            </p>
                            {canUseLeaveTracking(currentPlan) ? (
                                <Link href={`/employees/${employee.id}/leave/new`} className="mt-4 inline-flex">
                                    <Button size="sm" className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
                                        <Palmtree className="h-4 w-4" /> Record leave
                                    </Button>
                                </Link>
                            ) : null}
                        </div>
                    )}
                </CardContent>
            </Card>

            {leaveArchiveResult.hiddenCount > 0 ? (
                <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-[var(--text)]">{getArchiveUpgradeMessage(currentPlan.id, leaveArchiveResult.hiddenCount, "leave record")}</p>
                        </div>
                        <Link href={archiveUpgradeHref}>
                            <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{archiveUpgradeLabel}</Button>
                        </Link>
                    </div>
                </div>
            ) : null}

            <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
                Leave records are for practical tracking and payroll support. For legal interpretation, consult official guidance or a qualified adviser.
            </p>
        </div>
    );
}



