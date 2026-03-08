"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Loader2, CalendarRange, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getContractsForEmployee, getEmployees, getLeaveForEmployee, getSettings, saveLeaveRecord } from "@/lib/storage";
import { calculateAnnualLeaveSummary, estimateLeaveDays, formatLeaveValue, getLeaveAllowanceForType, getLeaveTypeLabel } from "@/lib/leave";
import { canUseAdvancedLeaveFeatures, getUserPlan } from "@/lib/entitlements";
import { Contract, CustomLeaveType, Employee, LeaveRecord, LeaveType } from "@/lib/schema";
import { useToast } from "@/components/ui/toast";
import { useUnsavedChanges } from "@/app/hooks/use-unsaved-changes";

type LeaveFormData = {
    employeeId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    note: string;
    allowOverrun: boolean;
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
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] ml-1">{label}</label>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow-sm)]">
                <select
                    value={day}
                    onChange={(event) => updateValue(year, month, Number(event.target.value))}
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)] transition-all"
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
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)] transition-all"
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
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-bold text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)] transition-all"
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
    const { toast } = useToast();
    const preselectedEmpId = searchParams.get("employeeId");
    const today = React.useMemo(() => new Date(), []);

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [leaveRecords, setLeaveRecords] = React.useState<Record<string, LeaveRecord[]>>({});
    const [contractsByEmployee, setContractsByEmployee] = React.useState<Record<string, Contract[]>>({});
    const [customLeaveTypes, setCustomLeaveTypes] = React.useState<CustomLeaveType[]>([]);
    const [advancedLeaveEnabled, setAdvancedLeaveEnabled] = React.useState(false);
    const [formData, setFormData] = React.useState<LeaveFormData>({
        employeeId: preselectedEmpId || "",
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

    const updateForm = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    React.useEffect(() => {
        let active = true;
        async function load() {
            const [emps, settings] = await Promise.all([getEmployees(), getSettings()]);
            const selectedEmployeeId = preselectedEmpId || emps[0]?.id || "";
            const leavePairs = await Promise.all(emps.map(async (employee) => [employee.id, await getLeaveForEmployee(employee.id)] as const));
            const contractPairs = await Promise.all(emps.map(async (employee) => [employee.id, await getContractsForEmployee(employee.id)] as const));

            if (!active) return;
            const plan = getUserPlan(settings);
            setEmployees(emps);
            setLeaveRecords(Object.fromEntries(leavePairs));
            setContractsByEmployee(Object.fromEntries(contractPairs));
            setCustomLeaveTypes(settings.customLeaveTypes ?? []);
            setAdvancedLeaveEnabled(canUseAdvancedLeaveFeatures(plan));
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

    const annualSummary = selectedEmployee?.startDate
        ? calculateAnnualLeaveSummary(selectedEmployee.startDate, selectedRecords, selectedContracts, parseISO(formData.startDate))
        : null;
    
    const leaveBalance = getLeaveAllowanceForType(
        formData.type,
        selectedRecords,
        selectedContracts,
        parseISO(formData.startDate),
        customLeaveTypes,
        selectedEmployee?.startDate
    );
    const exceedsAllowance = Number.isFinite(leaveBalance.remaining) && formData.days > Math.max(leaveBalance.remaining, 0);
    const customType = customLeaveTypes.find((type) => type.id === formData.type);

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
            toast("Leave record saved successfully!");
            router.push("/leave");
        } catch (error) {
            console.error("Failed to save leave record", error);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-sm)] w-full">
                <button
                    onClick={() => router.back()}
                    className="h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--surface-2)] active-scale text-[var(--text-muted)]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="font-bold text-lg tracking-tight" style={{ color: "var(--text)" }}>
                    Record Leave
                </h1>
            </div>

            <Card className="animate-slide-up hover-lift shadow-[var(--shadow-md)] overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-8 bg-[var(--accent-subtle)] border-b border-[var(--border)]">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">
                                <CalendarRange className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-[var(--text)]">Leave days estimation</h2>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-md">Weekdays are counted automatically. Feel free to adjust the total manually if your worker follows a different pattern.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] ml-1">Employee</label>
                                <select
                                    value={formData.employeeId}
                                    onChange={(event) => updateForm({ employeeId: event.target.value, allowOverrun: false })}
                                    className="w-full h-12 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)] outline-none transition-all shadow-[var(--shadow-sm)]"
                                    required
                                >
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>{employee.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] ml-1">Leave type</label>
                                <select
                                    value={formData.type}
                                    onChange={(event) => updateForm({ type: event.target.value as LeaveType, allowOverrun: false })}
                                    className="w-full h-12 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)] outline-none transition-all shadow-[var(--shadow-sm)]"
                                    required
                                >
                                    {availableLeaveTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <DateSelectField
                                label="Start date"
                                value={formData.startDate}
                                onChange={(value) => {
                                    const safeEndDate = formData.endDate < value ? value : formData.endDate;
                                    updateForm({ startDate: value, endDate: safeEndDate, allowOverrun: false });
                                }}
                            />
                            <DateSelectField
                                label="End date"
                                value={formData.endDate}
                                min={formData.startDate}
                                onChange={(value) => updateForm({ endDate: value, allowOverrun: false })}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-[180px,1fr]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] ml-1">Days to record</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={formData.days}
                                    onChange={(event) => {
                                        setDaysTouched(true);
                                        updateForm({ days: parseFloat(event.target.value) || 0, allowOverrun: false });
                                    }}
                                    className="w-full h-12 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-black text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)] outline-none shadow-[var(--shadow-sm)]"
                                    required
                                />
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)] flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">Remaining Balance</p>
                                <div className="mt-2 flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-[var(--text)] tracking-tighter">
                                        {formatLeaveValue(leaveBalance.remaining)}
                                    </span>
                                    <span className="text-xs font-bold text-[var(--text-muted)]">
                                        {getLeaveTypeLabel(formData.type, customLeaveTypes)} remaining
                                    </span>
                                </div>
                                {formData.type === "annual" && advancedLeaveEnabled && (annualSummary?.remainingCarryOver ?? 0) > 0 && (
                                    <p className="mt-2 text-xs font-semibold text-[var(--primary)] px-2 py-1 bg-[var(--accent-subtle)] rounded-lg w-fit">
                                        Using {formatLeaveValue(annualSummary?.remainingCarryOver ?? 0)} carried-over days first
                                    </p>
                                )}
                            </div>
                        </div>

                        {exceedsAllowance && (
                            <div className="space-y-4">
                                <Alert variant="warning" className="rounded-2xl border-[var(--focus)] bg-[var(--surface-raised)] shadow-[var(--shadow-sm)]">
                                    <AlertTriangle className="h-5 w-5 text-[var(--focus)]" />
                                    <AlertTitle className="font-bold text-[var(--text)]">Exceeds available balance</AlertTitle>
                                    <AlertDescription className="text-sm text-[var(--text-muted)]">
                                        This entry is {formData.days - Math.max(leaveBalance.remaining, 0)} day{formData.days - Math.max(leaveBalance.remaining, 0) === 1 ? "" : "s"} over the current balance.
                                    </AlertDescription>
                                </Alert>

                                <button
                                    type="button"
                                    onClick={() => updateForm({ allowOverrun: !formData.allowOverrun })}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200 active-scale hover:bg-[var(--surface-2)] shadow-[var(--shadow-sm)] border border-[var(--border)]"
                                    style={{
                                        backgroundColor: formData.allowOverrun ? "var(--accent-subtle)" : "var(--surface-1)",
                                        borderColor: formData.allowOverrun ? "var(--primary)" : "var(--border)",
                                    }}
                                >
                                    <div
                                        className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                        style={{
                                            backgroundColor: formData.allowOverrun ? "var(--primary)" : "transparent",
                                            border: `1.5px solid ${formData.allowOverrun ? "var(--primary)" : "var(--border)"}`,
                                        }}
                                    >
                                        {formData.allowOverrun && <Check className="h-4 w-4 text-white" strokeWidth={4} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Grant extra leave</p>
                                        <p className="text-xs mt-1 text-[var(--text-muted)]">Allows saving this record even though it exceeds the balance.</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] ml-1">Notes</label>
                            <textarea
                                value={formData.note}
                                onChange={(event) => updateForm({ note: event.target.value })}
                                className="w-full min-h-[120px] rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 text-sm font-medium text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)] transition-all shadow-[var(--shadow-sm)]"
                                placeholder="Add an optional note..."
                            />
                        </div>

                        <div className="pt-6 border-t border-[var(--border)]">
                            <Button
                                type="submit"
                                disabled={saving || (exceedsAllowance && !formData.allowOverrun)}
                                className="w-full h-14 text-base font-black rounded-2xl shadow-[var(--shadow-md)] active-scale transition-all gap-3"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                {saving ? "Saving Record..." : "Save Leave Record"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NewLeavePage() {
    return (
        <React.Suspense fallback={
            <div className="p-12 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin h-10 w-10 text-[var(--primary)]" />
                <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">Loading leave data...</p>
            </div>
        }>
            <NewLeaveContent />
        </React.Suspense>
    );
}
