"use client";

import * as React from "react";
import { format } from "date-fns";
import {
    AlertTriangle,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Mail,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";
import {
    buildEmptyOrdinaryWorkPattern,
    normalizeOrdinaryWorkPattern,
} from "@/lib/ordinary-work-pattern";
import {
    buildDefaultFreePayslipFormState,
    buildFreePayslipCalculationInput,
    buildFreePayslipPayload,
    buildPatternFromPreset,
    type FreePayslipFieldErrors,
    type FreePayslipFormState,
    FREE_PAYSLIP_DRAFT_STORAGE_KEY,
    FREE_PAYSLIP_RULE_MESSAGE,
    FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE,
    getPresetFromPattern,
    isValidMonthKey,
    ORDINARY_HOURS_PER_DAY,
    sanitizeSavedFreePayslipDraft,
    validateFreePayslipForm,
} from "@/lib/free-payslip-form";
import { OrdinaryWorkPatternPicker } from "@/components/payroll/ordinary-work-pattern-picker";
import { OrdinaryWorkCalendarSummaryCard } from "@/components/payroll/ordinary-work-calendar-summary";
import { describeOrdinaryWorkCalendar } from "@/lib/payroll-calendar";
import { buildPayrollSummary } from "@/lib/payroll-summary";
import { getMonthBounds, getMonthKey } from "@/lib/payslip-draft";

type DeliveryPhase = "idle" | "sending" | "quota-used" | "service-unavailable" | "success";

type NoticeTone = "info" | "warning" | "danger" | "success";

type DeliveryState = {
    phase: DeliveryPhase;
    tone: NoticeTone;
    message: string;
    email: string;
};

type DeliverResponse = {
    status: "sent";
    email: string;
    monthKey: string;
};

type OrdinaryWorkPreset = "monday-to-friday" | "monday-to-saturday" | "custom";

const INITIAL_DELIVERY_STATE: DeliveryState = {
    phase: "idle",
    tone: "info",
    message: "",
    email: "",
};

function loadSavedDraft() {
    if (typeof window === "undefined") return null;
    try {
        const rawDraft = window.localStorage.getItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY);
        return rawDraft ? sanitizeSavedFreePayslipDraft(JSON.parse(rawDraft)) : null;
    } catch {
        return null;
    }
}

function getNoticeStyles(tone: NoticeTone) {
    if (tone === "danger") return "border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface-raised))] text-[var(--text)]";
    if (tone === "warning") return "border-[var(--warning)]/30 bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface-raised))] text-[var(--text)]";
    if (tone === "success") return "border-[var(--success)]/25 bg-[color:color-mix(in_srgb,var(--success)_10%,var(--surface-raised))] text-[var(--text)]";
    return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]";
}

function TextField({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
    return (
        <label htmlFor={id} className="block space-y-2">
            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
            {children}
            {hint ? <span className="block text-sm leading-6 text-[var(--text-muted)]">{hint}</span> : null}
            {error ? <span className="block text-sm font-medium text-[var(--danger)]">{error}</span> : null}
        </label>
    );
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
            <span className="min-w-0 leading-6 text-[var(--text-muted)]">{label}</span>
            <span className={`text-right tabular-nums ${accent ? "font-bold text-[var(--primary)]" : "font-semibold text-[var(--text)]"}`}>{value}</span>
        </div>
    );
}

function SectionCard({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{eyebrow}</p>
                <h3 className="font-serif text-2xl font-bold text-[var(--text)]">{title}</h3>
                <p className="max-w-3xl text-sm leading-7 text-[var(--text-muted)]">{description}</p>
            </div>
            <div className="mt-6 space-y-6">{children}</div>
        </section>
    );
}

