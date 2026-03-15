"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Save, Lock, FileText, AlertTriangle, ArrowLeft, Download, Loader2, Palmtree, AlertCircle, Mail, MessageCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { WizardStepper, type Step } from "@/components/ui/wizard-stepper";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { ActionBar } from "@/components/ui/action-bar";
import { ReviewSummary, type ReviewSection } from "@/components/ui/review-summary";
import { useToast } from "@/components/ui/toast";
import {
    getPayPeriod, savePayPeriod, lockPayPeriod as doLockPayPeriod, unlockPayPeriod as doUnlockPayPeriod,
    getEmployees, getSettings, getLeaveForEmployee,
    savePayslip, saveDocumentMeta
} from "@/lib/storage";
import { calculatePayslip } from "@/lib/calculator";
import { getMonthKey, normalizePayslipDraftToInput } from "@/lib/payslip-draft";
import { PayPeriod, Employee, EmployeeEntry, PayslipInput, EmployerSettings, LeaveRecord } from "@/lib/schema";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";
import { getUserPlan, isRecordWithinArchive } from "@/lib/entitlements";
import { track } from "@/lib/analytics";
import { PLANS, PlanConfig } from "../../../../config/plans";
import { EMPLOYER_DETAILS_REQUIRED_ERROR, getEmployerDetailsSettingsHref, hasRequiredEmployerDetails } from "@/lib/employer-details";

function openWhatsAppDesktop(): void {
    globalThis.open("https://web.whatsapp.com/", "_blank", "noopener,noreferrer");
}

