"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Users, ChevronRight, Sparkles, FileBadge, Pencil, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, deleteEmployee, getSettings } from "@/lib/storage";
import { Employee, EmployerSettings } from "@/lib/schema";
import { generateCertificateOfService } from "@/lib/certificate-pdf";

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [generatingPdf, setGeneratingPdf] = React.useState<string | null>(null);
    const [generatingContract, setGeneratingContract] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const [data, s] = await Promise.all([getEmployees(), getSettings()]);
            setEmployees(data);
            setSettings(s);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        await deleteEmployee(id);
        setConfirmDelete(null);
        load();
    };

    const isFullPro = settings?.proStatus === "pro" || settings?.proStatus === "trial";
    const isAnnual = settings?.proStatus === "annual";
    const limit = isFullPro ? Infinity : (isAnnual ? 3 : 1);

    return (
        <div className="min-h-screen flex flex-col lg:pl-64" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Header */}
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Employees
                        </h1>
                    </div>
                    {(!loading && !isFullPro && employees.length >= limit) ? (
                        <Link href="/pricing">
                            <Button size="sm" className="gap-1.5 bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white">
                                <Sparkles className="h-4 w-4" /> Upgrade
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/employees/new">
                            <Button size="sm" className="gap-1.5 bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white">
                                <Plus className="h-4 w-4" /> Add New
                            </Button>
                        </Link>
                    )}

                </div>
            </header>

            <main className="flex-1 px-4 py-6 content-container">
                {loading ? (
                    <div className="space-y-3 animate-fade-in">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-xl bg-[var(--bg-subtle)]" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-32 bg-[var(--bg-subtle)] rounded" />
                                            <div className="h-3 w-24 bg-[var(--bg-subtle)] rounded" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : employees.length === 0 ? (
                    <Card className="glass-panel border-dashed border-2 p-12 text-center overflow-hidden relative mt-8">
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--amber-500)]/5 to-transparent pointer-events-none" />
                        <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-[var(--amber-500)]/10 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-[var(--amber-500)]/20 blur-xl rounded-full" />
                            <Users className="h-10 w-10 text-[var(--amber-500)] relative z-10" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2 tracking-tight">No employees yet</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-[250px] mx-auto leading-relaxed">Add your first employee to build out your team and manage compliance.</p>
                        <Link href="/employees/new">
                            <Button className="h-12 px-6 rounded-xl bg-[var(--amber-500)] text-white font-bold hover:bg-[var(--amber-600)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all">
                                <Plus className="h-5 w-5 mr-2" /> Add Employee
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {employees.map((emp, i) => (
                            <Card key={emp.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0" style={{ backgroundColor: "var(--amber-500)" }}>
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{emp.name}</p>
                                                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{emp.role} · R{emp.hourlyRate.toFixed(2)}/hr</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!settings?.simpleMode && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        aria-label="Download certificate of service"
                                                        onClick={async () => {
                                                            if (!settings || generatingPdf === emp.id) return;
                                                            try {
                                                                setGeneratingPdf(emp.id);
                                                                const bytes = await generateCertificateOfService(emp, settings);
                                                                const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement("a");
                                                                a.href = url;
                                                                a.download = `${emp.name.replace(/\s+/g, "_")}_Certificate_of_Service.pdf`;
                                                                a.click();
                                                                URL.revokeObjectURL(url);
                                                            } catch (err) {
                                                                console.error("PDF generation failed", err);
                                                                alert("Failed to generate PDF. Please try again.");
                                                            } finally {
                                                                setGeneratingPdf(null);
                                                            }
                                                        }}
                                                    >
                                                        {generatingPdf === emp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBadge className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        aria-label="Download employment contract"
                                                        onClick={async () => {
                                                            if (!settings || generatingContract === emp.id) return;
                                                            try {
                                                                setGeneratingContract(emp.id);
                                                                const { generateEmploymentContract } = await import('@/lib/contract-pdf');
                                                                const bytes = await generateEmploymentContract(emp, settings);
                                                                const blob = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement("a");
                                                                a.href = url;
                                                                a.download = `${emp.name.replace(/\s+/g, "_")}_Employment_Contract.pdf`;
                                                                a.click();
                                                                URL.revokeObjectURL(url);
                                                            } catch (err) {
                                                                console.error("Contract PDF generation failed", err);
                                                                alert("Failed to generate contract. Please try again.");
                                                            } finally {
                                                                setGeneratingContract(null);
                                                            }
                                                        }}
                                                    >
                                                        {generatingContract === emp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0"
                                                        aria-label="Edit employee"
                                                        onClick={() => router.push(`/employees/${emp.id}/edit`)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button size="sm" variant="default" className="gap-1.5 text-xs h-8 bg-amber-500 text-white font-bold" onClick={() => router.push(`/wizard?empId=${emp.id}`)}>
                                                Payslip <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                            {!settings?.simpleMode && (
                                                <button aria-label="Delete employee" onClick={() => setConfirmDelete(emp.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {confirmDelete === emp.id && (
                                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                                            <p className="text-[11px] text-[var(--text-secondary)]">Delete {emp.name}?</p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                                                <Button size="sm" variant="danger" className="bg-red-500 text-white" onClick={() => handleDelete(emp.id)}>Delete</Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {!isFullPro && employees.length >= limit && (
                            <Card className="border-dashed border-2 border-amber-500/50 bg-amber-500/[0.03] overflow-hidden mt-4">
                                <CardContent className="p-6 text-center space-y-3">
                                    <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                                        <Sparkles className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm">Employee Limit Reached</h4>
                                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                                            {isAnnual
                                                ? "Annual Support allows up to 3 workers. Go Lifetime for unlimited seats."
                                                : "The Free plan is limited to 1 worker. Upgrade for more seats and full legal history."}
                                        </p>
                                    </div>
                                    <Link href="/pricing" className="block w-full">
                                        <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-9">
                                            View Upgrade Options
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                <Alert className="mt-6 bg-[var(--bg-subtle)] border-[var(--border-subtle)]">
                    <AlertDescription className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
                        Your data is 100% private and protected by POPIA compliant local-only storage.
                    </AlertDescription>
                </Alert>
            </main>
        </div>
    );
}
