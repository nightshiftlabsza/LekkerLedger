"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getNMWForDate } from "@/lib/legal/registry";

export default function WageCalculatorPage() {
    const nmw = getNMWForDate(new Date());
    const [hourlyRate, setHourlyRate] = React.useState<number>(0);
    const [hoursPerDay, setHoursPerDay] = React.useState<number>(8);
    const [daysPerWeek, setDaysPerWeek] = React.useState<number>(5);
    const [overtimeHours, setOvertimeHours] = React.useState<number>(0);

    const weeklyOrdinay = hourlyRate * hoursPerDay * daysPerWeek;
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const weeklyTotal = weeklyOrdinay + overtimePay;
    const monthlyEstimate = weeklyTotal * 4.333;

    return (
        <>
            <PageHeader
                title="Wage & UIF calculator"
                subtitle="Estimate weekly and monthly pay based on SA minimum wage rules"
            />

            <Card className="glass-panel border-none">
                <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="type-overline text-[var(--text-muted)] block mb-1">Hourly Rate (R)</label>
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={hourlyRate || ""}
                                onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                                placeholder={nmw.toFixed(2)}
                            />
                        </div>
                        <div>
                            <label className="type-overline text-[var(--text-muted)] block mb-1">Hours/Day</label>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={hoursPerDay}
                                onChange={e => setHoursPerDay(parseFloat(e.target.value) || 8)}
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="type-overline text-[var(--text-muted)] block mb-1">Days/Week</label>
                            <input
                                type="number"
                                min={1}
                                max={7}
                                value={daysPerWeek}
                                onChange={e => setDaysPerWeek(parseFloat(e.target.value) || 5)}
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="type-overline text-[var(--text-muted)] block mb-1">Overtime hrs/week</label>
                            <input
                                type="number"
                                min={0}
                                value={overtimeHours || ""}
                                onChange={e => setOvertimeHours(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] text-sm font-mono"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="border-t border-[var(--border)] pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="type-body text-[var(--text-muted)]">Weekly ordinary pay</span>
                            <span className="font-mono font-bold text-[var(--text)]">R{weeklyOrdinay.toFixed(2)}</span>
                        </div>
                        {overtimeHours > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="type-body text-[var(--text-muted)]">Weekly overtime (1.5×)</span>
                                <span className="font-mono font-bold text-[var(--primary)]">R{overtimePay.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                            <span className="type-body-bold text-[var(--text)]">Weekly total</span>
                            <span className="font-mono font-bold text-lg text-[var(--text)]">R{weeklyTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="type-body-bold text-[var(--text)]">Monthly estimate</span>
                            <span className="font-mono font-bold text-lg text-[var(--primary)]">R{monthlyEstimate.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--text-muted)]">
                            National Minimum Wage: <strong>R{nmw.toFixed(2)}/hr</strong> (effective 1 Mar 2026). Overtime at 1.5×, capped at 10 hrs/week. Sunday work: 2× (1.5× if ordinarily works Sundays).{" "}
                            <a
                                href="https://www.gov.za/documents/notices/national-minimum-wage-act-national-minimum-wage-9-jan-2025"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-500 hover:text-blue-400"
                            >
                                Source: Dept. of Employment &amp; Labour (2026)
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
