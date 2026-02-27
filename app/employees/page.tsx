"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2, Users, ChevronRight, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, deleteEmployee } from "@/lib/storage";
import { Employee } from "@/lib/schema";

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await getEmployees();
            setEmployees(data);
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
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/">
                            <button
                                aria-label="Go home"
                                className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--bg-subtle)]"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        </Link>
                        <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Employees
                        </h1>
                    </div>
                    <Link href="/employees/new">
                        <Button size="sm" className="gap-1.5" id="add-employee-btn">
                            <Plus className="h-4 w-4" /> Add
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-4">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--amber-500)" }} />
                    </div>
                )}

                {!loading && employees.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in">
                        <div
                            className="h-16 w-16 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: "rgba(196,122,28,0.10)" }}
                        >
                            <Users className="h-8 w-8" style={{ color: "var(--amber-500)" }} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                                No employees yet
                            </p>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                Add your first domestic worker to get started.
                            </p>
                        </div>
                        <Link href="/employees/new">
                            <Button className="gap-2 mt-2">
                                <Plus className="h-4 w-4" /> Add Employee
                            </Button>
                        </Link>
                    </div>
                )}

                {!loading && employees.length > 0 && (
                    <div className="space-y-3 animate-slide-up">
                        {employees.map((emp, i) => (
                            <Card
                                key={emp.id}
                                className="animate-slide-up"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div
                                            className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                                            style={{ backgroundColor: "var(--amber-500)" }}
                                        >
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                                {emp.name}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                                                {emp.role} · R{emp.hourlyRate.toFixed(2)}/hr
                                            </p>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1 text-xs"
                                                onClick={() => router.push(`/leave?employeeId=${emp.id}`)}
                                            >
                                                <Palmtree className="h-3.5 w-3.5" /> Leave
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="gap-1.5 text-xs"
                                                onClick={() => router.push(`/wizard?empId=${emp.id}`)}
                                            >
                                                Payslip <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                            <button
                                                onClick={() => setConfirmDelete(emp.id)}
                                                aria-label={`Delete ${emp.name}`}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--red-50)]"
                                                style={{ color: "var(--text-muted)" }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline delete confirmation */}
                                    {confirmDelete === emp.id && (
                                        <div
                                            className="mt-3 pt-3 flex items-center justify-between gap-2 animate-slide-down"
                                            style={{ borderTop: "1px solid var(--border-subtle)" }}
                                        >
                                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                                Delete {emp.name}? This can&#39;t be undone.
                                            </p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                                                    Cancel
                                                </Button>
                                                <Button size="sm" variant="danger" onClick={() => handleDelete(emp.id)}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Alert variant="default" className="mt-6">
                    <AlertDescription>
                        Data is stored only on this device. Nothing is sent to any server.
                    </AlertDescription>
                </Alert>
            </main>
        </div>
    );
}
