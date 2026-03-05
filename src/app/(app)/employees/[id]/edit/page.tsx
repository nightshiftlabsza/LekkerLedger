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
import { SideDrawer } from "@/components/layout/side-drawer";
import { EmployeeSchema, Employee } from "@/lib/schema";
import { saveEmployee, getEmployee } from "@/lib/storage";
import { NMW_RATE } from "@/lib/calculator";
import { useToast } from "@/components/ui/toast";

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
        startDate: "",
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: "8",
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});

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
                idNumber: emp.idNumber || "",
                hourlyRate: emp.hourlyRate.toString(),
                role: emp.role || "Domestic Worker",
                phone: emp.phone || "",
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
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <SideDrawer />
                    <Link href="/employees">
                        <button aria-label="Back" className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface-2)] text-[var(--text-muted)]">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <div>
                        <p className="text-[10px] leading-none mb-0.5" style={{ color: "var(--text-muted)" }}>
                            <Link href="/employees" className="hover:underline">Employees</Link> › Edit
                        </p>
                        <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text)" }}>
                            Edit Employee
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
                <Card className="animate-slide-up">
                    <CardContent className="p-6">
                        <form onSubmit={handleSave} className="space-y-5">
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
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    error={errors.name}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Input
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    error={errors.role}
                                    disabled={saving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="idNumber">ID / Passport Number</Label>
                                <Input
                                    id="idNumber"
                                    value={formData.idNumber}
                                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                    error={errors.idNumber}
                                    disabled={saving}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={saving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Employment Start</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        disabled={saving}
                                    />
                                </div>
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
                                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                        error={errors.hourlyRate}
                                        disabled={saving}
                                    />
                                </div>
                                {belowNMW && (
                                    <Alert variant="error">
                                        <AlertDescription>
                                            National Minimum Wage is <strong>R{NMW_RATE}/hr</strong>. You cannot legally pay below this.
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
                                    onChange={(e) => setFormData({ ...formData, ordinaryHoursPerDay: e.target.value })}
                                    disabled={saving}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, ordinarilyWorksSundays: !formData.ordinarilyWorksSundays })}
                                className="w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all hover:bg-[var(--surface-2)]"
                                style={{
                                    border: `1.5px solid ${formData.ordinarilyWorksSundays ? "var(--primary)" : "var(--border)"}`,
                                    backgroundColor: formData.ordinarilyWorksSundays ? "rgba(196,122,28,0.04)" : "transparent",
                                }}
                            >
                                <div
                                    className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                                    style={{
                                        backgroundColor: formData.ordinarilyWorksSundays ? "var(--primary)" : "transparent",
                                        border: `1.5px solid ${formData.ordinarilyWorksSundays ? "var(--primary)" : "var(--border)"}`,
                                    }}
                                >
                                    {formData.ordinarilyWorksSundays && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Ordinarily works on Sundays</p>
                                    <p className="text-xs mt-0.5 opacity-70">Toggled on = 1.5x Sunday rate. Off = 2.0x (BCEA Section 16).</p>
                                </div>
                            </button>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold"
                                    disabled={saving || belowNMW}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
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
