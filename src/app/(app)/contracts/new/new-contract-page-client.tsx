"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { Stepper } from "@/components/ui/stepper";
import { getEmployees, saveContract, getSettings } from "@/lib/storage";
import { Contract, Employee, EmployerSettings } from "@/lib/schema";
import { canUseContractGenerator, getUserPlan } from "@/lib/entitlements";
import { CONTRACT_TEMPLATE_META } from "@/src/config/contract-template";
import { ContractFormWizard, WIZARD_STEPS } from "@/components/contracts/ContractFormWizard";

const STEPS_WITHOUT_EMPLOYEE = WIZARD_STEPS.slice(1);

export function NewContractPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const employeeIdParam = searchParams.get("employeeId");
    const skipEmployeeStep = Boolean(employeeIdParam);

    const [currentStep, setCurrentStep] = React.useState(0);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState<string | null>(null);

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
        salary: {} as unknown as Contract["salary"],
        leave: {
            annualDays: undefined as unknown as number,
            sickDays: undefined as unknown as number,
        },
        terms: {
            accommodationProvided: false,
            accommodationDetails: "",
            overtimeAgreement:
                "Any overtime must be agreed in advance. Overtime is limited to a maximum of 3 hours per day and 10 hours per week (no more than 55 total hours including ordinary hours) and is paid at 1.5 times the ordinary hourly wage, in line with the BCEA and Sectoral Determination 7 for domestic workers.",
            sundayHolidayAgreement:
                "Sunday and public-holiday work must be agreed in advance. If Sunday is not part of the employee's ordinary hours, work on Sunday is paid at twice (2x) the ordinary wage; if Sunday is part of the ordinary hours, it is paid at 1.5 times the ordinary wage. Work on public holidays is paid at twice (2x) the ordinary daily wage, in line with the BCEA and Sectoral Determination 7.",
            noticeClause:
                "Either party may terminate employment by giving written notice. If the employee has been employed for 6 months or less, at least 1 week's written notice is required; after 6 months, at least 4 weeks' written notice is required, in line with Sectoral Determination 7 for domestic workers. Notice may not be given during any period of leave except as allowed by the BCEA. If employment ends for operational requirements, the employee will receive severance pay of at least 1 week's remuneration for each completed year of continuous service, and any outstanding wages and accrued annual leave will be paid out.",
            paymentDetails: "",
            lawyerReviewAcknowledged: false,
        },
        effectiveDate: new Date().toISOString().split("T")[0],
    });

    React.useEffect(() => {
        let active = true;
        async function load() {
            const [employeeRows, employerSettings] = await Promise.all([getEmployees(), getSettings()]);
            if (!active) return;
            setEmployees(employeeRows);
            setSettings(employerSettings);

            let restoredData = null;
            let restoredStep = 0;
            try {
                const stored = sessionStorage.getItem("lekkerledger-contract-draft-state");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    restoredData = parsed.formData;
                    restoredStep = parsed.currentStep;
                }
            } catch {
                // Ignore parse errors
            }

            if (restoredData) {
                setFormData(restoredData);
                setCurrentStep(restoredStep);
            } else {
                const selectedEmployee = employeeRows.find((employee) => employee.id === employeeIdParam) || (skipEmployeeStep ? employeeRows[0] : undefined);
                if (selectedEmployee) {
                    setFormData((current) => ({
                        ...current,
                        employeeId: selectedEmployee.id,
                        jobTitle: current.jobTitle || selectedEmployee.role || "Domestic worker",
                        placeOfWork: current.placeOfWork || employerSettings.employerAddress || "",
                    }));
                }
                setCurrentStep(0);
            }
            setLoading(false);
        }
        void load();
        return () => {
            active = false;
        };
    }, [employeeIdParam, skipEmployeeStep]);

    const selectedEmployee = employees.find((employee) => employee.id === formData.employeeId);
    const wizardStepIndex = skipEmployeeStep ? currentStep + 1 : currentStep;

    const handleSave = async () => {
        if (!selectedEmployee || !settings) return;

        const missing: string[] = [];
        if (!settings.employerName?.trim()) missing.push("employer name");
        if (!settings.employerAddress?.trim()) missing.push("employer address");
        if (!settings.employerIdNumber?.trim()) missing.push("employer ID / registration number");

        const resolvedEmployeeAddress = (formData.employeeAddress || selectedEmployee.address || "").trim();
        if (!resolvedEmployeeAddress) missing.push("employee residential address");

        if (missing.length > 0) {
            const last = missing.pop();
            if (!last) return;
            const listText = missing.length ? `${missing.join(", ")} and ${last}` : last;
            setSaveError(
                `Please add the ${listText} before generating a draft. You can update employer details under Settings and the employee's address on the Parties step.`,
            );
            return;
        }

        setSaveError(null);
        setSaving(true);
        try {
            const contract: Contract = {
                id: crypto.randomUUID(),
                householdId: selectedEmployee.householdId ?? "default",
                employeeId: selectedEmployee.id,
                employeeAddress: (formData.employeeAddress || selectedEmployee.address || "").trim(),
                status: "draft",
                version: formData.version ?? 1,
                effectiveDate: formData.effectiveDate!,
                jobTitle: formData.jobTitle!,
                placeOfWork: formData.placeOfWork || settings.employerAddress || "",
                duties: formData.duties || ["General cleaning"],
                workingHours: formData.workingHours!,
                salary: formData.salary!,
                leave: formData.leave!,
                terms: formData.terms!,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            contract.leave = {
                annualDays: contract.leave?.annualDays ?? 21,
                sickDays: contract.leave?.sickDays ?? 30,
            };
            contract.terms = {
                ...(contract.terms ?? {
                    accommodationProvided: false,
                    accommodationDetails: "",
                    overtimeAgreement: "",
                    sundayHolidayAgreement: "",
                    noticeClause: "",
                    paymentDetails: "",
                    lawyerReviewAcknowledged: false,
                }),
                accommodationDetails: contract.terms?.accommodationDetails?.trim() ?? "",
                overtimeAgreement: contract.terms?.overtimeAgreement?.trim() ?? "",
                sundayHolidayAgreement: contract.terms?.sundayHolidayAgreement?.trim() ?? "",
                noticeClause: contract.terms?.noticeClause?.trim() ?? "",
                paymentDetails: contract.terms?.paymentDetails?.trim() ?? "",
            };
            await saveContract(contract);
            sessionStorage.removeItem("lekkerledger-contract-draft-state");
            router.push("/documents?tab=contracts");
        } catch (error) {
            console.error(error);
            setSaving(false);
        }
    };

    if (loading) return null;

    if (settings && !canUseContractGenerator(getUserPlan(settings))) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <PageHeader
                    title="Employment contract"
                    subtitle="Work through the actual job terms first, then save a draft PDF to review before anyone signs."
                />
                <FeatureGateCard
                    title="Contract drafts are available on Standard and Pro"
                    description="Free keeps payroll and payslips simple. Upgrade if you need employment contracts, document storage, and fuller household records."
                />
            </div>
        );
    }

    const visibleSteps = skipEmployeeStep ? STEPS_WITHOUT_EMPLOYEE : WIZARD_STEPS;
    const totalVisibleSteps = visibleSteps.length;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center">
                <button
                    onClick={() => {
                        if (currentStep === 0) {
                            router.back();
                        } else {
                            setCurrentStep((s) => s - 1);
                        }
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> {currentStep === 0 ? "Back" : "Previous step"}
                </button>
            </div>

            <div className="space-y-4">
                <PageHeader
                    title={skipEmployeeStep && selectedEmployee ? `Contract — ${selectedEmployee.name}` : "Employment contract"}
                    subtitle="Work through the actual job terms first, then generate a draft PDF to review before anyone signs."
                />
                <Stepper
                    steps={visibleSteps}
                    currentStep={currentStep}
                    className="py-2"
                    onStepClick={(i) => {
                        if (i <= currentStep) setCurrentStep(i);
                    }}
                />
            </div>

            <div className="flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                <p className="text-xs leading-relaxed text-[var(--warning)]">
                    This tool helps you prepare a draft employment agreement. It is <strong>not legal advice</strong>. Before anyone signs, review the full document carefully. If unsure, consult a South African labour lawyer.
                </p>
            </div>

            <Card className="glass-panel border-none p-5">
                <div className="space-y-1.5 text-sm text-[var(--text-muted)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Template details</p>
                    <p>
                        Version: <strong className="text-[var(--text)]">{CONTRACT_TEMPLATE_META.versionLabel}</strong> · Updated: <strong className="text-[var(--text)]">{CONTRACT_TEMPLATE_META.updatedAtLabel}</strong>
                    </p>
                    <p>
                        Source: <a href={CONTRACT_TEMPLATE_META.sourceHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--primary)] hover:underline">{CONTRACT_TEMPLATE_META.sourceLabel}</a> · {CONTRACT_TEMPLATE_META.sourceCheckedLabel}
                    </p>
                </div>
            </Card>

            {saveError && (
                <div className="rounded-2xl border px-4 py-3 text-xs text-[var(--warning)]" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                    {saveError}
                </div>
            )}

            <ContractFormWizard
                currentStep={wizardStepIndex}
                setCurrentStep={(updater) => {
                    const next = typeof updater === "function" ? updater(wizardStepIndex) : updater;
                    setCurrentStep(skipEmployeeStep ? next - 1 : next);
                }}
                formData={formData}
                setFormData={setFormData}
                employees={employees}
                settings={settings}
                saving={saving}
                onSave={handleSave}
                onBackToTop={() => router.back()}
                skipEmployeeStep={skipEmployeeStep}
                totalVisibleSteps={totalVisibleSteps}
            />
        </div>
    );
}
