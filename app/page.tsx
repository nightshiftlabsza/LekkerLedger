"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Calculator, Shield, Clock, ChevronRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SideDrawer } from "@/components/layout/side-drawer";
import { NMW_RATE } from "@/lib/calculator";
import { getSettings } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [hours, setHours] = React.useState("160");
  const [rate, setRate] = React.useState("30.23");
  const [showCalc, setShowCalc] = React.useState(true);

  const rateNum = parseFloat(rate) || 0;
  const hoursNum = parseFloat(hours) || 0;
  const belowNMW = rateNum > 0 && rateNum < NMW_RATE;

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

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const s = await getSettings();
      if (!s.employerName) {
        router.push("/onboarding");
      } else {
        router.push("/employees");
      }
    } catch {
      router.push("/employees");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center gap-3">
          <SideDrawer />
          <div className="flex items-center gap-2">
            <img src="/brand/logo-full.png" alt="LekkerLedger Logo" className="h-6 w-auto" />
          </div>
        </div>
        <Button size="sm" variant="default" onClick={handleStart}>
          Get Started
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16 sm:py-24 text-center max-w-2xl mx-auto w-full">
        <div className="space-y-8 w-full animate-slide-up">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(196,122,28,0.10)",
              color: "var(--amber-500)",
              border: "1px solid rgba(196,122,28,0.20)",
            }}
          >
            <Shield className="h-3.5 w-3.5" />
            The Domestic Standard — BCEA & Sectional Determination 7
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]"
              style={{ color: "var(--text-primary)" }}
            >
              Compliant payslips in{" "}
              <span style={{ color: "var(--amber-500)" }}>90 seconds.</span>
            </h1>
            <p
              className="text-base sm:text-lg leading-relaxed max-w-lg mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Calculates the correct minimum wage, overtime, UIF, and Sunday
              rates for your domestic worker — then generates a professional
              PDF. No spreadsheets. No guessing.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" className="w-full sm:w-auto gap-2 font-bold" onClick={handleStart}>
              Manage Employees <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2"
              onClick={() => setShowCalc((v) => !v)}
            >
              <Calculator className="h-5 w-5" />
              {showCalc ? "Hide Calculator" : "Quick Calculator"}
            </Button>
          </div>

          {/* Quick Calculator */}
          {showCalc && (
            <Card className="max-w-lg mx-auto text-left animate-scale-in">
              <CardContent className="p-6 sm:p-8 space-y-7">
                <h2
                  className="text-lg font-extrabold flex items-center gap-2 mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Calculator className="h-6 w-6" style={{ color: "var(--amber-500)" }} />
                  Minimum Wage &amp; UIF Calculator
                </h2>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="calc-hours">Hours Worked</Label>
                    <Input
                      id="calc-hours"
                      type="number"
                      min="0"
                      placeholder="160"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calc-rate">Hourly Rate (R)</Label>
                    <div className="relative">
                      <span
                        className="absolute left-4 top-3 text-sm font-semibold pointer-events-none"
                        style={{ color: "var(--text-muted)" }}
                      >
                        R
                      </span>
                      <Input
                        id="calc-rate"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="30.23"
                        className="pl-8"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        error={belowNMW ? `Below NMW (min R${NMW_RATE}/hr)` : undefined}
                      />
                    </div>
                  </div>
                </div>

                {belowNMW && (
                  <Alert variant="error">
                    <AlertDescription>
                      National Minimum Wage for Domestic Workers is{" "}
                      <strong>R{NMW_RATE}/hr</strong>. Calculation below uses
                      the legal minimum.
                    </AlertDescription>
                  </Alert>
                )}

                {preview && (
                  <div
                    className="rounded-xl overflow-hidden mt-2"
                    style={{ border: "1px solid var(--border-subtle)" }}
                  >
                    <div
                      className="flex justify-between items-center px-5 py-4 text-sm"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        Gross ({hoursNum}h × R{preview.effectiveRate.toFixed(2)})
                      </span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        R {preview.gross.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center px-5 py-3.5 text-sm"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        UIF (1%){" "}
                        {!preview.uifActive && (
                          <span
                            className="text-xs font-medium"
                            style={{ color: "var(--amber-500)" }}
                          >
                            · not applicable ≤24hrs
                          </span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums" style={{ color: "var(--red-500)" }}>
                        {preview.uifActive ? `-R ${preview.uif.toFixed(2)}` : "R 0.00"}
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center px-5 py-4"
                      style={{ backgroundColor: "var(--amber-500)" }}
                    >
                      <span className="font-bold text-white">Net Pay (est.)</span>
                      <span className="font-extrabold text-white text-xl tabular-nums">
                        R {preview.net.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <p
                  className="text-xs text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  Estimate only. Create a full payslip PDF via the wizard.
                </p>

                <Button className="w-full gap-2" onClick={handleStart}>
                  Create Full Payslip <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Trust signals */}
          <div
            className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 pt-6 text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: "var(--green-500)" }} />
              Private (Local & Google Drive)
            </span>
            <span className="hidden md:inline-flex items-center text-[var(--border-strong)]">|</span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
              Generated in 90s
            </span>
            <span className="hidden md:inline-flex items-center text-[var(--border-strong)]">|</span>
            <a
              href="https://github.com/nightshiftlabsza/LekkerLedger"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-all"
            >
              <Github className="h-4 w-4" />
              Verifiably Open Source
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
