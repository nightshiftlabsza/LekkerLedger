"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NMW_RATE, calculatePayslip } from "@/lib/calculator";

export default function Home() {
  const [hours, setHours] = React.useState("160");
  const [rate, setRate] = React.useState("30.23");
  const [showCalc, setShowCalc] = React.useState(false);

  const rateNum = parseFloat(rate) || 0;
  const hoursNum = parseFloat(hours) || 0;
  const belowNMW = rateNum > 0 && rateNum < NMW_RATE;

  // Quick preview calc - no persistence, just numbers
  const preview = React.useMemo(() => {
    if (!rateNum || !hoursNum) return null;
    const effectiveRate = Math.max(rateNum, NMW_RATE);
    const gross = hoursNum * effectiveRate;
    const uifActive = hoursNum > 24;
    const uifBase = Math.min(gross, 17712);
    const uif = uifActive ? uifBase * 0.01 : 0;
    const net = gross - uif;
    return { gross, uif, net, uifActive, effectiveRate };
  }, [rateNum, hoursNum]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex flex-col font-sans">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center max-w-4xl mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
            <Shield className="h-3.5 w-3.5" />
            SA Domestic Worker Compliance — BCEA & SD7
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Compliant payslips{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                in 90 seconds.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
              Stop guessing. LekkerLedger calculates the correct pay, UIF, and
              minimum wage for your domestic worker — no spreadsheets required.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/employees">
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 h-12 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 hover:shadow-xl transition-all"
              >
                Manage Employees <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 h-12 px-8 text-base font-semibold border-slate-300 hover:bg-slate-50"
              onClick={() => setShowCalc((v) => !v)}
            >
              <Calculator className="h-5 w-5" />
              {showCalc ? "Hide Calculator" : "Quick Calculator"}
            </Button>
          </div>

          {/* Quick Calculator */}
          {showCalc && (
            <Card className="max-w-lg mx-auto border-slate-200 shadow-xl shadow-slate-100 mt-4 text-left animate-in slide-in-from-bottom-4 duration-300 bg-white">
              <CardContent className="p-6 space-y-5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Minimum Wage &amp; UIF Calculator
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calc-hours">Hours Worked</Label>
                    <Input
                      id="calc-hours"
                      type="number"
                      min="0"
                      placeholder="e.g. 160"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calc-rate">Hourly Rate (R)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-medium text-sm">
                        R
                      </span>
                      <Input
                        id="calc-rate"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="30.23"
                        className="pl-7"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        error={
                          belowNMW ? `Below NMW (R${NMW_RATE}/hr)` : undefined
                        }
                      />
                    </div>
                  </div>
                </div>

                {belowNMW && (
                  <Alert variant="error">
                    <AlertDescription>
                      The National Minimum Wage for Domestic Workers is{" "}
                      <strong>R{NMW_RATE}/hr</strong>. The calculation below
                      uses R{NMW_RATE}/hr automatically.
                    </AlertDescription>
                  </Alert>
                )}

                {preview && (
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-3.5 text-sm">
                      <span className="text-slate-500">
                        Gross Pay ({hoursNum}hrs × R
                        {preview.effectiveRate.toFixed(2)})
                      </span>
                      <span className="font-semibold text-slate-900">
                        R {preview.gross.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-5 py-3.5 text-sm">
                      <span className="text-slate-500">
                        UIF (1%){" "}
                        {!preview.uifActive && (
                          <span className="text-xs text-amber-600 font-medium">
                            &lt;= 24 hrs, not applicable
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-red-500">
                        -R {preview.uif.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-5 py-4 bg-blue-600">
                      <span className="font-bold text-white">
                        Net Pay (Est.)
                      </span>
                      <span className="font-extrabold text-white text-xl">
                        R {preview.net.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3 text-center">
                  Estimate only. Generate a full PDF payslip with employee
                  details via the wizard.
                </p>

                <Link href="/employees" className="block">
                  <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 font-semibold">
                    Create Full Payslip <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Data stays on your device</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Under 90 seconds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-indigo-500" />
              <span>BCEA &amp; SD7 compliant</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
