"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getEmployees, saveLeaveRecord } from "@/lib/storage";
import { Employee, LeaveRecord, LeaveType } from "@/lib/schema";

function NewLeaveContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedEmpId = searchParams.get("employeeId");

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);

    const [formData, setFormData] = React.useState({
        employeeId: preselectedEmpId || "",
        type: "annual" as LeaveType,
        days: 1,
        date: new Date().toISOString().split("T")[0],
        note: ""
    });

    React.useEffect(() => {
        async function load() {
            const emps = await getEmployees();
            setEmployees(emps);
            if (emps.length > 0 && !formData.employeeId) {
                setFormData(prev => ({ ...prev, employeeId: emps[0].id }));
            }
            setLoading(false);
        }
        load();
    }, [formData.employeeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const record: LeaveRecord = {
                id: crypto.randomUUID(),
                ...formData
            };
            await saveLeaveRecord(record);
            router.push("/leave");
        } catch (error) {
            console.error("Failed to save leave record", error);
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[var(--primary)]" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-2"
            >
                <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <PageHeader
                title="Record Leave"
                subtitle="Add a new leave record for an employee"
            />

            <Card className="glass-panel border-none shadow-xl">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Employee</label>
                            <select
                                value={formData.employeeId}
                                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none appearance-none"
                                required
                            >
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Leave Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as LeaveType })}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none"
                                    required
                                >
                                    <option value="annual">Annual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="family">Family Responsibility</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Days</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={formData.days}
                                    onChange={e => setFormData({ ...formData, days: parseFloat(e.target.value) })}
                                    className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Start Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Notes (Optional)</label>
                            <textarea
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none min-h-[100px]"
                                placeholder="e.g. Flu, Family wedding, etc."
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full h-12 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-all gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {saving ? "Saving..." : "Save Leave Record"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NewLeavePage() {
    return (
        <React.Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[var(--primary)]" /></div>}>
            <NewLeaveContent />
        </React.Suspense>
    );
}
