"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { EmployeeSchema, Employee } from "@/lib/schema";
import { saveEmployee, getEmployee, getPayslipsForEmployee } from "@/lib/storage";
import { NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";
import { formatEmployeeIdNumberInput, normalizeEmployeeIdNumber } from "@/src/lib/employee-id";
import { useUnsavedChanges } from "@/app/hooks/use-unsaved-changes";
import { OrdinaryWorkPatternPicker } from "@/components/payroll/ordinary-work-pattern-picker";
import {
    buildEmptyOrdinaryWorkPattern,
    normalizeOrdinaryWorkPattern,
    ordinarilyWorksSundaysFromPattern,
} from "@/lib/ordinary-work-pattern";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: "",
        idNumber: "",
        hourlyRate: NMW_RATE.toString(),
        role: "Domestic Worker",
        phone: "",
        email: "",
        startDate: "",
        startDateIsApproximate: false,
        leaveCycleStartDate: "",
        leaveCycleEndDate: "",
        annualLeaveDaysRemaining: "",
        annualLeaveBalanceAsOfDate: "",
        ordinaryWorkPattern: buildEmptyOrdinaryWorkPattern(),
        ordinaryHoursPerDay: "8",
    });
    const [isDirty, setIsDirty] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [startDateLocked, setStartDateLocked] = React.useState(false);
    const [lockedStartDate, setLockedStartDate] = React.useState("");
    const [enableLeaveSetup, setEnableLeaveSetup] = React.useState(false);
    const [initialAnnualLeaveDaysRemaining, setInitialAnnualLeaveDaysRemaining] = React.useState("");

    useUnsavedChanges(isDirty);

    const updateForm = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    React.useEffect(() => {
        async function load() {
            if (!id) return;
            const [emp, payslips] = await Promise.all([getEmployee(id), getPayslipsForEmployee(id)]);
            if (!emp) {
                router.push("/employees");
                return;
            }
            const payrollExists = payslips.length > 0;
            setFormData({
                name: emp.name,
                idNumber: formatEmployeeIdNumberInput(emp.idNumber || ""),
                hourlyRate: emp.hourlyRate.toString(),
                role: emp.role || "Domestic Worker",
                phone: emp.phone || "",
                email: emp.email || "",
                startDate: emp.startDate || "",
                startDateIsApproximate: emp.startDateIsApproximate ?? false,
                leaveCycleStartDate: emp.leaveCycleStartDate || "",
                leaveCycleEndDate: emp.leaveCycleEndDate || "",
                annualLeaveDaysRemaining: emp.annualLeaveDaysRemaining === undefined ? "" : String(emp.annualLeaveDaysRemaining),
                annualLeaveBalanceAsOfDate: emp.annualLeaveBalanceAsOfDate || "",
                ordinaryWorkPattern: emp.ordinaryWorkPattern ?? buildEmptyOrdinaryWorkPattern(),
                ordinaryHoursPerDay: (emp.ordinaryHoursPerDay ?? 8).toString(),
            });
            setStartDateLocked(payrollExists);
            setLockedStartDate(emp.startDate || "");
            setInitialAnnualLeaveDaysRemaining(emp.annualLeaveDaysRemaining === undefined ? "" : String(emp.annualLeaveDaysRemaining));
            setEnableLeaveSetup(Boolean(emp.leaveCycleStartDate || emp.leaveCycleEndDate || emp.annualLeaveDaysRemaining !== undefined));
            setLoading(false);
        }
        load();
    }, [id, router]);

    const hourlyRateNum = Number.parseFloat(formData.hourlyRate) || 0;
    const belowNMW = hourlyRateNum > 0 && hourlyRateNum < NMW_RATE;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const submissionData = {
            id,
            ...formData,
            idNumber: normalizeEmployeeIdNumber(formData.idNumber),
            hourlyRate: Number.parseFloat(formData.hourlyRate),
            ordinaryHoursPerDay: Number(formData.ordinaryHoursPerDay) || 8,
            startDate: startDateLocked ? lockedStartDate : formData.startDate,
            annualLeaveDaysRemaining: enableLeaveSetup && formData.annualLeaveDaysRemaining !== ""
                ? Number.parseFloat(formData.annualLeaveDaysRemaining)
                : undefined,
            annualLeaveBalanceAsOfDate: (() => {
                if (!enableLeaveSetup || formData.annualLeaveDaysRemaining === "") return "";
                if (formData.annualLeaveDaysRemaining === initialAnnualLeaveDaysRemaining && formData.annualLeaveBalanceAsOfDate) {
                    return formData.annualLeaveBalanceAsOfDate;
                }
                return new Date().toISOString().slice(0, 10);
            })(),
            leaveCycleStartDate: enableLeaveSetup ? formData.leaveCycleStartDate : "",
            leaveCycleEndDate: enableLeaveSetup ? formData.leaveCycleEndDate : "",
            ordinaryWorkPattern: normalizeOrdinaryWorkPattern(formData.ordinaryWorkPattern),
            ordinarilyWorksSundays: ordinarilyWorksSundaysFromPattern(formData.ordinaryWorkPattern),
        };

        const parsed = EmployeeSchema.safeParse(submissionData);
        if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            parsed.error.issues.forEach((err) => {
                if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setSaving(true);
        try {
            await saveEmployee(parsed.data as Employee);
            setIsDirty(false);
            toast("Changes saved successfully!");
            router.push("/employees");
        } catch (err) {
            console.error(err);
            setErrors({ form: "Failed to save. Please try again." });
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <div className="max-w-xl mx-auto mb-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-sm)] w-full">
                <Link href="/employees">
                    <button
                        aria-label="Back"
                        className="h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--surface-2)] active-scale text-[var(--text-muted)]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-0.5 opacity-60" style={{ color: "var(--text-muted)" }}>
                        <Link href="/employees" className="hover:text-[var(--primary)] transition-colors">Employees</Link> › Edit
                    </p>
                    <h1 className="font-bold text-lg tracking-tight" style={{ color: "var(--text)" }}>
                        {formData.name || "Edit Employee"}
                    </h1>
                </div>
            </div>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
                <Card className="animate-slide-up hover-lift shadow-[var(--shadow-md)]">
                    <CardContent className="p-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            {errors.form && (
                                <Alert variant="error">
                                    <AlertDescription>{errors.form}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => updateForm({ name: e.target.value })}
                                    error={errors.name}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => updateForm({ role: e.target.value })}
                                    error={errors.role}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="idNumber">SA ID number or passport (optional)</Label>
                                <Input
                                    id="idNumber"
                                    value={formData.idNumber}
                                    onChange={(e) => updateForm({ idNumber: formatEmployeeIdNumberInput(e.target.value) })}
                                    error={errors.idNumber}
                                    disabled={saving}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateForm({ phone: e.target.value })}
                                        disabled={saving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address (optional)</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateForm({ email: e.target.value })}
                                        error={errors.email}
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Employment start date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => updateForm({ startDate: e.target.value })}
                                    error={errors.startDate}
                                    disabled={saving || startDateLocked}
                                />
                                {startDateLocked ? (
                                    <p className="text-xs text-[var(--text-muted)]">
                                        This date is locked because payroll has already been created for this employee.
                                    </p>
                                ) : (
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Optional. Use the exact date if you know it, or your best estimate if you do not.
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-sm text-[var(--text)]">Start date is an estimate</p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            Turn this on if the employment start date above is approximate.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.startDateIsApproximate}
                                        onCheckedChange={(checked) => updateForm({ startDateIsApproximate: checked })}
                                        disabled={saving || !formData.startDate}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-sm text-[var(--text)]">Set current leave details</p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            Optional. Use this when the leave cycle or remaining leave should come from your records instead of automatic calculation.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={enableLeaveSetup}
                                        onCheckedChange={(checked) => {
                                            setEnableLeaveSetup(checked);
                                            setIsDirty(true);
                                        }}
                                        disabled={saving}
                                    />
                                </div>

                                {enableLeaveSetup ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="leaveCycleStartDate">Current leave year starts</Label>
                                                <Input
                                                    id="leaveCycleStartDate"
                                                    type="date"
                                                    value={formData.leaveCycleStartDate}
                                                    onChange={(e) => updateForm({ leaveCycleStartDate: e.target.value })}
                                                    error={errors.leaveCycleStartDate}
                                                    disabled={saving}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="leaveCycleEndDate">Current leave year ends</Label>
                                                <Input
                                                    id="leaveCycleEndDate"
                                                    type="date"
                                                    value={formData.leaveCycleEndDate}
                                                    onChange={(e) => updateForm({ leaveCycleEndDate: e.target.value })}
                                                    error={errors.leaveCycleEndDate}
                                                    disabled={saving}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="annualLeaveDaysRemaining">Annual leave remaining now</Label>
                                            <Input
                                                id="annualLeaveDaysRemaining"
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={formData.annualLeaveDaysRemaining}
                                                onChange={(e) => updateForm({ annualLeaveDaysRemaining: e.target.value })}
                                                error={errors.annualLeaveDaysRemaining}
                                                disabled={saving}
                                            />
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Leave this blank if you only want to save the dates for now.
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hourlyRate">Default Hourly Rate (ZAR) *</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-sm font-semibold pointer-events-none text-[var(--text-muted)]">R</span>
                                    <Input
                                        id="hourlyRate"
                                        className="pl-8"
                                        type="number"
                                        step="0.01"
                                        value={formData.hourlyRate}
                                        onChange={(e) => updateForm({ hourlyRate: e.target.value })}
                                        error={errors.hourlyRate}
                                        disabled={saving}
                                    />
                                </div>
                                {belowNMW && (
                                    <Alert variant="error">
                                        <AlertDescription>
                                            National Minimum Wage is <strong>R{NMW_RATE}/hr</strong>.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ordinaryHoursPerDay">Ordinary Hours per Day</Label>
                                <Input
                                    id="ordinaryHoursPerDay"
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={formData.ordinaryHoursPerDay}
                                    onChange={(e) => updateForm({ ordinaryHoursPerDay: e.target.value })}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
                                <Label>Ordinary work pattern</Label>
                                <OrdinaryWorkPatternPicker
                                    value={formData.ordinaryWorkPattern}
                                    onChange={(ordinaryWorkPattern) => updateForm({ ordinaryWorkPattern })}
                                    helperText="Select the days this worker ordinarily works. Payroll excludes South African public holidays that fall on these selected days."
                                />
                                <p className="text-xs text-[var(--text-muted)]">
                                    Sunday pay is 1.5× only if Sunday is selected here. Otherwise Sunday pay stays at 2×.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-[var(--border)]">
                                <Button
                                    type="submit"
                                    className="w-full h-14 text-base font-bold rounded-2xl shadow-[var(--shadow-md)] active-scale transition-all"
                                    disabled={saving || belowNMW}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                    {saving ? "Saving Changes..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
