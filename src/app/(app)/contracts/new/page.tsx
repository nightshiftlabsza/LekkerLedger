"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, ArrowRight, Save, Loader2, FileText, Clock, Banknote, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Stepper } from "@/components/ui/stepper";
import { getEmployees, saveContract } from "@/lib/storage";
import { Employee, Contract } from "@/lib/schema";

const STEPS = [
    { label: "Employee", description: "Select worker" },
    { label: "Role", description: "Job details" },
    { label: "Hours", description: "Work schedule" },
    { label: "Salary", description: "Pay & Leave" },
    { label: "Review", description: "Final check" },
];

export default function NewContractPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = React.useState(0);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    const [formData, setFormData] = React.useState<Partial<Contract>>({
        status: "draft",
        version: 1,
        jobTitle: "Domestic Worker",
        duties: ["General cleaning", "Laundry", "Meal preparation"],
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
        effectiveDate: new Date().toISOString().split("T")[0],
    });

    React.useEffect(() => {
        async function load() {
            const emps = await getEmployees();
            setEmployees(emps);
            if (emps.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    employeeId: emps[0].id,
                    salary: { ...prev.salary!, amount: emps[0].hourlyRate * 160 } // estimate
                }));
            }
            setLoading(false);
        }
        load();
    }, []);

    const empName = (id: string) => employees.find(e => e.id === id)?.name ?? "Unknown";

    const handleNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 0));

    const handleSave = async () => {
        setSaving(true);
        try {
            const contract: Contract = {
                id: crypto.randomUUID(),
                employeeId: formData.employeeId!,
                status: "active", // Default to active on save for now
                version: formData.version!,
                effectiveDate: formData.effectiveDate!,
                jobTitle: formData.jobTitle!,
                duties: formData.duties!,
                workingHours: formData.workingHours!,
                salary: formData.salary!,
                leave: formData.leave!,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await saveContract(contract);
            router.push("/contracts");
        } catch (error) {
            console.error(error);
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => currentStep === 0 ? router.back() : handleBack()}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> {currentStep === 0 ? "Back to List" : "Previous Step"}
                </button>
            </div>

            <div className="space-y-2">
                <PageHeader title="New Contract" subtitle="Create a BCEA-compliant employment agreement" />
                <Stepper steps={STEPS} currentStep={currentStep} className="py-6" />
            </div>

            <Card className="glass-panel border-none shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                    {/* Step 0: Employee */}
                    {currentStep === 0 && (
                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-12 w-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[var(--text)]">Who is this for?</h3>
                                    <p className="text-sm text-[var(--text-muted)]">Select the employee for this contract.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {employees.map(emp => (
                                    <button
                                        key={emp.id}
                                        onClick={() => setFormData({ ...formData, employeeId: emp.id })}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${formData.employeeId === emp.id
                                            ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]"
                                            : "border-[var(--border)] hover:border-[var(--amber-300)]"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-black">
                                                {emp.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-[var(--text)]">{emp.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{emp.role}</p>
                                            </div>
                                        </div>
                                        {formData.employeeId === emp.id && (
                                            <div className="h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 1: Role & Dates */}
                    {currentStep === 1 && (
                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Job Title</label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm outline-none focus:ring-2 focus:ring-[var(--focus)]/20 shadow-inner-sm"
                                        placeholder="e.g. Domestic Worker, Gardener"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Effective Date</label>
                                    <input
                                        type="date"
                                        value={formData.effectiveDate}
                                        onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm outline-none focus:ring-2 focus:ring-[var(--focus)]/20 shadow-inner-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Primary Duties</label>
                                    <textarea
                                        value={formData.duties?.join(", ")}
                                        onChange={e => setFormData({ ...formData, duties: e.target.value.split(",").map(d => d.trim()) })}
                                        className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm outline-none focus:ring-2 focus:ring-[var(--focus)]/20 min-h-[100px] shadow-inner-sm"
                                        placeholder="Describe the main tasks..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Hours */}
                    {currentStep === 2 && (
                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Days per week</label>
                                    <input
                                        type="number"
                                        value={formData.workingHours?.daysPerWeek}
                                        onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours!, daysPerWeek: parseInt(e.target.value) } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Break (min)</label>
                                    <input
                                        type="number"
                                        value={formData.workingHours?.breakDuration}
                                        onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours!, breakDuration: parseInt(e.target.value) } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-mono"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Work Start</label>
                                    <input
                                        type="time"
                                        value={formData.workingHours?.startAt}
                                        onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours!, startAt: e.target.value } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Work End</label>
                                    <input
                                        type="time"
                                        value={formData.workingHours?.endAt}
                                        onChange={e => setFormData({ ...formData, workingHours: { ...formData.workingHours!, endAt: e.target.value } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Salary & Leave */}
                    {currentStep === 3 && (
                        <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Salary Amount (R)</label>
                                    <input
                                        type="number"
                                        value={formData.salary?.amount}
                                        onChange={e => setFormData({ ...formData, salary: { ...formData.salary!, amount: parseFloat(e.target.value) } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Pay Frequency</label>
                                    <select
                                        value={formData.salary?.frequency}
                                        onChange={e => setFormData({ ...formData, salary: { ...formData.salary!, frequency: e.target.value as Contract["salary"]["frequency"] } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm outline-none focus:ring-2 focus:ring-[var(--focus)]/20"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Fortnightly">Fortnightly</option>
                                        <option value="Weekly">Weekly</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Annual Leave (Days)</label>
                                    <input
                                        type="number"
                                        value={formData.leave?.annualDays}
                                        onChange={e => setFormData({ ...formData, leave: { ...formData.leave!, annualDays: parseInt(e.target.value) } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Sick Leave (Days)</label>
                                    <input
                                        type="number"
                                        value={formData.leave?.sickDays}
                                        onChange={e => setFormData({ ...formData, leave: { ...formData.leave!, sickDays: parseInt(e.target.value) } })}
                                        className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 4 && (
                        <div className="p-8 space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="bg-[var(--surface-2)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
                                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                                    <h4 className="font-black text-sm text-[var(--text)] uppercase tracking-tight">Contract Preview</h4>
                                    <span className="text-[10px] font-black px-2 py-1 bg-[var(--surface-2)] text-[var(--focus)] rounded-lg">BCEA v7</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-4">
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-[var(--text-muted)] mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Employee</p>
                                            <p className="text-sm font-bold">{empName(formData.employeeId!)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Clock className="h-4 w-4 text-[var(--text-muted)] mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Hours</p>
                                            <p className="text-sm font-bold">{formData.workingHours?.daysPerWeek} days / week</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Banknote className="h-4 w-4 text-[var(--text-muted)] mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Salary</p>
                                            <p className="text-sm font-bold">R{formData.salary?.amount.toFixed(2)} ({formData.salary?.frequency})</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Calendar className="h-4 w-4 text-[var(--text-muted)] mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Start Date</p>
                                            <p className="text-sm font-bold">{formData.effectiveDate}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[var(--border)]">
                                    <p className="text-xs italic text-[var(--text-muted)]">By saving, this contract will become the active reference for payroll calculations.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-6 bg-[var(--surface-2)]/50 border-t border-[var(--border)] flex items-center justify-between">
                        <Button
                            variant="ghost"
                            disabled={currentStep === 0 || saving}
                            onClick={handleBack}
                            className="font-bold text-[var(--text-muted)]"
                        >
                            Back
                        </Button>
                        {currentStep === STEPS.length - 1 ? (
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] px-10 h-12 font-black transition-all gap-2 shadow-lg shadow-amber-500/20"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                {saving ? "Saving..." : "Create & Activate"}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] px-10 h-12 font-black transition-all gap-2 shadow-lg shadow-amber-500/20"
                            >
                                Next Step <ArrowRight className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
