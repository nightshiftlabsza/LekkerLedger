"use client";

import * as React from "react";
import Link from "next/link";
import {
    Download, CalendarDays, AlertCircle, ChevronDown, ChevronUp, Info, CheckCircle2, ShieldCheck, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getEmployees, getAllPayslips, getSettings, getPayPeriods } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings, PayPeriod } from "@/lib/schema";
import { generateUFilingData, generateUFilingTaxYearData, rowsToCsv, downloadCsv, UFilingRow } from "@/lib/ufiling";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

export function UFilingClient() {
    const [isClient, setIsClient] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [payslips, setPayslips] = React.useState<PayslipInput[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [payPeriods, setPayPeriods] = React.useState<PayPeriod[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = React.useState<string>("");
    const [view, setView] = React.useState<"monthly" | "annual">("monthly");
    const [selectedTaxYear, setSelectedTaxYear] = React.useState<number>(new Date().getFullYear());
    const [rows, setRows] = React.useState<UFilingRow[]>([]);
    const [showGuide, setShowGuide] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
        async function load() {
            try {
                const [emps, pss, s, periods] = await Promise.all([
                    getEmployees(),
                    getAllPayslips(),
                    getSettings(),
                    getPayPeriods()
                ]);
                setEmployees(emps);
                setPayslips(pss);
                setSettings(s);
                const locked = periods.filter(p => p.status === "locked");
                setPayPeriods(locked);
                if (locked.length > 0) setSelectedPeriodId(locked[0].id);
            } catch (err) {
                console.error("Failed to load uFiling data:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    React.useEffect(() => {
        if (employees.length === 0 || payslips.length === 0) {
            setRows([]);
            return;
        }

        if (view === "monthly") {
            const period = payPeriods.find(p => p.id === selectedPeriodId);
            if (period) {
                const date = new Date(period.startDate);
                setRows(generateUFilingData(employees, payslips, date.getMonth(), date.getFullYear()));
            } else {
                setRows([]);
            }
        } else {
            setRows(generateUFilingTaxYearData(employees, payslips, selectedTaxYear));
        }
    }, [selectedPeriodId, payPeriods, employees, payslips, view, selectedTaxYear]);

    const handleDownload = async () => {
        if (!settings) return;
        const csv = rowsToCsv(rows, settings);
        let filename = "uFiling_Export.csv";

        if (view === "monthly") {
            const period = payPeriods.find(p => p.id === selectedPeriodId);
            if (period) filename = `uFiling_${period.name.replace(/\s+/g, '_')}.csv`;
        } else {
            filename = `uFiling_TaxYear_${selectedTaxYear - 1}_${selectedTaxYear}.csv`;
        }

        downloadCsv(csv, filename);
        const { logAuditEvent } = await import("@/lib/storage");
        await logAuditEvent("EXPORT_UFILING", `Downloaded uFiling CSV (${view})`, { view, rowCount: rows.length });
    };

    if (!isClient || loading) {
        return (
            <EmptyState
                title="No locked periods available"
                description="You can only generate a uFiling export for a payroll month that has been completed and locked."
                icon={ShieldCheck}
                actionLabel="Go to Payroll"
                actionHref="/payroll"
                requirements={[
                    "Complete payslips for your employees",
                    "Review and generate the PDF documents",
                    "Lock the pay period to seal the records"
                ]}
            />
        );
    }

    if (payPeriods.length === 0) {
        return (
            <EmptyState
                title="No locked periods available"
                description="You can only generate a uFiling export for a payroll month that has been completed and locked."
                icon={ShieldCheck}
                actionLabel="Go to Payroll"
                actionHref="/payroll"
                requirements={[
                    "Complete payslips for your employees",
                    "Review and generate the PDF documents",
                    "Lock the pay period to seal the records"
                ]}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Prerequisites Checklist */}
            <Card className="glass-panel border-none shadow-sm overflow-hidden">
                <div className="bg-[var(--surface-2)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Setup Checklist</h3>
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CheckItem label="UIF Reference Number" completed={!!settings?.uifRefNumber} />
                        <CheckItem label="Employer Name & Address" completed={!!settings?.employerName && !!settings?.employerAddress} />
                        <CheckItem label="Employee ID Numbers" completed={employees.length > 0 && employees.every(e => !!e.idNumber)} />
                        <CheckItem label="Locked Pay Periods" completed={payPeriods.length > 0} />
                    </div>
                    {(!settings?.uifRefNumber || payPeriods.length === 0) && (
                        <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-amber-100 flex items-start gap-3">
                            <AlertCircle className="h-4 w-4 text-[var(--focus)] mt-0.5" />
                            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">
                                Declarations must identify both your <strong>UIF Reference</strong> and data from <strong>Locked</strong> months to be accepted by the uFiling system.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* How-to guide (collapsible) */}
            <div className="animate-slide-up delay-100">
                <button type="button" onClick={() => setShowGuide(!showGuide)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-all shadow-sm group">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary-hover)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                            <Info className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-[var(--text)]">Compliance Guide: Submission Steps</span>
                    </div>
                    {showGuide ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                </button>
                {showGuide && (
                    <div className="mt-2 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-5 animate-in fade-in zoom-in-95 duration-300 shadow-xl relative z-10">
                        <GuideStep step={1} title="Download CSV" desc="Select a locked month below and click Download." />
                        <GuideStep step={2} title="Login to uFiling" desc="Access ufiling.co.za and enter your employer credentials." />
                        <GuideStep step={3} title="Electronic Declarations" desc="Navigate to Declarations → Electronic Declarations → Upload CSV File." />
                        <GuideStep step={4} title="Validate & Submit" desc="Select the file, validate it against the Department’s rules, and submit." />
                    </div>
                )}
            </div>

            {/* View & Selection */}
            <Card className="glass-panel border-none shadow-sm">
                <CardContent className="p-5 flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                                <History className="h-5 w-5 text-[var(--primary-hover)]" />
                            </div>
                            <div>
                                <Label className="font-bold text-sm text-[var(--text)]">Export Mode</Label>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black">Choose declaration scope</p>
                            </div>
                        </div>
                        <div className="flex bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)]">
                            <button
                                onClick={() => setView("monthly")}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "monthly" ? 'bg-[var(--surface-1)] text-[var(--primary-hover)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setView("annual")}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "annual" ? 'bg-[var(--surface-1)] text-[var(--primary-hover)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                            >
                                Annual (Tax Year)
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                                <CalendarDays className="h-5 w-5 text-[var(--primary-hover)]" />
                            </div>
                            <div>
                                <Label className="font-bold text-sm text-[var(--text)]">
                                    {view === "monthly" ? "Select Locked Period" : "Select Tax Year End"}
                                </Label>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black">
                                    {view === "monthly" ? "Only locked months are declarative" : "Aggregates March to February"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {view === "monthly" ? (
                                payPeriods.length > 0 ? (
                                    <select
                                        value={selectedPeriodId}
                                        onChange={e => setSelectedPeriodId(e.target.value)}
                                        className="min-w-[200px] h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none"
                                    >
                                        {payPeriods.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-red-500">No locked periods yet</p>
                                        <Link href="/payroll" className="text-[10px] text-[var(--primary-hover)] underline">Go to Payroll</Link>
                                    </div>
                                )
                            ) : (
                                <select
                                    value={selectedTaxYear}
                                    onChange={e => setSelectedTaxYear(Number(e.target.value))}
                                    className="min-w-[200px] h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-sm font-bold text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)]/20 outline-none"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y - 1}/{y} Tax Year</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[var(--text)]">Preview Records</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                        <History className="h-3 w-3" /> Showing data from locked pay periods only
                    </div>
                </div>

                <DataTable<UFilingRow>
                    data={rows}
                    keyField={(r) => r.idNumber}
                    emptyMessage={`No payslip data found in the selected period.`}
                    columns={[
                        {
                            key: "employee",
                            label: "Employee",
                            render: (r) => <span className="font-bold text-[var(--text)]">{r.employeeName}</span>
                        },
                        {
                            key: "idNumber",
                            label: "ID Number",
                            render: (r) => <span className="type-mono text-[var(--text-muted)]">{r.idNumber || "MISSING"}</span>
                        },
                        {
                            key: "gross",
                            label: "Gross",
                            render: (r) => <span className="type-mono font-bold text-[var(--text)]">R{r.grossRemuneration.toFixed(2)}</span>
                        },
                        {
                            key: "totalUif",
                            label: "Total UIF",
                            align: "right",
                            render: (r) => <span className="font-black text-[var(--primary-hover)]">R{r.totalUif.toFixed(2)}</span>
                        }
                    ]}
                />
            </div>

            {/* Download */}
            <div className="pt-4">
                <Button
                    className="w-full gap-2 h-14 text-base font-black bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-xl shadow-amber-500/20 transition-all rounded-2xl"
                    onClick={handleDownload}
                    disabled={rows.length === 0 || !settings?.uifRefNumber}
                >
                    <Download className="h-5 w-5" /> Download Export Bundle (CSV)
                </Button>
                {!settings?.uifRefNumber && (
                    <p className="text-center text-[10px] text-red-500 font-bold mt-3 uppercase tracking-wider">
                        Cannot export without a UIF Reference Number
                    </p>
                )}
            </div>
        </div>
    );
}

function CheckItem({ label, completed }: { label: string; completed: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded flex items-center justify-center ${completed ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`}>
                {completed && <CheckCircle2 className="h-3 w-3" strokeWidth={4} />}
            </div>
            <span className={`text-[11px] font-bold ${completed ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{label}</span>
        </div>
    );
}

function GuideStep({ step, title, desc }: { step: number; title: string; desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="h-6 w-6 rounded-lg bg-[var(--surface-2)] text-[10px] font-black flex items-center justify-center shrink-0 border border-[var(--border)]">
                {step}
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-tight text-[var(--text)] mb-0.5">{title}</p>
                <p className="text-[11px] text-[var(--text-muted)] leading-normal">{desc}</p>
            </div>
        </div>
    );
}
