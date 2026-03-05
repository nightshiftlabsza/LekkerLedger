"use client";

import * as React from "react";
import { X, CheckCircle2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Employee, PayslipInput } from "@/lib/schema";
import { calculatePayslip } from "@/lib/calculator";

export interface EmployeeSummary {
    employee: Employee;
    latestPayslip: PayslipInput | null;
    netPay: number | null;
}

interface BulkRunModalProps {
    isOpen: boolean;
    onClose: () => void;
    summaries: EmployeeSummary[];
    onConfirm: (selectedEmpIds: string[]) => Promise<void>;
}

export function BulkRunModal({ isOpen, onClose, summaries, onConfirm }: BulkRunModalProps) {
    const validSummaries = React.useMemo(() =>
        summaries.filter(s => s.latestPayslip !== null),
        [summaries]);

    // Default all valid employees to checked
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(validSummaries.map(s => s.employee.id)));
        }
    }, [isOpen, validSummaries]);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isProcessing) onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, isProcessing, onClose]);

    if (!isOpen) return null;

    const targetMonth = new Date();

    const toggleEmployee = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === validSummaries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(validSummaries.map(s => s.employee.id)));
        }
    };

    const handleConfirm = async () => {
        if (selectedIds.size === 0) return;
        setIsProcessing(true);
        try {
            await onConfirm(Array.from(selectedIds));
            onClose();
        } catch (e) {
            console.error("Bulk run failed", e);
        } finally {
            setIsProcessing(false);
        }
    };

    const totalGross = Array.from(selectedIds).reduce((acc, id) => {
        const s = validSummaries.find(x => x.employee.id === id);
        if (s?.latestPayslip) {
            return acc + calculatePayslip(s.latestPayslip).grossPay;
        }
        return acc;
    }, 0);

    return (
        <div role="dialog" aria-modal="true" aria-label="Bulk Payroll Run" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-lg bg-[var(--surface-1)] border border-[var(--border)] shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div>
                        <h2 className="text-lg font-black text-[var(--text)]">Bulk Payroll Run</h2>
                        <p className="text-sm text-[var(--text-muted)]">Generating for {format(targetMonth, "MMMM yyyy")}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close" className="h-8 w-8 p-0 shrink-0 rounded-full" disabled={isProcessing}>
                        <X className="h-5 w-5 text-[var(--text-muted)]" />
                    </Button>
                </div>

                <div className="p-4 bg-[var(--primary)]/5 border-b border-[var(--focus)]/10">
                    <p className="text-sm font-semibold text-[var(--focus)] dark:text-amber-400">
                        This will copy the <strong>last generated payslip</strong> for each selected employee and update the dates to {format(targetMonth, "MMMM yyyy")}.
                    </p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Select Employees</span>
                        <Button variant="ghost" size="sm" onClick={toggleAll} className="h-6 text-xs text-[var(--focus)] font-bold px-2">
                            {selectedIds.size === validSummaries.length ? "Deselect All" : "Select All"}
                        </Button>
                    </div>

                    {validSummaries.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                            No employees with past payslips to template from.
                        </div>
                    ) : (
                        validSummaries.map((s) => (
                            <div
                                key={s.employee.id}
                                role="button"
                                tabIndex={0}
                                aria-pressed={selectedIds.has(s.employee.id)}
                                aria-label={`${s.employee.name}, last net pay ${s.netPay !== null ? `R${s.netPay.toFixed(2)}` : "unknown"}`}
                                onClick={() => toggleEmployee(s.employee.id)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleEmployee(s.employee.id); } }}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedIds.has(s.employee.id) ? 'border-[var(--focus)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--border)]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${selectedIds.has(s.employee.id) ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-[var(--text)]">{s.employee.name}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] uppercase">
                                            Last Net: {s.netPay !== null ? `R${s.netPay.toFixed(2)}` : "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${selectedIds.has(s.employee.id) ? 'bg-[var(--primary)] border-[var(--focus)]' : 'border-[var(--border)] bg-transparent'}`}>
                                    {selectedIds.has(s.employee.id) && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] rounded-b-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm px-1">
                        <span className="text-[var(--text-muted)] font-semibold">Projected Gross Total</span>
                        <span className="font-mono font-bold text-[var(--text)]">R{totalGross.toFixed(2)}</span>
                    </div>
                    <Button
                        className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-base shadow-sm rounded-xl"
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0 || isProcessing}
                    >
                        {isProcessing ? (
                            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...</>
                        ) : (
                            `Generate ${selectedIds.size} Payslip${selectedIds.size === 1 ? '' : 's'}`
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
