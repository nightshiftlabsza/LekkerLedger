"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ArrowRight, Calendar, Lock, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { getPayPeriods, getEmployees } from "@/lib/storage";
import { PayPeriod, Employee } from "@/lib/schema";

export function PayrollClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const employeeIdFilter = searchParams.get("employeeId");

    const [isClient, setIsClient] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [periods, setPeriods] = React.useState<PayPeriod[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);

    React.useEffect(() => {
        setIsClient(true);
        let active = true;
        async function load() {
            try {
                const [p, e] = await Promise.all([getPayPeriods(), getEmployees()]);
                if (!active) return;
                setPeriods(p);
                setEmployees(e);
            } catch (err) {
                console.error("Failed to load payroll data:", err);
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

    const currentPeriod = periods.find(p => p.status === "draft" || p.status === "review");

    let lockedPeriods = periods.filter(p => p.status === "locked");
    if (employeeIdFilter) {
        lockedPeriods = lockedPeriods.filter(p =>
            p.entries.some(e => e.employeeId === employeeIdFilter)
        );
    }
    const filteredEmployee = employeeIdFilter ? employees.find(e => e.id === employeeIdFilter) : null;

    if (!isClient || loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <Button
                        disabled
                        className="gap-1.5 bg-[var(--primary)] text-white font-bold opacity-50 cursor-not-allowed"
                    >
                        <Plus className="h-4 w-4" />
                        Add {format(new Date(), "MMMM yyyy")} Payroll
                    </Button>
                </div>
                <EmptyState
                    icon={Calendar}
                    title="No pay runs yet"
                    description="Create your first pay period to generate domestic-worker payslips."
                    actionLabel="Create first pay period"
                    actionHref="/payroll/new"
                />
            </div>
        );
    }

    const isCurrentMonthFinalized = periods.some(p => p.status === "locked" && p.name === format(new Date(), "MMMM yyyy"));
    const showAddButton = !currentPeriod && !isCurrentMonthFinalized;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                {showAddButton && (
                    <Link href="/payroll/new">
                        <Button
                            className="gap-1.5 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] h-10 px-4 text-sm"
                        >
                            <Plus className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">Add {format(new Date(), "MMMM yyyy")} Payroll</span>
                            <span className="sm:hidden">New Pay Run</span>
                        </Button>
                    </Link>
                )}
            </div>

            {/* Current / active period */}
            {currentPeriod && (
                <Card className="glass-panel border-2 border-[var(--primary)]/30 overflow-hidden">
                    <CardContent className="p-4 sm:p-6 space-y-4">
                        <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl sm:rounded-2xl bg-[var(--primary)] flex items-center justify-center">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="type-h3 text-[var(--text)] truncate">{currentPeriod.name}</h2>
                                    <p className="type-label text-[var(--text-muted)] text-xs">
                                        {format(new Date(currentPeriod.startDate), "d MMM")} — {format(new Date(currentPeriod.endDate), "d MMM yyyy")}
                                    </p>
                                </div>
                            </div>
                            <StatusChip
                                variant={currentPeriod.status === "review" ? "needs-info" : "draft"}
                                label={currentPeriod.status === "review" ? "Needs review" : "In progress"}
                            />
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-[var(--text-muted)]">Household progress</span>
                                <span className="text-[var(--text)]">
                                    {currentPeriod.entries.filter(e => e.status === "complete").length} of {currentPeriod.entries.length} employees done
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                    style={{
                                        width: `${currentPeriod.entries.length > 0
                                            ? (currentPeriod.entries.filter(e => e.status === "complete").length / currentPeriod.entries.length) * 100
                                            : 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <Link href={`/payroll/${currentPeriod.id}`}>
                            <Button className="w-full gap-2 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] h-11 rounded-xl text-sm">
                                <span className="truncate">Open {currentPeriod.name}</span>
                                <ArrowRight className="h-4 w-4 shrink-0" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {periods.length === 0 && (
                <EmptyState
                    icon={Calendar}
                    title="No pay runs yet"
                    description={
                        employees.length === 0
                            ? "Add your first employee to start running payroll."
                            : "Create your first pay period to generate domestic-worker payslips."
                    }
                    actionLabel={employees.length === 0 ? "Add Employee" : "Create first pay period"}
                    actionHref={employees.length === 0 ? "/employees/new" : "/payroll/new"}
                />
            )}

            {/* Finalised months */}
            {lockedPeriods.length > 0 || employeeIdFilter ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="type-overline text-[var(--text-muted)]">Finalised Months</h3>
                        {employeeIdFilter && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/payroll")}
                                className="h-6 gap-1 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            >
                                <X className="h-3 w-3" /> Clear Filter
                            </Button>
                        )}
                    </div>

                    {employeeIdFilter && (
                        <div className="px-1 mb-4">
                            <p className="text-xs text-[var(--text-muted)]">
                                Showing finalised months for <span className="font-bold text-[var(--primary-hover)]">{filteredEmployee?.name || "Employee"}</span>
                            </p>
                        </div>
                    )}

                    {lockedPeriods.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed rounded-2xl">
                            <Lock className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)] opacity-20" />
                            <p className="text-sm font-bold text-[var(--text-muted)]">No finalised months for this employee</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {lockedPeriods.map(period => (
                                <Link key={period.id} href={`/payroll/${period.id}`}>
                                    <Card className="glass-panel border-none hover-lift active:scale-[0.99]">
                                        <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
                                                    <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--text-muted)]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-body-bold text-[var(--text)] truncate">{period.name}</p>
                                                    <p className="type-overline text-[var(--text-muted)] text-[10px]">
                                                        Finalised {period.lockedAt ? format(new Date(period.lockedAt), "d MMM yyyy") : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusChip variant="locked" label="Finalised" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

