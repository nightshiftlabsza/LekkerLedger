"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Save, Loader2, FileText, Clock, Banknote, Calendar, Home, ShieldAlert, CheckCircle2, BriefcaseBusiness, FileSignature } from "lucide-react";
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

function textList(value: string) {
    return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
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
}

const STORAGE_KEY = "lekkerledger-contract-draft-state";

export function ContractFormWizard({
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    employees,
    settings,
    saving,
    onSave,
    onBackToTop,
}: ContractFormWizardProps) {
    const selectedEmployee = employees.find((employee) => employee.id === formData.employeeId);
    const initialDuties = formData.duties?.join("\n") || "General cleaning\nLaundry\nBasic household support";
    const [dutiesInput, setDutiesInput] = React.useState(initialDuties);

    // Save to session storage on change to preserve state if navigating away
    React.useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep, formData }));
        } catch (error) {
            console.error("Failed to save wizard state to session storage", error);
        }
    }, [currentStep, formData]);

    // Calculate hourly rate for NMW check
    const isMonthly = formData.salary?.frequency === "Monthly";
    const isFortnightly = formData.salary?.frequency === "Fortnightly";
    const weeksPerYear = 52.14;
    const monthsPerYear = 12;

    let hourlyRate = 0;
    if (formData.salary?.amount && formData.workingHours?.daysPerWeek && formData.workingHours?.startAt && formData.workingHours?.endAt) {
        const start = formData.workingHours.startAt.split(":").map(Number);
        const end = formData.workingHours.endAt.split(":").map(Number);
        let hoursPerDay = (end[0] + end[1] / 60) - (start[0] + start[1] / 60);

        // Subtract break duration in hours
        if (formData.workingHours.breakDuration) {
            hoursPerDay -= formData.workingHours.breakDuration / 60;
        }

        const weeklyHours = hoursPerDay * formData.workingHours.daysPerWeek;

        if (weeklyHours > 0) {
            if (isMonthly) {
                const weeklyPay = (formData.salary.amount * monthsPerYear) / weeksPerYear;
                hourlyRate = weeklyPay / weeklyHours;
            } else if (isFortnightly) {
                const weeklyPay = formData.salary.amount / 2;
                hourlyRate = weeklyPay / weeklyHours;
            } else {
                // Weekly
                hourlyRate = formData.salary.amount / weeklyHours;
            }
        }
    }

    const handleNext = () => setCurrentStep((step) => Math.min(step + 1, WIZARD_STEPS.length - 1));
    const handleBack = () => setCurrentStep((step) => Math.max(step - 1, 0));

    return (
        <Card className="glass-panel border-none shadow-2xl overflow-hidden">
            <CardContent className="p-0">
                {currentStep === 0 && (
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[var(--text)]">Choose the employee</h3>
                                <p className="text-sm text-[var(--text-muted)]">This contract will use the employee’s saved details as the starting point.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {employees.map((employee) => (
                                <button
                                    key={employee.id}
                                    onClick={() => setFormData((current) => ({ ...current, employeeId: employee.id }))}
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
                        <Alert>
                            <FileSignature className="h-4 w-4" />
                            <AlertDescription>
                                Start with the employee you already saved. You will still be able to adjust the job terms, hours, pay, leave, and wording before the draft is saved.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Job title">
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(event) => setFormData((current) => ({ ...current, jobTitle: event.target.value }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                            <Field label="Effective date">
                                <input
                                    type="date"
                                    value={formData.effectiveDate}
                                    onChange={(event) => setFormData((current) => ({ ...current, effectiveDate: event.target.value }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                        </div>
                        <Field label="Employee address">
                            <input
                                type="text"
                                value={formData.employeeAddress || selectedEmployee?.address || ""}
                                onChange={(event) => setFormData((current) => ({ ...current, employeeAddress: event.target.value }))}
                                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                placeholder="Employee residential address"
                            />
                        </Field>
                        <Field label="Place of work">
                            <input
                                type="text"
                                value={formData.placeOfWork || ""}
                                onChange={(event) => setFormData((current) => ({ ...current, placeOfWork: event.target.value }))}
                                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                placeholder="Household address or main work location"
                            />
                        </Field>
                        <Field label="Main duties">
                            <textarea
                                value={dutiesInput}
                                onChange={(event) => {
                                    setDutiesInput(event.target.value);
                                    setFormData((current) => ({ ...current, duties: textList(event.target.value) }));
                                }}
                                className="min-h-[160px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
                                placeholder={"General cleaning\nLaundry\nChildcare support\nMeal preparation"}
                            />
                        </Field>
                        <Alert>
                            <BriefcaseBusiness className="h-4 w-4" />
                            <AlertDescription>
                                Keep this practical and specific. It is better to describe the real household duties than to leave them vague.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Days per week">
                                <input
                                    type="number"
                                    value={formData.workingHours?.daysPerWeek}
                                    onChange={(event) => setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, daysPerWeek: parseInt(event.target.value, 10) || 0 } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                            <Field label="Break (minutes)">
                                <input
                                    type="number"
                                    value={formData.workingHours?.breakDuration}
                                    onChange={(event) => setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, breakDuration: parseInt(event.target.value, 10) || 0 } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Work starts">
                                <input
                                    type="time"
                                    value={formData.workingHours?.startAt}
                                    onChange={(event) => setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, startAt: event.target.value } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                            <Field label="Work ends">
                                <input
                                    type="time"
                                    value={formData.workingHours?.endAt}
                                    onChange={(event) => setFormData((current) => ({ ...current, workingHours: { ...current.workingHours!, endAt: event.target.value } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Pay amount (R)">
                                <input
                                    type="number"
                                    value={formData.salary?.amount}
                                    onChange={(event) => setFormData((current) => ({ ...current, salary: { ...current.salary!, amount: parseFloat(event.target.value) || 0 } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                            <Field label="Pay frequency">
                                <select
                                    value={formData.salary?.frequency}
                                    onChange={(event) => setFormData((current) => ({ ...current, salary: { ...current.salary!, frequency: event.target.value as Contract["salary"]["frequency"] } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Fortnightly">Fortnightly</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                            </Field>
                        </div>

                        {hourlyRate > 0 && hourlyRate < 30.23 && (
                            <Alert variant="warning">
                                <AlertTitle>NMW Warning</AlertTitle>
                                <AlertDescription>
                                    The effective hourly rate based on these hours and pay is <strong>R{hourlyRate.toFixed(2)}/hr</strong>. The National Minimum Wage for 2026 is <strong>R30.23/hr</strong>. Please ensure you are compliant.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Annual leave days">
                                <input
                                    type="number"
                                    value={formData.leave?.annualDays}
                                    onChange={(event) => setFormData((current) => ({ ...current, leave: { ...current.leave!, annualDays: parseInt(event.target.value, 10) || 0 } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                            </Field>
                            <Field label="Sick leave days">
                                <input
                                    type="number"
                                    value={formData.leave?.sickDays}
                                    onChange={(event) => setFormData((current) => ({ ...current, leave: { ...current.leave!, sickDays: parseInt(event.target.value, 10) || 0 } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                />
                                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                    Usually 1 day per 26 days worked for the first 6 months, then 30 days over a 3-year cycle.
                                </p>
                            </Field>
                        </div>
                        <Alert>
                            <Banknote className="h-4 w-4" />
                            <AlertDescription>
                                Use the actual agreed pay arrangement here. If overtime, Sundays, public holidays, or accommodation need special wording, cover that in the next step.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Accommodation provided?">
                                <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={formData.terms?.accommodationProvided}
                                        onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, accommodationProvided: event.target.checked } }))}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm text-[var(--text)]">Yes, accommodation is part of this job</span>
                                </label>
                            </Field>
                            <Field label="Accommodation details">
                                <input
                                    type="text"
                                    value={formData.terms?.accommodationDetails}
                                    onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, accommodationDetails: event.target.value } }))}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] disabled:opacity-50"
                                    placeholder="Room details, utilities, deduction notes, or other accommodation terms"
                                    disabled={!formData.terms?.accommodationProvided}
                                />
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
                                onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, overtimeAgreement: event.target.value } }))}
                                className="min-h-[100px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
                            />
                        </Field>
                        <Field label="Sunday / public holiday wording">
                            <textarea
                                value={formData.terms?.sundayHolidayAgreement}
                                onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, sundayHolidayAgreement: event.target.value } }))}
                                className="min-h-[100px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
                            />
                        </Field>
                        <Field label="Notice wording">
                            <textarea
                                value={formData.terms?.noticeClause}
                                onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, noticeClause: event.target.value } }))}
                                className="min-h-[100px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
                            />
                        </Field>
                        <Alert>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertDescription>
                                This draft follows the labour sample structure, but it is still not legal advice. Make sure the wording matches the real arrangement before anyone signs.
                            </AlertDescription>
                        </Alert>
                        <label className="flex items-start gap-3 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.terms?.lawyerReviewAcknowledged}
                                onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, lawyerReviewAcknowledged: event.target.checked } }))}
                                className="mt-1 h-4 w-4"
                            />
                            <div>
                                <p className="text-sm font-bold text-[var(--text)]">I understand this draft must be verified</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    The next step saves the contract draft into Documents. Review the generated PDF carefully, then only sign a version you are comfortable with and keep that signed version with the employee’s records. If you can, have a South African labour lawyer review the final wording.
                                </p>
                            </div>
                        </label>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="p-8 space-y-6">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/55 p-6 space-y-5">
                            <h3 className="text-lg font-black text-[var(--text)]">Draft summary</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <SummaryRow icon={FileText} label="Employee" value={selectedEmployee?.name ?? "Not selected"} />
                                <SummaryRow icon={Calendar} label="Effective date" value={formData.effectiveDate ?? ""} />
                                <SummaryRow icon={Home} label="Place of work" value={formData.placeOfWork || "Not set"} />
                                <SummaryRow icon={Banknote} label="Pay" value={`R${formData.salary?.amount?.toFixed(2) ?? "0.00"} (${formData.salary?.frequency})`} />
                                <SummaryRow icon={Clock} label="Schedule" value={`${formData.workingHours?.daysPerWeek} days/week, ${formData.workingHours?.startAt} to ${formData.workingHours?.endAt}`} />
                                <SummaryRow icon={CheckCircle2} label="Lawyer review reminder" value={formData.terms?.lawyerReviewAcknowledged ? "Acknowledged" : "Still needs acknowledgement"} />
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">What happens next</p>
                                <p className="text-sm text-[var(--text)]">
                                    Generating creates a draft contract in Documents. From there, you can preview the PDF, download it, talk through the wording with the employee, and only sign the final version you are happy with.
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Template version {CONTRACT_TEMPLATE_META.versionLabel} · Last updated {CONTRACT_TEMPLATE_META.updatedAtLabel}
                                </p>
                            </div>

                            {!formData.terms?.lawyerReviewAcknowledged && (
                                <Alert variant="warning">
                                    <AlertTitle>One step remaining before you can generate</AlertTitle>
                                    <AlertDescription>
                                        <p className="mb-3">You haven&apos;t confirmed the review reminder on the Terms step. Go back and tick the acknowledgement — it only takes a second.</p>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentStep(4)}>
                                            ← Back to Terms
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-2)]/45 p-6">
                    <Button variant="ghost" onClick={currentStep === 0 ? onBackToTop : handleBack} disabled={saving}>{currentStep === 0 ? "Back" : "Previous"}</Button>
                    {currentStep === WIZARD_STEPS.length - 1 ? (
                        <Button
                            onClick={onSave}
                            disabled={saving || !formData.terms?.lawyerReviewAcknowledged}
                            className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Generating..." : "Generate draft"}
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
