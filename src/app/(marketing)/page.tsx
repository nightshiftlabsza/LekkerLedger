"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Check, ChevronDown, ChevronRight, Shield, FileText, Users,
    Smartphone, CloudOff, HardDrive, ArrowRight, Menu, X,
    FolderSync, Fingerprint, Github, Mail, ClipboardCheck,
    Calendar, Download, BookOpen, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNMWForDate } from "@/lib/legal/registry";

/* ═══════════════════════════════════════════════════════════════════════════
 * MARKETING HOMEPAGE — follows Audit A §4 wireframe exactly:
 *   1. MarketingHeader  2. Hero  3. TrustStrip  4. HowItWorks
 *   5. Guardrails  6. FeatureGrid  7. PrivacyExplainer
 *   8. PricingSummary  9. FAQAccordion  10. FinalCTA + Footer
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function HomePage() {
    const nmw = getNMWForDate(new Date());

    return (
        <div className="min-h-screen flex flex-col selection:bg-amber-200" style={{ backgroundColor: "var(--bg-base)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <Hero nmw={nmw} />
                <TrustStrip />
                <HowItWorks />
                <Guardrails nmw={nmw} />
                <FeatureGrid />
                <PrivacyExplainer />
                <PricingSummary />
                <FAQAccordion />
                <FinalCTA />
            </main>

            <Footer />
            <StickyMobileCTA />
        </div>
    );
}

/* ─── 1. MARKETING HEADER ─────────────────────────────────────────────────── */
function MarketingHeader() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const links = [
        { href: "#how-it-works", label: "How it works" },
        { href: "/pricing", label: "Pricing" },
        { href: "/legal/privacy", label: "Privacy" },
        { href: "/rules", label: "Compliance guide" },
        { href: "#faq", label: "FAQ" },
    ];

    return (
        <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border-subtle)]">
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <Image src="/brand/logo-light.png" alt="LekkerLedger" width={140} height={36} className="h-8 w-auto block dark:hidden" priority />
                    <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={140} height={36} className="h-8 w-auto hidden dark:block" priority />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-6">
                    {links.map(l => (
                        <Link key={l.href} href={l.href} className="text-sm font-medium transition-colors hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>
                            {l.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden lg:flex items-center gap-3">
                    <Link href="/dashboard" className="text-sm font-semibold transition-colors hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>
                        Sign in
                    </Link>
                    <Link href="/dashboard">
                        <Button className="h-10 px-5 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-sm shadow-md">
                            Create your first payslip
                        </Button>
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl" style={{ color: "var(--text-primary)" }}>
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="lg:hidden border-t border-[var(--border-subtle)] px-4 py-4 space-y-2" style={{ backgroundColor: "var(--bg-surface)" }}>
                    {links.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]" style={{ color: "var(--text-primary)" }}>
                            {l.label}
                        </Link>
                    ))}
                    <div className="pt-3 space-y-2 border-t border-[var(--border-subtle)]">
                        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                            <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-sm">Sign in</Button>
                        </Link>
                        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                            <Button className="w-full h-11 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-sm mt-2">
                                Create your first payslip
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}

