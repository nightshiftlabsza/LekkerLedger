"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmployeeSchema, Employee } from "@/lib/schema";
import { saveEmployee, getEmployee } from "@/lib/storage";
import { NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";
import { formatEmployeeIdNumberInput, normalizeEmployeeIdNumber } from "@/src/lib/employee-id";
import { useUnsavedChanges } from "@/app/hooks/use-unsaved-changes";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: "",
        idNumber: "",
        hourlyRate: NMW_RATE.toString(),
        role: "Domestic Worker",
        phone: "",
        email: "",
        startDate: "",
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: "8",
    });
    const [isDirty, setIsDirty] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    useUnsavedChanges(isDirty);

    const updateForm = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    React.useEffect(() => {
        async function load() {
            if (!id) return;
            const emp = await getEmployee(id);
            if (!emp) {
                router.push("/employees");
                return;
            }
            setFormData({
                name: emp.name,
                idNumber: formatEmployeeIdNumberInput(emp.idNumber || ""),
                hourlyRate: emp.hourlyRate.toString(),
                role: emp.role || "Domestic Worker",
                phone: emp.phone || "",
                email: emp.email || "",
                startDate: emp.startDate || "",
                ordinarilyWorksSundays: emp.ordinarilyWorksSundays ?? false,
                ordinaryHoursPerDay: (emp.ordinaryHoursPerDay ?? 8).toString(),
            });
            setLoading(false);
        }
        load();
    }, [id, router]);

    const hourlyRateNum = parseFloat(formData.hourlyRate) || 0;
    const belowNMW = hourlyRateNum > 0 && hourlyRateNum < NMW_RATE;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const submissionData = {
            id,
            ...formData,
            idNumber: normalizeEmployeeIdNumber(formData.idNumber),
            hourlyRate: parseFloat(formData.hourlyRate),
            ordinaryHoursPerDay: Number(formData.ordinaryHoursPerDay) || 8,
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

        setSaving(true);
        try {
            await saveEmployee(parsed.data as Employee);
            setIsDirty(false);
            toast("Changes saved successfully!");
            router.push("/employees");
        } catch (err) {
            console.error(err);
            setErrors({ form: "Failed to save. Please try again." });
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <div className="max-w-xl mx-auto mb-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-sm)] w-full">
                <Link href="/employees">
                    <button
                        aria-label="Back"
                        className="h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--surface-2)] active-scale text-[var(--text-muted)]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-0.5 opacity-60" style={{ color: "var(--text-muted)" }}>
                        <Link href="/employees" className="hover:text-[var(--primary)] transition-colors">Employees</Link> › Edit
                    </p>
                    <h1 className="font-bold text-lg tracking-tight" style={{ color: "var(--text)" }}>
                        {formData.name || "Edit Employee"}
                    </h1>
                </div>
            </div>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
                <Card className="animate-slide-up hover-lift shadow-[var(--shadow-md)]">
                    <CardContent className="p-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            {errors.form && (
                                <Alert variant="error">
                                    <AlertDescription>{errors.form}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => updateForm({ name: e.target.value })}
                                    error={errors.name}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => updateForm({ role: e.target.value })}
                                    error={errors.role}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="idNumber">SA ID number or passport (optional)</Label>
                                <Input
                                    id="idNumber"
                                    value={formData.idNumber}
                                    onChange={(e) => updateForm({ idNumber: formatEmployeeIdNumberInput(e.target.value) })}
                                    error={errors.idNumber}
                                    disabled={saving}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateForm({ phone: e.target.value })}
                                        disabled={saving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateForm({ email: e.target.value })}
                                        error={errors.email}
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Employment Start</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => updateForm({ startDate: e.target.value })}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hourlyRate">Default Hourly Rate (ZAR) *</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-sm font-semibold pointer-events-none text-[var(--text-muted)]">R</span>
                                    <Input
                                        id="hourlyRate"
                                        className="pl-8"
                                        type="number"
                                        step="0.01"
                                        value={formData.hourlyRate}
                                        onChange={(e) => updateForm({ hourlyRate: e.target.value })}
                                        error={errors.hourlyRate}
                                        disabled={saving}
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
                                    disabled={saving}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => updateForm({ ordinarilyWorksSundays: !formData.ordinarilyWorksSundays })}
                                className="w-full flex items-start gap-4 p-5 rounded-2xl text-left transition-all duration-200 active-scale hover:bg-[var(--surface-2)] shadow-[var(--shadow-sm)] border border-[var(--border)]"
                                style={{
                                    backgroundColor: formData.ordinarilyWorksSundays ? "var(--accent-subtle)" : "var(--surface-1)",
                                    borderColor: formData.ordinarilyWorksSundays ? "var(--primary)" : "var(--border)",
                                }}
                            >
                                <div
                                    className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200"
                                    style={{
                                        backgroundColor: formData.ordinarilyWorksSundays ? "var(--primary)" : "transparent",
                                        border: `1.5px solid ${formData.ordinarilyWorksSundays ? "var(--primary)" : "var(--border)"}`,
                                    }}
                                >
                                    {formData.ordinarilyWorksSundays && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Ordinarily works on Sundays</p>
                                    <p className="text-xs mt-1 leading-relaxed opacity-70">Adjusts calculation between 1.5× and 2.0× normal rate (BCEA).</p>
                                </div>
                            </button>

                            <div className="pt-6 border-t border-[var(--border)]">
                                <Button
                                    type="submit"
                                    className="w-full h-14 text-base font-bold rounded-2xl shadow-[var(--shadow-md)] active-scale transition-all"
                                    disabled={saving || belowNMW}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                    {saving ? "Saving Changes..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
