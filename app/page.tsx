"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Clock, Github, AlertTriangle, ShieldCheck, Sparkles, ChevronRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SideDrawer } from "@/components/layout/side-drawer";
import { CalculatorHero } from "@/components/calculator-hero";
import Image from "next/image";
import { getSettings, saveSettings } from "@/lib/storage";
import { ComplianceSplash } from "@/components/compliance-splash";

export default function Home() {
  const router = useRouter();
  const [settings, setSettings] = React.useState<any>(null);
  const [showCompliance, setShowCompliance] = React.useState(false);
  const calculatorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettings(s);

      // Show compliance splash only once ever
      if (!localStorage.getItem("ll-compliance-shown")) {
        setShowCompliance(true);
        localStorage.setItem("ll-compliance-shown", "true");
      }
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
        router.push("/dashboard");
      }
    } catch {
      router.push("/onboarding");
    }
  };

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      <ComplianceSplash isOpen={showCompliance} onClose={() => setShowCompliance(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-4 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="focus-ring rounded-lg">
            <Image src="/brand/logo-light.png" alt="LekkerLedger" width={160} height={40} className="h-10 w-auto block dark:hidden" priority />
            <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={160} height={40} className="h-10 w-auto hidden dark:block" priority />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/rules" className="text-sm font-bold hover:text-[var(--amber-500)] transition-colors" style={{ color: "var(--text-secondary)" }}>The Rules</Link>
            <Link href="/pricing" className="text-sm font-bold hover:text-[var(--amber-500)] transition-colors" style={{ color: "var(--text-secondary)" }}>Support & Pro</Link>
            <Button className="bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-black px-6 rounded-xl h-11" onClick={handleStart}>
              Get Started
            </Button>
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
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full"
              style={{
                backgroundColor: "rgba(196,122,28,0.10)",
                color: "var(--amber-500)",
                border: "1px solid rgba(196,122,28,0.20)",
              }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Compliance is Non-Negotiable
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1
                className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05]"
                style={{ color: "var(--text-primary)" }}
              >
                Compliant payslips in{" "}
                <span style={{ color: "var(--amber-500)" }}>90 seconds.</span>
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                LekkerLedger calculates the correct National Minimum Wage, UIF, and Sunday
                rates automatically — then generates a professional
                PDF. Built for South African homeowners.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Button size="lg" className="w-full sm:w-auto gap-3 font-black px-10 h-16 rounded-[1.25rem] text-lg shadow-xl shadow-amber-500/20 active-scale" onClick={handleStart}>
                Start Compliance Check <ChevronRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="h-16 rounded-[1.25rem] px-8 font-bold border-[var(--border-subtle)]" onClick={scrollToCalculator}>
                View Calculator
              </Button>
            </div>

            {/* Savings Indicator */}
            <div
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 animate-fade-in"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-black tracking-tight uppercase">R3,000+ per year cheaper than traditional payroll services.</span>
            </div>

            {/* Trust signals (Desktop: Inline below CTA) */}
            <div
              className="hidden lg:flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" style={{ color: "var(--green-500)" }} />
                100% Private
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
                Fast Setup
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
            <div ref={calculatorRef} className="w-full max-w-lg mx-auto lg:max-w-none animate-scale-in scroll-mt-32">
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
              <Button size="lg" className="w-full gap-2 font-black h-14 rounded-2xl bg-amber-500 text-white shadow-lg active-scale" onClick={handleStart}>
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
              <button
                onClick={() => handleSaveSettings({ simpleMode: false })}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-amber-500 transition-colors"
                style={{ cursor: 'pointer' }}
              >
                Switch to expert mode
              </button>
            </div>
          )}
        </div>

        {/* Trust signals (Mobile: Bottom center) */}
        <div
          className="lg:hidden flex flex-wrap justify-center items-center gap-x-6 gap-y-3 pt-12 text-[10px] font-black uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--green-500)" }} />
            Private
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
            BCEA Compliant
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
        <div className="mt-24 w-full max-w-5xl mx-auto space-y-12 animate-slide-up">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Protect Your Household. <br className="hidden sm:block" />
              <span style={{ color: "var(--amber-500)" }}>The stakes are real.</span>
            </h2>
            <p className="text-base sm:text-lg max-w-2xl mx-auto font-medium" style={{ color: "var(--text-secondary)" }}>
              In South Africa, a single procedural error in a payslip or contract can lead to CCMA awards of up to 12 months' salary.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Legal Risk Protection",
                desc: "Non-compliant payslips are often used as primary evidence in labor disputes, leading to massive financial penalties.",
                icon: AlertTriangle,
                color: "var(--red-500)"
              },
              {
                title: "Local Privacy",
                desc: "We have zero servers. Your data stays on your device (and your private Google Sync) for maximum POPIA safety.",
                icon: ShieldCheck,
                color: "var(--blue-500)"
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
              <Card key={i} className="border-none shadow-[var(--shadow-lg)] bg-[var(--bg-surface)] hover-lift rounded-[2rem]">
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${item.color}10`, color: item.color, border: `1px solid ${item.color}20` }}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-black text-lg pt-2" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed font-medium opacity-80" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-[3rem] p-10 sm:p-20 space-y-10 text-center shadow-[var(--shadow-2xl)] relative overflow-hidden group border border-white/5" style={{ background: "linear-gradient(145deg, #09090b 0%, #18181b 100%)" }}>
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="h-64 w-64 text-amber-500" />
            </div>
            <div className="relative z-10 space-y-8">
              <h3 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">Professional Payroll. <br /> Pure Peace of Mind.</h3>
              <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium">
                The leading platform for domestic worker compliance in South Africa. Stay protected from CCMA risks with our automated labor engine.
              </p>
              <div className="pt-6">
                <Button size="lg" className="bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-black px-12 h-20 text-xl rounded-[1.5rem] active-scale shadow-2xl shadow-amber-500/40" onClick={handleStart}>
                  Start My Free Audit Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <Image src="/brand/logo-light.png" alt="LekkerLedger" width={140} height={35} className="h-8 w-auto block dark:hidden" />
              <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={140} height={35} className="h-8 w-auto hidden dark:block" />
              <p className="text-sm text-[var(--text-secondary)] font-medium">
                Professional payroll and compliance for South African homeowners.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-primary)]">Product</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/rules" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">SA Rules Guide</Link>
                <Link href="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Pricing & Pro</Link>
                <Link href="/ufiling" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">uFiling Export</Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-primary)]">Legal</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/legal/terms" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Terms of Service</Link>
                <Link href="/legal/privacy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Privacy Policy (POPIA)</Link>
                <Link href="/legal/refunds" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Refund & Cancellation</Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-primary)]">Connect</h4>
              <nav className="flex flex-col gap-2">
                <a href="mailto:nightshiftlabsza@gmail.com" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Support Email</a>
                <a href="https://github.com/nightshiftlabsza/LekkerLedger" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">GitHub Repository</a>
              </nav>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
            <p>© 2026 LekkerLedger. All rights reserved.</p>
            <p>Crafted with ❤️ in South Africa 🇿🇦 by Nightshift Labs</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
