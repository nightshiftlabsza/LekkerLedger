"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Save, Lock, FileText, AlertTriangle, ArrowLeft, Download, Loader2, Palmtree, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { WizardStepper, type Step } from "@/components/ui/wizard-stepper";
import { StatusChip, type ChipVariant } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { ActionBar } from "@/components/ui/action-bar";
import { ReviewSummary, type ReviewSection } from "@/components/ui/review-summary";
import {
    getPayPeriod, savePayPeriod, lockPayPeriod as doLockPayPeriod,
    getEmployees, getSettings, getLeaveForEmployee,
    savePayslip, saveDocumentMeta
} from "@/lib/storage";
import { calculatePayslip } from "@/lib/calculator";
import { PayPeriod, Employee, EmployeeEntry, PayslipInput, EmployerSettings, LeaveRecord } from "@/lib/schema";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";
import { getUserPlan, isRecordWithinArchive } from "@/lib/entitlements";
import { PLANS, PlanConfig } from "../../../../config/plans";

export default function PayPeriodWorkspacePage() {
    const params = useParams();
    const periodId = params.periodId as string;

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [period, setPeriod] = React.useState<PayPeriod | null>(null);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [plan, setPlan] = React.useState<PlanConfig>(PLANS.free);
    const [leaveMap, setLeaveMap] = React.useState<Record<string, LeaveRecord[]>>({});
    const [showReview, setShowReview] = React.useState(false);
    const [showLockConfirm, setShowLockConfirm] = React.useState(false);
    const [generatingPdfs, setGeneratingPdfs] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const [p, emps, s] = await Promise.all([getPayPeriod(periodId), getEmployees(), getSettings()]);
            setPeriod(p);
            setEmployees(emps);
            setSettings(s);
            setPlan(getUserPlan(s));

            // Auto-populate leave days from leave records within this period
            if (p && p.status === "draft") {
                const periodStart = new Date(p.startDate).getTime();
                const periodEnd = new Date(p.endDate).getTime();
                const lmap: Record<string, LeaveRecord[]> = {};
                for (const entry of p.entries) {
                    const records = await getLeaveForEmployee(entry.employeeId);
                    const inRange = records.filter(r => {
                        const d = new Date(r.date).getTime();
                        return d >= periodStart && d <= periodEnd;
                    });
                    lmap[entry.employeeId] = inRange;
                    // Pre-fill leaveDays if not already set
                    if (entry.leaveDays === 0 && inRange.length > 0) {
                        entry.leaveDays = inRange.reduce((sum, r) => sum + r.days, 0);
                    }
                }
                setLeaveMap(lmap);
            }
            setLoading(false);
        }
        load();
    }, [periodId]);

    const updateEntry = (employeeId: string, field: keyof EmployeeEntry, value: number | string) => {
        if (!period) return;
        const entries = period.entries.map(e => {
            if (e.employeeId !== employeeId) return e;
            const updated = { ...e, [field]: value };
            // Auto-compute status
            const hasData = updated.ordinaryHours > 0 || updated.overtimeHours > 0 || updated.sundayHours > 0 || updated.publicHolidayHours > 0;
            updated.status = hasData ? "complete" : "empty";
            return updated;
        });
        setPeriod({ ...period, entries });
    };

    const handleSave = async () => {
        if (!period) return;
        setSaving(true);
        await savePayPeriod(period);
        setSaving(false);
    };

    const handleMoveToReview = async () => {
        if (!period) return;
        const updated: PayPeriod = { ...period, status: "review" };
        await savePayPeriod(updated);
        setPeriod(updated);
        setShowReview(true);
    };

    const handleLock = async () => {
        if (!period) return;
        setSaving(true);
        try {
            // Generate payslips and document metadata so they appear in /documents
            for (const entry of period.entries) {
                const emp = employees.find(e => e.id === entry.employeeId);
                if (!emp) continue;
                const payslipInput = entryToPayslipInput(entry, emp);
                await savePayslip(payslipInput);

                await saveDocumentMeta({
                    id: payslipInput.id,
                    householdId: "default",
                    type: "payslip",
                    employeeId: emp.id,
                    periodId: period.id,
                    fileName: getPayslipFilename(emp, payslipInput),
                    createdAt: new Date().toISOString(),
                });
            }

            await doLockPayPeriod(period.id);
            const locked = await getPayPeriod(period.id);
            setPeriod(locked);
            setShowLockConfirm(false);
            setShowReview(false);
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    };

    /** Convert an EmployeeEntry + Employee → PayslipInput for PDF generation */
    const entryToPayslipInput = (entry: EmployeeEntry, emp: Employee): PayslipInput => {
        const records = leaveMap[entry.employeeId] || [];
        const annual = records.filter(r => r.type === "annual").reduce((s, r) => s + r.days, 0);
        const sick = records.filter(r => r.type === "sick").reduce((s, r) => s + r.days, 0);
        const family = records.filter(r => r.type === "family").reduce((s, r) => s + r.days, 0);

        return {
            id: `${period!.id}-${entry.employeeId}`,
            employeeId: entry.employeeId,
            payPeriodStart: new Date(period!.startDate),
            payPeriodEnd: new Date(period!.endDate),
            ordinaryHours: entry.ordinaryHours,
            overtimeHours: entry.overtimeHours,
            sundayHours: entry.sundayHours,
            publicHolidayHours: entry.publicHolidayHours,
            daysWorked: Math.ceil(entry.ordinaryHours / (emp.ordinaryHoursPerDay || 8)),
            shortFallHours: 0,
            hourlyRate: entry.rateOverride ?? emp.hourlyRate,
            includeAccommodation: false,
            otherDeductions: entry.otherDeductions,
            createdAt: new Date(),
            ordinarilyWorksSundays: emp.ordinarilyWorksSundays ?? false,
            ordinaryHoursPerDay: emp.ordinaryHoursPerDay ?? 8,
            annualLeaveTaken: annual,
            sickLeaveTaken: sick,
            familyLeaveTaken: family,
        };
    };

    /** Bulk download all payslip PDFs as individual files */
    const handleDownloadPayslips = async () => {
        if (!period || !settings || !plan) {
            console.error("Missing data for PDF generation:", { period: !!period, settings: !!settings, plan: !!plan });
            alert("Unable to generate PDFs: Missing required data (Settings or Employees).");
            return;
        }

        if (!isRecordWithinArchive(plan, period.endDate)) {
            alert("This record is outside your plan's archive window. Please upgrade to Pro to access and export it.");
            return;
        }

        setGeneratingPdfs(true);
        let completedCount = 0;
        try {
            for (const entry of period.entries) {
                const emp = employees.find(e => e.id === entry.employeeId);
                if (!emp) {
                    console.warn(`Employee not found for entry: ${entry.employeeId}`);
                    continue;
                }

                const payslipInput = entryToPayslipInput(entry, emp);
                const pdfBytes = await generatePayslipPdfBytes(emp, payslipInput, settings);

                // Correctly handle the Uint8Array for Blob
                const blob = new Blob([pdfBytes.buffer as any], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = getPayslipFilename(emp, payslipInput);
                document.body.appendChild(a);
                a.click();

                // Small cleanup
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                completedCount++;
                // Small delay between downloads to avoid browser throttling
                await new Promise(r => setTimeout(r, 400));
            }

            if (completedCount === 0 && period.entries.length > 0) {
                throw new Error("No payslips were generated. Check console for details.");
            }
        } catch (err) {
            console.error("Batch PDF generation failed:", err);
            const msg = err instanceof Error ? err.message : "Unknown error";
            alert(`Some payslips failed to generate: ${msg}. Please try again or check your settings.`);
        }
        setGeneratingPdfs(false);
    };

    if (loading) {
        return (
            <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
                <PageHeader title="Loading..." />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    if (!period) {
        return (
            <div className="w-full max-w-5xl mx-auto">
                <EmptyState
                    title="Pay period not found"
                    description="This pay period may have been deleted."
                    icon={AlertCircle}
                    actionLabel="Go to Payroll"
                    actionHref="/payroll"
                />
            </div>
        );
    }

    const isLocked = period.status === "locked";
    const completedCount = period.entries.filter(e => e.status === "complete").length;
    const totalCount = period.entries.length;
    const allComplete = completedCount === totalCount && totalCount > 0;

    // Wizard steps
    const steps: Step[] = [
        { label: "Enter Hours", status: allComplete ? "complete" : completedCount > 0 ? "active" : "upcoming" },
        { label: "Review", status: period.status === "review" || isLocked ? "complete" : allComplete ? "active" : "upcoming" },
        { label: "Generate", status: isLocked ? "complete" : "upcoming" },
        { label: "Lock", status: isLocked ? "complete" : "upcoming" },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
            <PageHeader
                title={period.name}
                subtitle={`${format(new Date(period.startDate), "d MMM")} — ${format(new Date(period.endDate), "d MMM yyyy")}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/payroll">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-bold">
                                <ArrowLeft className="h-3.5 w-3.5" /> Back
                            </Button>
                        </Link>
                        {isLocked && <StatusChip variant="locked" />}
                    </div>
                }
            />

            {/* Wizard stepper */}
            <WizardStepper steps={steps} className="mb-6" />

            {/* Review mode */}
            {showReview && !isLocked && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="glass-panel border-2 border-[var(--primary)]/30 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="type-h3 text-[var(--text)]">Review & Confirm</h3>
                                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Step 2: Check for compliance errors</p>
                                </div>
                            </div>

                            {(() => {
                                const sections: ReviewSection[] = period.entries.map(entry => {
                                    const emp = employees.find(e => e.id === entry.employeeId);
                                    if (!emp) return { title: "Unknown", items: [] };
                                    const input = entryToPayslipInput(entry, emp);
                                    const calc = calculatePayslip(input);

                                    return {
                                        title: emp.name,
                                        items: [
                                            { label: "Ordinary Pay", value: `R${calc.ordinaryPay.toFixed(2)}` },
                                            { label: "Total Gross", value: `R${calc.grossPay.toFixed(2)}`, highlight: true },
                                            { label: "Total Deductions", value: `R${calc.deductions.total.toFixed(2)}` },
                                            { label: "Net Pay", value: `R${calc.netPay.toFixed(2)}`, isError: calc.grossPay < calc.deductions.total, highlight: true },
                                            { label: "Hourly Rate", value: calc.hourlyRate }
                                        ],
                                        editAction: () => setShowReview(false)
                                    };
                                });

                                const allWarnings: string[] = [];
                                const allErrors: string[] = [];
                                let totalCost = 0;

                                period.entries.forEach(entry => {
                                    const emp = employees.find(e => e.id === entry.employeeId);
                                    if (!emp) return;
                                    const calc = calculatePayslip(entryToPayslipInput(entry, emp));
                                    totalCost += calc.netPay;
                                    calc.complianceWarnings.forEach(w => {
                                        if (!allWarnings.includes(w)) allWarnings.push(`${emp.name}: ${w}`);
                                    });
                                    if (calc.grossPay < calc.deductions.total) {
                                        allErrors.push(`${emp.name}: Net pay is zero because deductions (R${calc.deductions.total.toFixed(2)}) exceed gross pay (R${calc.grossPay.toFixed(2)}).`);
                                    }
                                });

                                return (
                                    <ReviewSummary
                                        sections={sections}
                                        totalCost={totalCost}
                                        warnings={allWarnings}
                                        errors={allErrors}
                                    />
                                );
                            })()}
                        </CardContent>
                    </Card>

                    <ActionBar
                        secondaryAction={
                            <Button
                                variant="outline"
                                onClick={() => { setShowReview(false); handleSave(); }}
                                className="flex-1 sm:flex-none font-bold"
                            >
                                Back to Edit
                            </Button>
                        }
                        primaryAction={
                            <Button
                                onClick={() => setShowLockConfirm(true)}
                                className="flex-1 sm:flex-none gap-2 bg-[var(--success)] text-white font-bold hover:opacity-90 shadow-lg shadow-emerald-500/20"
                            >
                                <Lock className="h-4 w-4" /> Lock & Generate
                            </Button>
                        }
                    />
                </div>
            )}

            {/* Lock confirmation dialog */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="glass-panel max-w-md w-full mx-4">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-[var(--primary)]" />
                                <h3 className="type-h3 text-[var(--text)]">Lock this pay period?</h3>
                            </div>
                            <p className="type-body text-[var(--text-muted)]">
                                Locking prevents all edits. If you need to make changes later, create an adjustment in a new pay period.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setShowLockConfirm(false)} className="flex-1 font-bold">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleLock}
                                    disabled={saving}
                                    className="flex-1 gap-2 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)]"
                                >
                                    <Lock className="h-4 w-4" /> {saving ? "Locking..." : "Confirm & Lock"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Employee entry grid — only when not in review mode */}
            {!showReview && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="type-overline text-[var(--text-muted)]">
                            Employees ({completedCount}/{totalCount} complete)
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {period.entries.map(entry => {
                            const emp = employees.find(e => e.id === entry.employeeId);
                            if (!emp) return null;

                            return (
                                <Card key={entry.employeeId} className="glass-panel border-none">
                                    <CardContent className="p-5 space-y-4">
                                        {/* Employee header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-black text-lg">
                                                    {emp.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="type-body-bold text-[var(--text)]">{emp.name}</p>
                                                    <p className="type-overline text-[var(--text-muted)]">R{emp.hourlyRate.toFixed(2)}/hr</p>
                                                </div>
                                            </div>
                                            <StatusChip variant={entry.status as ChipVariant} />
                                        </div>

                                        {/* Input fields */}
                                        {!isLocked && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div>
                                                    <label className="type-overline text-[var(--text-muted)] block mb-1">Ordinary hrs</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={entry.ordinaryHours || ""}
                                                        onChange={e => updateEntry(entry.employeeId, "ordinaryHours", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="type-overline text-[var(--text-muted)] block mb-1">Overtime hrs</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={entry.overtimeHours || ""}
                                                        onChange={e => updateEntry(entry.employeeId, "overtimeHours", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="type-overline text-[var(--text-muted)] block mb-1">Sunday hrs</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={entry.sundayHours || ""}
                                                        onChange={e => updateEntry(entry.employeeId, "sundayHours", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="type-overline text-[var(--text-muted)] block mb-1">Deductions</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={entry.otherDeductions || ""}
                                                        onChange={e => updateEntry(entry.employeeId, "otherDeductions", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                                                        placeholder="R0"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Locked view - just show totals */}
                                        {isLocked && (
                                            <div className="grid grid-cols-5 gap-3 text-center">
                                                <div>
                                                    <p className="type-overline text-[var(--text-muted)]">Ordinary</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.ordinaryHours}h</p>
                                                </div>
                                                <div>
                                                    <p className="type-overline text-[var(--text-muted)]">Overtime</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.overtimeHours}h</p>
                                                </div>
                                                <div>
                                                    <p className="type-overline text-[var(--text-muted)]">Sunday</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.sundayHours}h</p>
                                                </div>
                                                <div>
                                                    <p className="type-overline text-[var(--text-muted)]">Deductions</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">R{entry.otherDeductions}</p>
                                                </div>
                                                <div>
                                                    <p className="type-overline text-[var(--text-muted)]">Leave</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.leaveDays}d</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Leave auto-populated indicator (draft mode) */}
                                        {!isLocked && entry.leaveDays > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-1">
                                                <Palmtree className="h-3.5 w-3.5 text-emerald-500" />
                                                <span>{entry.leaveDays} leave day{entry.leaveDays !== 1 ? "s" : ""} auto-populated from records</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Action bar — save + review */}
            {!isLocked && !showReview && (
                <ActionBar
                    secondaryAction={
                        <Button onClick={handleSave} disabled={saving} variant="outline" className="flex-1 sm:flex-none gap-2 font-bold">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Progress"}
                        </Button>
                    }
                    primaryAction={
                        <Button
                            onClick={handleMoveToReview}
                            disabled={!allComplete}
                            className="flex-1 sm:flex-none gap-2 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50"
                        >
                            <FileText className="h-4 w-4" /> Review & Generate
                        </Button>
                    }
                />
            )}

            {/* Locked — Download payslips */}
            {isLocked && (
                <Card className="glass-panel border-2 border-[var(--primary)]/30">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-[var(--primary)]" />
                            <div>
                                <h3 className="type-body-bold text-[var(--text)]">Period Locked</h3>
                                <p className="type-overline text-[var(--text-muted)]">
                                    Locked on {period.lockedAt ? format(new Date(period.lockedAt), "dd MMM yyyy, HH:mm") : "N/A"}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleDownloadPayslips}
                            disabled={generatingPdfs}
                            className={`w-full gap-2 h-12 text-base font-bold ${!isRecordWithinArchive(plan, period.endDate) ? 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] hover:bg-[var(--surface-2)] cursor-not-allowed' : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'}`}
                        >
                            {!isRecordWithinArchive(plan, period.endDate) ? (
                                <><Lock className="h-5 w-5" /> Upgrade to Export Payslips ({totalCount})</>
                            ) : generatingPdfs ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Generating PDFs…</>
                            ) : (
                                <><Download className="h-5 w-5" /> Download All Payslips ({totalCount})</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
