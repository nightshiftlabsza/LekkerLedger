"use client";

import * as React from "react";
import {
    Clock, Search, User, Calendar, Filter,
    ChevronDown, Download, Eye, Trash2,
    ArrowLeft, Loader2, MoreVertical,
    CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SideDrawer } from "@/components/layout/side-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getEmployees, getAllPayslips, deletePayslip } from "@/lib/storage";
import { Employee, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";

export default function HistoryPage() {
    const [loading, setLoading] = React.useState(true);
    const [payslips, setPayslips] = React.useState<PayslipInput[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("all");
    const [selectedYear, setSelectedYear] = React.useState<string>("all");
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [allPs, allEmp] = await Promise.all([getAllPayslips(), getEmployees()]);
            setPayslips(allPs);
            setEmployees(allEmp);
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (id: string) => {
        await deletePayslip(id);
        setDeleteConfirmId(null);
        setPayslips(prev => prev.filter(p => p.id !== id));
    };

    const years = Array.from(new Set(payslips.map(ps => new Date(ps.payPeriodStart).getFullYear()))).sort((a, b) => b - a);

    const filteredPayslips = payslips.filter(ps => {
        const emp = employees.find(e => e.id === ps.employeeId);
        const matchesSearch = emp?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ps.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesEmployee = selectedEmployeeId === "all" || ps.employeeId === selectedEmployeeId;
        const matchesYear = selectedYear === "all" || new Date(ps.payPeriodStart).getFullYear().toString() === selectedYear;

        return matchesSearch && matchesEmployee && matchesYear;
    });

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
            <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 h-16 flex items-center shrink-0">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <h1 className="font-black text-xs uppercase tracking-widest pt-0.5 text-[var(--text-primary)] flex items-center gap-2">
                            History
                        </h1>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--text-secondary)]">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full space-y-6 pb-24 lg:pb-8">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <Input
                            placeholder="Search employee or payslip ID..."
                            className="pl-10 h-11 bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-xl font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="w-full sm:w-48 h-11 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 appearance-none text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-amber-500/20"
                            >
                                <option value="all">All Employees</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="h-11 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 appearance-none text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-amber-500/20 pr-10"
                            >
                                <option value="all">Any Year</option>
                                {years.map(y => (
                                    <option key={y} value={y.toString()}>{y}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Loading records...</p>
                    </div>
                ) : filteredPayslips.length === 0 ? (
                    <Card className="glass-panel border-dashed border-2 p-20 text-center">
                        <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center">
                            <Clock className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">No records found</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-[280px] mx-auto leading-relaxed">
                            Try adjusting your filters or generate a new payslip from the dashboard.
                        </p>
                        <Link href="/dashboard">
                            <Button className="bg-amber-500 text-white font-bold hover:bg-amber-600 rounded-xl h-12 px-8">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        <div className="hidden md:grid grid-cols-5 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                            <div className="col-span-2">Employee / Period</div>
                            <div>Net Pay</div>
                            <div>Reference</div>
                            <div className="text-right">Action</div>
                        </div>
                        {filteredPayslips.map((ps) => {
                            const emp = employees.find(e => e.id === ps.employeeId);
                            const calc = calculatePayslip(ps);
                            return (
                                <Card key={ps.id} className="glass-panel border-none overflow-hidden group hover:shadow-lg transition-all duration-300">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:grid md:grid-cols-5 items-center p-4 sm:p-6 gap-4">
                                            <div className="col-span-2 flex items-center gap-4 w-full">
                                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm shrink-0">
                                                    {emp?.name.charAt(0).toUpperCase() || "E"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[var(--text-primary)] truncate">{emp?.name || "Unknown Employee"}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium capitalize">
                                                        {format(new Date(ps.payPeriodStart), "MMM d")} – {format(new Date(ps.payPeriodEnd), "MMM d, yyyy")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-auto">
                                                <span className="md:hidden text-[10px] uppercase font-black text-[var(--text-muted)] block mb-1">Net Salary</span>
                                                <p className="font-mono font-bold text-lg text-[var(--text-primary)]">R{calc.netPay.toFixed(2)}</p>
                                            </div>

                                            <div className="w-full md:w-auto">
                                                <span className="md:hidden text-[10px] uppercase font-black text-[var(--text-muted)] block mb-1">Ref ID</span>
                                                <code className="text-[10px] font-mono bg-[var(--bg-muted)] px-2 py-1 rounded text-[var(--text-muted)]">
                                                    {ps.id.slice(0, 8)}...
                                                </code>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 w-full md:w-auto mt-2 md:mt-0">
                                                {deleteConfirmId === ps.id ? (
                                                    <>
                                                        <span className="text-xs font-bold text-red-500">Delete?</span>
                                                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold text-red-500 hover:bg-red-50"
                                                            onClick={() => handleDelete(ps.id)}>Yes</Button>
                                                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold text-[var(--text-muted)]"
                                                            onClick={() => setDeleteConfirmId(null)}>No</Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link href={`/preview?payslipId=${ps.id}&empId=${ps.employeeId}`} className="flex-1 md:flex-none">
                                                            <Button variant="ghost" size="sm" className="w-full font-bold gap-2 text-amber-600 hover:bg-amber-500/10">
                                                                <Eye className="h-4 w-4" /> View
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="sm"
                                                            className="font-bold text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50"
                                                            onClick={() => setDeleteConfirmId(ps.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
