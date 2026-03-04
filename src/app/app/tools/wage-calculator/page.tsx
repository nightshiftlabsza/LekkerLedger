"use client";

import * as React from "react";
import { Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function WageCalculatorPage() {
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
                title="Wage Calculator"
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
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-mono"
                                placeholder="27.58"
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
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-mono"
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
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="type-overline text-[var(--text-muted)] block mb-1">Overtime hrs/week</label>
                            <input
                                type="number"
                                min={0}
                                value={overtimeHours || ""}
                                onChange={e => setOvertimeHours(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-mono"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="type-body text-[var(--text-secondary)]">Weekly ordinary pay</span>
                            <span className="font-mono font-bold text-[var(--text-primary)]">R{weeklyOrdinay.toFixed(2)}</span>
                        </div>
                        {overtimeHours > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="type-body text-[var(--text-secondary)]">Weekly overtime (1.5×)</span>
                                <span className="font-mono font-bold text-[var(--amber-500)]">R{overtimePay.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                            <span className="type-body-bold text-[var(--text-primary)]">Weekly total</span>
                            <span className="font-mono font-bold text-lg text-[var(--text-primary)]">R{weeklyTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="type-body-bold text-[var(--text-primary)]">Monthly estimate</span>
                            <span className="font-mono font-bold text-lg text-[var(--amber-500)]">R{monthlyEstimate.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--text-secondary)]">
                            SA national minimum wage: R27.58/hr (Mar 2025). Overtime must be paid at 1.5× and capped at 10 hrs/week. Sunday work: 2× (or 1.5× if ordinarily works Sundays).
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
