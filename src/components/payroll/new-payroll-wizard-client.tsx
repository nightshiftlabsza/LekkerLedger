"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, UserPlus, Calendar, Plus, Save } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee, PayPeriod } from "@/lib/schema";
import { getEmployees, saveEmployee, savePayPeriod, getActiveHouseholdId } from "@/lib/storage";
import { NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export function NewPayrollWizardClient() {
    const router = useRouter();
    const { toast } = useToast();

    const [isClient, setIsClient] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [step, setStep] = React.useState(0);
    const [saving, setSaving] = React.useState(false);
    const [activeHouseholdId, setActiveHouseholdId] = React.useState<string>("default");

    // Selections
    const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);

    // Dates
    const [startDate, setStartDate] = React.useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [endDate, setEndDate] = React.useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

    // Inline employee form (if 0 employees)
    const [newEmpName, setNewEmpName] = React.useState("");
    const [newEmpRate, setNewEmpRate] = React.useState(NMW_RATE.toString());

    React.useEffect(() => {
        let active = true;
        setIsClient(true);
        async function load() {
            try {
                const [emps, hId] = await Promise.all([getEmployees(), getActiveHouseholdId()]);
                if (!active) return;
                setEmployees(emps);
                setActiveHouseholdId(hId);

                // Pre-select if only one
                if (emps.length === 1) {
                    setSelectedEmployeeIds([emps[0].id]);
                } else if (emps.length > 0) {
                    setSelectedEmployeeIds(emps.map(e => e.id));
                }
            } catch (err) {
                console.error(err);
                if (active) toast("Failed to load setup data");
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [toast]);

    const handleCreateEmployeeAndNext = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const id = crypto.randomUUID();
            const newEmp: Employee = {
                id,
                householdId: activeHouseholdId,
                name: newEmpName.trim(),
                role: "Domestic Worker",
                hourlyRate: Number.parseFloat(newEmpRate) || NMW_RATE,
                idNumber: "",
                phone: "",
                address: "",
                startDate: new Date().toISOString().split('T')[0],
                ordinarilyWorksSundays: false,
                ordinaryHoursPerDay: 8,
                frequency: "Monthly"
            };
            await saveEmployee(newEmp);

            // Reload and select
            const emps = await getEmployees();
            setEmployees(emps);
            setSelectedEmployeeIds([id]);
            setStep(2); // Move to dates
        } catch (err) {
            console.error(err);
            toast("Failed to save employee");
        }
        setSaving(false);
    };

    const handleCreatePayRun = async () => {
        if (selectedEmployeeIds.length === 0) {
            toast("Please select at least one employee");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            toast("End date cannot be before start date");
            return;
        }

        setSaving(true);
        try {
            const periodId = crypto.randomUUID();
            const startStr = format(start, "MMM");
            const endStr = format(end, "yyyy");

            const newPeriod: PayPeriod = {
                id: periodId,
                householdId: activeHouseholdId,
                name: `${startStr} ${endStr} Pay Run`,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                status: "draft",
                entries: selectedEmployeeIds.map(empId => ({
                    employeeId: empId,
                    ordinaryHours: 0,
                    overtimeHours: 0,
                    sundayHours: 0,
                    publicHolidayHours: 0,
                    leaveDays: 0,
                    shortFallHours: 0,
                    advanceAmount: 0,
                    otherDeductions: 0,
                    note: "",
                    status: "empty" as const,
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await savePayPeriod(newPeriod);
            router.push(`/payroll/${periodId}`);
        } catch (err) {
            console.error(err);
            toast("Failed to create pay period");
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Step 0: Mode Selection */}
            {step === 0 && (
                <Card className="glass-panel overflow-hidden shadow-xl">
                    <CardContent className="p-4 sm:p-6 md:p-8 space-y-5">
                        <div className="text-center space-y-2 mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-black text-[var(--text)]">How do you want to start?</h2>
                            <p className="type-body text-[var(--text-muted)]">
                                All payroll data is stored securely on your device.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <button
                                onClick={() => setStep(1)}
                                data-testid="payroll-wizard-start"
                                className="flex flex-col items-center gap-3 p-6 text-center rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <h3 className="type-h3 text-[var(--text)]">Create Payroll</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Start a new monthly payroll on this device.
                                </p>
                            </button>

                            <Link href="/settings?tab=storage" className="flex flex-col items-center gap-3 p-6 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-all group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] transition-transform group-hover:scale-110">
                                    <Save className="h-6 w-6" />
                                </div>
                                <h3 className="type-h3 text-[var(--text)]">Restore Backup</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Load previous data from a backup file.
                                </p>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 1: Choose Employee(s) */}
            {step === 1 && isClient && (
                <Card className="glass-panel border-[var(--primary)]/30 border-2 shadow-2xl">
                    <CardContent className="p-4 sm:p-6 md:p-8 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">1</div>
                            <h2 className="text-xl sm:text-2xl font-black text-[var(--text)]">Who are you paying?</h2>
                        </div>

                        {employees.length === 0 ? (
                            <form onSubmit={handleCreateEmployeeAndNext} className="space-y-4 pt-4 border-t border-[var(--border)]">
                                <p className="type-body pb-2 text-[var(--text-muted)]">Add your first employee to get started.</p>

                                <div className="space-y-2">
                                    <Label>Employee Name</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Thandi Dlamini"
                                        value={newEmpName}
                                        onChange={e => setNewEmpName(e.target.value)}
                                        disabled={saving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hourly Rate (NMW is R{NMW_RATE})</Label>
                                    <Input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={newEmpRate}
                                        onChange={e => setNewEmpRate(e.target.value)}
                                        disabled={saving}
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" className="w-full gap-2 font-bold" disabled={saving || !newEmpName}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                        Add & Continue
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {employees.map(emp => (
                                        <WizardEmployeeRow
                                            key={emp.id}
                                            employee={emp}
                                            isSelected={selectedEmployeeIds.includes(emp.id)}
                                            onToggle={() => setSelectedEmployeeIds(prev =>
                                                prev.includes(emp.id)
                                                    ? prev.filter(id => id !== emp.id)
                                                    : [...prev, emp.id]
                                            )}
                                        />
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-[var(--border)] flex gap-3">
                                    <Link href="/employees/new" className="flex-1">
                                        <Button variant="outline" className="w-full gap-2 font-bold">
                                            <UserPlus className="h-4 w-4" /> Add Another
                                        </Button>
                                    </Link>
                                    <Button
                                        className="flex-1 gap-2 font-bold"
                                        disabled={selectedEmployeeIds.length === 0}
                                        onClick={() => setStep(2)}
                                        data-testid="payroll-wizard-next-to-dates"
                                    >
                                        Next <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Pay Period */}
            {step === 2 && isClient && (
                <Card className="glass-panel border-[var(--primary)]/30 border-2 shadow-2xl animate-in slide-in-from-right-4">
                    <CardContent className="p-4 sm:p-6 md:p-8 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">2</div>
                            <h2 className="text-xl sm:text-2xl font-black text-[var(--text)]">Set the pay period</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 pt-2">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    disabled={saving}
                                    data-testid="payroll-wizard-start-date"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    disabled={saving}
                                    data-testid="payroll-wizard-end-date"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--border)] flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 font-bold"
                                onClick={() => setStep(1)}
                                disabled={saving}
                                data-testid="payroll-wizard-back-to-employees"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleCreatePayRun}
                                disabled={saving}
                                className="flex-1 gap-2 font-bold"
                                data-testid="payroll-wizard-initialize"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                                Initialize Pay Run
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}

function WizardEmployeeRow({ employee, isSelected, onToggle }: { employee: Employee; isSelected: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            data-testid={`payroll-wizard-employee-${employee.id}`}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 text-left ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--primary)]/50'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white transition-colors ${isSelected ? 'bg-[var(--primary)]' : 'bg-[var(--text-muted)]'}`}>
                    {employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-bold text-[var(--text)]">{employee.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{employee.role} · R{employee.hourlyRate}/hr</p>
                </div>
            </div>

            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--text-muted)]'}`}>
                {isSelected && <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" strokeWidth="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
        </button>
    );
}

