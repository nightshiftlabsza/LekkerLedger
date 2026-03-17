"use client";

import * as React from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { AlertTriangle, ArrowLeft, CalendarRange, Check, Loader2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useUnsavedChanges } from "@/app/hooks/use-unsaved-changes";
import { canUseAdvancedLeaveFeatures, getUserPlan } from "@/lib/entitlements";
import {
    calculateAnnualLeaveSummary,
    estimateLeaveDays,
    formatLeaveValue,
    getLeaveAllowanceForType,
    getLeaveTypeLabel,
    hasManualAnnualLeaveBalance,
} from "@/lib/leave";
import { Contract, CustomLeaveType, Employee, LeaveRecord } from "@/lib/schema";
import { getContractsForEmployee, getEmployees, getLeaveForEmployee, getSettings, saveLeaveRecord } from "@/lib/storage";

type LeaveFormData = {
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    note: string;
    allowOverrun: boolean;
};

type RecordLeaveFormProps = {
    initialEmployeeId?: string;
    lockEmployee?: boolean;
    backHref: string;
    onSavedHref: string;
    title?: string;
    subtitle?: string;
};

const LEAVE_TYPE_LABELS = {
    annual: "Annual leave",
    sick: "Sick leave",
    family: "Family responsibility",
} as const;

function toIsoDate(date: Date) {
    return format(date, "yyyy-MM-dd");
}

