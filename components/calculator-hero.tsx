"use client";

import * as React from "react";
import Link from "next/link";
import { Calculator, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getNMW, UIF_MONTHLY_CAP, UIF_RATE } from "@/lib/calculator";
import { roundTo } from "@/lib/money";
import { COMPLIANCE } from "@/lib/compliance-constants";
import { triggerBurst } from "./ui/confetti-trigger";

export function CalculatorHero({ onStart }: { onStart: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
    const [hours, setHours] = React.useState("160");
    const [rate, setRate] = React.useState(COMPLIANCE.NMW.RATE_PER_HOUR.toString());

    const nmwRate = React.useMemo(() => getNMW(), []);
    const rateNum = parseFloat(rate) || 0;
    const hoursNum = parseFloat(hours) || 0;
    const belowNMW = rateNum > 0 && rateNum < nmwRate;

    const preview = React.useMemo(() => {
        if (!rateNum || !hoursNum) return null;
        const effectiveRate = Math.max(rateNum, nmwRate);
        const gross = roundTo(hoursNum * effectiveRate);
        const uifActive = hoursNum > 24;
        const uifBase = Math.min(gross, UIF_MONTHLY_CAP);
        const employeeUif = uifActive ? roundTo(uifBase * UIF_RATE) : 0;
        const employerUif = uifActive ? roundTo(uifBase * UIF_RATE) : 0;
        return { gross, employeeUif, employerUif, net: roundTo(gross - employeeUif), uifActive, effectiveRate };
    }, [rateNum, hoursNum, nmwRate]);

    return (
        <Card className="glass-panel shadow-[var(--shadow-2xl)] border-none">
            <CardContent className="p-6 sm:p-8 space-y-7">
                <h2 className="text-lg font-extrabold flex items-center gap-2 mb-2" style={{ color: "var(--text)" }}>
                    <Calculator className="h-6 w-6" style={{ color: "var(--primary)" }} />
                    National Minimum Wage &amp; UIF Calculator
                </h2>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="calc-hours">Hours Worked</Label>
                        <Input
                            id="calc-hours"
                            type="number"
                            inputMode="decimal"
                            placeholder="160"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="calc-rate">Hourly Rate (R)</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-sm font-semibold pointer-events-none" style={{ color: "var(--text-muted)" }}>R</span>
                            <Input
                                id="calc-rate"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder={COMPLIANCE.NMW.RATE_PER_HOUR.toString()}
                                className="pl-8"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {belowNMW && (
                    <Alert variant="error">
                        <AlertDescription>
                            National Minimum Wage is <strong>R{nmwRate}/hr</strong>. Calculation below uses the legal minimum.
                        </AlertDescription>
                    </Alert>
                )}

                {preview && (
                    <div className="rounded-2xl overflow-hidden mt-2 border border-[var(--border)]">
                        <div className="flex justify-between items-center px-5 py-4 text-xs font-bold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <span>Gross ({hoursNum}h × R{preview.effectiveRate.toFixed(2)})</span>
                            <span className="tabular-nums text-sm font-black" style={{ color: "var(--text)" }}>R {preview.gross.toFixed(2)}</span>
                        </div>
                        <div className="space-y-0 border-b border-[var(--border)]">
                            <div className="flex justify-between items-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                <span>
                                    Employee UIF (1%)
                                    {!preview.uifActive && <span className="text-[10px] lowercase" style={{ color: "var(--primary)" }}> · ≤24hrs</span>}
                                </span>
                                <span className="tabular-nums text-sm font-black" style={{ color: "var(--red-500)" }}>{preview.uifActive ? `-R ${preview.employeeUif.toFixed(2)}` : "R 0.00"}</span>
                            </div>
                            <div className="flex justify-between items-center px-5 pb-3.5 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                                <span>Employer UIF (1%) - not deducted from pay</span>
                                <span className="tabular-nums text-sm font-black" style={{ color: "var(--text)" }}>{preview.uifActive ? `R ${preview.employerUif.toFixed(2)}` : "R 0.00"}</span>
                            </div>
                        </div>
                        <div className="flex justify-end px-5 py-3 text-xs font-semibold" style={{ backgroundColor: "var(--surface-raised)" }}>
                            <Link href="/help/compliance#uif" className="text-[var(--primary)] underline-offset-4 hover:underline">
                                How UIF works
                            </Link>
                        </div>
                        <div className="flex justify-between items-center px-6 py-6 shadow-inner" style={{ background: "var(--primary)" }}>
                            <span className="font-black text-white/90 uppercase tracking-widest text-[10px]">Net Pay (est.)</span>
                            <span className="font-black text-white text-3xl tabular-nums">R {preview.net.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                <Button
                    className="w-full gap-2 h-14 text-base font-black rounded-2xl active-scale"
                    onClick={(e) => {
                        if (preview) triggerBurst();
                        onStart(e);
                    }}
                >
                    Create Full Payslip <ChevronRight className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
