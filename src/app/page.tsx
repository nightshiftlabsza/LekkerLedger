"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ShieldCheck, FileText, Github, Clock,
  Users, Palmtree, FileSpreadsheet, Calculator, HardDrive,
  Cloud, Eye, CheckCircle2, BookOpen, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { StickyMobileCta } from "@/components/layout/sticky-mobile-cta";
import { FaqAccordion } from "@/components/faq-accordion";
import Image from "next/image";
import { getSettings } from "@/lib/storage";
import { getNMW } from "@/lib/calculator";

export default function Home() {
  const router = useRouter();
  const nmwRate = React.useMemo(() => getNMW(), []);

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
      <MarketingHeader />
      <StickyMobileCta />

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 1: HERO
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">
            {/* Left: Copy */}
            <div className="space-y-8 w-full animate-slide-up text-center lg:text-left">
              <div className="space-y-6 relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-transparent blur-3xl -z-10 rounded-full" />
                <h1 className="type-display" style={{ color: "var(--text-primary)" }}>
                  Domestic-worker payslips, contracts & records{" "}
                  <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">
                    — made for South Africa.
                  </span>
                </h1>
                <p
                  className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Generate professional PDFs in minutes, with built-in wage and UIF checks
                  and an audit-friendly archive. Your employee data stays on your device
                  and/or your own Google Drive.
                </p>
              </div>

              {/* Key bullets */}
              <div className="flex flex-col gap-3 text-left max-w-lg mx-auto lg:mx-0">
                {[
                  { icon: FileText, text: "PDF payslips that look official — clear totals, deductions, pay period" },
                  { icon: HardDrive, text: "Privacy-first: no LekkerLedger employee database" },
                  { icon: Users, text: "Built for households, not HR departments" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "var(--color-brand-subtle)", color: "var(--color-brand)" }}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-3 font-black px-10 h-14 rounded-2xl text-base shadow-xl active-scale group relative overflow-hidden"
                  style={{ boxShadow: "0 20px 40px -12px rgba(196,122,28,0.35)" }}
                  onClick={handleStart}
                >
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-[150%]" />
                  Create your first payslip <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto font-bold px-8 h-14 rounded-2xl text-base active-scale"
                  >
                    View pricing
                  </Button>
                </Link>
              </div>
              <p className="text-xs font-medium text-center lg:text-left" style={{ color: "var(--text-muted)" }}>
                Free plan available · No credit card for trial
              </p>
            </div>

            {/* Right: Document Preview Stack */}
            <div className="w-full max-w-md mx-auto lg:max-w-none animate-scale-in">
              <div className="relative">
                {/* Contract card (behind) */}
                <div
                  className="absolute top-4 left-4 right-0 bottom-0 rounded-3xl rotate-2"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                />
                {/* Payslip card (front) */}
                <div
                  className="relative rounded-3xl p-6 sm:p-8 space-y-5"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-2xl)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="type-overline" style={{ color: "var(--amber-500)" }}>PAYSLIP</p>
                      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>March 2026</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--color-brand-subtle)", color: "var(--color-brand)" }}>
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Employee</span>
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Thandi Nkosi</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Hours worked</span>
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>160h</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Gross pay</span>
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>R 4,836.80</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>UIF (1%)</span>
                      <span className="text-sm font-bold" style={{ color: "var(--red-500)" }}>-R 48.37</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-5 py-4 rounded-2xl" style={{ backgroundColor: "var(--color-brand)", color: "white" }}>
                    <span className="text-xs font-black uppercase tracking-widest">Net Pay</span>
                    <span className="text-2xl font-black tabular-nums">R 4,788.43</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-success)" }}>NMW compliant · UIF calculated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 2: TRUST STRIP
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="py-8 border-y border-[var(--border-subtle)]" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <div className="max-w-5xl mx-auto px-5">
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              Private by design
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {[
                { icon: HardDrive, text: "Stored locally / in your Drive" },
                { icon: Cloud, text: "Google sign-in" },
                { icon: ShieldCheck, text: "POPIA-aware approach" },
                { icon: Github, text: "Open-source core", href: "https://github.com/nightshiftlabsza/LekkerLedger" },
              ].map(({ icon: Icon, text, href }, i) => {
                const content = (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] shadow-sm hover:shadow-[var(--shadow-sm)] transition-shadow">
                    <Icon className="h-3.5 w-3.5" style={{ color: "var(--amber-500)" }} />
                    {text}
                  </div>
                );
                return href ? (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">
                    {content}
                  </a>
                ) : <React.Fragment key={i}>{content}</React.Fragment>;
              })}
            </div>
            <p className="text-center mt-4">
              <Link href="/legal/privacy" className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--amber-500)] underline underline-offset-4 transition-colors">
                Learn how privacy works →
              </Link>
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 3: HOW IT WORKS
                   ═══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="px-5 py-16 sm:py-20 lg:py-24 scroll-mt-20">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="type-h1" style={{ color: "var(--text-primary)" }}>
                From hours worked to a{" "}
                <span style={{ color: "var(--color-brand)" }}>ready-to-file PDF.</span>
              </h2>
              <p className="text-base sm:text-lg max-w-2xl mx-auto font-medium" style={{ color: "var(--text-secondary)" }}>
                No setup headaches. Keep everything in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01", title: "Add employee details once",
                  desc: "Name, ID number, hourly rate, start date. Takes under a minute.",
                  icon: Users, color: "var(--blue-500)",
                },
                {
                  step: "02", title: "Enter hours & extras for the month",
                  desc: "Regular hours, overtime, public holidays, Sunday work — all in one form.",
                  icon: Clock, color: "var(--amber-500)",
                },
                {
                  step: "03", title: "Generate a payslip PDF",
                  desc: "NMW check, UIF calculation, and a professional-looking PDF — automatically.",
                  icon: FileText, color: "var(--green-500)",
                },
                {
                  step: "04", title: "Save to your records",
                  desc: "Stored on your device and optionally synced to your own Google Drive.",
                  icon: HardDrive, color: "var(--color-brand)",
                },
              ].map((item, i) => (
                <div key={i} className="relative p-6 sm:p-7 rounded-[2rem] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-md)] hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 p-5 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                    <item.icon className="h-20 w-20" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-3xl font-black opacity-10" style={{ color: item.color }}>{item.step}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="type-h3" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                      <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                className="font-bold px-8 h-12 rounded-xl active-scale text-sm"
                variant="outline"
                onClick={handleStart}
              >
                Create your first payslip <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 4: COMPLIANCE GUARDRAILS
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-16 sm:py-20" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="type-h1" style={{ color: "var(--text-primary)" }}>
                Guardrails that help you{" "}
                <span style={{ color: "var(--color-brand)" }}>stay consistent.</span>
              </h2>
              <p className="text-base sm:text-lg max-w-2xl mx-auto font-medium" style={{ color: "var(--text-secondary)" }}>
                We&apos;re not a law firm. We help you follow common domestic employment requirements
                with clearer records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  title: "Minimum wage check",
                  desc: `Current NMW for domestic workers: R${nmwRate.toFixed(2)}/hr. We flag rates below this automatically.`,
                  icon: ShieldCheck,
                },
                {
                  title: "UIF threshold reminder",
                  desc: "If your employee works more than 24 hours per month, UIF registration and deductions are required.",
                  icon: Eye,
                },
                {
                  title: "Payslip fields checklist",
                  desc: "Our payslips include the fields recommended by the BCEA — employer details, pay period, deductions, and net pay.",
                  icon: CheckCircle2,
                },
                {
                  title: "Archive reminders",
                  desc: "Keep payslip records for at least 3 years. Our paid plans offer 1–5 year archives with optional Drive sync.",
                  icon: Clock,
                },
                {
                  title: "Public holiday & Sunday rates",
                  desc: "Contextual reminders when generating payslips during months with public holidays or Sunday work.",
                  icon: Calculator,
                },
                {
                  title: "Contract templates",
                  desc: "Simple, BCEA-aligned contract templates that cover the written particulars requirement.",
                  icon: FileText,
                },
              ].map(({ title, desc, icon: Icon }, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm space-y-3 hover-lift">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--color-brand-subtle)", color: "var(--color-brand)" }}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
                  <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs font-medium px-4 py-2 rounded-full inline-flex items-center gap-2" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}>
                <BookOpen className="h-3 w-3" /> Not legal advice — see our compliance guide for sources
              </p>
              <div>
                <Link href="/rules" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--amber-500)] underline underline-offset-4 transition-colors">
                  Read the compliance guide →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 5: FEATURE HIGHLIGHTS
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="type-h1" style={{ color: "var(--text-primary)" }}>
                Everything you need for{" "}
                <span style={{ color: "var(--color-brand)" }}>household payroll records.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: FileText, title: "Payslip PDFs", desc: "Professional monthly payslips with all required fields, downloadable as PDFs.", color: "var(--amber-500)" },
                { icon: FileText, title: "Contract generator", desc: "Simple employment contract templates aligned with BCEA written particulars requirements.", color: "var(--blue-500)" },
                { icon: Palmtree, title: "Leave tracking", desc: "Track annual, sick, and family responsibility leave entitlements per employee.", color: "var(--green-500)" },
                { icon: Clock, title: "Archive & history", desc: "Searchable record of all payslips generated — with timestamps and totals.", color: "var(--color-brand)" },
                { icon: FileSpreadsheet, title: "uFiling export", desc: "Generate export files compatible with SARS eFiling for UIF declarations.", color: "var(--blue-500)" },
                { icon: Calculator, title: "Wage & UIF calculator", desc: "Quick NMW and UIF estimates before you generate a full payslip.", color: "var(--green-500)", href: "/calculator" },
              ].map(({ icon: Icon, title, desc, color, href }, i) => (
                <Card key={i} className="border-none shadow-[var(--shadow-md)] bg-[var(--bg-surface)] hover-lift rounded-2xl group overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
                    <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                    {href && (
                      <Link href={href} className="text-xs font-semibold text-[var(--amber-500)] hover:underline underline-offset-4 transition-colors inline-flex items-center gap-1">
                        Try the calculator <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 6: PRIVACY EXPLANATION
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-16 sm:py-20" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="type-h1" style={{ color: "var(--text-primary)" }}>
                Your employee data isn&apos;t stored in a{" "}
                <span style={{ color: "var(--color-brand)" }}>vendor database.</span>
              </h2>
              <p className="text-base sm:text-lg max-w-2xl mx-auto font-medium" style={{ color: "var(--text-secondary)" }}>
                LekkerLedger is designed so payroll data stays with you — on your device
                and optionally synced to your own Google Drive.
              </p>
            </div>

            {/* Privacy flow diagram */}
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {[
                  { icon: Users, label: "You enter details", sub: "Employee info, hours, extras" },
                  { icon: HardDrive, label: "Stored on your device", sub: "Browser local storage" },
                  { icon: Cloud, label: "Optional: your Google Drive", sub: "Your account, your files" },
                ].map(({ icon: Icon, label, sub }, i) => (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: "var(--color-brand-subtle)", color: "var(--color-brand)" }}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
                      <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl text-center" style={{ backgroundColor: "var(--bg-muted)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>LekkerLedger does not maintain a central employee database.</strong>{" "}
                  We may collect anonymous usage telemetry (no employee details).
                  Payments are processed by third-party payment providers.{" "}
                  <Link href="/legal/privacy" className="underline hover:text-[var(--amber-500)] transition-colors">
                    Read the full privacy policy →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 7: PRICING SUMMARY
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-16 sm:py-20 lg:py-24">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="type-h1" style={{ color: "var(--text-primary)" }}>
                Start free.{" "}
                <span style={{ color: "var(--color-brand)" }}>Upgrade when you need more.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Standard", price: "Free", period: "forever",
                  features: ["1 employee", "3-month history archive", "BCEA-aligned payslips"],
                  highlight: false,
                },
                {
                  title: "Annual Support", price: "R 99", period: "per year",
                  features: ["Up to 3 employees", "1-year compliance archive", "Contract generator"],
                  highlight: false, badge: "Popular",
                },
                {
                  title: "Lekker Pro", price: "R 299", period: "once-off",
                  features: ["Unlimited employees", "5-year archive", "Google Drive sync + vault"],
                  highlight: true, badge: "Best value",
                },
              ].map(({ title, price, period, features, highlight, badge }, i) => (
                <div
                  key={i}
                  className={`relative p-6 sm:p-7 rounded-2xl space-y-5 transition-all ${highlight ? "shadow-xl" : "shadow-[var(--shadow-md)]"}`}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: highlight ? "2px solid var(--color-brand)" : "1px solid var(--border-subtle)",
                  }}
                >
                  {badge && (
                    <div
                      className="absolute -top-3 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm"
                      style={{
                        backgroundColor: highlight ? "var(--color-brand)" : "var(--bg-muted)",
                        color: highlight ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {badge}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold" style={{ color: highlight ? "var(--color-brand)" : "var(--text-secondary)" }}>{title}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>{price}</span>
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: highlight ? "var(--color-brand)" : "var(--color-success)" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button variant="outline" className="font-bold px-8 h-12 rounded-xl active-scale text-sm">
                  See full pricing <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                className="font-black px-8 h-12 rounded-xl shadow-lg active-scale text-sm"
                style={{ backgroundColor: "var(--color-brand)", color: "white" }}
                onClick={handleStart}
              >
                Create your first payslip <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 8: FAQ
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-16 sm:py-20" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="type-h1" style={{ color: "var(--text-primary)" }}>
                Frequently asked questions
              </h2>
            </div>
            <FaqAccordion />
            <div className="flex justify-center">
              <Button
                className="font-black px-8 h-12 rounded-xl shadow-lg active-scale text-sm"
                style={{ backgroundColor: "var(--color-brand)", color: "white" }}
                onClick={handleStart}
              >
                Create your first payslip <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
                   SECTION 9: FINAL CTA + FOOTER
                   ═══════════════════════════════════════════════════════════════ */}
        <section className="px-5 py-16 sm:py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="type-h1" style={{ color: "var(--text-primary)" }}>
              Clear records. Fair pay.{" "}
              <span style={{ color: "var(--color-brand)" }}>Less admin.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="font-black px-10 h-14 rounded-2xl text-base shadow-xl active-scale"
                style={{ backgroundColor: "var(--color-brand)", color: "white" }}
                onClick={handleStart}
              >
                Create your first payslip <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="font-bold px-8 h-14 rounded-2xl text-base active-scale"
                >
                  View pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
              <Image src="/brand/logo-light.png" alt="LekkerLedger" width={180} height={45} className="h-10 w-auto block dark:hidden" />
              <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={180} height={45} className="h-10 w-auto hidden dark:block" />
              <p className="text-sm text-[var(--text-secondary)] font-medium max-w-[250px]">
                Domestic-worker payslips, contracts & records — made for South Africa.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h4 className="type-overline text-[var(--text-primary)] normal-case text-sm">Product</h4>
              <nav className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
                <Link href="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Pricing</Link>
                <Link href="/calculator" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Wage Calculator</Link>
                <Link href="/rules" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Compliance Guide</Link>
              </nav>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h4 className="type-overline text-[var(--text-primary)] normal-case text-sm">Legal</h4>
              <nav className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
                <Link href="/legal/terms" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Terms of Service</Link>
                <Link href="/legal/privacy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Privacy Policy (POPIA)</Link>
                <Link href="/legal/refunds" className="text-sm text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">Refund Policy</Link>
              </nav>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <h4 className="type-overline text-[var(--text-primary)] normal-case text-sm">Connect</h4>
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
