"use client";

import * as React from "react";
import { ArrowRight, Save, Loader2, FileText, Clock, Banknote, Calendar, Home, CheckCircle2, BriefcaseBusiness, Info, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Contract, Employee, EmployerSettings } from "@/lib/schema";
import { CONTRACT_TEMPLATE_META } from "@/src/config/contract-template";

export const WIZARD_STEPS = [
    { label: "Employee", description: "Choose the worker" },
    { label: "Parties", description: "Job and workplace" },
    { label: "Hours", description: "Schedule" },
    { label: "Pay", description: "Pay and leave" },
    { label: "Terms", description: "Key clauses" },
    { label: "Review", description: "Final check" },
];

const TERMS_TEXT_LIMIT = 1000;

type StepErrorMap = Partial<Record<
    | "employeeId"
    | "jobTitle"
    | "effectiveDate"
    | "placeOfWork"
    | "duties"
    | "daysPerWeek"
    | "startAt"
    | "endAt"
    | "workdayRange"
    | "salaryAmount"
    | "salaryFrequency"
    | "accommodationDetails",
    string
>>;

function textList(value: string) {
    return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalisePlainText(value: string) {
    return value
        .replace(/\r\n?/g, "\n")
        .replace(/\u00A0/g, " ")
        .replace(/\u2028|\u2029/g, "\n");
}

function insertPlainTextAtCursor(
    event: React.ClipboardEvent<HTMLTextAreaElement>,
    currentValue: string,
    onChange: (nextValue: string) => void,
    maxLength: number,
) {
    event.preventDefault();
    const pasted = normalisePlainText(event.clipboardData.getData("text/plain"));
    const target = event.currentTarget;
    const start = target.selectionStart ?? currentValue.length;
    const end = target.selectionEnd ?? currentValue.length;
    const nextValue = `${currentValue.slice(0, start)}${pasted}${currentValue.slice(end)}`.slice(0, maxLength);
    const cursorPosition = Math.min(start + pasted.length, nextValue.length);

    onChange(nextValue);

    window.requestAnimationFrame(() => {
        target.setSelectionRange(cursorPosition, cursorPosition);
    });
}

export interface ContractFormWizardProps {
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    formData: Partial<Contract>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Contract>>>;
    employees: Employee[];
    settings: EmployerSettings;
    saving: boolean;
    onSave: () => void;
    onBackToTop: () => void;
    skipEmployeeStep?: boolean;
    totalVisibleSteps?: number;
    /** Custom label for save button when editing (e.g. "Update draft") */
    saveLabel?: string;
}

const STORAGE_KEY = "lekkerledger-contract-draft-state";

// Styled date input with calendar icon
function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-11 pl-4 pr-10 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--focus)]"
                style={{ colorScheme: "light" }}
            />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        </div>
    );
}

// Styled time input — uses native picker only (no decorative icon overlay to avoid duplicate clocks)
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-11 pl-4 pr-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--focus)] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"
            style={{ colorScheme: "light" }}
            aria-label="Time"
        />
    );
}

// Label with optional ⓘ tooltip — hover or click to show SA labour-law hints
function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
    const [open, setOpen] = React.useState(false);
    const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const ref = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    if (!tooltip) {
        return (
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
        );
    }

    return (
        <span
            className="flex items-center gap-1.5 relative"
            ref={ref}
            onMouseEnter={() => {
                hoverTimer.current = setTimeout(() => setOpen(true), 200);
            }}
            onMouseLeave={() => {
                if (hoverTimer.current) {
                    clearTimeout(hoverTimer.current);
                    hoverTimer.current = null;
                }
                setOpen(false);
            }}
        >
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold cursor-help select-none shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-1"
                style={{ color: "var(--primary)", border: "1.5px solid var(--primary)", lineHeight: 1 }}
                aria-label={`Info about ${label}`}
                aria-expanded={open}
            >
                i
            </button>
            {open && (
                <span
                    role="tooltip"
                    className="absolute left-0 top-full mt-1.5 z-50 max-w-[280px] rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-xs leading-relaxed text-[var(--text)] shadow-lg"
                    style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                >
                    {tooltip}
                </span>
            )}
        </span>
    );
}

