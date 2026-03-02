"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Palmtree, Clock, ShieldAlert, CheckCircle2, AlertTriangle, CalendarRange, Filter, FileText, Download, UserCircle2, Info, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getLeaveRecords, saveLeaveRecord, deleteLeaveRecord } from "@/lib/storage";
import { Employee, LeaveRecord } from "@/lib/schema";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaveDashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultEmployeeId = searchParams.get("employeeId");
    const { toast } = useToast();

    const [loading, setLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>(defaultEmployeeId || "all");
    const [records, setRecords] = React.useState<LeaveRecord[]>([]);

    // New Record Form State
    const [showNewForm, setShowNewForm] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [newRecord, setNewRecord] = React.useState<Partial<LeaveRecord>>({
        type: "annual",
        status: "approved"
    });

    // P2: Delete confirmation state
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

    React.useEffect(() => {
        loadData();
    }, [selectedEmployeeId]);

    async function loadData() {
        setLoading(true);
        const emps = await getEmployees();
        setEmployees(emps);
        if (emps.length === 0) {
            setLoading(false);
            return;
        }

        const effectiveEmpId = selectedEmployeeId === "all" ? undefined : selectedEmployeeId;
        const allRecords = await getLeaveRecords(effectiveEmpId);
        // Sort newest first
        allRecords.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        setRecords(allRecords);

        if (defaultEmployeeId && !newRecord.employeeId) {
            setNewRecord(prev => ({ ...prev, employeeId: defaultEmployeeId }));
        }

        setLoading(false);
    }

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRecord.employeeId || !newRecord.startDate || !newRecord.endDate || !newRecord.type) {
            toast("Please fill in all required fields.");
            return;
        }

        const emp = employees.find(e => e.id === newRecord.employeeId);
        if (!emp) return;

        setSaving(true);
        try {
            const days = differenceInDays(new Date(newRecord.endDate), new Date(newRecord.startDate)) + 1;
            const recordToSave: LeaveRecord = {
                id: crypto.randomUUID(),
                employeeId: newRecord.employeeId,
                type: newRecord.type as any,
                startDate: new Date(newRecord.startDate),
                endDate: new Date(newRecord.endDate),
                daysTaken: days > 0 ? days : 1, // Basic assumption, UI should refine
                status: (newRecord.status as any) || "approved",
                notes: newRecord.notes,
                createdAt: new Date()
            };

            await saveLeaveRecord(recordToSave);
            toast("Leave record saved successfully.");
            setShowNewForm(false);
            setNewRecord({ type: "annual", status: "approved" });
            loadData();
        } catch (error) {
            console.error(error);
            toast("Failed to save leave record.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteLeaveRecord(id);
        toast("Leave record deleted.");
        setDeleteConfirmId(null);
        loadData();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
                <header className="sticky top-0 z-30 px-4 py-3 glass-panel border-b border-[var(--border-subtle)]">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <Skeleton className="h-9 w-full max-w-[200px]" />
                    </div>
                </header>
                <div className="p-4 space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-base)] pb-24">
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel border-b border-[var(--border-subtle)] shadow-sm">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SideDrawer />
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Back">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="font-bold text-base text-[var(--text-primary)] tracking-tight">Leave Manager</h1>
                    </div>
                    <Button size="sm" onClick={() => setShowNewForm(!showNewForm)} className="h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 rounded-xl shadow-sm">
                        {showNewForm ? "Cancel" : <><Plus className="h-4 w-4" /> Record Leave</>}
                    </Button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-6">

                {/* Filters */}
                {employees.length > 0 && !showNewForm && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <Button
                            variant={selectedEmployeeId === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEmployeeId("all")}
                            className={`rounded-full px-4 text-xs font-bold whitespace-nowrap ${selectedEmployeeId === "all" ? "bg-amber-500 text-white hover:bg-amber-600" : ""}`}
                        >
                            All Employees
                        </Button>
                        {employees.map(emp => (
                            <Button
                                key={emp.id}
                                variant={selectedEmployeeId === emp.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedEmployeeId(emp.id)}
                                className={`rounded-full px-4 text-xs font-bold whitespace-nowrap ${selectedEmployeeId === emp.id ? "bg-amber-500 text-white hover:bg-amber-600" : ""}`}
                            >
                                {emp.name}
                            </Button>
                        ))}
                    </div>
                )}

                {/* New Record Form */}
                {showNewForm && (
                    <Card className="glass-panel border-amber-500/20 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-4">
                        <CardContent className="p-5 sm:p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <Palmtree className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-[var(--text-primary)] leading-tight">New Leave Record</h2>
                                    <p className="text-xs text-[var(--text-muted)]">Log taken or planned days off</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveRecord} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Employee</Label>
                                    <Select value={newRecord.employeeId} onValueChange={v => setNewRecord({ ...newRecord, employeeId: v })}>
                                        <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-amber-500">
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(e => (
                                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Leave Type</Label>
                                        <Select value={newRecord.type} onValueChange={v => setNewRecord({ ...newRecord, type: v as any })}>
                                            <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="annual">Annual Leave</SelectItem>
                                                <SelectItem value="sick">Sick Leave</SelectItem>
                                                <SelectItem value="family">Family Responsibility</SelectItem>
                                                <SelectItem value="maternity">Maternity</SelectItem>
                                                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={newRecord.status} onValueChange={v => setNewRecord({ ...newRecord, status: v as any })}>
                                            <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800"
                                            value={newRecord.startDate ? format(new Date(newRecord.startDate), "yyyy-MM-dd") : ""}
                                            onChange={e => setNewRecord({ ...newRecord, startDate: e.target.value ? new Date(e.target.value) : undefined })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800"
                                            value={newRecord.endDate ? format(new Date(newRecord.endDate), "yyyy-MM-dd") : ""}
                                            onChange={e => setNewRecord({ ...newRecord, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes (Optional)</Label>
                                    <Input
                                        placeholder="e.g. Doctor's note provided"
                                        className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800"
                                        value={newRecord.notes || ""}
                                        onChange={e => setNewRecord({ ...newRecord, notes: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base mt-2 shadow-sm">
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                                    Save Leave Record
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Records List */}
                <div className="space-y-3">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">
                        {selectedEmployeeId === "all" ? "Recent Leave History" : "Employee Leave History"}
                    </h2>

                    {records.length === 0 ? (
                        <Card className="glass-panel border-dashed p-10 text-center">
                            <Palmtree className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                            <p className="text-sm font-bold text-[var(--text-primary)]">No leave records found</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Tap 'Record Leave' to add days off.</p>
                        </Card>
                    ) : (
                        records.map(record => {
                            const emp = employees.find(e => e.id === record.employeeId);
                            const isPending = record.status === "pending";
                            return (
                                <Card key={record.id} className="glass-panel border-none overflow-hidden group">
                                    <CardContent className="p-0">
                                        <div className="flex items-stretch">
                                            {/* Left color bar based on type */}
                                            <div className={`w-1.5 shrink-0 ${record.type === 'sick' ? 'bg-rose-500' :
                                                record.type === 'annual' ? 'bg-amber-500' :
                                                    record.type === 'family' ? 'bg-blue-500' :
                                                        'bg-zinc-500'
                                                }`} />
                                            <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-sm uppercase tracking-wider text-[var(--text-primary)]">
                                                            {record.type} Leave
                                                        </span>
                                                        {isPending && (
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                                        <CalendarRange className="h-3.5 w-3.5 opacity-70" />
                                                        {format(new Date(record.startDate), "MMM d, yyyy")}
                                                        {record.startDate.getTime() !== record.endDate.getTime() && (
                                                            <> → {format(new Date(record.endDate), "MMM d, yyyy")}</>
                                                        )}
                                                        <span className="mx-1">•</span>
                                                        <span className="font-bold text-[var(--text-primary)]">{record.daysTaken} day{record.daysTaken > 1 ? 's' : ''}</span>
                                                    </div>
                                                    {selectedEmployeeId === "all" && emp && (
                                                        <div className="mt-2 text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-2 w-fit">
                                                            <UserCircle2 className="h-3.5 w-3.5" /> {emp.name}
                                                        </div>
                                                    )}
                                                    {record.notes && (
                                                        <p className="mt-2 text-xs text-[var(--text-muted)] italic">"{record.notes}"</p>
                                                    )}
                                                </div>

                                                {/* P2 FIX: replace native confirm() with inline UI */}
                                                <div className="flex items-center gap-2">
                                                    {deleteConfirmId === record.id ? (
                                                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 animate-in fade-in">
                                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 pl-2">Delete?</span>
                                                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="h-6 text-xs px-2">No</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(record.id)} className="h-6 text-xs px-2">Yes</Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-xs font-bold text-rose-500 hover:bg-rose-500/10 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => setDeleteConfirmId(record.id)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                    <Button variant="outline" size="sm" className="text-xs font-bold h-8 border-[var(--border-subtle)]">
                                                        Edit
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-blue-800 dark:text-blue-300">
                    <Info className="h-5 w-5 shrink-0" />
                    <div className="text-xs space-y-1">
                        <p className="font-bold">BCEA Leave Guidelines</p>
                        <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                            <li>Annual: 15 days per year (or 1 day per 17 days worked)</li>
                            <li>Sick: 30 days every 3 years (or 1 day per 26 days worked in first 6 mos)</li>
                            <li>Family: 3 days per year (if working >4 days/week for >4 mos)</li>
                        </ul>
                    </div>
                </div>

            </main>
        </div>
    );
}

