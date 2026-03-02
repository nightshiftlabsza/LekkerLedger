"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft, Loader2, Palmtree, Thermometer, Heart, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployee, getLeaveForEmployee, saveLeaveRecord, deleteLeaveRecord, getTotalDaysWorkedForEmployee } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { Employee, LeaveRecord, LeaveType } from "@/lib/schema";
import { calculateLeaveBalances, LeaveBalances } from "@/lib/leave";
import { Plus, X, Tag, Trash2, Pencil, Save, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateSafe } from "@/lib/utils";

function LeaveCard({
    icon: Icon,
    label,
    accrued,
    taken,
    remaining,
    color,
}: {
    icon: React.ElementType;
    label: string;
    accrued: number;
    taken: number;
    remaining: number;
    color: string;
}) {
    const pct = accrued > 0 ? Math.min(100, (remaining / accrued) * 100) : 0;
    return (
        <Card className="animate-slide-up">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}18` }}
                    >
                        <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {remaining.toFixed(1)} days remaining
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: "var(--bg-subtle)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                </div>

                <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Accrued: {accrued.toFixed(1)}d</span>
                    <span>Taken: {taken.toFixed(1)}d</span>
                </div>
            </CardContent>
        </Card>
    );
}

function LeaveContent() {
    const searchParams = useSearchParams();
    const employeeId = searchParams.get("employeeId") || "";
    const [loading, setLoading] = React.useState(true);
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [balances, setBalances] = React.useState<LeaveBalances | null>(null);
    const [records, setRecords] = React.useState<LeaveRecord[]>([]);
    const [showAdd, setShowAdd] = React.useState(false);
    const [newLeave, setNewLeave] = React.useState({
        type: "annual" as LeaveType,
        days: "1",
        date: formatDateSafe(new Date()),
        note: "",
    });
    const [editingNote, setEditingNote] = React.useState<string | null>(null);
    const [noteValue, setNoteValue] = React.useState("");

    const load = React.useCallback(async () => {
        if (!employeeId) { setLoading(false); return; }
        const emp = await getEmployee(employeeId);
        setEmployee(emp);
        if (emp) {
            const [leaveRecords, totalDaysWorked] = await Promise.all([
                getLeaveForEmployee(employeeId),
                getTotalDaysWorkedForEmployee(employeeId)
            ]);
            setRecords(leaveRecords);
            const bal = calculateLeaveBalances(emp.startDate || "", totalDaysWorked, leaveRecords);
            setBalances(bal);
        }
        setLoading(false);
    }, [employeeId]);

    React.useEffect(() => {
        load();
    }, [load]);

    const handleAddLeave = async () => {
        if (!employee) return;
        const record: LeaveRecord = {
            id: crypto.randomUUID(),
            employeeId: employee.id,
            type: newLeave.type,
            days: parseFloat(newLeave.days),
            date: newLeave.date,
            note: newLeave.note,
        };
        await saveLeaveRecord(record);
        setShowAdd(false);
        setNewLeave({ type: "annual", days: "1", date: formatDateSafe(new Date()), note: "" });
        load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this leave record?")) return;
        await deleteLeaveRecord(id);
        load();
    };

    const handleUpdateNote = async (record: LeaveRecord) => {
        await saveLeaveRecord({ ...record, note: noteValue });
        setEditingNote(null);
        load();
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
                <Skeleton className="h-14 w-full rounded-xl" />
                <div className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="text-center py-20">
                <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Employee not found</p>
                <Link href="/employees"><Button variant="outline">Back to Employees</Button></Link>
            </div>
        );
    }

    if (!employee.startDate) {
        return (
            <div className="text-center py-20 px-4 space-y-4">
                <CalendarDays className="h-12 w-12 mx-auto" style={{ color: "var(--text-muted)" }} />
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No Start Date Set</p>
                <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                    To calculate leave balances, we need to know when {employee.name} started working.
                    Edit their profile to add a start date.
                </p>
                <Link href="/employees">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Employees
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Employee header */}
            <div className="flex items-center gap-3 mb-2">
                <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: "var(--amber-500)", color: "var(--text-inverse)" }}
                >
                    {employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-bold" style={{ color: "var(--text-primary)" }}>{employee.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Employed since {new Date(employee.startDate).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
            </div>

            {/* Manual Leave Form */}
            {showAdd ? (
                <Card className="animate-slide-down border-2 border-[var(--amber-500)]">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm">Add Leave Record</h3>
                            <button onClick={() => setShowAdd(false)} className="text-[var(--text-muted)] p-1 hover:bg-[var(--bg-subtle)] rounded-md">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs">Type</Label>
                                <select
                                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm"
                                    value={newLeave.type}
                                    onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value as LeaveType })}
                                >
                                    <option value="annual">Annual</option>
                                    <option value="sick">Sick</option>
                                    <option value="family">Family Responsibility</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Days</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={newLeave.days}
                                    onChange={(e) => setNewLeave({ ...newLeave, days: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Note (Optional)</Label>
                            <Input
                                placeholder="e.g. Appointment, Flu"
                                value={newLeave.note}
                                onChange={(e) => setNewLeave({ ...newLeave, note: e.target.value })}
                            />
                        </div>
                        <Button className="w-full h-11" onClick={handleAddLeave}>Save Record</Button>
                    </CardContent>
                </Card>
            ) : (
                <Button
                    variant="outline"
                    className="w-full border-dashed border-2 py-6 gap-2"
                    onClick={() => setShowAdd(true)}
                >
                    <Plus className="h-4 w-4" /> Log Historical Leave
                </Button>
            )}

            {/* Leave balance cards */}
            {balances && (
                <div className="space-y-3">
                    <LeaveCard
                        icon={Palmtree}
                        label="Annual Leave"
                        accrued={balances.annual.accrued}
                        taken={balances.annual.taken}
                        remaining={balances.annual.remaining}
                        color="#c47a1c"
                    />
                    <LeaveCard
                        icon={Thermometer}
                        label="Sick Leave"
                        accrued={balances.sick.accrued}
                        taken={balances.sick.taken}
                        remaining={balances.sick.remaining}
                        color="#3b82f6"
                    />
                    <LeaveCard
                        icon={Heart}
                        label="Family Responsibility"
                        accrued={balances.family.accrued}
                        taken={balances.family.taken}
                        remaining={balances.family.remaining}
                        color="#10b981"
                    />
                </div>
            )}

            {/* Leave history */}
            {records.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                            Leave History
                        </h3>
                        <div className="space-y-2">
                            {records.map((r) => (
                                <div
                                    key={r.id}
                                    className="py-3 space-y-2"
                                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        r.type === "annual" ? "#c47a1c" :
                                                            r.type === "sick" ? "#3b82f6" : "#10b981",
                                                }}
                                            />
                                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                                {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{r.days}d</span>
                                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(r.date).toLocaleDateString("en-ZA")}</span>
                                            <div className="flex items-center gap-1 ml-2">
                                                <button onClick={() => { setEditingNote(r.id); setNoteValue(r.note || ""); }} className="p-1.5 hover:bg-[var(--bg-subtle)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-[var(--bg-subtle)] rounded-md text-[var(--text-muted)] hover:text-red-500">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {editingNote === r.id ? (
                                        <div className="flex gap-2">
                                            <Input
                                                className="h-8 text-xs font-normal"
                                                value={noteValue}
                                                onChange={(e) => setNoteValue(e.target.value)}
                                                autoFocus
                                            />
                                            <Button size="sm" className="h-8 px-2" onClick={() => handleUpdateNote(r)}>
                                                <Save className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setEditingNote(null)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : r.note && (
                                        <p className="text-[11px] italic pl-4" style={{ color: "var(--text-secondary)" }}>
                                            "{r.note}"
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Leave is calculated per BCEA &amp; Sectoral Determination 7.
                Leave taken via the payslip wizard is automatically logged here.
            </p>
        </div>
    );
}

export default function LeavePage() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
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
                        Leave Tracker
                    </h1>
                </div>
            </header>
            <main className="flex-1 px-4 py-6 content-container">
                <React.Suspense
                    fallback={
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
                        </div>
                    }
                >
                    <LeaveContent />
                </React.Suspense>
            </main>
        </div>
    );
}
