"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { Stepper } from "@/components/ui/stepper";
import { getEmployees, getContracts, saveContract, getSettings } from "@/lib/storage";
import { Contract, Employee, EmployerSettings } from "@/lib/schema";
import { canUseContractGenerator, getUserPlan } from "@/lib/entitlements";
import { CONTRACT_TEMPLATE_META } from "@/src/config/contract-template";

import { ContractFormWizard, WIZARD_STEPS } from "@/components/contracts/ContractFormWizard";

const STEPS_WITHOUT_EMPLOYEE = WIZARD_STEPS.slice(1);

export default function EditContractPage() {
    const params = useParams();
    const router = useRouter();
    const contractId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [currentStep, setCurrentStep] = React.useState(0);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [formData, setFormData] = React.useState<Partial<Contract>>({});
    const [saveError, setSaveError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const active = true;

        async function load() {
            try {
                const [contracts, employeeRows, employerSettings] = await Promise.all([
                    getContracts(),
                    getEmployees(),
                    getSettings(),
                ]);
                if (!active) return;

                const contract = contracts.find((c) => c.id === contractId);
                if (!contract || !["draft", "awaiting_signed_copy"].includes(contract.status)) {
                    router.push("/documents?tab=contracts");
                    return;
                }

                setEmployees(employeeRows);
                setSettings(employerSettings);
                setFormData({
                    ...contract,
                    duties: contract.duties?.length ? contract.duties : ["General cleaning"],
                });
                setCurrentStep(0);
            } catch (error) {
                console.error("Failed to load contract for edit", error);
                router.push("/documents?tab=contracts");
            } finally {
                if (active) setLoading(false);
            }
        }

        void load();
    }, [contractId, router]);

    const selectedEmployee = employees.find((e) => e.id === formData.employeeId);
    const skipEmployeeStep = Boolean(selectedEmployee);
    const visibleSteps = skipEmployeeStep ? STEPS_WITHOUT_EMPLOYEE : WIZARD_STEPS;
    const wizardStepIndex = skipEmployeeStep ? currentStep + 1 : currentStep;

    const handleSave = async () => {
        if (!selectedEmployee || !settings || !contractId || !formData.id) return;

        const missing: string[] = [];
        if (!settings.employerName?.trim()) missing.push("employer name");
        if (!settings.employerAddress?.trim()) missing.push("employer address");
        if (!settings.employerIdNumber?.trim()) missing.push("employer ID / registration number");

        const resolvedEmployeeAddress = (formData.employeeAddress || selectedEmployee.address || "").trim();
        if (!resolvedEmployeeAddress) missing.push("employee residential address");

        if (missing.length > 0) {
            const last = missing.pop()!;
            const listText = missing.length ? `${missing.join(", ")} and ${last}` : last;
            setSaveError(
                `Please add the ${listText} before updating this draft. You can update employer details under Settings and the employee's address on the Parties step.`,
            );
            return;
        }

        setSaveError(null);
        setSaving(true);
        try {
            const nextVersion = (formData.version ?? 1) + 1;
            const contract: Contract = {
                ...formData,
                id: contractId,
                householdId: formData.householdId ?? selectedEmployee.householdId ?? "default",
                employeeId: selectedEmployee.id,
                employeeAddress: resolvedEmployeeAddress,
                status: formData.status ?? "draft",
                version: nextVersion,
                effectiveDate: formData.effectiveDate!,
                jobTitle: formData.jobTitle!,
                placeOfWork: formData.placeOfWork || settings.employerAddress || "",
                duties: formData.duties || ["General cleaning"],
                workingHours: formData.workingHours!,
                salary: formData.salary!,
                leave: {
                    annualDays: formData.leave?.annualDays ?? 21,
                    sickDays: formData.leave?.sickDays ?? 30,
                },
                terms: {
                    accommodationProvided: formData.terms?.accommodationProvided ?? false,
                    accommodationDetails: formData.terms?.accommodationDetails?.trim() ?? "",
                    overtimeAgreement: formData.terms?.overtimeAgreement?.trim() ?? "",
                    sundayHolidayAgreement: formData.terms?.sundayHolidayAgreement?.trim() ?? "",
                    noticeClause: formData.terms?.noticeClause?.trim() ?? "",
                    paymentDetails: formData.terms?.paymentDetails?.trim() ?? "",
                    lawyerReviewAcknowledged: formData.terms?.lawyerReviewAcknowledged ?? false,
                },
                createdAt: formData.createdAt!,
                updatedAt: new Date().toISOString(),
            };
            await saveContract(contract);
            sessionStorage.removeItem("lekkerledger-contract-draft-state");
            router.push("/documents?tab=contracts");
        } catch (error) {
            console.error(error);
            setSaving(false);
        }
    };

    if (loading || Object.keys(formData).length === 0 || !settings) return null;

    if (!canUseContractGenerator(getUserPlan(settings))) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <PageHeader title="Edit contract" subtitle="Contract editing is available on Standard and Pro." />
                <FeatureGateCard
                    title="Contract drafts are available on Standard and Pro"
                    description="Upgrade if you need to edit employment contracts."
                />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center">
                <button
                    onClick={() => (currentStep === 0 ? router.back() : setCurrentStep((s) => s - 1))}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> {currentStep === 0 ? "Back" : "Previous step"}
                </button>
            </div>

            <div className="space-y-4">
                <PageHeader
                    title={selectedEmployee ? `Edit contract — ${selectedEmployee.name}` : "Edit contract"}
                    subtitle="Update the draft terms, then save to regenerate the PDF."
                />
                <Stepper
                    steps={visibleSteps}
                    currentStep={currentStep}
                    className="py-2"
                    onStepClick={(i) => { if (i <= currentStep) setCurrentStep(i); }}
                />
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    This tool helps you prepare a draft employment agreement. It is <strong>not legal advice</strong>. Before anyone signs, review the full document carefully.
                </p>
            </div>

            <Card className="glass-panel border-none p-5">
                <div className="space-y-1.5 text-sm text-[var(--text-muted)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]">Template details</p>
                    <p>Version: <strong className="text-[var(--text)]">{CONTRACT_TEMPLATE_META.versionLabel}</strong></p>
                </div>
            </Card>

            {saveError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
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
                totalVisibleSteps={visibleSteps.length}
                saveLabel="Update draft"
            />
        </div>
    );
}