export function ContractFormWizard({
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    employees,
    saving,
    onSave,
    onBackToTop,
    skipEmployeeStep = false,
    saveLabel = "Generate draft",
}: ContractFormWizardProps) {
    const selectedEmployee = employees.find((employee) => employee.id === formData.employeeId);
    const initialDuties = formData.duties?.join("\n") || "General cleaning\nLaundry\nBasic household support";
    const [dutiesInput, setDutiesInput] = React.useState(initialDuties);
    const [stepErrors, setStepErrors] = React.useState<StepErrorMap>({});

    // Save to session storage on change
    React.useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep, formData }));
        } catch (error) {
            console.error("Failed to save wizard state to session storage", error);
        }
    }, [currentStep, formData]);

    // Hourly rate calculation for NMW check
    const isMonthly = formData.salary?.frequency === "Monthly";
    const isFortnightly = formData.salary?.frequency === "Fortnightly";
    const weeksPerYear = 52.14;
    const monthsPerYear = 12;

    let hourlyRate = 0;
    if (formData.salary?.amount && formData.workingHours?.daysPerWeek && formData.workingHours?.startAt && formData.workingHours?.endAt) {
        const start = formData.workingHours.startAt.split(":").map(Number);
        const end = formData.workingHours.endAt.split(":").map(Number);
        let hoursPerDay = (end[0] + end[1] / 60) - (start[0] + start[1] / 60);
        if (formData.workingHours.breakDuration) {
            hoursPerDay -= formData.workingHours.breakDuration / 60;
        }
        const weeklyHours = hoursPerDay * formData.workingHours.daysPerWeek;
        if (weeklyHours > 0) {
            if (isMonthly) {
                const weeklyPay = (formData.salary.amount * monthsPerYear) / weeksPerYear;
                hourlyRate = weeklyPay / weeklyHours;
            } else if (isFortnightly) {
                hourlyRate = (formData.salary.amount / 2) / weeklyHours;
            } else {
                hourlyRate = formData.salary.amount / weeklyHours;
            }
        }
    }

    const payFrequencyLabel = formData.salary?.frequency === "Monthly" ? "month"
        : formData.salary?.frequency === "Fortnightly" ? "fortnight"
        : "week";
    const clearError = React.useCallback((field: keyof StepErrorMap) => {
        setStepErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    }, []);

    const updateTermsText = React.useCallback(
        (field: "overtimeAgreement" | "sundayHolidayAgreement" | "noticeClause", value: string) => {
            setFormData((current) => ({
                ...current,
                terms: {
                    ...current.terms!,
                    [field]: value.slice(0, TERMS_TEXT_LIMIT),
                },
            }));
        },
        [setFormData],
    );

    const validateStep = React.useCallback(() => {
        const nextErrors: StepErrorMap = {};

        if (currentStep === 0 && !skipEmployeeStep && !formData.employeeId) {
            nextErrors.employeeId = "Choose the worker before you continue.";
        }

        if (currentStep === 1) {
            if (!formData.jobTitle?.trim()) nextErrors.jobTitle = "Add the job title for this contract.";
            if (!formData.effectiveDate?.trim()) nextErrors.effectiveDate = "Choose the date this draft should start from.";
            if (!formData.placeOfWork?.trim()) nextErrors.placeOfWork = "Add the place of work so the draft stays clear.";
            if (textList(dutiesInput).length === 0) nextErrors.duties = "Add at least one duty for the employee.";
        }

        if (currentStep === 2) {
            const daysPerWeek = Number(formData.workingHours?.daysPerWeek ?? 0);
            if (!Number.isFinite(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
                nextErrors.daysPerWeek = "Enter how many days per week they normally work.";
            }
            if (!formData.workingHours?.startAt) nextErrors.startAt = "Add the normal start time.";
            if (!formData.workingHours?.endAt) nextErrors.endAt = "Add the normal end time.";
            if (formData.workingHours?.startAt && formData.workingHours?.endAt && formData.workingHours.endAt <= formData.workingHours.startAt) {
                nextErrors.workdayRange = "End time must be later than start time.";
            }
        }

        if (currentStep === 3) {
            const amount = Number(formData.salary?.amount ?? 0);
            if (!Number.isFinite(amount) || amount <= 0) nextErrors.salaryAmount = "Enter the agreed pay amount before you continue.";
            if (!formData.salary?.frequency) nextErrors.salaryFrequency = "Choose how often this pay amount applies.";
        }

        if (currentStep === 4 && formData.terms?.accommodationProvided && !formData.terms.accommodationDetails?.trim()) {
            nextErrors.accommodationDetails = "Add the accommodation details or switch this off.";
        }

        setStepErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [currentStep, dutiesInput, formData, skipEmployeeStep]);

    const handleNext = () => {
        if (!validateStep()) return;
        setCurrentStep((step) => Math.min(step + 1, WIZARD_STEPS.length - 1));
    };
    const handleBack = () => setCurrentStep((step) => Math.max(step - 1, 0));

    return (
        <Card className="glass-panel border-none shadow-2xl overflow-hidden">
            <CardContent className="p-0">
                {/* ── Step 0: Employee selection (only shown when not pre-selected) ── */}
                {currentStep === 0 && !skipEmployeeStep && (
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-3">
                            {employees.map((employee) => (
                                <button
                                    key={employee.id}
                                    onClick={() => {
                                        clearError("employeeId");
                                        setFormData((current) => ({ ...current, employeeId: employee.id }));
                                    }}
                                    className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${formData.employeeId === employee.id ? "border-[var(--primary)] bg-[var(--primary)]/6" : "border-[var(--border)] hover:border-[var(--primary)]/25"}`}
                                >
                                    <div>
                                        <p className="font-bold text-[var(--text)]">{employee.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{employee.role}</p>
                                    </div>
                                    {formData.employeeId === employee.id && <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" />}
                                </button>
                            ))}
                        </div>
                        {stepErrors.employeeId ? <FieldError message={stepErrors.employeeId} /> : null}
                    </div>
                )}

                {/* ── Step 1: Parties ── */}
                {currentStep === 1 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Job title">
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(event) => {
                                        clearError("jobTitle");
                                        setFormData((current) => ({ ...current, jobTitle: event.target.value }));
                                    }}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                />
                                {stepErrors.jobTitle ? <FieldError message={stepErrors.jobTitle} /> : null}
                            </Field>
                            <Field label="Effective date">
                                <DateInput
                                    value={formData.effectiveDate ?? ""}
                                    onChange={(v) => {
                                        clearError("effectiveDate");
                                        setFormData((current) => ({ ...current, effectiveDate: v }));
                                    }}
                                />
                                {stepErrors.effectiveDate ? <FieldError message={stepErrors.effectiveDate} /> : null}
                            </Field>
                        </div>
                        <Field label="Employee address">
                            <input
                                type="text"
                                value={formData.employeeAddress || selectedEmployee?.address || ""}
                                onChange={(event) => setFormData((current) => ({ ...current, employeeAddress: event.target.value }))}
                                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                placeholder="Employee residential address"
                            />
                        </Field>
                        <Field label="Place of work">
                            <input
                                type="text"
                                value={formData.placeOfWork || ""}
                                onChange={(event) => {
                                    clearError("placeOfWork");
                                    setFormData((current) => ({ ...current, placeOfWork: event.target.value }));
                                }}
                                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                placeholder="Household address or main work location"
                            />
                            {stepErrors.placeOfWork ? <FieldError message={stepErrors.placeOfWork} /> : null}
                        </Field>
                        <Field label="Main duties">
                            <textarea
                                value={dutiesInput}
                                onChange={(event) => {
                                    clearError("duties");
                                    setDutiesInput(event.target.value);
                                    setFormData((current) => ({ ...current, duties: textList(event.target.value) }));
                                }}
                                className="min-h-[160px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] p-4 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                placeholder={"General cleaning\nLaundry\nChildcare support\nMeal preparation"}
                            />
                            {stepErrors.duties ? <FieldError message={stepErrors.duties} /> : null}
                        </Field>
                        <Alert>
                            <BriefcaseBusiness className="h-4 w-4" />
                            <AlertDescription>
                                Keep this practical and specific. It is better to describe the real household duties than to leave them vague.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* ── Step 2: Hours ── */}
                {currentStep === 2 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Days per week">
                                <input
                                    type="number"
                                    value={formData.workingHours?.daysPerWeek}
                                    onChange={(event) => {
                                        clearError("daysPerWeek");
                                        setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, daysPerWeek: parseInt(event.target.value, 10) || 0 } }));
                                    }}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                    min={1} max={7}
                                />
                                {stepErrors.daysPerWeek ? <FieldError message={stepErrors.daysPerWeek} /> : null}
                            </Field>
                            <Field label="Break (minutes)">
                                <input
                                    type="number"
                                    value={formData.workingHours?.breakDuration}
                                    onChange={(event) => setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, breakDuration: parseInt(event.target.value, 10) || 0 } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                    min={0}
                                />
                            </Field>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Work starts">
                                <TimeInput
                                    value={formData.workingHours?.startAt ?? ""}
                                    onChange={(v) => {
                                        clearError("startAt");
                                        clearError("workdayRange");
                                        setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, startAt: v } }));
                                    }}
                                />
                                {stepErrors.startAt ? <FieldError message={stepErrors.startAt} /> : null}
                            </Field>
                            <Field label="Work ends">
                                <TimeInput
                                    value={formData.workingHours?.endAt ?? ""}
                                    onChange={(v) => {
                                        clearError("endAt");
                                        clearError("workdayRange");
                                        setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, endAt: v } }));
                                    }}
                                />
                                {stepErrors.endAt ? <FieldError message={stepErrors.endAt} /> : null}
                            </Field>
                        </div>
                        {stepErrors.workdayRange ? <FieldError message={stepErrors.workdayRange} /> : null}
                    </div>
                )}

                {/* ── Step 3: Pay ── */}
                {currentStep === 3 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    Pay amount (R / {payFrequencyLabel})
                                </label>
                                <input
                                    type="number"
                                    value={formData.salary?.amount || ""}
                                    onChange={(event) => {
                                        clearError("salaryAmount");
                                        setFormData((current) => ({ ...current, salary: { ...current.salary!, amount: parseFloat(event.target.value) || 0 } }));
                                    }}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                    placeholder="e.g. 5500"
                                    min={0}
                                />
                                {stepErrors.salaryAmount ? <FieldError message={stepErrors.salaryAmount} /> : null}
                                {hourlyRate > 0 && (
                                    <p className="text-[11px] text-[var(--text-muted)]">≈ R{hourlyRate.toFixed(2)}/hr based on hours entered</p>
                                )}
                            </div>
                            <Field label="Pay frequency">
                                <select
                                    value={formData.salary?.frequency}
                                    onChange={(event) => {
                                        clearError("salaryFrequency");
                                        clearError("salaryAmount");
                                        setFormData((current) => ({
                                            ...current,
                                            salary: {
                                                ...current.salary!,
                                                frequency: event.target.value as Contract["salary"]["frequency"],
                                                amount: 0,
                                            },
                                        }));
                                    }}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Fortnightly">Fortnightly</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                                {stepErrors.salaryFrequency ? <FieldError message={stepErrors.salaryFrequency} /> : null}
                                <p className="text-[11px] text-[var(--text-muted)]">Changing frequency clears the old amount so you can enter the new agreement safely.</p>
                            </Field>
                        </div>

                        {hourlyRate > 0 && hourlyRate < 30.23 && (
                            <Alert variant="warning">
                                <AlertTitle>NMW Warning</AlertTitle>
                                <AlertDescription>
                                    The effective hourly rate is <strong>R{hourlyRate.toFixed(2)}/hr</strong>. The National Minimum Wage for 2026 is <strong>R30.23/hr</strong>. Please ensure you are compliant.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <FieldLabel
                                    label="Annual leave days"
                                    tooltip="Under the BCEA, the minimum is 21 consecutive calendar days per leave cycle (for workers on a 5-day week). You may grant more."
                                />
                                <input
                                    type="number"
                                    value={formData.leave?.annualDays ?? ""}
                                    onChange={(event) => setFormData((current) => ({ ...current, leave: { ...current.leave!, annualDays: parseInt(event.target.value, 10) || (undefined as unknown as number) } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                    placeholder="e.g. 21"
                                    min={0}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel
                                    label="Sick leave days"
                                    tooltip="The BCEA gives employees 30 working days per 3-year sick leave cycle. In the first 6 months of employment: 1 day per 26 days worked."
                                />
                                <input
                                    type="number"
                                    value={formData.leave?.sickDays ?? ""}
                                    onChange={(event) => setFormData((current) => ({ ...current, leave: { ...current.leave!, sickDays: parseInt(event.target.value, 10) || (undefined as unknown as number) } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                    placeholder="e.g. 30"
                                    min={0}
                                />
                            </div>
                        </div>
                        <Alert>
                            <Banknote className="h-4 w-4" />
                            <AlertDescription>
                                Use the actual agreed pay arrangement here. If overtime, Sundays, public holidays, or accommodation need special wording, cover that in the next step.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* ── Step 4: Terms ── */}
                {currentStep === 4 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Accommodation provided?">
                                <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={formData.terms?.accommodationProvided}
                                        onChange={(event) => {
                                            clearError("accommodationDetails");
                                            setFormData((current) => ({ ...current, terms: { ...current.terms!, accommodationProvided: event.target.checked } }));
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm text-[var(--text)]">Yes, accommodation is part of this job</span>
                                </label>
                            </Field>
                            <Field label="Accommodation details">
                                <input
                                    type="text"
                                    value={formData.terms?.accommodationDetails}
                                    onChange={(event) => {
                                        clearError("accommodationDetails");
                                        setFormData((current) => ({ ...current, terms: { ...current.terms!, accommodationDetails: event.target.value } }));
                                    }}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                                    placeholder="Room details, utilities, deduction notes"
                                    disabled={!formData.terms?.accommodationProvided}
                                />
                                {stepErrors.accommodationDetails ? <FieldError message={stepErrors.accommodationDetails} /> : null}
                            </Field>
                        </div>
                        {formData.terms?.accommodationProvided && (
                            <Alert variant="warning">
                                <AlertTitle>Deduction Limit</AlertTitle>
                                <AlertDescription>
                                    Under Sectoral Determination 7, any accommodation deduction is capped at <strong>10%</strong> of the employee&apos;s wage.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Field label="Overtime wording">
                            <textarea
                                value={formData.terms?.overtimeAgreement}
                                onChange={(event) => updateTermsText("overtimeAgreement", event.target.value)}
                                onPaste={(event) => insertPlainTextAtCursor(event, formData.terms?.overtimeAgreement ?? "", (nextValue) => updateTermsText("overtimeAgreement", nextValue), TERMS_TEXT_LIMIT)}
                                maxLength={TERMS_TEXT_LIMIT}
                                className="min-h-[100px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] p-4 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                            />
                            <p className="text-[11px] text-[var(--text-muted)]">{TERMS_TEXT_LIMIT - (formData.terms?.overtimeAgreement?.length ?? 0)} characters left</p>
                        </Field>
                        <Field label="Sunday / public holiday wording">
                            <textarea
                                value={formData.terms?.sundayHolidayAgreement}
                                onChange={(event) => updateTermsText("sundayHolidayAgreement", event.target.value)}
                                onPaste={(event) => insertPlainTextAtCursor(event, formData.terms?.sundayHolidayAgreement ?? "", (nextValue) => updateTermsText("sundayHolidayAgreement", nextValue), TERMS_TEXT_LIMIT)}
                                maxLength={TERMS_TEXT_LIMIT}
                                className="min-h-[100px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] p-4 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                            />
                            <p className="text-[11px] text-[var(--text-muted)]">{TERMS_TEXT_LIMIT - (formData.terms?.sundayHolidayAgreement?.length ?? 0)} characters left</p>
                        </Field>
                        <Field label="Notice wording">
                            <textarea
                                value={formData.terms?.noticeClause}
                                onChange={(event) => updateTermsText("noticeClause", event.target.value)}
                                onPaste={(event) => insertPlainTextAtCursor(event, formData.terms?.noticeClause ?? "", (nextValue) => updateTermsText("noticeClause", nextValue), TERMS_TEXT_LIMIT)}
                                maxLength={TERMS_TEXT_LIMIT}
                                className="min-h-[100px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] p-4 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                            />
                            <p className="text-[11px] text-[var(--text-muted)]">{TERMS_TEXT_LIMIT - (formData.terms?.noticeClause?.length ?? 0)} characters left</p>
                        </Field>

                        {/* Single unified acknowledgement — replaces the two separate disclaimers */}
                        <label className="flex items-start gap-3 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.terms?.lawyerReviewAcknowledged}
                                onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, lawyerReviewAcknowledged: event.target.checked } }))}
                                className="mt-1 h-4 w-4 shrink-0"
                            />
                            <div>
                                <p className="text-sm font-bold text-[var(--text)]">I understand this is a draft, not legal advice</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    This template follows the DEL domestic-worker sample structure. I will review the full document carefully with the employee before anyone signs, and I understand the wording must match the real arrangement. If unsure about the final wording, I will consult a South African labour lawyer before signing.
                                </p>
                            </div>
                        </label>
                    </div>
                )}

                {/* ── Step 5: Review ── */}
                {currentStep === 5 && (
                    <div className="p-8 space-y-6">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/55 p-6 space-y-5">
                            <h3 className="text-lg font-black text-[var(--text)]">Draft summary</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <SummaryRow icon={FileText} label="Employee" value={selectedEmployee?.name ?? "Not selected"} />
                                <SummaryRow icon={Calendar} label="Effective date" value={formData.effectiveDate ?? ""} />
                                <SummaryRow icon={Home} label="Place of work" value={formData.placeOfWork || "Not set"} />
                                <SummaryRow icon={Banknote} label="Pay" value={`R${formData.salary?.amount?.toFixed(2) ?? "0.00"} / ${payFrequencyLabel}`} />
                                <SummaryRow icon={Clock} label="Schedule" value={`${formData.workingHours?.daysPerWeek} days/week, ${formData.workingHours?.startAt} to ${formData.workingHours?.endAt}`} />
                                <SummaryRow icon={CheckCircle2} label="Review acknowledgement" value={formData.terms?.lawyerReviewAcknowledged ? "Confirmed" : "Not yet confirmed"} />
                            </div>

                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">What happens next</p>
                                <p className="text-sm text-[var(--text)]">
                                    Generating creates a draft contract in Documents. From there, you can preview the PDF, download it, discuss the wording with the employee, and only sign a version you are both happy with.
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Template version {CONTRACT_TEMPLATE_META.versionLabel} · Last updated {CONTRACT_TEMPLATE_META.updatedAtLabel}
                                </p>
                            </div>

                            {/* Disclaimer */}
                            <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
                                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--text-muted)]" />
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                    This draft does not constitute legal advice. Review the PDF carefully before signing and keep the signed copy with the employee&apos;s records.
                                </p>
                            </div>

                            {!formData.terms?.lawyerReviewAcknowledged && (
                                <Alert variant="warning">
                                    <AlertTitle>One step remaining</AlertTitle>
                                    <AlertDescription>
                                        <p className="mb-3">You haven&apos;t confirmed the review acknowledgement on the Terms step.</p>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentStep(4)}>
                                            ← Back to Terms
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Navigation footer ── */}
                <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-2)]/45 p-6">
                    <Button
                        variant="ghost"
                        onClick={currentStep === 0 || (skipEmployeeStep && currentStep === 1) ? onBackToTop : handleBack}
                        disabled={saving}
                    >
                        {currentStep === 0 || (skipEmployeeStep && currentStep === 1) ? "Cancel" : "Previous"}
                    </Button>
                    {currentStep === WIZARD_STEPS.length - 1 ? (
                        <Button
                            onClick={onSave}
                            disabled={saving || !formData.terms?.lawyerReviewAcknowledged}
                            className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? (saveLabel.startsWith("Update") ? "Updating..." : "Generating...") : saveLabel}
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] gap-2">
                            Next <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
            {children}
        </div>
    );
}

function SummaryRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-1)] text-[var(--primary)]">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--text)]">{value}</p>
            </div>
        </div>
    );
}

function FieldError({ message }: { message: string }) {
    return <p className="text-sm font-medium text-[var(--danger)]">{message}</p>;
}
