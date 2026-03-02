"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowLeft, Loader2, FileText, Download, Users, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getSettings } from "@/lib/storage";
import { Employee, EmployerSettings } from "@/lib/schema";
import { generateContractPdfBytes, ContractInput } from "@/lib/contract-pdf";
import { generateDisciplinaryPdfBytes, DisciplinaryInput, DisciplinaryType } from "@/lib/disciplinary-pdf";

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

    const handleGenerateDisciplinary = async (type: DisciplinaryType) => {
        if (!selectedEmployee || !settings) return;
        setGenerating(true);
        setTimeout(async () => {
            try {
                const input: DisciplinaryInput = {
                    type,
                    employee: selectedEmployee,
                    employer: settings,
                    date: new Date().toISOString(),
                    offence: "General Misconduct",
                    details: "Enter specific details of the incident here once printed.",
                    actionRequired: "Ensure compliance with all site rules and regulations.",
                };
                const pdfBytes = await generateDisciplinaryPdfBytes(input);
                const blob = new Blob([pdfBytes.slice(0)], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${type.replace("-", "_").toUpperCase()}_${selectedEmployee.name.replace(/\s+/g, "_")}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Disciplinary generation failed:", err);
            } finally {
                setGenerating(false);
            }
        }, 50);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
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

                        {settings?.proStatus === "pro" ? (
                            <>
                                {/* Employee selector */}
                                <Card className="animate-slide-up delay-75">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contract-employee">Select Employee</Label>
                                            <select
                                                id="contract-employee"
                                                value={selectedId}
                                                onChange={(e) => setSelectedId(e.target.value)}
                                                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/50 transition-all outline-none"
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
                                                    className="focus:ring-2 focus:ring-amber-500/50"
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
                                                    className="focus:ring-2 focus:ring-amber-500/50"
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
                                                    className="focus:ring-2 focus:ring-amber-500/50"
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
                                                    className="focus:ring-2 focus:ring-amber-500/50"
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
                                                className="w-full rounded-lg px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-amber-500/50 transition-all outline-none"
                                                style={{
                                                    backgroundColor: "var(--bg-subtle)",
                                                    color: "var(--text-primary)",
                                                    border: "1px solid var(--border-subtle)",
                                                }}
                                            />
                                        </div>

                                        {settings && !settings.employerName && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                                <p className="text-xs" style={{ color: "var(--amber-600)" }}>
                                                    <span className="font-bold">⚠ Employer details not set.</span>{" "}
                                                    <Link href="/settings" className="underline font-bold">Add them in Settings</Link> for a complete contract.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Generate button */}
                                <Button
                                    className="w-full gap-2 h-14 text-base font-bold shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all bg-amber-500 hover:bg-amber-600 text-white animate-slide-up delay-150"
                                    onClick={handleGenerate}
                                    disabled={generating || !selectedEmployee}
                                >
                                    {generating ? (
                                        <><Loader2 className="h-5 w-5 animate-spin" /> Generating PDF…</>
                                    ) : (
                                        <><Download className="h-5 w-5" /> Download Contract PDF</>
                                    )}
                                </Button>

                                {/* NEW: Disciplinary Templates Section */}
                                <div className="pt-8 space-y-4 animate-slide-up delay-200">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <h2 className="font-black text-sm uppercase tracking-widest text-[var(--text-secondary)]">Disciplinary Templates</h2>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { id: "verbal-warning", title: "Verbal Warning Record", icon: FileText },
                                            { id: "written-warning", title: "Written Warning", icon: FileText },
                                            { id: "final-warning", title: "Final Written Warning", icon: FileText },
                                            { id: "disciplinary-notice", title: "Notice of Inquiry", icon: AlertTriangle },
                                        ].map((t) => (
                                            <Card key={t.id} className="hover:border-amber-500/50 cursor-pointer transition-all group" onClick={() => handleGenerateDisciplinary(t.id as any)}>
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                            <t.icon className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-bold">{t.title}</span>
                                                    </div>
                                                    <Download className="h-4 w-4 text-[var(--text-muted)] group-hover:text-amber-500" />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] italic text-center px-4">
                                        Note: Disciplinary action must follow fair procedure as per the LRA. Consult a labor expert for complex cases.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <Card className="animate-slide-up delay-75 border border-dashed border-amber-500/40 bg-amber-500/5 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                <CardContent className="p-8 text-center space-y-5 relative z-10">
                                    <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                        <FileText className="h-8 w-8 text-amber-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black tracking-tight text-amber-900 dark:text-amber-500">Legal Vault Locked</h3>
                                        <p className="text-sm text-amber-800/70 dark:text-amber-200/70 leading-relaxed max-w-sm mx-auto">
                                            A watertight employment contract and proper disciplinary records are your first line of defense at the CCMA. Upgrade to Pro to unlock our full legal library.
                                        </p>
                                    </div>
                                    <Link href="/pricing" className="block pt-2">
                                        <Button className="w-full h-12 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20">
                                            Unlock with Pro Lifetime (Save R3,000)
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

