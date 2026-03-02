"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Clock, Github, AlertTriangle, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { CalculatorHero } from "@/components/calculator-hero";
import Image from "next/image";
import { getSettings, saveSettings } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [settings, setSettings] = React.useState<any>(null);

  React.useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettings(s);
    }
    load();
  }, []);

  const simpleMode = settings?.simpleMode ?? false;

  const handleSaveSettings = async (updated: any) => {
    const s = await getSettings();
    const newSettings = { ...s, ...updated };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleStart = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
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
      <header className="sticky top-0 z-30 px-4 py-4 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="focus-ring rounded-lg">
            <Image src="/brand/logo-light.png" alt="LekkerLedger" width={160} height={40} className="h-10 w-auto block dark:hidden" priority />
            <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={160} height={40} className="h-10 w-auto hidden dark:block" priority />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/rules" className="text-sm font-medium hover:text-[var(--amber-500)] transition-colors" style={{ color: "var(--text-secondary)" }}>Legal Guide</Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-[var(--amber-500)] transition-colors" style={{ color: "var(--text-secondary)" }}>Pricing</Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-bold px-6">
                Get Started
              </Button>
            </Link>
          </nav>

          <div className="md:hidden">
            <SideDrawer />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 px-5 py-10 sm:py-16 lg:py-20 content-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8 w-full animate-slide-up text-center lg:text-left">
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
            <div className="space-y-6">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
                style={{ color: "var(--text-primary)" }}
              >
                Compliant payslips in{" "}
                <span style={{ color: "var(--amber-500)" }}>90 seconds.</span>
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0"
                style={{ color: "var(--text-secondary)" }}
              >
                Calculates the correct National Minimum Wage, overtime, UIF, and Sunday
                rates for your domestic worker — then generates a professional
                PDF. No spreadsheets. No guessing.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <Button size="lg" className="w-full sm:w-auto gap-2 font-bold px-8 h-14 rounded-2xl" onClick={() => handleStart()}>
                Manage Employees <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Savings Indicator */}
            <div
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 animate-fade-in"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-black tracking-tight">R3,000+ per year cheaper than traditional payroll services.</span>
            </div>

            {/* Trust signals (Desktop: Inline below CTA) */}
            <div
              className="hidden lg:flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: "var(--green-500)" }} />
                Private
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
                Fast
              </span>
              <a
                href="https://github.com/nightshiftlabsza/LekkerLedger"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-all"
              >
                <Github className="h-4 w-4" />
                Open Source
              </a>
            </div>
          </div>

          {/* Quick Calculator / Visual Column */}
          {!simpleMode && (
            <div className="w-full max-w-lg mx-auto lg:max-w-none animate-scale-in">
              <CalculatorHero onStart={() => handleStart()} />
            </div>
          )}
          {simpleMode && (
            <div className="w-full max-w-lg mx-auto lg:max-w-md animate-scale-in flex flex-col items-center justify-center p-8 space-y-6 text-center">
              <div className="h-24 w-24 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <ShieldCheck className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Pure Peace of Mind.</h2>
                <p className="text-sm text-[var(--text-secondary)]">Your domestic payroll, handled with absolute legal precision.</p>
              </div>
              <Button size="lg" className="w-full gap-2 font-black h-14 rounded-2xl bg-amber-500 text-white" onClick={handleStart}>
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
              <button
                onClick={() => handleSaveSettings({ simpleMode: false })}
                className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-amber-500 transition-colors"
                style={{ cursor: 'pointer' }}
              >
                Switch to expert mode
              </button>
            </div>
          )}
        </div>

        {/* Trust signals (Mobile: Bottom center) */}
        <div
          className="lg:hidden flex flex-wrap justify-center items-center gap-x-6 gap-y-3 pt-12 text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: "var(--green-500)" }} />
            Private
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
            Generated in 90s
          </span>
          <a
            href="https://github.com/nightshiftlabsza/LekkerLedger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Github className="h-4 w-4" />
            Open Source
          </a>
        </div>

        {/* NEW: Compliance Risk Section */}
        <div className="mt-24 w-full max-w-4xl mx-auto space-y-12 animate-slide-up">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Protect Your Household. <br className="hidden sm:block" />
              <span style={{ color: "var(--amber-500)" }}>Compliance is Non-Negotiable.</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              In South Africa, a single procedural error in a payslip or contract can lead to CCMA awards of up to 12 months' salary.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                title: "Legal Risk Protection",
                desc: "Non-compliant payslips are often used as primary evidence in labor disputes, leading to massive financial penalties.",
                icon: AlertTriangle,
                color: "var(--red-500)"
              },
              {
                title: "BCEA Compliance",
                desc: "Sectoral Determination 7 sets strict rules for leave, NMW, and overtime that are impossible to track manually.",
                icon: ShieldCheck,
                color: "var(--green-500)"
              },
              {
                title: "Digital Safety Net",
                desc: "Our labor engine ensures your calculations are always 100% legally accurate and up-to-date with current laws.",
                icon: Sparkles,
                color: "var(--amber-500)"
              }
            ].map((item, i) => (
              <Card key={i} className="border-none shadow-[var(--shadow-md)] bg-[var(--bg-surface)] hover-lift">
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${item.color}10`, color: item.color, border: `1px solid ${item.color}20` }}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-base pt-2" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-[2.5rem] p-10 sm:p-16 space-y-8 text-center shadow-[var(--shadow-2xl)] relative overflow-hidden group border border-white/10" style={{ background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)" }}>
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="h-48 w-48 text-amber-500" />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">Professional Payroll. <br /> Pure Peace of Mind.</h3>
              <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
                LekkerLedger is the leading platform for domestic worker compliance in South Africa. Generate legal payslips, manage leave, and stay protected from CCMA risks with our automated labor engine.
              </p>
              <div className="pt-6">
                <Button size="lg" className="bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-black px-10 h-16 text-lg rounded-2xl active-scale shadow-lg shadow-amber-500/20" onClick={handleStart}>
                  Start My Free Audit Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
