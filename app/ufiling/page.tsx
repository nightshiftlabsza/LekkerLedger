"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowLeft, Download, Loader2, CalendarDays, FileSpreadsheet, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getEmployees, getAllPayslips, getSettings } from "@/lib/storage";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";
import { generateUFilingData, rowsToCsv, downloadCsv, UFilingRow } from "@/lib/ufiling";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function UFilingPage() {
    const now = new Date();
    const [loading, setLoading] = React.useState(true);
    const [month, setMonth] = React.useState(now.getMonth());
    const [year, setYear] = React.useState(now.getFullYear());
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [payslips, setPayslips] = React.useState<PayslipInput[]>([]);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [rows, setRows] = React.useState<UFilingRow[]>([]);

    React.useEffect(() => {
        async function load() {
            const [emps, pss, s] = await Promise.all([
                getEmployees(),
                getAllPayslips(),
                getSettings(),
            ]);
            setEmployees(emps);
            setPayslips(pss);
            setSettings(s);
            setLoading(false);
        }
        load();
    }, []);

    // Recalculate rows when month/year/data changes
    React.useEffect(() => {
        if (employees.length > 0 && payslips.length > 0) {
            const data = generateUFilingData(employees, payslips, month, year);
            setRows(data);
        } else {
            setRows([]);
        }
    }, [employees, payslips, month, year]);

    const handleDownload = () => {
        if (!settings) return;
        const csv = rowsToCsv(rows, settings);
        downloadCsv(csv, `uFiling_${MONTHS[month]}_${year}.csv`);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            <header
                className="sticky top-0 z-30 px-4 py-3"
                style={{
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div className="max-w-2xl mx-auto flex items-center gap-3">
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
                        uFiling Export
                    </h1>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
                    </div>
                ) : (
                    <>
                        {/* Info banner */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-4 flex items-start gap-3">
                                <FileSpreadsheet className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--amber-500)" }} />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                        UIF Declaration CSV
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                        Download a CSV file formatted for the Department of Labour&apos;s uFiling system.
                                        Select a month and year, then export.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Settings warning */}
                        {settings && !settings.employerName && (
                            <Card className="animate-slide-up" style={{ borderColor: "var(--amber-500)" }}>
                                <CardContent className="p-4 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--amber-500)" }} />
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                            Employer details not set
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                            The CSV will include your employer name and UIF reference number.{" "}
                                            <Link href="/settings" className="underline" style={{ color: "var(--amber-500)" }}>
                                                Set them in Settings
                                            </Link>.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Month/Year Picker */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CalendarDays className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
                                    <Label className="font-bold text-sm">Select Period</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="ufiling-month" className="text-xs">Month</Label>
                                        <select
                                            id="ufiling-month"
                                            value={month}
                                            onChange={(e) => setMonth(parseInt(e.target.value))}
                                            className="w-full mt-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                                            style={{
                                                backgroundColor: "var(--bg-subtle)",
                                                color: "var(--text-primary)",
                                                border: "1px solid var(--border-subtle)",
                                            }}
                                        >
                                            {MONTHS.map((m, i) => (
                                                <option key={i} value={i}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="ufiling-year" className="text-xs">Year</Label>
                                        <select
                                            id="ufiling-year"
                                            value={year}
                                            onChange={(e) => setYear(parseInt(e.target.value))}
                                            className="w-full mt-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                                            style={{
                                                backgroundColor: "var(--bg-subtle)",
                                                color: "var(--text-primary)",
                                                border: "1px solid var(--border-subtle)",
                                            }}
                                        >
                                            {[year - 1, year, year + 1].map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Table */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-0">
                                <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                        Preview ({rows.length} record{rows.length !== 1 ? "s" : ""})
                                    </h3>
                                </div>

                                {rows.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                            No payslips found for {MONTHS[month]} {year}.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                                    <th className="px-4 py-2.5 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Employee</th>
                                                    <th className="px-4 py-2.5 text-right font-semibold" style={{ color: "var(--text-muted)" }}>Gross</th>
                                                    <th className="px-4 py-2.5 text-right font-semibold" style={{ color: "var(--text-muted)" }}>UIF (Emp)</th>
                                                    <th className="px-4 py-2.5 text-right font-semibold" style={{ color: "var(--text-muted)" }}>UIF (Er)</th>
                                                    <th className="px-4 py-2.5 text-right font-semibold" style={{ color: "var(--text-muted)" }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((r, i) => (
                                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                                        <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{r.employeeName}</td>
                                                        <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>R {r.grossRemuneration.toFixed(2)}</td>
                                                        <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>R {r.uifEmployee.toFixed(2)}</td>
                                                        <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>R {r.uifEmployer.toFixed(2)}</td>
                                                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold" style={{ color: "var(--amber-500)" }}>R {r.totalUif.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Download */}
                        <Button
                            className="w-full gap-2 h-12 text-base"
                            onClick={handleDownload}
                            disabled={rows.length === 0}
                        >
                            <Download className="h-5 w-5" />
                            Download CSV for uFiling
                        </Button>
                    </>
                )}
            </main>
        </div>
    );
}