export function FreePayslipGenerator() {
    const savedDraft = React.useMemo(() => loadSavedDraft(), []);

    const [form, setForm] = React.useState<FreePayslipFormState>(() => savedDraft?.form ?? buildDefaultFreePayslipFormState());
    const [errors, setErrors] = React.useState<FreePayslipFieldErrors>({});
    const [deliveryEmail, setDeliveryEmail] = React.useState(() => savedDraft?.email ?? "");
    const [marketingConsent, setMarketingConsent] = React.useState(() => savedDraft?.marketingConsent ?? false);
    const [delivery, setDelivery] = React.useState<DeliveryState>(INITIAL_DELIVERY_STATE);
    const [showIdentityField, setShowIdentityField] = React.useState(() => Boolean(savedDraft?.form.employeeId));
    const [showRoleOverride, setShowRoleOverride] = React.useState(() => (savedDraft?.form.employeeRole ?? "Domestic Worker") !== "Domestic Worker");
    const [showOrdinaryHoursOverride, setShowOrdinaryHoursOverride] = React.useState(() => Boolean(savedDraft?.form.ordinaryHoursOverride));
    const [showOptionalAdjustments, setShowOptionalAdjustments] = React.useState(() => {
        const savedForm = savedDraft?.form;
        return Boolean(
            savedForm
            && (
                savedForm.shortShiftCount !== "0"
                || savedForm.shortShiftWorkedHours !== "0"
                || savedForm.otherDeductions !== "0"
            ),
        );
    });
    const [showSummaryDetails, setShowSummaryDetails] = React.useState(false);

    const confirmedPattern = React.useMemo(() => normalizeOrdinaryWorkPattern(form.ordinaryWorkPattern), [form.ordinaryWorkPattern]);
    const normalizedPattern = React.useMemo(() => confirmedPattern ?? buildEmptyOrdinaryWorkPattern(), [confirmedPattern]);
    const schedulePreset = React.useMemo(() => getPresetFromPattern(normalizedPattern), [normalizedPattern]);
    const monthBounds = React.useMemo(
        () => getMonthBounds(isValidMonthKey(form.monthKey) ? form.monthKey : getMonthKey(new Date())),
        [form.monthKey],
    );
    const ordinaryCalendar = React.useMemo(
        () => describeOrdinaryWorkCalendar(monthBounds.start, monthBounds.end, normalizedPattern, ORDINARY_HOURS_PER_DAY),
        [monthBounds.end, monthBounds.start, normalizedPattern],
    );
    const calculationInput = React.useMemo(() => buildFreePayslipCalculationInput(form), [form]);
    const breakdown = React.useMemo(() => calculationInput ? calculatePayslip(calculationInput) : null, [calculationInput]);
    const payrollSummary = React.useMemo(() => calculationInput ? buildPayrollSummary(calculationInput) : null, [calculationInput]);
    const payload = React.useMemo(() => buildFreePayslipPayload(form), [form]);
    const ordinaryDaysHint = `Maximum normal days this month: ${ordinaryCalendar.ordinaryDayCap}.`;
    const ordinaryHoursHint = `Use this only if you want to enter total normal hours instead of normal days. Maximum normal hours this month: ${ordinaryCalendar.ordinaryHourCap}.`;
    const sundayWorkHelp = normalizedPattern.sunday
        ? "Sunday hours are treated as part of the usual schedule."
        : "Sunday hours are treated as extra Sunday work.";
    const reviewSundayBasis = normalizedPattern.sunday
        ? "Sunday is part of the usual schedule."
        : "Sunday is extra Sunday work.";

    const updateField = React.useCallback((key: keyof FreePayslipFormState, value: FreePayslipFormState[keyof FreePayslipFormState]) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const nextErrors = { ...current };
            delete nextErrors[key];
            return nextErrors;
        });
    }, []);

    const updateSchedulePreset = React.useCallback((preset: OrdinaryWorkPreset) => {
        updateField("ordinaryWorkPattern", buildPatternFromPreset(preset, normalizedPattern.sunday));
    }, [normalizedPattern.sunday, updateField]);

    const updateSundayBasis = React.useCallback((ordinarilyWorksSundays: boolean) => {
        updateField("ordinaryWorkPattern", { ...normalizedPattern, sunday: ordinarilyWorksSundays });
    }, [normalizedPattern, updateField]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY, JSON.stringify({
                form,
                email: deliveryEmail,
                marketingConsent,
            }));
        } catch {
            // Best-effort draft persistence only.
        }
    }, [deliveryEmail, form, marketingConsent]);

    const focusField = React.useCallback((field: keyof FreePayslipFormState) => {
        if (typeof document === "undefined") return;

        const fieldIds: Partial<Record<keyof FreePayslipFormState, string>> = {
            employerName: "free-employer-name",
            employerAddress: "free-employer-address",
            employeeName: "free-worker-name",
            employeeId: "free-worker-id",
            employeeRole: "free-worker-role",
            hourlyRate: "free-hourly-rate",
            monthKey: "free-month",
            ordinaryDaysWorked: "free-ordinary-days",
            ordinaryHoursOverride: "free-ordinary-hours",
            overtimeHours: "free-overtime-hours",
            sundayHours: "free-sunday-hours",
            publicHolidayHours: "free-public-holiday-hours",
            shortShiftCount: "free-short-shifts",
            shortShiftWorkedHours: "free-short-shift-hours",
            otherDeductions: "free-other-deductions",
            ordinaryWorkPattern: "free-schedule-preset-monday-to-friday",
        };

        const targetId = fieldIds[field];
        if (!targetId) return;

        window.requestAnimationFrame(() => {
            const element = document.getElementById(targetId);
            if (!element) return;
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            if ("focus" in element && typeof element.focus === "function") {
                element.focus();
            }
        });
    }, []);

    const validateForm = React.useCallback((focusFirstError: boolean) => {
        const nextErrors = validateFreePayslipForm(form);
        setErrors(nextErrors);

        if (focusFirstError) {
            const orderedFields = Object.keys(form) as Array<keyof FreePayslipFormState>;
            const firstErrorField = orderedFields.find((field) => Boolean(nextErrors[field]));
            if (firstErrorField) {
                focusField(firstErrorField);
            }
        }

        return Object.keys(nextErrors).length === 0;
    }, [focusField, form]);

    const resetDeliveryState = React.useCallback(() => {
        setDelivery(INITIAL_DELIVERY_STATE);
    }, []);

    const handleEmailPayslip = React.useCallback(async () => {
        const valid = validateForm(true);
        if (!valid) return;
        const normalizedEmail = deliveryEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            setDelivery({
                phase: "service-unavailable",
                tone: "danger",
                message: "Enter the email address that should receive the payslip.",
                email: "",
            });
            return;
        }
        if (!payload || !breakdown || !payrollSummary) {
            setDelivery({
                phase: "service-unavailable",
                tone: "danger",
                message: "Complete the required payslip details before sending.",
                email: normalizedEmail,
            });
            return;
        }
        setDelivery({
            phase: "sending",
            tone: "info",
            message: "Sending your payslip now.",
            email: normalizedEmail,
        });
        try {
            const response = await fetch("/api/free-payslip/deliver", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-store",
                body: JSON.stringify({
                    email: normalizedEmail,
                    marketingConsent,
                    form,
                }),
            });
            const data = await response.json() as DeliverResponse | { error?: string };
            if (!response.ok) {
                const message = typeof data === "object" && data && "error" in data && typeof data.error === "string"
                    ? data.error
                    : FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE;

                if (response.status === 409) {
                    setDelivery({
                        phase: "quota-used",
                        tone: "warning",
                        message,
                        email: normalizedEmail,
                    });
                    return;
                }

                setDelivery({
                    phase: "service-unavailable",
                    tone: "danger",
                    message,
                    email: normalizedEmail,
                });
                return;
            }

            const sent = data as DeliverResponse;
            setDelivery({
                phase: "success",
                tone: "success",
                message: `Your payslip has been sent to ${sent.email}`,
                email: sent.email,
            });
        } catch {
            setDelivery({
                phase: "service-unavailable",
                tone: "danger",
                message: FREE_PAYSLIP_SERVICE_UNAVAILABLE_MESSAGE,
                email: normalizedEmail,
            });
        }
    }, [breakdown, deliveryEmail, form, payload, payrollSummary, validateForm]);

    const gateCardTitle = delivery.phase === "sending"
        ? "Sending your payslip"
        : delivery.phase === "quota-used"
            ? "Free payslip already used this month"
            : delivery.phase === "service-unavailable"
                ? "Service unavailable"
                : delivery.phase === "success"
                    ? "Payslip sent"
                    : "Email your free payslip";
    const idleGateMessage = "Enter your email address and we will send the PDF if that email has not used its free payslip this month.";

    return (
        <section id="free-payslip-generator" data-testid="free-payslip-generator" className="mx-auto max-w-[78rem] scroll-mt-24">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-8">
                <div className="max-w-3xl space-y-3">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Enter this month&apos;s pay details</h2>
                    <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                        Enter the employer, worker, month, and hours. The tool calculates the pay breakdown and UIF.
                    </p>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
                    <div className="space-y-6">
                        <SectionCard
                            eyebrow="Employer and worker"
                            title="Names, address, and pay rate"
                            description="These are the details that appear on the payslip."
                        >
                            <div className="grid gap-5 lg:grid-cols-2">
                                <TextField id="free-employer-name" label="Employer name" error={errors.employerName}>
                                    <Input
                                        id="free-employer-name"
                                        value={form.employerName}
                                        onChange={(event) => updateField("employerName", event.target.value)}
                                        placeholder="Employer name"
                                    />
                                </TextField>
                                <TextField id="free-employer-address" label="Employer address" error={errors.employerAddress}>
                                    <Input
                                        id="free-employer-address"
                                        value={form.employerAddress}
                                        onChange={(event) => updateField("employerAddress", event.target.value)}
                                        placeholder="Employer address"
                                    />
                                </TextField>
                                <TextField id="free-worker-name" label="Worker name" error={errors.employeeName}>
                                    <Input
                                        id="free-worker-name"
                                        value={form.employeeName}
                                        onChange={(event) => updateField("employeeName", event.target.value)}
                                        placeholder="Worker name"
                                    />
                                </TextField>
                                <TextField id="free-month" label="Payslip month" error={errors.monthKey}>
                                    <Input
                                        id="free-month"
                                        type="month"
                                        value={form.monthKey}
                                        onChange={(event) => updateField("monthKey", event.target.value)}
                                    />
                                </TextField>
                                <TextField
                                    id="free-hourly-rate"
                                    label="Hourly rate"
                                    hint={`The hourly rate must be at least R${NMW_RATE.toFixed(2)}.`}
                                    error={errors.hourlyRate}
                                >
                                    <Input
                                        id="free-hourly-rate"
                                        type="number"
                                        min={NMW_RATE}
                                        step="0.01"
                                        value={form.hourlyRate}
                                        onChange={(event) => updateField("hourlyRate", event.target.value)}
                                    />
                                </TextField>
                            </div>

                            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRoleOverride((current) => {
                                            const next = !current;
                                            if (!next) updateField("employeeRole", "Domestic Worker");
                                            return next;
                                        });
                                    }}
                                    className="flex w-full items-center justify-between gap-3 text-left"
                                >
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Different job title</p>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">Only change this if the payslip should show a different job title.</p>
                                    </div>
                                    {showRoleOverride ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                </button>
                                {showRoleOverride ? (
                                    <div className="mt-4">
                                        <TextField id="free-worker-role" label="Job title" error={errors.employeeRole}>
                                            <Input
                                                id="free-worker-role"
                                                value={form.employeeRole}
                                                onChange={(event) => updateField("employeeRole", event.target.value)}
                                                placeholder="Domestic worker"
                                            />
                                        </TextField>
                                    </div>
                                ) : null}
                            </div>

                            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                <button
                                    type="button"
                                    onClick={() => setShowIdentityField((current) => !current)}
                                    className="flex w-full items-center justify-between gap-3 text-left"
                                >
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Worker ID or passport</p>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">Only add this if it should appear on the payslip.</p>
                                    </div>
                                    {showIdentityField ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                </button>
                                {showIdentityField ? (
                                    <div className="mt-4">
                                        <TextField id="free-worker-id" label="ID or passport number" error={errors.employeeId}>
                                            <Input
                                                id="free-worker-id"
                                                value={form.employeeId}
                                                onChange={(event) => updateField("employeeId", event.target.value)}
                                                placeholder="ID or passport number"
                                            />
                                        </TextField>
                                    </div>
                                ) : null}
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="This month&apos;s work"
                            title="Days and extra hours"
                            description="Enter the usual work week, normal days worked, and any overtime, Sunday, or public holiday hours."
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Usual work week</p>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {[
                                            { key: "monday-to-friday" as const, label: "Monday to Friday", detail: "Usual weekdays only." },
                                            { key: "monday-to-saturday" as const, label: "Monday to Saturday", detail: "Usual weekdays plus Saturday." },
                                            { key: "custom" as const, label: "Custom days", detail: "Choose the usual days below." },
                                        ].map((preset) => {
                                            const selected = schedulePreset === preset.key;
                                            return (
                                                <button
                                                    key={preset.key}
                                                    id={`free-schedule-preset-${preset.key}`}
                                                    type="button"
                                                    onClick={() => updateSchedulePreset(preset.key)}
                                                    className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                                >
                                                    <p className="text-sm font-bold">{preset.label}</p>
                                                    <p className={`mt-1 text-sm leading-6 ${selected ? "text-white/88" : "text-[var(--text-muted)]"}`}>{preset.detail}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.ordinaryWorkPattern ? <p className="text-sm font-medium text-[var(--danger)]">{errors.ordinaryWorkPattern}</p> : null}
                                </div>

                                {schedulePreset === "custom" ? (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Usual weekdays</p>
                                        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Select the days that are part of the normal work week.</p>
                                        <div className="mt-4">
                                            <OrdinaryWorkPatternPicker
                                                value={form.ordinaryWorkPattern}
                                                onChange={(nextPattern) => updateField("ordinaryWorkPattern", nextPattern)}
                                                hiddenDayKeys={["sunday"]}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Usual Sunday work</p>
                                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Is Sunday part of the usual work week?</p>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => updateSundayBasis(false)}
                                            className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${!normalizedPattern.sunday ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                        >
                                            <p className="text-sm font-bold">No</p>
                                            <p className={`mt-1 text-sm leading-6 ${!normalizedPattern.sunday ? "text-white/88" : "text-[var(--text-muted)]"}`}>Sunday is extra work.</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateSundayBasis(true)}
                                            className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${normalizedPattern.sunday ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--primary)]/40"}`}
                                        >
                                            <p className="text-sm font-bold">Yes</p>
                                            <p className={`mt-1 text-sm leading-6 ${normalizedPattern.sunday ? "text-white/88" : "text-[var(--text-muted)]"}`}>Sunday is part of the normal week.</p>
                                        </button>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{sundayWorkHelp}</p>
                                </div>

                                <OrdinaryWorkCalendarSummaryCard
                                    summary={ordinaryCalendar}
                                    ordinaryHoursPerDay={ORDINARY_HOURS_PER_DAY}
                                    title="This month's normal days and hours"
                                />
                                <div className="grid gap-5 lg:grid-cols-2">
                                    <TextField
                                        id="free-ordinary-days"
                                        label="Normal days worked"
                                        hint={ordinaryDaysHint}
                                        error={errors.ordinaryDaysWorked}
                                    >
                                        <Input
                                            id="free-ordinary-days"
                                            type="number"
                                            min="0"
                                            max={ordinaryCalendar.ordinaryDayCap}
                                            value={form.ordinaryDaysWorked}
                                            onChange={(event) => updateField("ordinaryDaysWorked", event.target.value)}
                                        />
                                    </TextField>

                                    <div className="space-y-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOrdinaryHoursOverride((current) => {
                                                    const next = !current;
                                                    if (!next) updateField("ordinaryHoursOverride", "");
                                                    return next;
                                                });
                                            }}
                                            className="flex w-full items-center justify-between gap-3 text-left"
                                        >
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Enter normal hours instead</p>
                                                <p className="mt-1 text-sm text-[var(--text-muted)]">Use this if the month was not made up of full normal days.</p>
                                            </div>
                                            {showOrdinaryHoursOverride ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                        </button>
                                        {showOrdinaryHoursOverride ? (
                                            <TextField
                                                id="free-ordinary-hours"
                                                label="Normal hours worked"
                                                hint={ordinaryHoursHint}
                                                error={errors.ordinaryHoursOverride}
                                            >
                                                <Input
                                                    id="free-ordinary-hours"
                                                    type="number"
                                                    min="0"
                                                    max={ordinaryCalendar.ordinaryHourCap}
                                                    value={form.ordinaryHoursOverride}
                                                    onChange={(event) => updateField("ordinaryHoursOverride", event.target.value)}
                                                />
                                            </TextField>
                                        ) : (
                                            <p className="text-sm leading-6 text-[var(--text-muted)]">Leave this closed if normal days are enough.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-5 lg:grid-cols-3">
                                    <TextField id="free-overtime-hours" label="Overtime hours" hint="Enter hours worked outside normal time." error={errors.overtimeHours}>
                                        <Input
                                            id="free-overtime-hours"
                                            type="number"
                                            min="0"
                                            value={form.overtimeHours}
                                            onChange={(event) => updateField("overtimeHours", event.target.value)}
                                        />
                                    </TextField>
                                    <TextField id="free-sunday-hours" label="Sunday hours" hint={reviewSundayBasis} error={errors.sundayHours}>
                                        <Input
                                            id="free-sunday-hours"
                                            type="number"
                                            min="0"
                                            value={form.sundayHours}
                                            onChange={(event) => updateField("sundayHours", event.target.value)}
                                        />
                                    </TextField>
                                    <TextField
                                        id="free-public-holiday-hours"
                                        label="Public holiday hours"
                                        hint="Only enter hours actually worked on a South African public holiday."
                                        error={errors.publicHolidayHours}
                                    >
                                        <Input
                                            id="free-public-holiday-hours"
                                            type="number"
                                            min="0"
                                            value={form.publicHolidayHours}
                                            onChange={(event) => updateField("publicHolidayHours", event.target.value)}
                                        />
                                    </TextField>
                                </div>

                                <div data-testid="free-payslip-optional-adjustments" className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowOptionalAdjustments((current) => !current)}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Deductions and short shifts</p>
                                            <p className="mt-1 text-sm text-[var(--text-muted)]">Open this only for agreed deductions or short shifts under four hours.</p>
                                        </div>
                                        {showOptionalAdjustments ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                    </button>
                                    {showOptionalAdjustments ? (
                                        <div className="mt-4 grid gap-5 lg:grid-cols-2">
                                            <TextField
                                                id="free-other-deductions"
                                                label="Other deductions"
                                                hint="Only enter agreed deductions that should appear on this payslip."
                                                error={errors.otherDeductions}
                                            >
                                                <Input
                                                    id="free-other-deductions"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.otherDeductions}
                                                    onChange={(event) => updateField("otherDeductions", event.target.value)}
                                                />
                                            </TextField>
                                            <div className="space-y-4">
                                                <TextField id="free-short-shifts" label="Short shifts under four hours" error={errors.shortShiftCount}>
                                                    <Input
                                                        id="free-short-shifts"
                                                        type="number"
                                                        min="0"
                                                        value={form.shortShiftCount}
                                                        onChange={(event) => updateField("shortShiftCount", event.target.value)}
                                                    />
                                                </TextField>
                                                <TextField id="free-short-shift-hours" label="Hours worked across those short shifts" error={errors.shortShiftWorkedHours}>
                                                    <Input
                                                        id="free-short-shift-hours"
                                                        type="number"
                                                        min="0"
                                                        value={form.shortShiftWorkedHours}
                                                        onChange={(event) => updateField("shortShiftWorkedHours", event.target.value)}
                                                    />
                                                </TextField>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    <aside className="xl:sticky xl:top-24 xl:self-start">
                        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <div className="space-y-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Summary and PDF</p>
                                <h3 className="font-serif text-2xl font-bold text-[var(--text)]">This month&apos;s figures</h3>
                                <p className="text-sm leading-7 text-[var(--text-muted)]">The totals appear here as you fill in the form.</p>
                            </div>

                            <div className="mt-6 space-y-5">
                                {breakdown && payrollSummary ? (
                                    <div className="space-y-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <SummaryRow label="Gross pay" value={`R ${payrollSummary.grossPay.toFixed(2)}`} accent />
                                        <SummaryRow label="UIF deducted from pay" value={`R ${payrollSummary.employeeUifDeduction.toFixed(2)}`} />
                                        <SummaryRow label="Pay to worker" value={`R ${payrollSummary.netPayToEmployee.toFixed(2)}`} accent />
                                        <SummaryRow label="UIF paid by employer" value={`R ${payrollSummary.employerUifContribution.toFixed(2)}`} />
                                        <SummaryRow label="Total employer cost" value={`R ${payrollSummary.employerTotalCost.toFixed(2)}`} accent />
                                    </div>
                                ) : (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-7 text-[var(--text-muted)]">
                                        Enter the pay details to see the figures here.
                                    </div>
                                )}

                                {breakdown && payrollSummary ? (
                                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowSummaryDetails((current) => !current)}
                                            className="flex w-full items-center justify-between gap-3 text-left"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text)]">Show pay breakdown</p>
                                                <p className="mt-1 text-sm text-[var(--text-muted)]">Open this to see how each amount was calculated.</p>
                                            </div>
                                            {showSummaryDetails ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                                        </button>
                                        {showSummaryDetails ? (
                                            <div className="mt-4 space-y-4">
                                                <div className="space-y-2">
                                                    <SummaryRow label={`Normal pay (${breakdown.effectiveOrdinaryHours}h)`} value={`R ${breakdown.ordinaryPay.toFixed(2)}`} />
                                                    {breakdown.overtimePay > 0 ? <SummaryRow label={`Overtime (${calculationInput?.overtimeHours ?? 0}h)`} value={`R ${breakdown.overtimePay.toFixed(2)}`} /> : null}
                                                    {breakdown.sundayPay > 0 ? <SummaryRow label={`Sunday (${calculationInput?.sundayHours ?? 0}h)`} value={`R ${breakdown.sundayPay.toFixed(2)}`} /> : null}
                                                    {breakdown.publicHolidayPay > 0 ? <SummaryRow label={`Public holiday (${calculationInput?.publicHolidayHours ?? 0}h)`} value={`R ${breakdown.publicHolidayPay.toFixed(2)}`} /> : null}
                                                    {breakdown.topUps.fourHourMinimumHours > 0 ? <SummaryRow label="Extra hours added for short shifts" value={`${breakdown.topUps.fourHourMinimumHours}h`} /> : null}
                                                    <SummaryRow label="Other deductions" value={`R ${breakdown.deductions.other.toFixed(2)}`} />
                                                    <SummaryRow label="Sunday pay rule" value={reviewSundayBasis} />
                                                    <SummaryRow label="Payslip month" value={format(monthBounds.end, "MMMM yyyy")} />
                                                </div>
                                                <OrdinaryWorkCalendarSummaryCard
                                                    summary={ordinaryCalendar}
                                                    ordinaryHoursPerDay={ORDINARY_HOURS_PER_DAY}
                                                    title="This month's normal days and hours"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div data-testid={`free-payslip-gate-${delivery.phase}`} className={`rounded-[1.25rem] border p-4 ${getNoticeStyles(delivery.tone)}`}>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            {delivery.tone === "success" ? (
                                                <BadgeCheck className="mt-0.5 h-5 w-5 text-[var(--success)]" />
                                            ) : delivery.tone === "danger" ? (
                                                <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
                                            ) : delivery.tone === "warning" ? (
                                                <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning)]" />
                                            ) : (
                                                <Mail className="mt-0.5 h-5 w-5 text-[var(--primary)]" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{gateCardTitle}</p>
                                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{FREE_PAYSLIP_RULE_MESSAGE}</p>
                                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{delivery.message || idleGateMessage}</p>
                                            </div>
                                        </div>

                                        {delivery.phase !== "success" ? (
                                            <>
                                                <TextField id="free-delivery-email" label="Email address">
                                                    <Input
                                                        id="free-delivery-email"
                                                        type="email"
                                                        value={deliveryEmail}
                                                        onChange={(event) => {
                                                            setDeliveryEmail(event.target.value);
                                                            if (delivery.phase !== "idle") {
                                                                resetDeliveryState();
                                                            }
                                                        }}
                                                        placeholder="name@example.com"
                                                    />
                                                </TextField>

                                                <label className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={marketingConsent}
                                                        onChange={(event) => setMarketingConsent(event.target.checked)}
                                                        className="mt-1 h-4 w-4 rounded border-[var(--border)]"
                                                    />
                                                    <span className="text-sm leading-6 text-[var(--text)]">
                                                        Send me a free monthly household employer checklist and tips. Unsubscribe anytime.
                                                    </span>
                                                </label>
                                            </>
                                        ) : null}

                                        {delivery.phase === "success" ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeliveryEmail("");
                                                    resetDeliveryState();
                                                }}
                                                className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                                            >
                                                Use another email
                                            </button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={() => void handleEmailPayslip()}
                                                disabled={delivery.phase === "sending"}
                                                className="w-full gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                            >
                                                {delivery.phase === "sending" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                                Email my free payslip
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    );
}