export default function PayPeriodWorkspacePage() {
    const params = useParams();
    const router = useRouter();
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
    const [saveAcknowledged, setSaveAcknowledged] = React.useState(false);
    const { toast } = useToast();
    const saveAcknowledgedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const redirectToEmployerSettings = React.useCallback(() => {
        toast("Add your employer name and address in Settings before generating payslips.", "info");
        router.push(getEmployerDetailsSettingsHref(`/payroll/${periodId}`));
    }, [periodId, router, toast]);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const [p, emps, s] = await Promise.all([getPayPeriod(periodId), getEmployees(), getSettings()]);
            setPeriod(p);
            setEmployees(emps);
            setSettings(s);
            setPlan(getUserPlan(s));

            // Auto-populate leave days from leave records within this period
            if (p?.status === "draft") {
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
        return () => {
            if (saveAcknowledgedTimerRef.current) {
                globalThis.clearTimeout(saveAcknowledgedTimerRef.current);
            }
        };
    }, [periodId]);

    const updateEntry = (employeeId: string, field: keyof EmployeeEntry, value: number | string) => {
        if (!period) return;
        const entries = period.entries.map(e => {
            if (e.employeeId !== employeeId) return e;
            const updated = { ...e, [field]: value };
            // A status of "complete" means the user has interacted with the entry.
            // We allow proceeding even if all fields are 0.
            updated.status = "complete";
            return updated;
        });
        setPeriod({ ...period, entries });
    };

    const handleSave = async () => {
        if (!period || saving) return;
        setSaving(true);
        try {
            await savePayPeriod(period);
            setSaveAcknowledged(true);
            if (saveAcknowledgedTimerRef.current) {
                globalThis.clearTimeout(saveAcknowledgedTimerRef.current);
            }
            saveAcknowledgedTimerRef.current = globalThis.setTimeout(() => {
                setSaveAcknowledged(false);
                saveAcknowledgedTimerRef.current = null;
            }, 2200);
            toast("Changes saved.", "success");
        } catch (error) {
            console.error("handleSave error:", error);
            toast(error instanceof Error ? error.message : "Could not save this payroll month.", "error");
        } finally {
            setSaving(false);
        }
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
        if (!hasRequiredEmployerDetails(settings)) {
            redirectToEmployerSettings();
            return;
        }
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
                    householdId: emp.householdId ?? period.householdId ?? "default",
                    type: "payslip",
                    employeeId: emp.id,
                    periodId: period.id,
                    fileName: getPayslipFilename(emp, payslipInput),
                    source: "generated",
                    createdAt: new Date().toISOString(),
                });
            }

            await doLockPayPeriod(period.id);
            const locked = await getPayPeriod(period.id);
            setPeriod(locked);
            setShowLockConfirm(false);
            setShowReview(false);
            toast("Payroll finalised successfully", "success");
        } catch (err) {
            console.error("handleLock error:", err);
            setShowLockConfirm(false);
            const msg = err instanceof Error ? err.message : "Failed to finalise pay period";
            const isDuplicate = msg.includes("already exists");
            toast(
                isDuplicate
                    ? "A payslip already exists for this period. Use \"Undo Finalise\" below to regenerate."
                    : msg,
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleUnlock = async () => {
        if (!period) return;
        if (!confirm("Unlocking will delete the generated payslips from your documents so you can fix errors and re-finalise. Are you sure?")) return;
        
        setSaving(true);
        try {
            await doUnlockPayPeriod(period.id);
            const unlocked = await getPayPeriod(period.id);
            setPeriod(unlocked);
            setShowReview(true); // Take them back to review mode
            toast("Payroll unlocked for editing", "success");
        } catch (err) {
            console.error("handleUnlock error:", err);
            toast(err instanceof Error ? err.message : "Failed to unlock pay period", "error");
        } finally {
            setSaving(false);
        }
    };

    /** Convert an EmployeeEntry + Employee → PayslipInput for PDF generation */
    const entryToPayslipInput = (entry: EmployeeEntry, emp: Employee): PayslipInput => {
        const records = leaveMap[entry.employeeId] || [];
        const annual = records.filter(r => r.type === "annual").reduce((s, r) => s + r.days, 0);
        const sick = records.filter(r => r.type === "sick").reduce((s, r) => s + r.days, 0);
        const family = records.filter(r => r.type === "family").reduce((s, r) => s + r.days, 0);

        return {
            ...normalizePayslipDraftToInput({
                id: `${period!.id}-${entry.employeeId}`,
                householdId: period!.householdId || emp.householdId || "default",
                employeeId: entry.employeeId,
                monthKey: getMonthKey(new Date(period!.startDate)),
                standardWorkingDaysThisMonth: Math.ceil(entry.ordinaryHours / (emp.ordinaryHoursPerDay || 8)),
                ordinaryHoursPerDay: emp.ordinaryHoursPerDay ?? 8,
                ordinaryHoursOverride: entry.ordinaryHours,
                overtimeHours: entry.overtimeHours,
                sundayHours: entry.sundayHours,
                publicHolidayHours: entry.publicHolidayHours,
                shortShiftCount: 0,
                shortShiftWorkedHours: 0,
                shortFallHoursOverride: entry.shortFallHours || 0,
                hourlyRate: entry.rateOverride ?? emp.hourlyRate,
                includeAccommodation: false,
                otherDeductions: entry.otherDeductions,
                annualLeaveTaken: annual,
                sickLeaveTaken: sick,
                familyLeaveTaken: family,
                ordinarilyWorksSundays: emp.ordinarilyWorksSundays ?? false,
                createdAt: new Date(),
            }),
            advanceAmount: entry.advanceAmount || 0,
            payPeriodStart: new Date(period!.startDate),
            payPeriodEnd: new Date(period!.endDate),
        };
    };

    const buildPayslipFiles = async (): Promise<File[]> => {
        if (!period || !settings || !plan) {
            console.error("Missing data for PDF generation:", { period: !!period, settings: !!settings, plan: !!plan });
            throw new Error("Missing settings or employee data.");
        }

        if (!hasRequiredEmployerDetails(settings)) {
            redirectToEmployerSettings();
            throw new Error(EMPLOYER_DETAILS_REQUIRED_ERROR);
        }

        if (!isRecordWithinArchive(plan, period.endDate)) {
            throw new Error("This month is outside your archive window.");
        }

        const files: File[] = [];
        for (const entry of period.entries) {
            const emp = employees.find(e => e.id === entry.employeeId);
            if (!emp) continue;
            const payslipInput = entryToPayslipInput(entry, emp);
            const pdfBytes = await generatePayslipPdfBytes(emp, payslipInput, settings);
            const fileName = getPayslipFilename(emp, payslipInput);
            files.push(new File([Uint8Array.from(pdfBytes)], fileName, { type: "application/pdf" }));
        }

        if (files.length === 0) {
            throw new Error("No payslips were generated.");
        }

        return files;
    };

    const downloadFiles = async (files: File[]) => {
        for (const file of files) {
            const url = URL.createObjectURL(file);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = file.name;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    };

    /** Bulk download all payslip PDFs as individual files */
    const handleDownloadPayslips = async () => {
        setGeneratingPdfs(true);
        try {
            const files = await buildPayslipFiles();
            await downloadFiles(files);
            track("payslip_export", {
                method: "bulk_download_pdf",
                payslip_count: files.length,
                period_status: period?.status ?? "unknown",
            });
            toast("Payslips downloaded", "success");
        } catch (error) {
            console.error("Batch PDF generation failed:", error);
            if (error instanceof Error && error.message === EMPLOYER_DETAILS_REQUIRED_ERROR) {
                return;
            }
            toast(error instanceof Error ? error.message : "Could not generate payslips", "error");
        } finally {
            setGeneratingPdfs(false);
        }
    };

    const handleSharePayslips = async (channel: "email" | "whatsapp") => {
        setGeneratingPdfs(true);
        try {
            const files = await buildPayslipFiles();
            const shareText = `Payslips for ${period?.name} from LekkerLedger.`;
            const navigatorWithShare = navigator as Navigator & {
                canShare?: (data?: ShareData) => boolean;
            };

            if (navigatorWithShare.share && navigatorWithShare.canShare?.({ files })) {
                await navigatorWithShare.share({
                    title: `${period?.name} payslips`,
                    text: shareText,
                    files,
                });
                toast(channel === "email" ? "Email share opened" : "WhatsApp share opened", "success");
                return;
            }

            await downloadFiles(files);
            if (channel === "email") {
                globalThis.location.href = `mailto:?subject=${encodeURIComponent(`${period?.name} payslips`)}&body=${encodeURIComponent("Your payslip PDFs have been downloaded. Attach them from your Downloads folder before sending.")}`;
                toast("Payslips downloaded. Attach them from Downloads in your email app.", "info");
            } else {
                openWhatsAppDesktop();
                toast("Payslips downloaded. Attach them from Downloads in WhatsApp.", "info");
            }
        } catch (error) {
            console.error("Sharing payslips failed:", error);
            if (error instanceof Error && error.message === EMPLOYER_DETAILS_REQUIRED_ERROR) {
                return;
            }
            toast(error instanceof Error ? error.message : "Could not prepare the payslips", "error");
        } finally {
            setGeneratingPdfs(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-5xl space-y-6 pb-40 md:pb-24">
                <PageHeader title="Loading..." />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    if (!period) {
        return (
            <div className="mx-auto w-full max-w-5xl pb-40 md:pb-24">
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
    const allComplete = totalCount > 0 && completedCount === totalCount;
    const employerDetailsReady = hasRequiredEmployerDetails(settings);

    // Wizard status logic
    let enterHoursStatus: Step["status"] = "upcoming";
    if (allComplete) enterHoursStatus = "complete";
    else if (completedCount > 0) enterHoursStatus = "active";

    let reviewStatus: Step["status"] = "upcoming";
    if (period.status === "review" || isLocked) reviewStatus = "complete";
    else if (allComplete) reviewStatus = "active";

    // Wizard steps
    const steps: Step[] = [
        { label: "Enter Hours", status: enterHoursStatus },
        { label: "Review", status: reviewStatus },
        { label: "Generate", status: isLocked ? "complete" : "upcoming" },
        { label: "Lock", status: isLocked ? "complete" : "upcoming" },
    ];

    return (
        <div className="mx-auto w-full max-w-5xl space-y-5 pb-40 md:space-y-6 md:pb-24">
            <PageHeader
                title={period.name}
                subtitle={`${format(new Date(period.startDate), "d MMM")} — ${format(new Date(period.endDate), "d MMM yyyy")}`}
                actions={
                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                        <Link href="/payroll">
                            <Button variant="ghost" size="sm" className="min-h-[44px] gap-1.5 text-sm font-bold">
                                <ArrowLeft className="h-3.5 w-3.5" /> Back
                            </Button>
                        </Link>
                        {isLocked && <StatusChip variant="locked" label="Finalised" />}
                    </div>
                }
            />

            {/* Wizard stepper */}
            <WizardStepper steps={steps} className="mb-6" />

            {/* Review mode */}
            {showReview && !isLocked && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {!employerDetailsReady && (
                        <Card className="border border-[var(--focus)]/40 bg-[var(--primary)]/5">
                            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--primary)]" />
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text)]">Employer details required before finalising</p>
                                        <p className="text-sm text-[var(--text-muted)]">Complete your employer name and address in Settings before this month can generate payslips.</p>
                                    </div>
                                </div>
                                <Link href={getEmployerDetailsSettingsHref(`/payroll/${periodId}`)}>
                                    <Button variant="outline" className="font-bold">Open Settings</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="glass-panel border-2 border-[var(--primary)]/30 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="type-h3 text-[var(--text)]">Review this month</h3>
                                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Check the totals before you finalise it</p>
                                </div>
                            </div>

                            {(() => {
                                const sections: ReviewSection[] = period.entries.map(entry => {
                                    const emp = employees.find(e => e.id === entry.employeeId);
                                    if (!emp) return { title: "Unknown", items: [] };
                                    const input = entryToPayslipInput(entry, emp);
                                    const calc = calculatePayslip(input);

                                    const sundayRate = emp.ordinarilyWorksSundays ? 1.5 : 2.0;
                                    return {
                                        title: emp.name,
                                        items: [
                                            { label: `Ordinary Pay (${input.ordinaryHours}h${calc.topUps.fourHourMinimumHours > 0 ? ` + ${calc.topUps.fourHourMinimumHours}h 4-hr top-up` : ""})`, value: `R${calc.ordinaryPay.toFixed(2)}` },
                                            ...(input.overtimeHours > 0 ? [{ label: `Overtime Pay (${input.overtimeHours}h @ 1.5×)`, value: `R${(input.overtimeHours * (entry.rateOverride ?? emp.hourlyRate) * 1.5).toFixed(2)}` }] : []),
                                            ...(input.sundayHours > 0 ? [{ label: `Sunday Pay (${input.sundayHours}h @ ${sundayRate}×)`, value: `R${(input.sundayHours * (entry.rateOverride ?? emp.hourlyRate) * sundayRate).toFixed(2)}` }] : []),
                                            ...(input.publicHolidayHours > 0 ? [{ label: `Public Holiday Pay (${input.publicHolidayHours}h @ 2.0×)`, value: `R${(input.publicHolidayHours * (entry.rateOverride ?? emp.hourlyRate) * 2.0).toFixed(2)}` }] : []),
                                            ...(calc.topUps.fourHourMinimumHours > 0 ? [{ label: "4-hour minimum top-up included", value: `${calc.topUps.fourHourMinimumHours}h`, highlight: true }] : []),
                                            { label: "Total Gross", value: `R${calc.grossPay.toFixed(2)}`, highlight: true },
                                            ...(calc.deductions.uifEmployee > 0 ? [{ label: "Employee UIF (1%)", value: `-R${calc.deductions.uifEmployee.toFixed(2)}` }] : []),
                                            ...(calc.deductions.advance && calc.deductions.advance > 0 ? [{ label: "Advance", value: `-R${calc.deductions.advance.toFixed(2)}` }] : []),
                                            ...(calc.deductions.other > 0 ? [{ label: "Other Deductions", value: `-R${calc.deductions.other.toFixed(2)}` }] : []),
                                            ...(calc.deductions.total > 0 ? [{ label: "Total Deductions", value: `-R${calc.deductions.total.toFixed(2)}` }] : []),
                                            ...(calc.employerContributions.uifEmployer > 0 ? [{ label: "Employer UIF (1%)", value: `R${calc.employerContributions.uifEmployer.toFixed(2)}` }] : []),
                                            { label: "Employer cost", value: `R${(calc.grossPay + calc.employerContributions.uifEmployer).toFixed(2)}`, highlight: true },
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
                                    totalCost += calc.grossPay + calc.employerContributions.uifEmployer;
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
                        variant="paper"
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
                                <h3 className="type-h3 text-[var(--text)]">Finalise this month?</h3>
                            </div>
                            <p className="type-body text-[var(--text-muted)]">
                                Finalising ensures your payslips, tax records (UIF), and ledger stay consistent. This &quot;freezes&quot; the month to prevent accidental changes to historical data.
                            </p>
                            <p className="type-body text-[var(--text-muted)]">
                                If you need to make corrections later, you can record them as an <strong>adjustment</strong> in the next month.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button variant="outline" onClick={() => setShowLockConfirm(false)} className="w-full flex-1 font-bold">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleLock}
                                    disabled={saving}
                                    className="w-full flex-1 gap-2 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)]"
                                >
                                    <Lock className="h-4 w-4" /> {saving ? "Finalising..." : "Confirm & Finalise"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Employee entry grid — only when not in review mode. Wrapped in paper panel for Civic Ledger integration. */}
            {!showReview && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-1">
                        <h3 className="type-overline text-[var(--text-muted)]">
                            Employees ({completedCount}/{totalCount} done)
                        </h3>
                    </div>
                    <div className="p-5 pt-3 space-y-3">
                        {period.entries.map(entry => {
                            const emp = employees.find(e => e.id === entry.employeeId);
                            if (!emp) return null;
                            const entryBreakdown = calculatePayslip(entryToPayslipInput(entry, emp));

                            return (
                                <Card key={entry.employeeId} className="border border-[var(--border)] bg-[var(--surface-1)] shadow-sm">
                                    <CardContent className="p-4 sm:p-6 space-y-4">
                                        {/* Employee header */}
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-black text-lg shrink-0">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="type-body-bold truncate text-[var(--text)]">{emp.name}</p>
                                                <p className="type-overline text-[var(--text-muted)]">R{emp.hourlyRate.toFixed(2)}/hr</p>
                                            </div>
                                        </div>

                                        {/* Input fields */}
                                                {!isLocked && (
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div className="min-w-0">
                                                    <label htmlFor={`ordinary-hours-${entry.employeeId}`} className="type-overline text-[var(--text-muted)] block mb-1">Ordinary hours</label>
                                                    <input
                                                        id={`ordinary-hours-${entry.employeeId}`}
                                                        type="number"
                                                        min={0}
                                                        value={entry.ordinaryHours}
                                                        onChange={e => updateEntry(entry.employeeId, "ordinaryHours", Number.parseFloat(e.target.value) || 0)}
                                                        className="min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text)] text-sm font-mono"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <label htmlFor={`overtime-hours-${entry.employeeId}`} className="type-overline text-[var(--text-muted)] block mb-1">Overtime hours</label>
                                                    <input
                                                        id={`overtime-hours-${entry.employeeId}`}
                                                        type="number"
                                                        min={0}
                                                        value={entry.overtimeHours}
                                                        onChange={e => updateEntry(entry.employeeId, "overtimeHours", Number.parseFloat(e.target.value) || 0)}
                                                        className="min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text)] text-sm font-mono"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <label htmlFor={`sunday-hours-${entry.employeeId}`} className="type-overline text-[var(--text-muted)] block mb-1">Sunday hours</label>
                                                    <input
                                                        id={`sunday-hours-${entry.employeeId}`}
                                                        type="number"
                                                        min={0}
                                                        value={entry.sundayHours}
                                                        onChange={e => updateEntry(entry.employeeId, "sundayHours", Number.parseFloat(e.target.value) || 0)}
                                                        className="min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text)] text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <label htmlFor={`public-holiday-hours-${entry.employeeId}`} className="type-overline text-[var(--text-muted)] block mb-1">Public holiday hours</label>
                                                    <input
                                                        id={`public-holiday-hours-${entry.employeeId}`}
                                                        type="number"
                                                        min={0}
                                                        value={entry.publicHolidayHours}
                                                        onChange={e => updateEntry(entry.employeeId, "publicHolidayHours", Number.parseFloat(e.target.value) || 0)}
                                                        className="min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text)] text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <label htmlFor={`shortfall-hours-${entry.employeeId}`} className="type-overline text-[var(--text-muted)] block mb-1">Shortfall hours</label>
                                                    <input
                                                        id={`shortfall-hours-${entry.employeeId}`}
                                                        type="number"
                                                        min={0}
                                                        value={entry.shortFallHours || 0}
                                                        onChange={e => updateEntry(entry.employeeId, "shortFallHours", Number.parseFloat(e.target.value) || 0)}
                                                        className="min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text)] text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <label htmlFor={`other-deductions-${entry.employeeId}`} className="type-overline text-[var(--text-muted)] block mb-1">Other deductions</label>
                                                    <input
                                                        id={`other-deductions-${entry.employeeId}`}
                                                        type="number"
                                                        min={0}
                                                        value={entry.otherDeductions}
                                                        onChange={e => updateEntry(entry.employeeId, "otherDeductions", Number.parseFloat(e.target.value) || 0)}
                                                        className="min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-[var(--text)] text-sm font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Locked view - just show totals */}
                                        {isLocked && (
                                            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
                                                <div className="min-w-0">
                                                    <p className="type-overline text-[var(--text-muted)]">Ordinary</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.ordinaryHours}h</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-overline text-[var(--text-muted)]">Overtime</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.overtimeHours}h</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-overline text-[var(--text-muted)]">Sunday</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.sundayHours}h</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-overline text-[var(--text-muted)]">Shortfall</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.shortFallHours}h</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-overline text-[var(--text-muted)]">Other deductions</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">R{entry.otherDeductions}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-overline text-[var(--text-muted)]">Leave</p>
                                                    <p className="font-mono text-sm text-[var(--text)]">{entry.leaveDays}d</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Leave auto-populated indicator (draft mode) */}
                                        {!isLocked && entry.leaveDays > 0 && (
                                            <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-muted)]">
                                                <Palmtree className="h-3.5 w-3.5 text-[var(--success)]" />
                                                <span>{entry.leaveDays} leave day{entry.leaveDays !== 1 ? "s" : ""} auto-populated from records</span>
                                            </div>
                                        )}

                                        {!isLocked && entryBreakdown.grossPay < entryBreakdown.deductions.total && (
                                            <div className="flex items-start gap-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}>
                                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                <span>Deductions are higher than gross pay for this employee. Reduce the deductions before you finalise this month.</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    {!isLocked && (
                        <ActionBar
                            variant="paper"
                            secondaryAction={
                                <Button onClick={handleSave} disabled={saving} variant="outline" className="flex-1 sm:flex-none gap-3 px-5 font-bold">
                                    {(() => {
                                        if (saving) return <Loader2 className="h-4 w-4 animate-spin" />;
                                        if (saveAcknowledged) return <CheckCircle2 className="h-4 w-4" />;
                                        return <Save className="h-4 w-4" />;
                                    })()}
                                    {saving ? "Saving..." : (saveAcknowledged ? "Changes Saved" : "Save Progress")}
                                </Button>
                            }
                            primaryAction={
                                <Button
                                    onClick={handleMoveToReview}
                                    disabled={!allComplete}
                                    className="flex-1 sm:flex-none gap-3 px-5 bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50"
                                >
                                    <FileText className="h-4 w-4" /> Review & Generate
                                </Button>
                            }
                        />
                    )}
                </div>
            )}

            {/* Locked — Download payslips */}
            {isLocked && (
                <Card className="glass-panel border-2 border-[var(--primary)]/30">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-[var(--primary)]" />
                            <div>
                                <h3 className="type-body-bold text-[var(--text)]">Month finalised</h3>
                                <p className="type-overline text-[var(--text-muted)]">
                                    Finalised on {period.lockedAt ? format(new Date(period.lockedAt), "dd MMM yyyy, HH:mm") : "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Button
                                onClick={handleDownloadPayslips}
                                disabled={generatingPdfs}
                                className={`w-full gap-2 h-12 text-base font-bold ${!isRecordWithinArchive(plan, period.endDate) ? 'cursor-not-allowed border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]' : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'}`}
                            >
                                {(() => {
                                    if (!isRecordWithinArchive(plan, period.endDate)) {
                                        return <><Lock className="h-5 w-5" /> Upgrade to Export</>;
                                    }
                                    if (generatingPdfs) {
                                        return <><Loader2 className="h-5 w-5 animate-spin" /> Preparing…</>;
                                    }
                                    return <><Download className="h-5 w-5" /> Download all ({totalCount})</>;
                                })()}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={generatingPdfs || !isRecordWithinArchive(plan, period.endDate)}
                                onClick={() => handleSharePayslips("email")}
                                className="h-12 gap-2 font-bold"
                            >
                                <Mail className="h-4 w-4" /> Email
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={generatingPdfs || !isRecordWithinArchive(plan, period.endDate)}
                                onClick={() => handleSharePayslips("whatsapp")}
                                className="h-12 gap-2 font-bold"
                            >
                                <MessageCircle className="h-4 w-4" /> WhatsApp
                            </Button>
                        </div>
                        <div className="pt-4 border-t border-[var(--border)]">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleUnlock}
                                disabled={saving}
                                className="gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--danger)]"
                            >
                                <AlertTriangle className="h-3.5 w-3.5" /> Made a mistake? Undo Finalise
                            </Button>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                            On Android and other supported devices, Email and WhatsApp will use the device share sheet with the PDF files attached. On desktop browsers, the files will download first so you can attach them.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
