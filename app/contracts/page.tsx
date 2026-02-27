"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowLeft, Loader2, FileText, Download, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getSettings } from "@/lib/storage";
import { Employee, EmployerSettings } from "@/lib/schema";
import { generateContractPdfBytes, ContractInput } from "@/lib/contract-pdf";

export default function ContractsPage() {
    const [loading, setLoading] = React.useState(true);
    const [generating, setGenerating] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [selectedId, setSelectedId] = React.useState("");
    const [form, setForm] = React.useState({
        startDate: new Date().toISOString().slice(0, 10),
        workDays: "Monday to Friday",
        workHoursPerDay: "8",
        duties: "General domestic duties including cleaning, laundry, ironing, and cooking as reasonably assigned by the employer.",
        probationMonths: "3",
    });

    React.useEffect(() => {
        async function load() {
            const [emps, s] = await Promise.all([getEmployees(), getSettings()]);
            setEmployees(emps);
            setSettings(s);
            if (emps.length > 0) setSelectedId(emps[0].id);
            setLoading(false);
        }
        load();
    }, []);

    const selectedEmployee = employees.find((e) => e.id === selectedId);

    const handleGenerate = async () => {
        if (!selectedEmployee || !settings) return;
        setGenerating(true);
        setTimeout(async () => {
            try {
                const input: ContractInput = {
                    employee: selectedEmployee,
                    employer: settings,
                    startDate: form.startDate,
                    workDays: form.workDays,
                    workHoursPerDay: parseInt(form.workHoursPerDay) || 8,
                    duties: form.duties,
                    probationMonths: parseInt(form.probationMonths) || 0,
                };
                const pdfBytes = await generateContractPdfBytes(input);
                const blob = new Blob([pdfBytes.slice(0)], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Contract_${selectedEmployee.name.replace(/\s+/g, "_")}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Contract generation failed:", err);
            } finally {
                setGenerating(false);
            }
        }, 50);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
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
                    <Link href="/dashboard">
                        <button
                            aria-label="Back"
                            className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--bg-subtle)]"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Employment Contracts
                    </h1>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-5">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
                    </div>
                ) : employees.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Users className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No employees yet</p>
                            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                                Add at least one employee to generate a contract.
                            </p>
                            <Link href="/employees/new">
                                <Button className="gap-2">Add Employee</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Info */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-4 flex items-start gap-3">
                                <FileText className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--amber-500)" }} />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                        BCEA Employment Contract
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                        Generate a legally compliant employment contract with leave entitlements,
                                        termination clauses, and signature lines. Protects both you and your worker.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employee selector */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contract-employee">Select Employee</Label>
                                    <select
                                        id="contract-employee"
                                        value={selectedId}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm font-medium"
                                        style={{
                                            backgroundColor: "var(--bg-subtle)",
                                            color: "var(--text-primary)",
                                            border: "1px solid var(--border-subtle)",
                                        }}
                                    >
                                        {employees.map((e) => (
                                            <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-start">Start Date</Label>
                                        <Input
                                            id="contract-start"
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-probation">Probation (months)</Label>
                                        <Input
                                            id="contract-probation"
                                            type="number"
                                            min="0"
                                            max="12"
                                            value={form.probationMonths}
                                            onChange={(e) => setForm({ ...form, probationMonths: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-days">Work Days</Label>
                                        <Input
                                            id="contract-days"
                                            placeholder="Monday to Friday"
                                            value={form.workDays}
                                            onChange={(e) => setForm({ ...form, workDays: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-hours">Hours/Day</Label>
                                        <Input
                                            id="contract-hours"
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={form.workHoursPerDay}
                                            onChange={(e) => setForm({ ...form, workHoursPerDay: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contract-duties">Job Duties</Label>
                                    <textarea
                                        id="contract-duties"
                                        rows={3}
                                        value={form.duties}
                                        onChange={(e) => setForm({ ...form, duties: e.target.value })}
                                        className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                                        style={{
                                            backgroundColor: "var(--bg-subtle)",
                                            color: "var(--text-primary)",
                                            border: "1px solid var(--border-subtle)",
                                        }}
                                    />
                                </div>

                                {settings && !settings.employerName && (
                                    <p className="text-xs" style={{ color: "var(--amber-500)" }}>
                                        ⚠ Employer details not set.{" "}
                                        <Link href="/settings" className="underline">Add them in Settings</Link> for a complete contract.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Generate button */}
                        <Button
                            className="w-full gap-2 h-12 text-base"
                            onClick={handleGenerate}
                            disabled={generating || !selectedEmployee}
                        >
                            {generating ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Generating…</>
                            ) : (
                                <><Download className="h-5 w-5" /> Download Contract PDF</>
                            )}
                        </Button>
                    </>
                )}
            </main>
        </div>
    );
}
