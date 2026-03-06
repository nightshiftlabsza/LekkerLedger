"use client";

import * as React from "react";
import Link from "next/link";
import {
    Check, ChevronDown, ChevronRight, Shield, FileText, Users,
    CloudOff, HardDrive, ArrowRight, Menu, X,
    FolderSync, ClipboardCheck,
    Calendar, Download, AlertCircle, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNMWForDate } from "@/lib/legal/registry";
import { Logo } from "@/components/ui/logo";
import { PLANS, PLAN_ORDER, type BillingCycle, getPlanDisplayPrice, getPlanPeriodLabel, getPlanPrice } from "@/src/config/plans";

/* ═══════════════════════════════════════════════════════════════════════════
 * MARKETING HOMEPAGE — follows Audit A §4 wireframe exactly:
 *   1. MarketingHeader  2. Hero  3. TrustStrip  4. HowItWorks
 *   5. Guardrails  6. FeatureGrid  7. PrivacyExplainer
 *   8. PricingSummary  9. FAQAccordion  10. FinalCTA + Footer
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function HomePage() {
    const nmw = getNMWForDate(new Date());

    return (
        <div className="min-h-screen flex flex-col selection:bg-amber-200" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <Hero nmw={nmw} />
                <TrustStrip />
                <HowItWorks />
                <ProductTour />
                <Guardrails nmw={nmw} />
                <FeatureGrid />
                <PrivacyExplainer />
                <PricingSummary />
                <FAQPreview />
            </main>
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
        <header className="sticky top-0 z-50 bg-[color:color-mix(in_srgb,var(--surface-1)_94%,white_6%)] backdrop-blur-md shadow-sm border-b border-[var(--border)]/90">
            <div className="content-container-wide px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[4.75rem] gap-6">
                {/* Logo */}
                <Link
                    href="/"
                    className="inline-flex items-center rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-raised)] px-3 py-2 shadow-[0_8px_22px_rgba(16,24,40,0.05)] outline-none transition-all hover:border-[var(--primary)]/20 hover:shadow-[0_12px_26px_rgba(16,24,40,0.08)]"
                >
                    <Logo
                        iconClassName="h-10 w-10 sm:h-11 sm:w-11"
                        textClassName="text-[1.2rem] sm:text-[1.32rem]"
                        className="gap-2.5"
                    />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
                    {links.map(l => (
                        <Link key={l.href} href={l.href} className="text-[13px] font-semibold transition-colors hover:text-[var(--primary)]" style={{ color: "var(--text-muted)" }}>
                            {l.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden lg:flex items-center gap-3">
                    <Link href="/open-app" className="text-[13px] font-semibold transition-colors hover:text-[var(--primary)]" style={{ color: "var(--text-muted)" }}>
                        Open app
                    </Link>
                    <Link href="/onboarding" className="pl-1 border-l border-[var(--border)]/80">
                        <Button className="h-10 px-5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-bold text-sm shadow-[var(--shadow-1)]">
                            Start free
                        </Button>
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--bg)] border border-[var(--border)] shadow-sm active:scale-95 transition-all text-[var(--text)] hover:text-[var(--primary)]"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="lg:hidden border-t border-[var(--border)] px-4 py-4 space-y-2" style={{ backgroundColor: "var(--surface-1)" }}>
                    {links.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--surface-2)]" style={{ color: "var(--text)" }}>
                            {l.label}
                        </Link>
                    ))}
                    <div className="pt-3 space-y-2 border-t border-[var(--border)]">
                        <Link href="/open-app" onClick={() => setMobileOpen(false)}>
                            <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-sm">Open app</Button>
                        </Link>
                        <Link href="/onboarding" onClick={() => setMobileOpen(false)}>
                            <Button className="w-full h-11 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-bold text-sm mt-2">
                                Start free
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
    const demoMonth = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(new Date());
    const assurances = [
        "No central LekkerLedger employee database",
        "Optional backup in your own Google Drive",
        "Works offline once loaded",
    ];
    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-24 w-72 h-72 bg-[var(--accent-subtle)] rounded-full blur-3xl" />
            </div>

            <div className="relative content-container-wide px-4 sm:px-6 lg:px-8 py-14 md:py-20 lg:py-24 pb-20 md:pb-24">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <div className="space-y-7 max-w-[36rem]">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-[0_8px_20px_rgba(16,24,40,0.04)]" style={{ color: "var(--text-muted)" }}>
                            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                            Civic Ledger payroll records
                        </div>

                        <h1 className="type-h1" style={{ color: "var(--text)" }}>
                            Run household payroll properly with <span className="text-[var(--primary)]">payslips, records, and annual paperwork in one calm workspace.</span>
                        </h1>

                        <p className="type-body-large" style={{ color: "var(--text-muted)" }}>
                            Keep the payroll records South African households are expected to keep, without paying the kind of monthly fee usually charged by fully managed payroll services or scrambling later when paperwork is requested.
                        </p>

                        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[0_18px_38px_rgba(16,24,40,0.05)]">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] mb-3" style={{ color: "var(--text-muted)" }}>
                                Privacy and storage
                            </p>
                            <ul className="grid gap-3 sm:grid-cols-3">
                                {assurances.map((t, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]">
                                            <Check className="h-3 w-3 text-[var(--primary)] stroke-[2.4px]" />
                                        </span>
                                        <span className="text-sm leading-5" style={{ color: "var(--text)" }}>{t}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Link href="/onboarding">
                                <Button className="h-12 px-7 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-bold text-base shadow-[var(--shadow-2)] transition-all">
                                    Start free <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                            <div className="flex flex-col justify-center gap-2 border-l-0 sm:border-l sm:border-[var(--border)] sm:pl-4">
                                <Link href="/examples" className="text-sm font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
                                    See sample payslip →
                                </Link>
                                <Link href="/legal/privacy" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1">
                                    How your data is stored →
                                </Link>
                            </div>
                        </div>

                        <p className="text-xs font-medium max-w-lg" style={{ color: "var(--text-muted)" }}>
                            Free works locally in one browser or device. Paid plans work best when connected to Google so your records can travel with you while staying private from LekkerLedger.
                        </p>
                    </div>

                    {/* Right: Document preview */}
                    <div className="hidden lg:block relative">
                        <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(0,122,77,0.08),transparent_48%)] pointer-events-none" />
                        <div className="relative rounded-[28px] overflow-hidden shadow-[0_34px_80px_rgba(16,24,40,0.14)] border border-[var(--border)] bg-[var(--surface-1)]">
                            <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>Monthly payroll</p>
                                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Document preview</p>
                                </div>
                                <div className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                                    Ledger file
                                </div>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* Mini payslip preview */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Payslip</p>
                                        <p className="text-lg font-black" style={{ color: "var(--text)" }}>{demoMonth}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-[var(--primary)]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-muted)" }}>Employee</span>
                                        <span className="font-bold" style={{ color: "var(--text)" }}>Thandi M.</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-muted)" }}>Hours worked</span>
                                        <span className="font-mono font-bold" style={{ color: "var(--text)" }}>160</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-muted)" }}>Rate</span>
                                        <span className="font-mono font-bold" style={{ color: "var(--text)" }}>R{nmw.toFixed(2)}/hr</span>
                                    </div>
                                    <div className="border-t border-[var(--border)] pt-2 mt-2 flex justify-between">
                                        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Gross</span>
                                        <span className="text-lg font-black text-[var(--primary)]">R{(nmw * 160).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: "var(--text-muted)" }}>UIF (1%)</span>
                                        <span className="font-mono" style={{ color: "var(--text-muted)" }}>-R{(nmw * 160 * 0.01).toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-[var(--border)] pt-2 flex justify-between">
                                        <span className="font-bold" style={{ color: "var(--text)" }}>Net Pay</span>
                                        <span className="text-xl font-black text-[var(--primary)]">R{(nmw * 160 * 0.99).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--primary)]">Sample layout</span>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--primary)]">UIF Included</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating contract card */}
                        <div className="absolute -bottom-10 -left-10 p-4 rounded-xl shadow-xl border border-[var(--border)] max-w-[200px] z-10" style={{ backgroundColor: "var(--surface-1)" }}>
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-[var(--primary)]" />
                                <span className="text-xs font-bold" style={{ color: "var(--text)" }}>Contract ready</span>
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
        { icon: HardDrive, text: "Local-first storage" },
        { icon: FolderSync, text: "Backup in your own Google Drive" },
        { icon: Shield, text: "POPIA-aware handling" },
        { icon: Check, text: "14-day refund policy" },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] px-5 py-5 shadow-[var(--shadow-1)] sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="max-w-lg">
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Built for trust
                            </p>
                            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Payroll records stay with you: on your device by default, with optional private backup in your own Google Drive when you want continuity across devices.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                        {badges.map((b, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2">
                                    <b.icon className="h-3.5 w-3.5 text-[var(--primary)]" />
                                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{b.text}</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/trust" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                            See trust details <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
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
        <section id="how-it-works" className="relative" style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                        Clear household paperwork shouldn&apos;t cost what a managed payroll service costs.
                    </h2>
                    <p className="text-base mt-4" style={{ color: "var(--text-muted)" }}>
                        Run monthly payroll, keep employee records tidy, and stay ready for annual paperwork without paying the fees of a fully managed payroll service.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {steps.map((s, i) => (
                        <div key={i} className="relative p-6 rounded-2xl border border-[var(--border)] transition-all hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5" style={{ backgroundColor: "var(--surface-1)" }}>
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                                <span className="text-base font-black text-[var(--primary)]">{s.num}</span>
                            </div>
                            <h3 className="text-base font-bold mb-2" style={{ color: "var(--text)" }}>{s.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                            {i < 3 && <ChevronRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-300" />}
                        </div>
                    ))}
                </div>


            </div>
        </section>
    );
}

/* ─── 4.5 PRODUCT TOUR ───────────────────────────────────────────────────── */
function ProductTour() {
    const panels = [
        {
            eyebrow: "Monthly view",
            title: "See what is done, what still needs attention, and what is ready to export.",
            body: "The dashboard works like a calm task hub for household payroll instead of a generic admin app.",
            href: "/open-app",
            cta: "Open the app",
            accent: "bg-[var(--primary)]/10 text-[var(--primary)]",
        },
        {
            eyebrow: "Records and documents",
            title: "Move from payroll entry to payslips, exports, and employee history without hunting through menus.",
            body: "The main product areas are visible and connected, so people can understand what LekkerLedger actually does before they sign up.",
            href: "/examples",
            cta: "See sample documents",
            accent: "bg-[var(--accent-subtle)] text-[var(--primary)]",
        },
    ];

    return (
        <section style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-20 sm:px-6 md:py-24 lg:px-8">
                <div className="mx-auto mb-14 max-w-2xl text-center">
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                        See the product before you commit.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        A homepage should show the product, not only describe it. These previews show the task hub, payroll review flow, and record areas people usually want to inspect first.
                    </p>
                </div>

                <div className="space-y-8">
                    <div className="grid gap-8 rounded-[32px] border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-1)] xl:grid-cols-[0.92fr_1.08fr] xl:items-center xl:p-8">
                        <div className="max-w-xl space-y-5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${panels[0].accent}`}>
                                {panels[0].eyebrow}
                            </span>
                            <h3 className="text-[clamp(1.7rem,2.2vw,2.3rem)] font-semibold leading-tight font-[family:var(--font-serif)]" style={{ color: "var(--text)" }}>
                                {panels[0].title}
                            </h3>
                            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                {panels[0].body}
                            </p>
                            <Link href={panels[0].href} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                                {panels[0].cta} <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="space-y-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>March payroll</p>
                                    <p className="mt-1 text-lg font-black" style={{ color: "var(--text)" }}>Household dashboard</p>
                                </div>
                                <span className="rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                                    2 tasks left
                                </span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                                {[
                                    ["Employees", "3 active"],
                                    ["This month", "Review stage"],
                                    ["Archive", "Up to date"],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>{label}</p>
                                        <p className="mt-2 text-sm font-bold" style={{ color: "var(--text)" }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                {[
                                    "Finish Nomsa's payslip inputs",
                                    "Review UIF totals before export",
                                    "Download March PDF pack",
                                ].map((task) => (
                                    <div key={task} className="flex items-center gap-3">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{task}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8 rounded-[32px] border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-1)] xl:grid-cols-[0.92fr_1.08fr] xl:items-center xl:p-8">
                        <div className="max-w-xl space-y-5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${panels[1].accent}`}>
                                {panels[1].eyebrow}
                            </span>
                            <h3 className="text-[clamp(1.7rem,2.2vw,2.3rem)] font-semibold leading-tight font-[family:var(--font-serif)]" style={{ color: "var(--text)" }}>
                                {panels[1].title}
                            </h3>
                            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                {panels[1].body}
                            </p>
                            <Link href={panels[1].href} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                                {panels[1].cta} <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>Payroll run</p>
                                        <p className="mt-1 text-base font-black" style={{ color: "var(--text)" }}>Payslip review</p>
                                    </div>
                                    <FileText className="h-5 w-5 text-[var(--primary)]" />
                                </div>
                                <div className="mt-4 space-y-3">
                                    {[
                                        ["Gross pay", "R4,836.80"],
                                        ["UIF", "R48.37"],
                                        ["Net pay", "R4,788.43"],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex items-center justify-between border-b border-[var(--border)]/70 pb-2 text-sm last:border-b-0 last:pb-0">
                                            <span style={{ color: "var(--text-muted)" }}>{label}</span>
                                            <span className="font-mono font-bold" style={{ color: "var(--text)" }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5 text-[var(--primary)]" />
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Employee record</p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rate, leave, start date, document history</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                                    <div className="flex items-center gap-3">
                                        <Download className="h-5 w-5 text-[var(--primary)]" />
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Annual paperwork</p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>uFiling export, COIDA pack, archived PDFs</p>
                                        </div>
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

/* ─── 5. GUARDRAILS ───────────────────────────────────────────────────────── */
function Guardrails({ nmw }: { nmw: number }) {
    const items = [
        `Minimum wage check — current rate R${nmw.toFixed(2)}/hr (as of 1 Mar 2026)`,
        "COIDA registration reminder — mandatory for all domestic workers from 2026",
        "UIF threshold reminder — if your employee works more than 24 hours/month",
        "Payslip field checklist — what a complete payslip should include",
        "Archive reminders — keep statements/records for at least 3 years",
        "Public holiday & Sunday rate reminders",
    ];

    return (
        <section style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 max-w-lg">
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>
                            Guardrails that help you stay consistent.
                        </h2>
                        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            We&apos;re not a law firm. We help you follow common domestic employment requirements with clearer records.
                        </p>

                        <ul className="space-y-3">
                            {items.map((t, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="h-4 w-4 text-[var(--primary)] shrink-0 mt-1 stroke-[3px]" />
                                    <span className="text-sm" style={{ color: "var(--text)" }}>{t}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                General information, not legal advice. Always check official guidance for your situation.
                            </p>
                        </div>

                        <Link href="/rules" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary)]">
                            Read the compliance guide <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* Compliance checklist card visual */}
                    <div className="hidden lg:block">
                        <div className="p-8 rounded-2xl border border-[var(--border)] shadow-xl" style={{ backgroundColor: "var(--surface-1)" }}>
                            <div className="flex items-center gap-3 mb-6">
                                <ClipboardCheck className="h-5 w-5 text-[var(--primary)]" />
                                <h3 className="type-h4" style={{ color: "var(--text)" }}>Monthly checks (built-in)</h3>
                            </div>
                            <div className="space-y-3">
                                {["Hourly rate ≥ NMW ✓", "UIF deduction calculated ✓", "Pay period dates set ✓", "Employee details complete ✓", "Leave balance tracked ✓"].map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "var(--surface-2)" }}>
                                        <div className="h-5 w-5 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
                                            <Check className="h-3 w-3 text-[var(--primary)] stroke-[3px]" />
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{c}</span>
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
        {
            icon: FileText,
            eyebrow: "Monthly payroll",
            title: "Run the full monthly payslip flow in one place.",
            desc: "Track hours, totals, deductions, pay periods, and ready-to-share payslip PDFs without rebuilding the same records every month.",
            points: ["Pay periods and payslip PDFs", "Clear totals and deductions"],
        },
        {
            icon: ClipboardCheck,
            eyebrow: "Employee records",
            title: "Keep contracts and supporting records together.",
            desc: "Store the core employment details households usually need, from BCEA-aligned contracts to searchable employee paperwork and history.",
            points: ["Contract generator", "Employee file and document trail"],
        },
        {
            icon: Calendar,
            eyebrow: "Leave and admin",
            title: "Track the admin that usually gets messy later.",
            desc: "Keep annual, sick, and family responsibility leave tidy, with Pro adding deeper admin control like loan tracking and longer history.",
            points: ["Leave tracking", "Loan tracking on Pro"],
        },
        {
            icon: Shield,
            eyebrow: "Compliance and annual paperwork",
            title: "Handle the records behind UIF and COIDA with less guesswork.",
            desc: "Use calm guardrails, uFiling support, and ROE pack preparation to keep the paperwork side organised when it is time to submit or review.",
            points: ["uFiling export", "COIDA ROE support"],
        },
        {
            icon: FolderSync,
            eyebrow: "Storage and archive",
            title: "Keep a tidy record trail on your device and in your Drive.",
            desc: "LekkerLedger keeps payroll records local-first, with optional Google Drive backup and archive depth that grows with your plan.",
            points: ["Local-first storage", "Drive backup and archive history"],
        },
        {
            icon: Users,
            eyebrow: "For growing households",
            title: "Step up when one household becomes several.",
            desc: "Standard covers one household with a small team. Pro is built for multiple households, unlimited employees, and longer-running records.",
            points: ["Up to 3 employees on Standard", "Multi-household and unlimited employees on Pro"],
        },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                        More than a payslip tool. A calm household payroll workspace.
                    </h2>
                    <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        LekkerLedger keeps the monthly payroll flow, employee records, annual paperwork, and supporting documents together, so you are not juggling separate tools later.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="p-6 rounded-2xl border border-[var(--border)] transition-all hover:border-[var(--primary)]/30 hover:shadow-lg" style={{ backgroundColor: "var(--surface-1)" }}>
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                                <f.icon className="h-5 w-5 text-[var(--primary)]" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: "var(--text-muted)" }}>{f.eyebrow}</p>
                            <h3 className="text-base font-bold mb-3 leading-snug" style={{ color: "var(--text)" }}>{f.title}</h3>
                            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
                            <div className="space-y-2">
                                {f.points.map((point) => (
                                    <div key={point} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        <span>{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-8 max-w-5xl mx-auto shadow-xl flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-1 space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                            <Database className="h-4 w-4" /> Documents and annual paperwork
                        </div>
                        <h3 className="type-h3" style={{ color: "var(--text)" }}>Your record trail stays together when it matters.</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            Payslips, contracts, exports, and supporting payroll records live in one searchable place instead of being scattered across chats, folders, and email threads. Standard keeps 12 months accessible, and Pro extends that to 5 years with deeper admin history.
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            That means less scrambling when you need to revisit a payslip, share a contract, prepare UIF paperwork, or pull together annual COIDA information.
                        </p>
                        <Link href="/onboarding" className="inline-block">
                            <Button variant="outline" className="mt-2 h-11 px-6 rounded-xl border-[var(--border)] shadow-sm">Start your workspace</Button>
                        </Link>
                    </div>
                    {/* Visual html depiction of archive */}
                    <div className="flex-1 w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5 shadow-inner space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-2xl -mr-16 -mt-16" />

                        <div className="flex justify-between items-center mb-5 border-b border-[var(--border)] pb-3">
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Database className="h-3.5 w-3.5" /> Vault History
                            </span>
                            <span className="text-xs text-[var(--primary)] font-bold bg-[var(--accent-subtle)] px-2 py-1 rounded">Recent records</span>
                        </div>
                        {[
                            { title: "Recent payslip", type: "PDF copy", date: "28 Feb", icon: FileText },
                            { title: "Earlier payslip", type: "PDF copy", date: "31 Jan", icon: FileText },
                            { title: "BCEA Employment Contract", type: "Signed PDF", date: "15 Jan", icon: ClipboardCheck }
                        ].map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--primary)]/30 transition-colors">
                                <div className="flex items-center gap-3.5">
                                    <div className="h-9 w-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                                        <doc.icon className="h-4 w-4 text-[var(--primary)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{doc.title}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{doc.date} • {doc.type}</p>
                                    </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                    <Download className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── 7. PRIVACY EXPLAINER ────────────────────────────────────────────────── */
function PrivacyExplainer() {
    return (
        <section style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 max-w-lg">
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>
                            Your employee data isn&apos;t stored in a vendor database.
                        </h2>
                        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger is designed so payroll data stays with you — on your device and optionally synced to your own Google Drive.
                        </p>

                        <div className="p-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5">
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                <strong>Honest footnote:</strong> We may collect anonymous usage telemetry (no employee details). Payments are processed by PayStack. We do not store your credit card information.
                            </p>
                        </div>

                        <Link href="/legal/privacy" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary)]">
                            See the privacy model <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* Diagram */}
                    <div className="hidden lg:block">
                        <div className="p-8 rounded-2xl border border-[var(--border)] shadow-xl" style={{ backgroundColor: "var(--surface-1)" }}>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text)" }}>You enter details</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Employee info → payslip data</p>
                                    </div>
                                </div>
                                <div className="ml-6 border-l-2 border-dashed border-[var(--border)] h-6" />
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                                        <HardDrive className="h-6 w-6 text-[var(--primary)]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Stored on your device</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Browser storage / IndexedDB</p>
                                    </div>
                                </div>
                                <div className="ml-6 border-l-2 border-dashed border-[var(--border)] h-6" />
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                                        <FolderSync className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Optional: your Google Drive</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Synced to your own personal folder</p>
                                    </div>
                                </div>
                                <div className="ml-6 border-l-2 border-dashed border-[var(--border)] h-6" />
                                <div className="flex items-center gap-4 opacity-50">
                                    <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                        <CloudOff className="h-6 w-6 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: "var(--text)" }}>LekkerLedger servers</p>
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
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly");
    const homepageBullets: Record<string, { intro?: string; items: string[] }> = {
        free: {
            items: [
                "1 active employee",
                "1 household workspace",
                "Clear payslip flow",
                "ROE copy-ready numbers",
            ],
        },
        standard: {
            items: [
                "Up to 3 active employees",
                "Google Drive backup",
                "Contracts and uFiling export",
                "Annual COIDA ROE pack",
            ],
        },
        pro: {
            intro: "Everything in Standard, plus:",
            items: [
                "Leave and loan tracking",
                "5-year archive and deeper record history",
                "Unlimited employees when your household grows",
                "Multi-household workspace",
            ],
        },
    };
    const comparisonRows = [
        { label: "Active employees", values: { free: "1", standard: "Up to 3", pro: "Unlimited" } },
        { label: "Archive history", values: { free: "3 months", standard: "12 months", pro: "5 years" } },
        { label: "Google backup", values: { free: "No", standard: "Yes", pro: "Yes" } },
        { label: "Contracts + uFiling export", values: { free: "No", standard: "Yes", pro: "Yes" } },
        { label: "Leave + loan tracking", values: { free: "No", standard: "No", pro: "Yes" } },
        { label: "Multi-household workspace", values: { free: "No", standard: "No", pro: "Yes" } },
    ] as const;
    const getEffectiveMonthlyLabel = (planId: "standard" | "pro") => {
        const yearlyPrice = getPlanPrice(planId, "yearly");
        if (!yearlyPrice) return "";
        return `≈ R${(yearlyPrice / 12).toFixed(2)}/month billed yearly`;
    };

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                        Simple payroll and records for domestic employers
                    </p>
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                        Payslips, UIF-ready numbers, and household records in one place.
                    </h2>
                    <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        Start free, then move up only when you need backup, archive depth, or support for more households and employees.
                    </p>
                    <div className="flex justify-center pt-3">
                        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-[var(--shadow-1)]">
                            {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                                <button
                                    key={cycle}
                                    type="button"
                                    onClick={() => setBillingCycle(cycle)}
                                    className="rounded-full px-5 py-2.5 text-sm font-bold transition-all"
                                    style={{
                                        backgroundColor: billingCycle === cycle ? "var(--primary)" : "transparent",
                                        color: billingCycle === cycle ? "#ffffff" : "var(--text-muted)",
                                    }}
                                >
                                    {cycle === "monthly" ? "Monthly" : "Yearly"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {PLAN_ORDER.map((planId) => {
                        const plan = PLANS[planId];
                        const featured = plan.id === "pro";
                        const primaryCycle = plan.id === "free" ? "yearly" : billingCycle;
                        const summary = homepageBullets[plan.id];
                        const paidHref = `/open-app?recommended=google&next=${encodeURIComponent(`/upgrade?plan=${plan.id}&billing=${billingCycle}&pay=1`)}`;
                        return (
                            <div key={plan.id} className={`relative rounded-[24px] border p-6 shadow-[var(--shadow-1)] ${featured ? "border-[var(--primary)]" : "border-[var(--border)]"}`} style={{ backgroundColor: "var(--surface-1)" }}>
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>{plan.label}</p>
                                            <h3 className="mt-2 text-xl font-black" style={{ color: "var(--text)" }}>{plan.bestFor}</h3>
                                        </div>
                                        {plan.badge && (
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${featured ? "bg-[var(--primary)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"}`}>
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                        <div className="flex items-end gap-2">
                                            <span className="text-4xl font-semibold type-mono" style={{ color: "var(--text)" }}>
                                                {getPlanDisplayPrice(plan, primaryCycle)}
                                            </span>
                                            <span className="pb-1 text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                {getPlanPeriodLabel(plan, primaryCycle)}
                                            </span>
                                        </div>
                                        {plan.pricing.yearly && (
                                            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                                                {billingCycle === "yearly"
                                                    ? getEffectiveMonthlyLabel(plan.id as "standard" | "pro")
                                                    : `Or ${getPlanDisplayPrice(plan, "yearly")}/year`}
                                            </p>
                                        )}
                                    </div>

                                    {summary.intro && (
                                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                            {summary.intro}
                                        </p>
                                    )}

                                    <ul className="space-y-2.5">
                                        {summary.items.map((bullet) => (
                                            <li key={bullet} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="border-t border-[var(--border)] pt-4">
                                        {plan.id === "free" ? (
                                            <Link href="/onboarding">
                                                <Button className="w-full h-11 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-bold text-sm">
                                                    Start free
                                                </Button>
                                            </Link>
                                        ) : (
                                            <div className="space-y-2">
                                                <Link href={paidHref}>
                                                    <Button className="w-full h-11 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-bold text-sm">
                                                        Continue with Google to pay
                                                    </Button>
                                                </Link>
                                                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                                    Choose {plan.label}, connect Google, then finish payment from the app with your plan preselected.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
                    <div className="hidden grid-cols-[1.6fr_repeat(3,1fr)] border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4 text-xs font-black uppercase tracking-[0.16em] md:grid" style={{ color: "var(--text-muted)" }}>
                        <div>What changes</div>
                        <div className="text-center">Free</div>
                        <div className="text-center">Standard</div>
                        <div className="text-center">Pro</div>
                    </div>
                    {comparisonRows.map((row) => (
                        <div key={row.label} className="grid gap-4 border-t border-[var(--border)] px-6 py-4 first:border-t-0 md:grid-cols-[1.6fr_repeat(3,1fr)] md:items-center">
                            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{row.label}</div>
                            <div className="flex items-center justify-between text-sm md:block md:text-center" style={{ color: "var(--text-muted)" }}>
                                <span className="font-bold md:hidden" style={{ color: "var(--text)" }}>Free</span>
                                <span>{row.values.free}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm md:block md:text-center" style={{ color: "var(--text-muted)" }}>
                                <span className="font-bold md:hidden" style={{ color: "var(--text)" }}>Standard</span>
                                <span>{row.values.standard}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm md:block md:text-center" style={{ color: "var(--text-muted)" }}>
                                <span className="font-bold md:hidden" style={{ color: "var(--text)" }}>Pro</span>
                                <span>{row.values.pro}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-6 text-center text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                    Built specifically for South African domestic employers.
                </p>

                <div className="text-center mt-8 space-y-3">
                    <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary)]">
                        See full pricing & comparison <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <div>
                        <Link href="/onboarding">
                            <Button className="h-11 px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-bold text-sm">
                                Start free
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── 9. FAQ ACCORDION ───────────────────────────────────────────────────── */
function FAQPreview() {
    const faqs = [
        { q: "Is my employee data stored on LekkerLedger's servers?", a: "No. LekkerLedger doesn't keep a central database of your employee records. Payroll data is stored locally on your device, and paid users can connect Google to keep a private backup in their own Google Drive app data area. Your payroll records stay private from us." },
        { q: "Do I need to register for COIDA?", a: "Yes. Employers of domestic workers generally need to register with the Compensation Fund (COIDA) to cover occupational injuries. This is one of those areas where the legal expectation matters, so it helps to keep the record trail tidy early instead of rebuilding it later." },
        { q: "Do I need to register for UIF?", a: "It depends on hours worked. If your employee works more than 24 hours per month, UIF registration is generally expected. LekkerLedger includes UIF calculations so you are not guessing later, but always check official guidance for your situation." },
        { q: "Can I use LekkerLedger for one employee only?", a: "Yes. Free supports one active employee, Standard supports up to 3, and Pro supports unlimited employees." },
        { q: "What does Standard include?", a: "Standard starts at R29/month or R249/year. It gives you up to 3 active employees, 12 months of archive history, Google Drive backup, contracts, uFiling export, and the annual ROE pack. It is still priced to stay accessible for normal households." },
        { q: "What does Pro include?", a: "Pro starts at R49/month or R399/year. It gives you everything in Standard, plus leave and loan tracking, a 5-year archive, and deeper record control for households that want more history and admin depth. It also adds unlimited employees and multi-household support if you need that headroom." },
        { q: "Can I export records for uFiling?", a: "Yes — there's a built-in uFiling export tool to generate UIF declarations for submission." },
        { q: "Is this legal advice?", a: "No. LekkerLedger provides tools and general information to help you keep clearer records. We are not a law firm. Always verify against official sources for your specific situation." },
        { q: "Can my domestic worker get a copy of the payslip?", a: "Absolutely — you can download the PDF and share it via WhatsApp, email, or print. Clear payslips benefit both employer and employee." },
    ];

    return (
        <section id="faq" style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                <div className="text-center mb-16">
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                        Frequently asked questions
                    </h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((f, i) => (
                        <FAQItem key={i} question={f.q} answer={f.a} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-left p-5 rounded-xl border border-[var(--border)] transition-all hover:border-[var(--primary)]/30"
                style={{ backgroundColor: "var(--surface-1)" }}
            >
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>{question}</h3>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: "var(--text-muted)" }} />
                </div>
                {open && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {answer}
                    </p>
                )}
            </button>

        </>
    );
}


