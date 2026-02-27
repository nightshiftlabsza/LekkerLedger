"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { EmployeeSchema, Employee } from "@/lib/schema";
import { saveEmployee, getEmployees, getSettings } from "@/lib/storage";
import { NMW_RATE } from "@/lib/calculator";
import { EmployerSettings } from "@/lib/schema";

export default function AddEmployeePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: "",
        idNumber: "",
        hourlyRate: NMW_RATE.toString(),
        role: "Domestic Worker",
        phone: "",
        startDate: new Date().toISOString().slice(0, 10),
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [canAdd, setCanAdd] = React.useState(true);
    const [tierLimitReached, setTierLimitReached] = React.useState<"free" | "annual" | null>(null);

    React.useEffect(() => {
        async function checkLimit() {
            const [emps, settings] = await Promise.all([getEmployees(), getSettings()]);
            const tier = settings.proStatus || "free";

            if (tier === "free" && emps.length >= 1) {
                setCanAdd(false);
                setTierLimitReached("free");
            } else if (tier === "annual" && emps.length >= 3) {
                setCanAdd(false);
                setTierLimitReached("annual");
            }
        }
        checkLimit();
    }, []);

    const hourlyRateNum = parseFloat(formData.hourlyRate) || 0;
    const belowNMW = hourlyRateNum > 0 && hourlyRateNum < NMW_RATE;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const submissionData = {
            id: crypto.randomUUID(),
            ...formData,
            hourlyRate: parseFloat(formData.hourlyRate),
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

        setLoading(true);
        try {
            await saveEmployee(parsed.data as Employee);
            router.push("/employees");
        } catch (err) {
            console.error(err);
            setErrors({ form: "Failed to save. Please try again." });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-30 px-4 py-3"
                style={{
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <SideDrawer />
                    <Link href="/employees">
                        <button
                            aria-label="Back"
                            className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--bg-subtle)]"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Add Employee
                    </h1>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
                <Card className="animate-slide-up">
                    <CardContent className="p-6">
                        <form onSubmit={handleSave} className="space-y-5">
                            {!canAdd && (
                                <Alert variant="default" className="border-amber-500 bg-amber-50">
                                    <Sparkles className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                        <strong>{tierLimitReached === "annual" ? "Annual" : "Standard"} Tier Limit:</strong>
                                        {tierLimitReached === "annual" ? " You can only have up to 3 active workers." : " You can only have 1 active worker."}
                                        <Link href="/pricing" className="ml-1 underline font-bold">Upgrade to Pro</Link> for unlimited seats.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {errors.form && (
                                <Alert variant="error">
                                    <AlertDescription>{errors.form}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Thandi Dlamini"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    error={errors.name}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Input
                                    id="role"
                                    placeholder="e.g. Domestic Worker, Gardener"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    error={errors.role}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="idNumber">ID / Passport Number (Optional)</Label>
                                <Input
                                    id="idNumber"
                                    placeholder="e.g. 9001015009087"
                                    value={formData.idNumber}
                                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                    error={errors.idNumber}
                                    disabled={loading}
                                />
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    Stored on-device only. Used on the payslip PDF.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="e.g. 071 234 5678"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={loading}
                                    />
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        For WhatsApp sharing of payslips.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Employment Start</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        disabled={loading}
                                    />
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Used to calculate leave.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hourlyRate">Default Hourly Rate (ZAR) *</Label>
                                <div className="relative">
                                    <span
                                        className="absolute left-4 top-3 text-sm font-semibold pointer-events-none"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        R
                                    </span>
                                    <Input
                                        id="hourlyRate"
                                        className="pl-8"
                                        type="number"
                                        step="0.01"
                                        placeholder={NMW_RATE.toString()}
                                        value={formData.hourlyRate}
                                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                        error={errors.hourlyRate}
                                        disabled={loading}
                                    />
                                </div>
                                {belowNMW && (
                                    <Alert variant="error">
                                        <AlertDescription>
                                            National Minimum Wage is <strong>R{NMW_RATE}/hr</strong> for Domestic
                                            Workers (SD7). You cannot legally pay below this.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {!belowNMW && hourlyRateNum >= NMW_RATE && (
                                    <p className="text-xs" style={{ color: "var(--green-500)" }}>
                                        ✓ Above National Minimum Wage
                                    </p>
                                )}
                            </div>

                            <div
                                className="pt-4"
                                style={{ borderTop: "1px solid var(--border-subtle)" }}
                            >
                                <Button
                                    type="submit"
                                    className="w-full gap-2 h-12 text-base"
                                    disabled={loading || belowNMW || !canAdd}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" /> Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" /> Save Employee
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
