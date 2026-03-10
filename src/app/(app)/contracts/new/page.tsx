"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { Stepper } from "@/components/ui/stepper";
import { getEmployees, saveContract, getSettings } from "@/lib/storage";
import { Contract, Employee, EmployerSettings } from "@/lib/schema";
import { canUseContractGenerator, getUserPlan } from "@/lib/entitlements";
import { CONTRACT_TEMPLATE_META } from "@/src/config/contract-template";

import { ContractFormWizard, WIZARD_STEPS } from "@/components/contracts/ContractFormWizard";

// Steps to show when employee is pre-selected (skip step 0 "Employee")
const STEPS_WITHOUT_EMPLOYEE = WIZARD_STEPS.slice(1);

export default function NewContractPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const employeeIdParam = searchParams.get("employeeId");
    const skipEmployeeStep = Boolean(employeeIdParam);

    // When skipping the employee step, currentStep tracks within STEPS_WITHOUT_EMPLOYEE (0-indexed, maps to WIZARD_STEPS index 1+)
    // When not skipping, currentStep tracks WIZARD_STEPS (0-indexed, includes employee step at 0)
    const [currentStep, setCurrentStep] = React.useState(0);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

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
            annualDays: undefined as unknown as number,
            sickDays: undefined as unknown as number,
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
        let active = true;
        async function load() {
            const [employeeRows, employerSettings] = await Promise.all([getEmployees(), getSettings()]);
            if (!active) return;
            setEmployees(employeeRows);
            setSettings(employerSettings);

            // Attempt to restore session data
            let restoredData = null;
            let restoredStep = 0;
            try {
                const stored = sessionStorage.getItem("lekkerledger-contract-draft-state");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    restoredData = parsed.formData;
                    restoredStep = parsed.currentStep;
                }
            } catch (e) {
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
                        salary: {
                            ...current.salary!,
                            amount: current.salary?.amount || Number((selectedEmployee.hourlyRate * 195).toFixed(2)),
                        },
                    }));
                }
                // When launched from an employee page, start at step 0 of the visible steps
                // (which maps to WIZARD_STEPS index 1 — Parties)
                setCurrentStep(0);
            }
            setLoading(false);
        }
        load();
        return () => {
            active = false;
        };
    }, [employeeIdParam, skipEmployeeStep]);

    const selectedEmployee = employees.find((employee) => employee.id === formData.employeeId);

    // The actual WIZARD_STEPS index to pass to ContractFormWizard
    // When skipping employee step: visible step 0 = wizard step 1, etc.
    const wizardStepIndex = skipEmployeeStep ? currentStep + 1 : currentStep;

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
                duties: formData.duties || ["General cleaning"],
                workingHours: formData.workingHours!,
                salary: formData.salary!,
                leave: formData.leave!,
                terms: formData.terms!,
                createdAt: new Date().toISOString(),
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

            {/* Legal disclaimer */}
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    This tool helps you prepare a draft employment agreement. It is <strong>not legal advice</strong>. Before anyone signs, review the full document carefully. If unsure, consult a South African labour lawyer.
                </p>
            </div>

            {/* Template details */}
            <Card className="glass-panel border-none p-5">
                <div className="space-y-1.5 text-sm text-[var(--text-muted)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Template details</p>
                    <p>
                        Version: <strong className="text-[var(--text)]">{CONTRACT_TEMPLATE_META.versionLabel}</strong> · Updated: <strong className="text-[var(--text)]">{CONTRACT_TEMPLATE_META.updatedAtLabel}</strong>
                    </p>
                    <p>
                        Source: <a href={CONTRACT_TEMPLATE_META.sourceHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--primary)] hover:underline">{CONTRACT_TEMPLATE_META.sourceLabel}</a> · <strong className="text-[var(--text)]">{CONTRACT_TEMPLATE_META.reviewLabel}</strong>
                    </p>
                </div>
            </Card>

            <ContractFormWizard
                currentStep={wizardStepIndex}
                setCurrentStep={(updater) => {
                    // Convert wizard step index back to visible step index
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
