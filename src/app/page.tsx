"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Clock, Github, AlertTriangle, ShieldCheck, Sparkles, ChevronRight, ShieldAlert, FileText, Lock } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      <ComplianceSplash isOpen={showCompliance} onClose={() => setShowCompliance(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-6 xl:py-8 glass-panel shadow-[var(--shadow-sm)] backdrop-blur-md bg-opacity-80" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="focus-ring rounded-lg">
            <Image src="/brand/logo-light.png" alt="LekkerLedger" width={224} height={56} className="h-12 sm:h-14 w-auto block dark:hidden" priority />
            <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={224} height={56} className="h-12 sm:h-14 w-auto hidden dark:block" priority />
          </Link>

          <nav className="hidden md:flex items-center gap-8 group">
            <Link href="/rules" className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--amber-500)] hover:underline underline-offset-4 transition-all">The Rules</Link>
            <Link href="/pricing" className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--amber-500)] hover:underline underline-offset-4 transition-all">Pricing</Link>
            <Button className="bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-black px-6 rounded-xl h-11 shadow-lg shadow-amber-500/20 active-scale" onClick={handleStart}>
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
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm"
              style={{
                backgroundColor: "var(--bg-surface)",
                color: "var(--amber-500)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Legal & Private
            </div>

            {/* Headline */}
            <div className="space-y-6 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-transparent blur-3xl -z-10 rounded-full" />
              <h1
                className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.05]"
                style={{ color: "var(--text-primary)" }}
              >
                Compliant payslips in{" "}
                <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">90 seconds.</span>
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
              <Button size="lg" className="w-full sm:w-auto gap-3 font-black px-10 h-16 rounded-[1.25rem] text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/40 active-scale group relative overflow-hidden" onClick={handleStart}>
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-[150%]" />
                Start Free Check <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Savings Indicator */}
            <div
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--green-500)] bg-opacity-10 border border-[var(--green-500)] border-opacity-20 text-[var(--green-500)] animate-fade-in font-black tracking-tight uppercase"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">R3,000+ per year cheaper than traditional payroll services.</span>
            </div>

            {/* Trust signals (Desktop: Inline below CTA) */}
            <div className="hidden lg:flex flex-wrap items-center gap-x-4 gap-y-3 pt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--green-500)]" />
                100% Private
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] shadow-sm">
                <FileText className="h-3.5 w-3.5 text-[var(--blue-500)]" />
                BCEA Compliant
              </div>
              <a
                href="https://github.com/nightshiftlabsza/LekkerLedger"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-zinc-400 transition-all shadow-sm"
              >
                <Github className="h-3.5 w-3.5" />
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
        <div className="lg:hidden flex flex-wrap justify-center items-center gap-x-3 gap-y-3 pt-12">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--green-500)]" />
            Private
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] shadow-sm">
            <FileText className="h-3.5 w-3.5 text-[var(--blue-500)]" />
            BCEA Compliant
          </div>
        </div>

        {/* NEW: Compliance Risk Section */}
        <div className="mt-24 w-full max-w-5xl mx-auto space-y-12 animate-slide-up">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Protect Your Household. <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">The Stakes Are Real.</span>
            </h2>
            <p className="text-base sm:text-lg max-w-2xl mx-auto font-medium" style={{ color: "var(--text-secondary)" }}>
              In South Africa, a single procedural error in a payslip or contract can lead to CCMA awards of up to 12 months' salary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Legal Risk Protection",
                desc: "Non-compliant payslips are often used as primary evidence in labor disputes, leading to massive financial penalties at the CCMA.",
                icon: AlertTriangle,
                color: "var(--red-500)",
                className: "md:col-span-2 lg:col-span-2"
              },
              {
                title: "Local Privacy",
                desc: "Zero servers. Your data stays securely on your device for strict POPIA adherence.",
                icon: Lock,
                color: "var(--blue-500)",
                className: "md:col-span-1 lg:col-span-1"
              },
              {
                title: "BCEA Compliance",
                desc: "Sectoral Determination 7 sets strict rules for leave, NMW, and overtime.",
                icon: FileText,
                color: "var(--green-500)",
                className: "md:col-span-1 lg:col-span-1"
              },
              {
                title: "Digital Safety Net",
                desc: "Our labor engine ensures your calculations are always 100% legally accurate.",
                icon: Sparkles,
                color: "var(--amber-500)",
                className: "md:col-span-1 lg:col-span-2"
              }
            ].map((item, i) => (
              <Card key={i} className={`border-none shadow-[var(--shadow-lg)] bg-[var(--bg-surface)] hover-lift rounded-[2rem] group overflow-hidden relative ${item.className}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-8 space-y-4 relative z-10 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm relative group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-black text-xl lg:text-2xl pt-2" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                  </div>
                  <p className="text-sm md:text-base leading-relaxed font-medium opacity-80 pt-4" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-[3rem] p-10 sm:p-20 space-y-10 text-center shadow-[var(--shadow-2xl)] relative overflow-hidden group border border-white/5" style={{ background: "linear-gradient(145deg, #09090b 0%, #18181b 100%)" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-50" />
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
              <Sparkles className="h-64 w-64 text-amber-500" />
            </div>
            <div className="relative z-10 space-y-8">
              <h3 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">Professional Payroll. <br /> Pure Peace of Mind.</h3>
              <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium">
                The leading platform for domestic worker compliance in South Africa. Stay protected from CCMA risks with our automated labor engine.
              </p>
              <div className="pt-6">
                <Button size="lg" className="bg-[var(--amber-500)] hover:bg-[var(--amber-600)] text-white font-black px-12 h-20 text-xl rounded-[1.5rem] active-scale shadow-2xl shadow-amber-500/40 relative overflow-hidden group/cta" onClick={handleStart}>
                  <div className="absolute inset-0 bg-white/20 group-hover/cta:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-[150%]" />
                  Start Free Check <ArrowRight className="ml-3 h-6 w-6 group-hover/cta:translate-x-1 transition-transform" />
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
            <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
              <Image src="/brand/logo-light.png" alt="LekkerLedger" width={180} height={45} className="h-10 w-auto block dark:hidden" />
              <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={180} height={45} className="h-10 w-auto hidden dark:block" />
              <p className="text-sm text-[var(--text-secondary)] font-medium max-w-[250px]">
                Professional payroll and compliance for South African homeowners.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-primary)]">Product</h4>
              <nav className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
                <Link href="/rules" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">The Rules</Link>
                <Link href="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Pricing</Link>
                <Link href="/ufiling" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">uFiling Export</Link>
              </nav>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-primary)]">Legal</h4>
              <nav className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
                <Link href="/legal/terms" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Terms of Service</Link>
                <Link href="/legal/privacy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Privacy Policy (POPIA)</Link>
                <Link href="/legal/refunds" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Refund Policy</Link>
              </nav>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-primary)]">Connect</h4>
              <nav className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
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
