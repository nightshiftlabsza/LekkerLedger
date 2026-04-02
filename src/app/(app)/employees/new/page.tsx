"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { EmployeeSchema, Employee } from "@/lib/schema";
import { saveEmployee, getEmployees, getSettings } from "@/lib/storage";
import { getUserPlan, canCreateEmployee } from "@/lib/entitlements";
import { NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";
import { formatEmployeeIdNumberInput, normalizeEmployeeIdNumber } from "@/src/lib/employee-id";
import { useUnsavedChanges } from "@/app/hooks/use-unsaved-changes";
import { REFUND_WINDOW_LABEL } from "@/config/plans";
import { OrdinaryWorkPatternPicker } from "@/components/payroll/ordinary-work-pattern-picker";
import {
    buildEmptyOrdinaryWorkPattern,
    normalizeOrdinaryWorkPattern,
    ordinarilyWorksSundaysFromPattern,
} from "@/lib/ordinary-work-pattern";

export default function AddEmployeePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: "",
        idNumber: "",
        hourlyRate: NMW_RATE.toString(),
        role: "",
        phone: "",
        email: "",
        startDate: "",
        startDateIsApproximate: false,
        leaveCycleStartDate: "",
        leaveCycleEndDate: "",
        annualLeaveDaysRemaining: "",
        ordinaryWorkPattern: buildEmptyOrdinaryWorkPattern(),
        ordinaryHoursPerDay: "8",
        frequency: "Monthly",
    });
    const [enableLeaveSetup, setEnableLeaveSetup] = React.useState(false);
    const [isDirty, setIsDirty] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [canAdd, setCanAdd] = React.useState(true);
    const [tierLimitReached, setTierLimitReached] = React.useState<string | null>(null);
    const onboardingSource = searchParams?.get("source") === "onboarding";

    useUnsavedChanges(isDirty);

    const updateForm = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    React.useEffect(() => {
        async function checkLimit() {
            const [emps, settings] = await Promise.all([getEmployees(), getSettings()]);
            const plan = getUserPlan(settings);

            if (!canCreateEmployee(plan, emps.length)) {
                setCanAdd(false);
                setTierLimitReached(plan.id);
            }
        }
        checkLimit();
    }, []);

    const hourlyRateNum = Number.parseFloat(formData.hourlyRate) || 0;
    const belowNMW = hourlyRateNum > 0 && hourlyRateNum < NMW_RATE;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const submissionData = {
            id: crypto.randomUUID(),
            ...formData,
            idNumber: normalizeEmployeeIdNumber(formData.idNumber),
            hourlyRate: Number.parseFloat(formData.hourlyRate),
            ordinaryHoursPerDay: Number(formData.ordinaryHoursPerDay) || 8,
            annualLeaveDaysRemaining: enableLeaveSetup && formData.annualLeaveDaysRemaining !== ""
                ? Number.parseFloat(formData.annualLeaveDaysRemaining)
                : undefined,
            annualLeaveBalanceAsOfDate: enableLeaveSetup && formData.annualLeaveDaysRemaining !== ""
                ? new Date().toISOString().slice(0, 10)
                : "",
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

        setLoading(true);
        try {
            await saveEmployee(parsed.data as Employee);
            setIsDirty(false);
            if (onboardingSource) {
                toast(`${formData.name} saved. Add your employer details before saving the first final payslip.`);
                router.push(`/wizard?empId=${parsed.data.id}&source=onboarding`);
                return;
            }
            toast(`${formData.name} saved successfully!`);
            router.push("/employees");
        } catch (err) {
            console.error(err);
            setErrors({ form: "Failed to save. Please try again." });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <div className="max-w-xl mx-auto mb-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-sm)] w-full">
                <Link href="/employees">
                    <button
                        aria-label="Back"
                        className="h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--surface-2)] active-scale"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
                <h1 className="font-bold text-lg tracking-tight" style={{ color: "var(--text)" }}>
                    Add Employee
                </h1>
            </div>

            <main className="flex-1 w-full px-4 py-6">
                <div className="max-w-xl mx-auto">
                    <Card className="animate-slide-up hover-lift shadow-[var(--shadow-md)]">
                        <CardContent className="p-8">
                            <form onSubmit={handleSave} className="space-y-6">
                                {onboardingSource && (
                                    <Alert variant="default" className="border-[var(--primary)]/30 bg-[var(--surface-2)]">
                                        <AlertDescription className="text-[var(--text-muted)]">
                                            Start with your worker now. You can add your employer name and address later in Settings, before you save the first final payslip.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {!canAdd && (
                                    <Alert variant="default" className="border-[var(--focus)] bg-[var(--surface-2)]">
                                        <Sparkles className="h-4 w-4 text-[var(--focus)]" />
                                        <AlertDescription className="space-y-2 text-[var(--text-muted)]">
                                            <p>
                                                <strong className="text-[var(--text)]">{tierLimitReached === "standard" ? "You are on Standard." : "You are on Free."}</strong>{" "}
                                                {tierLimitReached === "standard"
                                                    ? "Standard supports up to 3 active employees in one household."
                                                    : "Free supports 1 active employee."}
                                            </p>
                                            <p>
                                                {tierLimitReached === "standard"
                                                    ? "Need more headroom? Pro adds unlimited employees and multi-household support."
                                                    : "Need to manage more than one worker? Standard supports up to 3 employees."}
                                            </p>
                                            <p>
                                                <Link href="/pricing" className="underline font-bold">View plans</Link>
                                                <span> and remember: paid purchases have a {REFUND_WINDOW_LABEL} refund window.</span>
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {errors.form && (
                                    <Alert variant="error">
                                        <AlertDescription>{errors.form}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Thandi Dlamini"
                                        value={formData.name}
                                        onChange={(e) => updateForm({ name: e.target.value })}
                                        error={errors.name}
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Input
                                        id="role"
                                        placeholder="e.g. Domestic Worker, Gardener"
                                        value={formData.role}
                                        onChange={(e) => updateForm({ role: e.target.value })}
                                        error={errors.role}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="idNumber">SA ID number or passport (optional)</Label>
                                    <Input
                                        id="idNumber"
                                        placeholder="e.g. 900101 5009 087"
                                        value={formData.idNumber}
                                        onChange={(e) => updateForm({ idNumber: formatEmployeeIdNumberInput(e.target.value) })}
                                        error={errors.idNumber}
                                        disabled={loading}
                                    />
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Not required for a basic payslip. Helpful for UIF, uFiling, and yearly records.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="071 234 5678"
                                            value={formData.phone}
                                            onChange={(e) => updateForm({ phone: e.target.value })}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address (optional)</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="worker@example.com"
                                            value={formData.email}
                                            onChange={(e) => updateForm({ email: e.target.value })}
                                            error={errors.email}
                                            disabled={loading}
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
                                        disabled={loading}
                                    />
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Optional. Use the exact date if you know it, or your best estimate if you do not.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-sm text-[var(--text)]">Start date is an estimate</p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                Turn this on if the date above is approximate.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.startDateIsApproximate}
                                            onCheckedChange={(checked) => updateForm({ startDateIsApproximate: checked })}
                                            disabled={loading || !formData.startDate}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-sm text-[var(--text)]">Set current leave details now</p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                Optional. Use this if you already know the current leave year or remaining leave and do not want the app to guess.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={enableLeaveSetup}
                                            onCheckedChange={(checked) => {
                                                setEnableLeaveSetup(checked);
                                                setIsDirty(true);
                                            }}
                                            disabled={loading}
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
                                                        disabled={loading}
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
                                                        disabled={loading}
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
                                                    placeholder="e.g. 12.5"
                                                    value={formData.annualLeaveDaysRemaining}
                                                    onChange={(e) => updateForm({ annualLeaveDaysRemaining: e.target.value })}
                                                    error={errors.annualLeaveDaysRemaining}
                                                    disabled={loading}
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
                                        <span
                                            className="absolute left-4 top-3 text-sm font-semibold pointer-events-none"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            R
                                        </span>
                                        <Input
                                            id="hourlyRate"
                                            className="pl-8"
                                            type="number"
                                            step="0.01"
                                            placeholder={NMW_RATE.toString()}
                                            value={formData.hourlyRate}
                                            onChange={(e) => updateForm({ hourlyRate: e.target.value })}
                                            onFocus={(e) => e.target.select()}
                                            error={errors.hourlyRate}
                                            disabled={loading}
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
                                        onFocus={(e) => e.target.select()}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Pay Frequency</Label>
                                    <select
                                        id="frequency"
                                        className="w-full h-11 px-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--focus)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] disabled:opacity-50"
                                        value={formData.frequency}
                                        onChange={(e) => updateForm({ frequency: e.target.value })}
                                        disabled={loading}
                                    >
                                        <option value="Weekly">Weekly</option>
                                        <option value="Fortnightly">Fortnightly</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
                                    <Label>Ordinary work pattern</Label>
                                    <OrdinaryWorkPatternPicker
                                        value={formData.ordinaryWorkPattern}
                                        onChange={(ordinaryWorkPattern) => updateForm({ ordinaryWorkPattern })}
                                        helperText="Select the days this worker ordinarily works. Payroll will exclude South African public holidays that fall on these selected days."
                                    />
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Sunday pay is 1.5× only if Sunday is selected here. Otherwise Sunday pay stays at 2×.
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-[var(--border)]">
                                    <Button
                                        type="submit"
                                        className="w-full gap-2.5 h-14 text-base font-bold rounded-2xl shadow-[var(--shadow-md)] active-scale transition-all"
                                        disabled={loading || belowNMW || !canAdd}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" /> Saving…
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5" /> {onboardingSource ? "Save worker and continue" : "Save Employee"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