/* ─── 2. HERO ──────────────────────────────────────────────────────────────── */
function Hero({ nmw }: { nmw: number }) {
    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-24 w-72 h-72 bg-green-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <div className="space-y-8 max-w-xl">
                        <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.1]" style={{ color: "var(--text-primary)" }}>
                            Domestic-worker payslips, contracts & records —{" "}
                            <span className="text-amber-500">made for South Africa.</span>
                        </h1>

                        <p className="text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            Generate professional PDFs in minutes, with built-in wage and UIF checks and an audit-friendly archive. Your employee data stays on your device and/or your own Google Drive.
                        </p>

                        {/* 3 key bullets */}
                        <ul className="space-y-3">
                            {[
                                "PDF payslips with clear totals, deductions & pay period",
                                "Privacy-first: no LekkerLedger employee database",
                                "Built for households (not HR departments)",
                            ].map((t, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="h-3.5 w-3.5 text-green-600 stroke-[3px]" />
                                    </span>
                                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/dashboard">
                                <Button className="h-13 px-8 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-base shadow-lg shadow-green-600/20 transition-all hover:shadow-xl">
                                    Create your first payslip <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/pricing">
                                <Button variant="outline" className="h-13 px-8 rounded-xl font-bold text-base">
                                    View pricing
                                </Button>
                            </Link>
                        </div>

                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                            Free plan available • No credit card for trial
                        </p>
                    </div>

                    {/* Right: Document preview */}
                    <div className="hidden lg:block relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)]" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <div className="p-6 space-y-5">
                                {/* Mini payslip preview */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Payslip</p>
                                        <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>March 2026</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-amber-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-secondary)" }}>Employee</span>
                                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>Thandi M.</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-secondary)" }}>Hours worked</span>
                                        <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>160</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-secondary)" }}>Rate</span>
                                        <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>R{nmw.toFixed(2)}/hr</span>
                                    </div>
                                    <div className="border-t border-[var(--border-subtle)] pt-2 mt-2 flex justify-between">
                                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Gross</span>
                                        <span className="text-lg font-black text-amber-500">R{(nmw * 160).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-secondary)" }}>UIF (1%)</span>
                                        <span className="font-mono" style={{ color: "var(--text-secondary)" }}>-R{(nmw * 160 * 0.01).toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-[var(--border-subtle)] pt-2 flex justify-between">
                                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>Net Pay</span>
                                        <span className="text-xl font-black text-green-600">R{(nmw * 160 * 0.99).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600">BCEA Compliant</span>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600">UIF Included</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating contract card */}
                        <div className="absolute -bottom-4 -left-6 p-4 rounded-xl shadow-xl border border-[var(--border-subtle)] max-w-[200px]" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Contract ready</span>
                            </div>
                            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>BCEA-aligned template</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── 3. TRUST STRIP ──────────────────────────────────────────────────────── */
function TrustStrip() {
    const badges = [
        { icon: HardDrive, text: "Stored locally / in your Drive" },
        { icon: Fingerprint, text: "Google sign-in" },
        { icon: Shield, text: "POPIA-aware approach" },
        { icon: Github, text: "Open-source core" },
    ];

    return (
        <section className="border-y border-[var(--border-subtle)]" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-12">
                    <p className="text-xs font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--text-muted)" }}>
                        Private by design
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        {badges.map((b, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-default)]" style={{ backgroundColor: "var(--bg-surface)" }}>
                                <b.icon className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
                                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{b.text}</span>
                            </div>
                        ))}
                    </div>
                    <Link href="/legal/privacy" className="text-xs font-semibold text-amber-600 hover:text-amber-500 whitespace-nowrap">
                        Learn how privacy works →
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ─── 4. HOW IT WORKS ─────────────────────────────────────────────────────── */
function HowItWorks() {
    const steps = [
        { num: "1", title: "Add your employee details once", desc: "Name, ID, hourly rate, start date — you're guided through it." },
        { num: "2", title: "Enter hours / days / extras for the month", desc: "Hours worked, overtime, leave days — simple monthly entry." },
        { num: "3", title: "Generate a payslip PDF", desc: "Professional PDF with clear totals, deductions, and pay period — ready to share." },
        { num: "4", title: "Save to your records", desc: "Stored on your device. Optionally sync to your own Google Drive for backup." },
    ];

    return (
        <section id="how-it-works" className="relative" style={{ backgroundColor: "var(--bg-base)" }}>
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        From hours worked to a ready-to-file PDF.
                    </h2>
                    <p className="text-base mt-4" style={{ color: "var(--text-secondary)" }}>
                        No setup headaches. Keep everything in one place.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {steps.map((s, i) => (
                        <div key={i} className="relative p-6 rounded-2xl border border-[var(--border-subtle)] transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                                <span className="text-base font-black text-amber-600">{s.num}</span>
                            </div>
                            <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                            {i < 3 && <ChevronRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-300" />}
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link href="/dashboard">
                        <Button className="h-11 px-6 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-sm">
                            Create your first payslip
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ─── 5. GUARDRAILS ───────────────────────────────────────────────────────── */
function Guardrails({ nmw }: { nmw: number }) {
    const items = [
        `Minimum wage check — current rate R${nmw.toFixed(2)}/hr (as of 1 Mar 2026)`,
        "UIF threshold reminder — if your employee works more than 24 hours/month",
        "Payslip field checklist — what a compliant payslip should include",
        "Archive reminders — keep statements/records for at least 3 years",
        "Public holiday & Sunday rate reminders",
    ];

    return (
        <section style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 max-w-lg">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Guardrails that help you stay consistent.
                        </h2>
                        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            We&apos;re not a law firm. We help you follow common domestic employment requirements with clearer records.
                        </p>

                        <ul className="space-y-3">
                            {items.map((t, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="h-4 w-4 text-green-600 shrink-0 mt-1 stroke-[3px]" />
                                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                General information, not legal advice. Always check official guidance for your situation.
                            </p>
                        </div>

                        <Link href="/rules" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-500">
                            Read the compliance guide <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* Compliance checklist card visual */}
                    <div className="hidden lg:block">
                        <div className="p-8 rounded-2xl border border-[var(--border-subtle)] shadow-xl" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <div className="flex items-center gap-3 mb-6">
                                <ClipboardCheck className="h-5 w-5 text-green-600" />
                                <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Compliance Checklist</h3>
                            </div>
                            <div className="space-y-3">
                                {["Hourly rate ≥ NMW ✓", "UIF deduction calculated ✓", "Pay period dates set ✓", "Employee details complete ✓", "Leave balance tracked ✓"].map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                                        <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Check className="h-3 w-3 text-green-600 stroke-[3px]" />
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── 6. FEATURE GRID ─────────────────────────────────────────────────────── */
function FeatureGrid() {
    const features = [
        { icon: FileText, title: "Payslip PDFs (monthly)", desc: "Professional payslips with clear totals, deductions, and pay periods." },
        { icon: ClipboardCheck, title: "Contract generator", desc: "Simple BCEA-aligned employment contract templates." },
        { icon: Calendar, title: "Leave tracking", desc: "Annual, sick, and family responsibility leave — easy to explain and review." },
        { icon: FolderSync, title: "Archive & history", desc: "Searchable records of payslips, contracts, and documents." },
        { icon: Download, title: "uFiling export", desc: "Export UIF declarations where applicable." },
        { icon: Smartphone, title: "Works on mobile & desktop", desc: "Smooth experience across all devices with accessible navigation." },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg-base)" }}>
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Everything you need for household payroll records.
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="p-6 rounded-2xl border border-[var(--border-subtle)] transition-all hover:border-amber-500/30 hover:shadow-lg" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                                <f.icon className="h-5 w-5 text-amber-600" />
                            </div>
                            <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── 7. PRIVACY EXPLAINER ────────────────────────────────────────────────── */
function PrivacyExplainer() {
    return (
        <section style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 max-w-lg">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Your employee data isn&apos;t stored in a vendor database.
                        </h2>
                        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            LekkerLedger is designed so payroll data stays with you — on your device and optionally synced to your own Google Drive.
                        </p>

                        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                <strong>Honest footnote:</strong> We may collect anonymous usage telemetry (no employee details). Payments are processed by PayStack. We do not store your credit card information.
                            </p>
                        </div>

                        <Link href="/legal/privacy" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-500">
                            See the privacy model <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* Diagram */}
                    <div className="hidden lg:block">
                        <div className="p-8 rounded-2xl border border-[var(--border-subtle)] shadow-xl" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>You enter details</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Employee info → payslip data</p>
                                    </div>
                                </div>
                                <div className="ml-6 border-l-2 border-dashed border-[var(--border-default)] h-6" />
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <HardDrive className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Stored on your device</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Browser storage / IndexedDB</p>
                                    </div>
                                </div>
                                <div className="ml-6 border-l-2 border-dashed border-[var(--border-default)] h-6" />
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <FolderSync className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Optional: your Google Drive</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Synced to your own personal folder</p>
                                    </div>
                                </div>
                                <div className="ml-6 border-l-2 border-dashed border-[var(--border-default)] h-6" />
                                <div className="flex items-center gap-4 opacity-50">
                                    <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                        <CloudOff className="h-6 w-6 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>LekkerLedger servers</p>
                                        <p className="text-xs text-red-400 font-bold">No central employee database</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── 8. PRICING SUMMARY ─────────────────────────────────────────────────── */
function PricingSummary() {
    const plans = [
        {
            title: "Standard", price: "Free", period: "forever",
            bullets: ["1 employee", "3 months history", "BCEA-aligned calculations"],
        },
        {
            title: "Annual Support", price: "R99", period: "per year", badge: "Popular",
            bullets: ["Up to 3 employees", "1 year archive", "Contract generator"],
        },
        {
            title: "Lekker Pro", price: "R299", period: "once-off", badge: "Best Value",
            bullets: ["Unlimited employees", "5 year archive", "Google Drive sync"],
        },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg-base)" }}>
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Start free. Upgrade when your household needs more.
                    </h2>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {plans.map((p, i) => (
                        <div key={i} className={`relative p-6 rounded-2xl border transition-all ${i === 2 ? 'border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.02]' : 'border-[var(--border-subtle)]'}`} style={{ backgroundColor: "var(--bg-surface)" }}>
                            {p.badge && (
                                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${i === 2 ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                    {p.badge}
                                </span>
                            )}
                            <div className="text-center mb-4 pt-2">
                                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{p.title}</h3>
                                <div className="mt-2">
                                    <span className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>{p.price}</span>
                                    <span className="text-xs font-bold ml-1" style={{ color: "var(--text-muted)" }}>{p.period}</span>
                                </div>
                            </div>
                            <ul className="space-y-2 mb-6">
                                {p.bullets.map((b, j) => (
                                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                                        <Check className="h-3.5 w-3.5 text-green-500 stroke-[3px] shrink-0" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-8 space-y-3">
                    <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-500">
                        See full pricing & comparison <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <div>
                        <Link href="/dashboard">
                            <Button className="h-11 px-6 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-sm">
                                Create your first payslip
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── 9. FAQ ACCORDION ───────────────────────────────────────────────────── */
function FAQAccordion() {
    const faqs = [
        { q: "Is my employee data stored on LekkerLedger's servers?", a: "No. LekkerLedger doesn't keep a central database of your employee records. Payroll data is stored locally on your device, and you can optionally sync it to your personal private Google Drive. See our privacy policy for full details." },
        { q: "Do I need to register for UIF?", a: "It depends on hours worked. If your employee works more than 24 hours per month, UIF registration is generally expected. LekkerLedger includes UIF calculations — but always check official guidance for your situation." },
        { q: "Can I use LekkerLedger for one employee only?", a: "Yes! The free Standard plan supports one active employee — perfect for most households." },
        { q: "What does 'Annual Support' include?", a: "Annual Support (R99/year) gives you up to 3 employees, 1 year of archived history, contract generation, and repeat-payroll features. It renews yearly — cancel anytime to stop renewal." },
        { q: "What does the once-off Pro plan include?", a: "Lekker Pro (R299, pay once) gives you unlimited employees, 5 years of archive history, Google Drive sync, and the full legal vault. No recurring fees ever." },
        { q: "Can I export records for uFiling?", a: "Yes — there's a built-in uFiling export tool to generate UIF declarations for submission." },
        { q: "Is this legal advice?", a: "No. LekkerLedger provides tools and general information to help you create compliant records. We are not a law firm. Always verify against official sources for your specific situation." },
        { q: "Can my domestic worker get a copy of the payslip?", a: "Absolutely — you can download the PDF and share it via WhatsApp, email, or print. Clear payslips benefit both employer and employee." },
    ];

    return (
        <section id="faq" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Frequently asked questions
                    </h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((f, i) => (
                        <FAQItem key={i} question={f.q} answer={f.a} showCTA={i === 3 || i === 7} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQItem({ question, answer, showCTA }: { question: string; answer: string; showCTA?: boolean }) {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-left p-5 rounded-xl border border-[var(--border-subtle)] transition-all hover:border-amber-500/30"
                style={{ backgroundColor: "var(--bg-surface)" }}
            >
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{question}</h3>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: "var(--text-muted)" }} />
                </div>
                {open && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {answer}
                    </p>
                )}
            </button>
            {showCTA && (
                <div className="text-center py-2">
                    <Link href="/dashboard">
                        <Button className="h-10 px-5 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-sm">
                            Create your first payslip
                        </Button>
                    </Link>
                </div>
            )}
        </>
    );
}

/* ─── 10. FINAL CTA ──────────────────────────────────────────────────────── */
function FinalCTA() {
    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
            </div>
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center space-y-8">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Clear records. Fair pay. Less admin.
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/dashboard">
                        <Button className="h-13 px-8 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-base shadow-lg shadow-green-600/20">
                            Create your first payslip <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                    <Link href="/pricing">
                        <Button variant="outline" className="h-13 px-8 rounded-xl font-bold text-base">
                            View pricing
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
function Footer() {
    return (
        <footer className="border-t border-[var(--border-subtle)]" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Product</h4>
                        <div className="space-y-2">
                            <Link href="#how-it-works" className="block text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>How it works</Link>
                            <Link href="/pricing" className="block text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>Pricing</Link>
                            <Link href="/calculator" className="block text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>Wage Calculator</Link>
                            <Link href="/rules" className="block text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>Compliance Guide</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Legal</h4>
                        <div className="space-y-2">
                            <Link href="/legal/privacy" className="block text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>Privacy Policy</Link>
                            <Link href="/legal/terms" className="block text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>Terms of Service</Link>
                            <Link href="/legal/refunds" className="block text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>Refund Policy</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Connect</h4>
                        <div className="space-y-2">
                            <a href="mailto:nightshiftlabsza@gmail.com" className="flex items-center gap-2 text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>
                                <Mail className="h-3.5 w-3.5" /> Email Support
                            </a>
                            <a href="https://github.com/nightshiftlabsza" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-amber-600" style={{ color: "var(--text-secondary)" }}>
                                <Github className="h-3.5 w-3.5" /> GitHub
                            </a>
                        </div>
                    </div>
                    <div>
                        <Link href="/" className="block mb-4">
                            <Image src="/brand/logo-light.png" alt="LekkerLedger" width={120} height={30} className="h-8 w-auto block dark:hidden" />
                            <Image src="/brand/logo-dark.png" alt="LekkerLedger" width={120} height={30} className="h-8 w-auto hidden dark:block" />
                        </Link>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            Crafted by Nightshift Labs 🇿🇦<br />
                            South African domestic employment records, done properly.
                        </p>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>© 2026 LekkerLedger. All rights reserved.</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>General information, not legal advice.</p>
                </div>
            </div>
        </footer>
    );
}

/* ─── STICKY MOBILE CTA ──────────────────────────────────────────────────── */
function StickyMobileCTA() {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past 600px (past hero)
            setVisible(window.scrollY > 600);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between gap-3 safe-area-bottom">
            <Link href="/pricing" className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Pricing
            </Link>
            <Link href="/dashboard" className="flex-1 max-w-xs">
                <Button className="w-full h-11 rounded-xl bg-[var(--green-600,#16a34a)] hover:bg-[var(--green-700,#15803d)] text-white font-bold text-sm">
                    Create your first payslip
                </Button>
            </Link>
        </div>
    );
}
