"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Loader2, CalendarRange, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getContractsForEmployee, getEmployees, getLeaveForEmployee, saveLeaveRecord } from "@/lib/storage";
import { estimateLeaveDays, getLeaveAllowanceForType } from "@/lib/leave";
import { Contract, Employee, LeaveRecord, LeaveType } from "@/lib/schema";

type LeaveFormData = {
    employeeId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    note: string;
    allowOverrun: boolean;
};

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    annual: "Annual leave",
    sick: "Sick leave",
    family: "Family responsibility",
};

function toIsoDate(date: Date) {
    return format(date, "yyyy-MM-dd");
}

function DateSelectField({
    label,
    value,
    onChange,
    min,
}: {
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
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-2">
                <select
                    value={day}
                    onChange={(event) => updateValue(year, month, Number(event.target.value))}
                    className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)]/25"
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
                    className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)]/25"
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
                    className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)]/25"
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

function NewLeaveContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedEmpId = searchParams.get("employeeId");
    const today = React.useMemo(() => new Date(), []);

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [leaveRecords, setLeaveRecords] = React.useState<Record<string, LeaveRecord[]>>({});
    const [contractsByEmployee, setContractsByEmployee] = React.useState<Record<string, Contract[]>>({});
    const [formData, setFormData] = React.useState<LeaveFormData>({
        employeeId: preselectedEmpId || "",
        type: "annual",
        startDate: toIsoDate(today),
        endDate: toIsoDate(today),
        days: 1,
        note: "",
        allowOverrun: false,
    });
    const [daysTouched, setDaysTouched] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        async function load() {
            const emps = await getEmployees();
            const selectedEmployeeId = preselectedEmpId || emps[0]?.id || "";
            const leavePairs = await Promise.all(emps.map(async (employee) => [employee.id, await getLeaveForEmployee(employee.id)] as const));
            const contractPairs = await Promise.all(emps.map(async (employee) => [employee.id, await getContractsForEmployee(employee.id)] as const));

            if (!active) return;
            setEmployees(emps);
            setLeaveRecords(Object.fromEntries(leavePairs));
            setContractsByEmployee(Object.fromEntries(contractPairs));
            setFormData((current) => ({
                ...current,
                employeeId: current.employeeId || selectedEmployeeId,
            }));
            setLoading(false);
        }
        load();
        return () => {
            active = false;
        };
    }, [preselectedEmpId]);

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
    const leaveBalance = getLeaveAllowanceForType(formData.type, selectedRecords, selectedContracts, parseISO(formData.startDate));
    const exceedsAllowance = formData.days > Math.max(leaveBalance.remaining, 0);

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
                note: formData.note,
            };
            await saveLeaveRecord(record);
            router.push("/leave");
        } catch (error) {
            console.error("Failed to save leave record", error);
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[var(--primary)]" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <PageHeader
                title="Record leave"
                subtitle="Choose a start and end date, check the remaining balance, and override only if you want to allow extra leave."
            />

            <Card className="glass-panel border-none shadow-xl">
                <CardContent className="p-6 space-y-6">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/65 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
                                <CalendarRange className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--text)]">Leave days are estimated from the date range</p>
                                <p className="text-xs text-[var(--text-muted)]">Weekdays are counted by default. You can adjust the total if this employee works a different pattern.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Employee</label>
                            <select
                                value={formData.employeeId}
                                onChange={(event) => setFormData((current) => ({ ...current, employeeId: event.target.value, allowOverrun: false }))}
                                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none"
                                required
                            >
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[1fr,220px]">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Leave type</label>
                                <select
                                    value={formData.type}
                                    onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value as LeaveType, allowOverrun: false }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none"
                                    required
                                >
                                    <option value="annual">Annual leave</option>
                                    <option value="sick">Sick leave</option>
                                    <option value="family">Family responsibility</option>
                                </select>
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Remaining now</p>
                                <p className="mt-2 text-2xl font-black text-[var(--text)]">{leaveBalance.remaining}</p>
                                <p className="text-xs text-[var(--text-muted)]">{LEAVE_TYPE_LABELS[formData.type]} days left before this entry</p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <DateSelectField
                                label="Start date"
                                value={formData.startDate}
                                onChange={(value) => setFormData((current) => {
                                    const safeEndDate = current.endDate < value ? value : current.endDate;
                                    return { ...current, startDate: value, endDate: safeEndDate, allowOverrun: false };
                                })}
                            />
                            <DateSelectField
                                label="End date"
                                value={formData.endDate}
                                min={formData.startDate}
                                onChange={(value) => setFormData((current) => ({ ...current, endDate: value, allowOverrun: false }))}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-[220px,1fr]">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Days to record</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={formData.days}
                                    onChange={(event) => {
                                        setDaysTouched(true);
                                        setFormData((current) => ({ ...current, days: parseFloat(event.target.value) || 0, allowOverrun: false }));
                                    }}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none font-mono"
                                    required
                                />
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/55 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Allowance guide</p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Allowance</p>
                                        <p className="text-lg font-bold text-[var(--text)]">{leaveBalance.allowance}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Used</p>
                                        <p className="text-lg font-bold text-[var(--text)]">{leaveBalance.used}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">After this entry</p>
                                        <p className={`text-lg font-bold ${leaveBalance.remaining - formData.days < 0 ? "text-[var(--danger)]" : "text-[var(--text)]"}`}>
                                            {leaveBalance.remaining - formData.days}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {exceedsAllowance && (
                            <Alert variant="warning">
                                <AlertTitle>More leave than the remaining balance</AlertTitle>
                                <AlertDescription>
                                    This entry is {formData.days - Math.max(leaveBalance.remaining, 0)} day{formData.days - Math.max(leaveBalance.remaining, 0) === 1 ? "" : "s"} over the current balance. You can still save it if you want to allow additional paid or unpaid leave.
                                </AlertDescription>
                            </Alert>
                        )}

                        {exceedsAllowance && (
                            <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                <input
                                    type="checkbox"
                                    checked={formData.allowOverrun}
                                    onChange={(event) => setFormData((current) => ({ ...current, allowOverrun: event.target.checked }))}
                                    className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--focus)]"
                                />
                                <div>
                                    <p className="text-sm font-bold text-[var(--text)]">Allow this leave anyway</p>
                                    <p className="text-xs text-[var(--text-muted)]">Use this if you are granting extra days beyond the usual balance.</p>
                                </div>
                            </label>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Notes</label>
                            <textarea
                                value={formData.note}
                                onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
                                className="w-full min-h-[110px] rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)]/20"
                                placeholder="Optional note for your records"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={saving || (exceedsAllowance && !formData.allowOverrun)}
                            className="w-full h-12 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-all gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : exceedsAllowance ? <AlertTriangle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {saving ? "Saving..." : "Save leave record"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NewLeavePage() {
    return (
        <React.Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[var(--primary)]" /></div>}>
            <NewLeaveContent />
        </React.Suspense>
    );
}
