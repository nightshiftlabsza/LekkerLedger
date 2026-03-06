"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Loader2, FileText, Clock, Banknote, Calendar, Home, ShieldAlert, CheckCircle2, BriefcaseBusiness, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Stepper } from "@/components/ui/stepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getEmployees, saveContract, getSettings } from "@/lib/storage";
import { Contract, Employee, EmployerSettings } from "@/lib/schema";

const STEPS = [
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

export default function NewContractPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const employeeIdParam = searchParams.get("employeeId");

    const [currentStep, setCurrentStep] = React.useState(0);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [dutiesInput, setDutiesInput] = React.useState("General cleaning\nLaundry\nBasic household support");

    const [formData, setFormData] = React.useState<Partial<Contract>>({
        status: "draft",
        version: 1,
        jobTitle: "Domestic worker",
        placeOfWork: "",
        duties: ["General cleaning", "Laundry", "Basic household support"],
        workingHours: {
            daysPerWeek: 5,
            startAt: "08:00",
            endAt: "17:00",
            breakDuration: 60,
        },
        salary: {
            amount: 0,
            frequency: "Monthly",
        },
        leave: {
            annualDays: 21,
            sickDays: 30,
        },
        terms: {
            accommodationProvided: false,
            accommodationDetails: "",
            overtimeAgreement: "Any overtime must be agreed in advance and paid according to the BCEA.",
            sundayHolidayAgreement: "Sunday and public-holiday work must be agreed in advance and paid at the correct rate.",
            noticeClause: "Notice periods follow the BCEA and should be given in writing.",
            lawyerReviewAcknowledged: false,
        },
        effectiveDate: new Date().toISOString().split("T")[0],
    });

    React.useEffect(() => {
        async function load() {
            const [employeeRows, employerSettings] = await Promise.all([getEmployees(), getSettings()]);
            setEmployees(employeeRows);
            setSettings(employerSettings);

            const selectedEmployee = employeeRows.find((employee) => employee.id === employeeIdParam) || employeeRows[0];
            if (selectedEmployee) {
                setFormData((current) => ({
                    ...current,
                    employeeId: selectedEmployee.id,
                    jobTitle: current.jobTitle || selectedEmployee.role || "Domestic worker",
                    placeOfWork: current.placeOfWork || employerSettings.employerAddress || "",
                    salary: {
                        ...current.salary!,
                        amount: current.salary?.amount || Number((selectedEmployee.hourlyRate * 195).toFixed(2)),
                    },
                }));
            }
            setLoading(false);
        }
        load();
    }, [employeeIdParam]);

    const selectedEmployee = employees.find((employee) => employee.id === formData.employeeId);

    const handleNext = () => setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
    const handleBack = () => setCurrentStep((step) => Math.max(step - 1, 0));

    const handleSave = async () => {
        if (!selectedEmployee || !settings) return;
        setSaving(true);
        try {
            const contract: Contract = {
                id: crypto.randomUUID(),
                householdId: selectedEmployee.householdId ?? "default",
                employeeId: selectedEmployee.id,
                status: "draft",
                version: formData.version ?? 1,
                effectiveDate: formData.effectiveDate!,
                jobTitle: formData.jobTitle!,
                placeOfWork: formData.placeOfWork || settings.employerAddress || "",
                duties: textList(dutiesInput),
                workingHours: formData.workingHours!,
                salary: formData.salary!,
                leave: formData.leave!,
                terms: formData.terms!,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await saveContract(contract);
            router.push("/documents?tab=contracts");
        } catch (error) {
            console.error(error);
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => currentStep === 0 ? router.back() : handleBack()}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> {currentStep === 0 ? "Back" : "Previous step"}
                </button>
            </div>

            <div className="space-y-3">
                <PageHeader
                    title="Employment contract"
                    subtitle="Work through the actual job terms first, then save a draft PDF to review before anyone signs."
                />
                <Stepper steps={STEPS} currentStep={currentStep} className="py-4" />
            </div>

            <Alert variant="warning">
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                    This generator follows the Department of Employment and Labour domestic-worker sample structure, but it is still only a draft. Review it with the employee carefully, and if you can, have the final wording checked by a South African labour lawyer before signing.
                        </AlertDescription>
                    </Alert>

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
                            <Field label="Place of work">
                                <input
                                    type="text"
                                    value={formData.placeOfWork}
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
                                    <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.terms?.accommodationProvided}
                                            onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, accommodationProvided: event.target.checked } }))}
                                        />
                                        <span className="text-sm text-[var(--text)]">Yes, accommodation is part of this job</span>
                                    </label>
                                </Field>
                                <Field label="Accommodation details">
                                    <input
                                        type="text"
                                        value={formData.terms?.accommodationDetails}
                                        onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, accommodationDetails: event.target.value } }))}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
                                        placeholder="Room details, utilities, deduction notes, or other accommodation terms"
                                    />
                                </Field>
                            </div>
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
                            <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                <input
                                    type="checkbox"
                                    checked={formData.terms?.lawyerReviewAcknowledged}
                                    onChange={(event) => setFormData((current) => ({ ...current, terms: { ...current.terms!, lawyerReviewAcknowledged: event.target.checked } }))}
                                />
                                <div>
                                    <p className="text-sm font-bold text-[var(--text)]">I understand this draft should be checked before signing</p>
                                    <p className="text-xs text-[var(--text-muted)]">If you can, have a South African labour lawyer review the final wording.</p>
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
                                        Saving creates a draft contract in Documents. From there, you can preview the PDF, download it, talk through the wording with the employee, and only sign the final version you are happy with.
                                    </p>
                                </div>
                                <Alert variant="warning">
                                    <AlertTitle>Before using this</AlertTitle>
                                    <AlertDescription>
                                        The next step saves the contract draft into Documents. Review the generated PDF carefully, then only sign a version you are comfortable with and keep that signed version with the employee’s records.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-2)]/45 p-6">
                        <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0 || saving}>Back</Button>
                        {currentStep === STEPS.length - 1 ? (
                            <Button
                                onClick={handleSave}
                                disabled={saving || !formData.terms?.lawyerReviewAcknowledged}
                                className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] gap-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? "Saving..." : "Save draft to Documents"}
                            </Button>
                        ) : (
                            <Button onClick={handleNext} className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] gap-2">
                                Next <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
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