function DateSelectField({
    id,
    label,
    value,
    onChange,
    min,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: string;
}) {
    const parsedValue = parseISO(value);
    const base = Number.isNaN(parsedValue.getTime()) ? new Date() : parsedValue;
    const minDate = min ? parseISO(min) : null;
    const minYear = minDate && !Number.isNaN(minDate.getTime()) ? minDate.getFullYear() : new Date().getFullYear() - 1;
    const maxYear = new Date().getFullYear() + 3;
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
    const months = [
        { value: 0, label: "Jan" }, { value: 1, label: "Feb" }, { value: 2, label: "Mar" }, { value: 3, label: "Apr" },
        { value: 4, label: "May" }, { value: 5, label: "Jun" }, { value: 6, label: "Jul" }, { value: 7, label: "Aug" },
        { value: 8, label: "Sep" }, { value: 9, label: "Oct" }, { value: 10, label: "Nov" }, { value: 11, label: "Dec" },
    ];

    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const updateValue = (nextYear: number, nextMonth: number, nextDay: number) => {
        const safeDay = Math.min(nextDay, new Date(nextYear, nextMonth + 1, 0).getDate());
        const next = new Date(nextYear, nextMonth, safeDay);
        if (minDate && next < minDate) {
            onChange(toIsoDate(minDate));
            return;
        }
        onChange(toIsoDate(next));
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {label}
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow-sm)]">
                <select
                    id={id}
                    value={day}
                    onChange={(event) => updateValue(year, month, Number(event.target.value))}
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--text)] outline-none transition-all focus:ring-2 focus:ring-[var(--focus)]"
                >
                    {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((valueOption) => (
                        <option key={valueOption} value={valueOption}>
                            {valueOption}
                        </option>
                    ))}
                </select>
                <select
                    value={month}
                    onChange={(event) => updateValue(year, Number(event.target.value), day)}
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--text)] outline-none transition-all focus:ring-2 focus:ring-[var(--focus)]"
                >
                    {months.map((monthOption) => (
                        <option key={monthOption.value} value={monthOption.value}>
                            {monthOption.label}
                        </option>
                    ))}
                </select>
                <select
                    value={year}
                    onChange={(event) => updateValue(Number(event.target.value), month, day)}
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--text)] outline-none transition-all focus:ring-2 focus:ring-[var(--focus)]"
                >
                    {years.map((valueOption) => (
                        <option key={valueOption} value={valueOption}>
                            {valueOption}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export function RecordLeaveForm({
    initialEmployeeId = "",
    lockEmployee = false,
    backHref,
    onSavedHref,
    title = "Record leave",
    subtitle = "Save leave directly on this employee record.",
}: RecordLeaveFormProps) {
    const { toast } = useToast();
    const today = React.useMemo(() => new Date(), []);

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [leaveRecords, setLeaveRecords] = React.useState<Record<string, LeaveRecord[]>>({});
    const [contractsByEmployee, setContractsByEmployee] = React.useState<Record<string, Contract[]>>({});
    const [customLeaveTypes, setCustomLeaveTypes] = React.useState<CustomLeaveType[]>([]);
    const [advancedLeaveEnabled, setAdvancedLeaveEnabled] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState<LeaveFormData>({
        employeeId: initialEmployeeId,
        type: "annual",
        startDate: toIsoDate(today),
        endDate: toIsoDate(today),
        days: 1,
        note: "",
        allowOverrun: false,
    });
    const [isDirty, setIsDirty] = React.useState(false);
    const [daysTouched, setDaysTouched] = React.useState(false);

    useUnsavedChanges(isDirty);

    const updateForm = (updates: Partial<LeaveFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    React.useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            setLoadError(null);
            try {
                const [employeeRows, settings] = await Promise.all([getEmployees(), getSettings()]);
                const selectedEmployeeId = initialEmployeeId || employeeRows[0]?.id || "";
                const leavePairs = await Promise.all(
                    employeeRows.map(async (employee) => [employee.id, await getLeaveForEmployee(employee.id)] as const),
                );
                const contractPairs = await Promise.all(
                    employeeRows.map(async (employee) => [employee.id, await getContractsForEmployee(employee.id)] as const),
                );

                if (!active) return;
                const plan = getUserPlan(settings);
                setEmployees(employeeRows);
                setLeaveRecords(Object.fromEntries(leavePairs));
                setContractsByEmployee(Object.fromEntries(contractPairs));
                setCustomLeaveTypes(settings.customLeaveTypes ?? []);
                setAdvancedLeaveEnabled(canUseAdvancedLeaveFeatures(plan));
                setFormData((current) => ({
                    ...current,
                    employeeId: current.employeeId || selectedEmployeeId,
                }));
            } catch (error) {
                console.error("Failed to load leave form data", error);
                if (active) {
                    setLoadError("Could not load leave details. Please refresh and try again.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load().catch(() => undefined);
        return () => {
            active = false;
        };
    }, [initialEmployeeId]);

    React.useEffect(() => {
        if (daysTouched) return;
        const calculatedDays = estimateLeaveDays(formData.startDate, formData.endDate);
        setFormData((current) => ({
            ...current,
            days: calculatedDays || 1,
        }));
    }, [daysTouched, formData.endDate, formData.startDate]);

    const selectedEmployee = employees.find((employee) => employee.id === formData.employeeId);
    const selectedRecords = leaveRecords[formData.employeeId] || [];
    const selectedContracts = contractsByEmployee[formData.employeeId] || [];
    const availableLeaveTypes = React.useMemo(() => {
        const baseTypes = [
            { id: "annual", label: LEAVE_TYPE_LABELS.annual },
            { id: "sick", label: LEAVE_TYPE_LABELS.sick },
            { id: "family", label: LEAVE_TYPE_LABELS.family },
        ];

        if (!advancedLeaveEnabled) {
            return baseTypes;
        }

        return [
            ...baseTypes,
            ...customLeaveTypes.map((type) => ({
                id: type.id,
                label: type.name,
            })),
        ];
    }, [advancedLeaveEnabled, customLeaveTypes]);

    const annualSummary = selectedEmployee && (
        selectedEmployee.startDate
        || hasManualAnnualLeaveBalance(selectedEmployee)
        || selectedEmployee.leaveCycleStartDate
        || selectedEmployee.leaveCycleEndDate
    )
        ? calculateAnnualLeaveSummary(selectedEmployee, selectedRecords, selectedContracts, parseISO(formData.startDate))
        : null;

    const leaveBalance = getLeaveAllowanceForType(
        formData.type,
        selectedRecords,
        selectedContracts,
        parseISO(formData.startDate),
        customLeaveTypes,
        selectedEmployee,
    );
    const exceedsAllowance = Number.isFinite(leaveBalance.remaining) && formData.days > Math.max(leaveBalance.remaining, 0);
    const customType = customLeaveTypes.find((type) => type.id === formData.type);
    const employeeContextLocked = lockEmployee && Boolean(selectedEmployee);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedEmployee) return;
        if (exceedsAllowance && !formData.allowOverrun) return;

        setSaving(true);
        try {
            const record: LeaveRecord = {
                id: crypto.randomUUID(),
                householdId: selectedEmployee.householdId ?? "default",
                employeeId: formData.employeeId,
                type: formData.type,
                days: formData.days,
                date: formData.startDate,
                startDate: formData.startDate,
                endDate: formData.endDate,
                exceedsAllowance,
                typeLabel: getLeaveTypeLabel(formData.type, customLeaveTypes),
                isCustomType: Boolean(customType),
                paid: customType?.isPaid,
                note: formData.note,
            };
            await saveLeaveRecord(record);
            setIsDirty(false);
            toast("Leave record saved.");
            window.location.assign(onSavedHref);
        } catch (error) {
            console.error("Failed to save leave record", error);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="space-y-4">
                <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Could not load leave details</AlertTitle>
                    <AlertDescription>{loadError}</AlertDescription>
                </Alert>
                <Link href={backHref}>
                    <Button variant="outline">Back</Button>
                </Link>
            </div>
        );
    }

    if (employees.length === 0) {
        return (
            <EmptyState
                icon={CalendarRange}
                title="Add an employee first"
                description="Leave records are saved per employee. Add a worker, then record leave."
                actionLabel="Add employee"
                actionHref="/employees/new"
                secondaryActionLabel="Back to leave overview"
                secondaryActionHref="/leave"
            />
        );
    }

    return (
        <div className="space-y-6 pb-28 md:pb-6">
            <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                    <Link href={backHref}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" aria-label="Back">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-[var(--text)]">{title}</h1>
                        <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden border border-[var(--border)] bg-[var(--surface-1)]">
                <CardContent className="p-0">
                    <div className="border-b border-[var(--border)] bg-[var(--surface-2)]/40 p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
                                <CalendarRange className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--text)]">Leave calculation support</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Weekdays are counted automatically. You can still adjust the day total manually.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form id="record-leave-form" onSubmit={handleSubmit} className="space-y-6 p-6">
                        {employeeContextLocked ? (
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/35 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Employee</p>
                                <p className="mt-1 text-sm font-bold text-[var(--text)]">{selectedEmployee?.name}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label htmlFor="employee-id" className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                    Employee
                                </label>
                                <select
                                    id="employee-id"
                                    value={formData.employeeId}
                                    onChange={(event) => updateForm({ employeeId: event.target.value, allowOverrun: false })}
                                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm font-bold text-[var(--text)] outline-none transition-all focus:ring-2 focus:ring-[var(--focus)]"
                                    required
                                >
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="leave-type" className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                    Leave type
                                </label>
                                <select
                                    id="leave-type"
                                    value={formData.type}
                                    onChange={(event) => updateForm({ type: event.target.value as string, allowOverrun: false })}
                                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm font-bold text-[var(--text)] outline-none transition-all focus:ring-2 focus:ring-[var(--focus)]"
                                    required
                                >
                                    {availableLeaveTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <DateSelectField
                                id="leave-start-date"
                                label="Start date"
                                value={formData.startDate}
                                onChange={(value) => {
                                    const safeEndDate = formData.endDate < value ? value : formData.endDate;
                                    updateForm({ startDate: value, endDate: safeEndDate, allowOverrun: false });
                                }}
                            />
                            <DateSelectField
                                id="leave-end-date"
                                label="End date"
                                value={formData.endDate}
                                min={formData.startDate}
                                onChange={(value) => updateForm({ endDate: value, allowOverrun: false })}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-[180px,1fr]">
                            <div className="space-y-2">
                                <label htmlFor="leave-days" className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                    Days to record
                                </label>
                                <input
                                    id="leave-days"
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={formData.days}
                                    onChange={(event) => {
                                        setDaysTouched(true);
                                        updateForm({ days: Number.parseFloat(event.target.value) || 0, allowOverrun: false });
                                    }}
                                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm font-black text-[var(--text)] outline-none transition-all focus:ring-2 focus:ring-[var(--focus)]"
                                    required
                                />
                            </div>
                            <div className="flex flex-col justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Remaining balance</p>
                                <div className="mt-2 flex items-baseline gap-3">
                                    <span className="text-3xl font-black tracking-tight text-[var(--text)]">
                                        {formatLeaveValue(leaveBalance.remaining)}
                                    </span>
                                    <span className="text-xs font-bold text-[var(--text-muted)]">
                                        {getLeaveTypeLabel(formData.type, customLeaveTypes)} remaining
                                    </span>
                                </div>
                                {formData.type === "annual" && advancedLeaveEnabled && (annualSummary?.remainingCarryOver ?? 0) > 0 ? (
                                    <p className="mt-2 w-fit rounded-lg bg-[var(--accent-subtle)] px-2 py-1 text-xs font-semibold text-[var(--primary)]">
                                        Carry-over days are used first
                                    </p>
                                ) : null}
                                {formData.type === "annual" && hasManualAnnualLeaveBalance(selectedEmployee ?? "") ? (
                                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                                        This balance is based on the manual leave amount saved on the employee profile.
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {exceedsAllowance ? (
                            <div className="space-y-4">
                                <Alert variant="warning" className="rounded-2xl border-[var(--focus)] bg-[var(--surface-raised)]">
                                    <AlertTriangle className="h-5 w-5 text-[var(--focus)]" />
                                    <AlertTitle className="text-[var(--text)]">Exceeds available balance</AlertTitle>
                                    <AlertDescription className="text-sm text-[var(--text-muted)]">
                                        This entry is {formData.days - Math.max(leaveBalance.remaining, 0)} day
                                        {formData.days - Math.max(leaveBalance.remaining, 0) === 1 ? "" : "s"} over the current balance.
                                    </AlertDescription>
                                </Alert>

                                <button
                                    type="button"
                                    onClick={() => updateForm({ allowOverrun: !formData.allowOverrun })}
                                    className="flex w-full items-center gap-4 rounded-2xl border border-[var(--border)] p-5 text-left transition-all hover:bg-[var(--surface-2)]"
                                    style={{
                                        backgroundColor: formData.allowOverrun ? "var(--accent-subtle)" : "var(--surface-1)",
                                        borderColor: formData.allowOverrun ? "var(--primary)" : "var(--border)",
                                    }}
                                >
                                    <div
                                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-all"
                                        style={{
                                            backgroundColor: formData.allowOverrun ? "var(--primary)" : "transparent",
                                            border: `1.5px solid ${formData.allowOverrun ? "var(--primary)" : "var(--border)"}`,
                                        }}
                                    >
                                        {formData.allowOverrun ? <Check className="h-4 w-4 text-white" strokeWidth={4} /> : null}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text)]">Grant extra leave</p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            Allows saving even when this is above the current balance.
                                        </p>
                                    </div>
                                </button>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <label htmlFor="leave-note" className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                Notes
                            </label>
                            <textarea
                                id="leave-note"
                                value={formData.note}
                                onChange={(event) => updateForm({ note: event.target.value })}
                                className="min-h-[110px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--text)] outline-none transition-all focus:ring-2 focus:ring-[var(--focus)]"
                                placeholder="Add an optional note."
                            />
                        </div>

                        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/35 px-4 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
                            Leave records help with payroll tracking and record-keeping. For legal interpretation, check official guidance or a qualified adviser.
                        </p>

                        <div className="hidden border-t border-[var(--border)] pt-6 md:block">
                            <Button
                                type="submit"
                                disabled={saving || (exceedsAllowance && !formData.allowOverrun)}
                                className="h-12 w-full gap-2 rounded-2xl text-base font-black"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                {saving ? "Saving..." : "Save leave record"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface-1)]/95 p-3 backdrop-blur-sm md:hidden">
                <Button
                    type="submit"
                    form="record-leave-form"
                    disabled={saving || (exceedsAllowance && !formData.allowOverrun)}
                    className="h-12 w-full gap-2 rounded-xl text-base font-black"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {saving ? "Saving..." : "Save leave record"}
                </Button>
            </div>
        </div>
    );
}
