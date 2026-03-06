"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowRight,
    Calendar,
    Check,
    ChevronDown,
    ClipboardCheck,
    FileText,
    FolderSync,
    HardDrive,
    Shield,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNMWForDate } from "@/lib/legal/registry";
import { PLANS, PLAN_ORDER, type BillingCycle, getPlanDisplayPrice, getPlanPeriodLabel } from "@/src/config/plans";
import { MarketingHeader } from "../../../components/layout/marketing-header";

export default function HomePage() {
    const nmw = getNMWForDate(new Date());

    return (
        <div className="min-h-screen flex flex-col selection:bg-amber-200" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <Hero nmw={nmw} />
                <TrustBand />
                <HowItWorks nmw={nmw} />
                <WhyPeoplePay />
                <PricingPreview />
                <FAQPreview />
            </main>
        </div>
    );
}

function Hero({ nmw }: { nmw: number }) {
    const demoMonth = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(new Date());

    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-28 right-0 h-72 w-72 rounded-full bg-[var(--primary)]/6 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[var(--accent-subtle)] blur-3xl" />
            </div>

            <div className="relative content-container-wide px-4 py-14 sm:px-6 md:py-20 lg:px-8 lg:py-24">
                <div className="grid gap-10 xl:grid-cols-[minmax(0,36rem)_minmax(24rem,32rem)] xl:justify-between xl:gap-14">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-[0_8px_20px_rgba(16,24,40,0.04)]">
                            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                            Household payroll records
                        </div>

                        <div className="max-w-[34rem] space-y-4">
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                One calm place to run household payroll, keep records, and finish annual paperwork.
                            </h1>
                            <p className="type-body-large max-w-[34rem]" style={{ color: "var(--text-muted)" }}>
                                LekkerLedger helps South African households keep payslips, monthly records, and annual documents tidy without turning payroll into a project.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Link href="/onboarding">
                                <Button className="h-12 rounded-xl bg-[var(--primary)] px-7 text-base font-bold text-white shadow-[var(--shadow-2)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]">
                                    Start free <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="flex flex-col gap-2 border-[var(--border)] sm:border-l sm:pl-4">
                                <Link href="/pricing" className="text-sm font-semibold text-[var(--primary)] hover:underline">
                                    See pricing
                                </Link>
                                <Link href="/legal/privacy" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]">
                                    How storage works
                                </Link>
                            </div>
                        </div>

                        <p className="max-w-[34rem] text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                            Good for one employee on Free, with paid plans adding Google Drive backup, deeper history, and support for bigger households.
                        </p>
                    </div>

                    <div className="grid gap-4 xl:pt-2">
                        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_28px_70px_rgba(16,24,40,0.12)]">
                            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-5 py-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                        Monthly payroll
                                    </p>
                                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                        {demoMonth}
                                    </p>
                                </div>
                                <div className="rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                    Live preview
                                </div>
                            </div>

                            <div className="grid gap-5 p-5 md:grid-cols-[1.2fr_0.9fr]">
                                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                Payslip
                                            </p>
                                            <p className="mt-1 text-lg font-black" style={{ color: "var(--text)" }}>
                                                Thandi M.
                                            </p>
                                        </div>
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                                            <FileText className="h-5 w-5 text-[var(--primary)]" />
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-2.5 text-sm">
                                        <DataRow label="Hours worked" value="160" />
                                        <DataRow label="Rate" value={`R${nmw.toFixed(2)}/hr`} />
                                        <DataRow label="Gross pay" value={`R${(nmw * 160).toFixed(2)}`} strong />
                                        <DataRow label="UIF (1%)" value={`R${(nmw * 160 * 0.01).toFixed(2)}`} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <PreviewNote
                                        icon={Calendar}
                                        title="This month"
                                        body="Start a pay period, check each employee, then generate PDFs."
                                    />
                                    <PreviewNote
                                        icon={ClipboardCheck}
                                        title="Annual records"
                                        body="Keep contract, UIF, and ROE paperwork in the same workspace."
                                    />
                                    <PreviewNote
                                        icon={Users}
                                        title="Household scale"
                                        body="Stay simple for one worker or add more when your household grows."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <SmallChip icon={HardDrive} text="Stored on your device" />
                            <SmallChip icon={FolderSync} text="Optional Google Drive backup" />
                            <SmallChip icon={Shield} text="Calm, precise trust language" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function DataRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className={strong ? "font-black text-[var(--primary)]" : "font-semibold"} style={{ color: strong ? undefined : "var(--text)" }}>
                {value}
            </span>
        </div>
    );
}

function PreviewNote({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
    return (
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                    <Icon className="h-5 w-5 text-[var(--primary)]" />
                </span>
                <div className="space-y-1">
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                        {title}
                    </p>
                    <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                        {body}
                    </p>
                </div>
            </div>
        </div>
    );
}

function SmallChip({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm shadow-[var(--shadow-1)]">
            <Icon className="h-3.5 w-3.5 text-[var(--primary)]" />
            <span style={{ color: "var(--text-muted)" }}>{text}</span>
        </div>
    );
}

function TrustBand() {
    const items = [
        "No central LekkerLedger employee database",
        "Optional backup in your own Google Drive",
        "14-day refund policy",
        "Built for South African households",
    ];

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 pb-6 sm:px-6 md:pb-8 lg:px-8">
                <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-1)] px-5 py-5 shadow-[var(--shadow-1)] sm:px-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="max-w-xl">
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Built for trust
                            </p>
                            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                The homepage keeps the reassurance short. Detailed storage, privacy, pricing, and legal pages stay one click away.
                            </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[36rem]">
                            {items.map((item) => (
                                <div key={item} className="flex items-start gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                    <span className="text-sm leading-5" style={{ color: "var(--text)" }}>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function HowItWorks({ nmw }: { nmw: number }) {
    const steps = [
        {
            title: "Set up your household",
            body: "Add your worker, pay details, and the basics you want to keep consistent month to month.",
        },
        {
            title: "Run this month clearly",
            body: "Check hours, leave, deductions, and UIF before you generate the payslip pack.",
        },
        {
            title: "Keep the record trail tidy",
            body: "Come back for annual paperwork, older periods, and the documents you may need later.",
        },
    ];

    return (
        <section id="how-it-works" style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,28rem)] xl:items-start">
                    <div className="space-y-6">
                        <div className="max-w-2xl space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                How it works
                            </p>
                            <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                                A shorter path from monthly payroll to annual paperwork.
                            </h2>
                            <p className="max-w-[40rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                                The homepage now shows the flow once. Learn the rhythm here, then use pricing, trust, or compliance pages only when you need more detail.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {steps.map((step, index) => (
                                <div key={step.title} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-sm font-black text-[var(--primary)]">
                                            {index + 1}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>
                                                {step.title}
                                            </h3>
                                            <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                                {step.body}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)] xl:sticky xl:top-28">
                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                    One example
                                </p>
                                <h3 className="mt-2 text-xl font-black" style={{ color: "var(--text)" }}>
                                    Monthly payroll snapshot
                                </h3>
                            </div>

                            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                <div className="space-y-3 text-sm">
                                    <DataRow label="National minimum wage" value={`R${nmw.toFixed(2)}/hr`} />
                                    <DataRow label="Typical month" value="160 hours" />
                                    <DataRow label="Payslip ready" value="PDF pack" strong />
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <PreviewNote
                                    icon={FileText}
                                    title="Document output"
                                    body="Download a payslip, keep period history, and return to records when the year-end admin arrives."
                                />
                                <PreviewNote
                                    icon={Shield}
                                    title="Calm guidance"
                                    body="The product points you toward tidy records and expected paperwork without turning the page into a warning wall."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function WhyPeoplePay() {
    const reasons = [
        {
            title: "Backup and continuity",
            body: "Paid plans work best when you want private backup in your own Google account and less risk of losing records with one device.",
        },
        {
            title: "Longer record history",
            body: "Move beyond the light free setup when you want archive depth, annual paperwork support, and easier clean-up later.",
        },
        {
            title: "More household headroom",
            body: "Upgrade only when you need more employees, more than one household, or deeper admin features like leave and loan tracking.",
        },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-start">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Why people pay
                        </p>
                        <h2 className="type-h2 max-w-[14ch]" style={{ color: "var(--text)" }}>
                            Pay only when the records need to do more.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            Free is for getting the basics under control. Paid plans add backup, history, and extra household admin depth without changing the calm workflow.
                        </p>
                        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                            <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                Near payment decisions, the page stays concrete: where records live, who handles payment, what changes when you upgrade, and where to read the refund policy.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {reasons.map((reason) => (
                            <div key={reason.title} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                                <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>
                                    {reason.title}
                                </h3>
                                <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                    {reason.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function PricingPreview() {
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly");
    const homepageBullets: Record<string, string[]> = {
        free: ["1 active employee", "Local-only setup", "Good for getting started"],
        standard: ["Up to 3 active employees", "Google Drive backup", "Contracts and annual ROE pack"],
        pro: ["Unlimited employees", "Leave and loan tracking", "Multi-household workspace"],
    };

    return (
        <section style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Pricing preview
                        </p>
                        <h2 className="type-h2 max-w-[15ch]" style={{ color: "var(--text)" }}>
                            Enough pricing to choose a direction.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            The homepage gives a quick scan. Full comparison detail stays on the pricing page.
                        </p>
                    </div>

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

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {PLAN_ORDER.map((planId) => {
                        const plan = PLANS[planId];
                        const featured = plan.id === "standard";
                        const paidHref = `/open-app?recommended=google&next=${encodeURIComponent(`/upgrade?plan=${plan.id}&billing=${billingCycle}&pay=1`)}`;

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-[24px] border p-5 shadow-[var(--shadow-1)] ${featured ? "border-[var(--primary)]" : "border-[var(--border)]"}`}
                                style={{ backgroundColor: "var(--surface-1)" }}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                {plan.label}
                                            </p>
                                            <h3 className="mt-2 text-xl font-black" style={{ color: "var(--text)" }}>
                                                {plan.bestFor}
                                            </h3>
                                        </div>
                                        {plan.badge && (
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${featured ? "bg-[var(--primary)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"}`}>
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>

                                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                        <div className="flex items-end gap-2">
                                            <span className="text-4xl font-semibold type-mono" style={{ color: "var(--text)" }}>
                                                {getPlanDisplayPrice(plan, plan.id === "free" ? "yearly" : billingCycle)}
                                            </span>
                                            <span className="pb-1 text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                {getPlanPeriodLabel(plan, plan.id === "free" ? "yearly" : billingCycle)}
                                            </span>
                                        </div>
                                    </div>

                                    <ul className="space-y-2.5">
                                        {homepageBullets[plan.id].map((bullet) => (
                                            <li key={bullet} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {plan.id === "free" ? (
                                        <Link href="/onboarding">
                                            <Button className="h-11 w-full rounded-xl bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]">
                                                Start free
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href={paidHref}>
                                            <Button className="h-11 w-full rounded-xl bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]">
                                                Continue with Google to pay
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                        Refunds, plan detail, and full comparison stay on the pricing page.
                    </p>
                    <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline">
                        See full pricing <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

function FAQPreview() {
    const faqs = [
        {
            q: "Is my employee data stored on LekkerLedger's servers?",
            a: "No. LekkerLedger does not keep a central employee database. Records stay on your device by default, with optional backup in your own Google Drive on paid plans.",
        },
        {
            q: "Do I need to register for UIF?",
            a: "If your employee works more than 24 hours per month, UIF registration is generally expected. LekkerLedger helps you keep the numbers tidy, but you should still check official guidance for your situation.",
        },
        {
            q: "Can I use LekkerLedger for just one employee?",
            a: "Yes. Free supports one active employee, and you can move up later if your household needs backup, more history, or more employees.",
        },
        {
            q: "Is this legal advice?",
            a: "No. LekkerLedger provides tools and general guidance to help you keep clear household payroll records. Always verify official rules for your own case.",
        },
    ];

    return (
        <section id="faq" style={{ backgroundColor: "var(--bg)" }}>
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="mb-10 max-w-2xl space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                        FAQ
                    </p>
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                        Short answers to the main signup questions.
                    </h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq) => (
                        <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = React.useState(false);

    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full rounded-xl border border-[var(--border)] p-5 text-left transition-all hover:border-[var(--primary)]/30"
            style={{ backgroundColor: "var(--surface-1)" }}
        >
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {question}
                </h3>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
            </div>
            {open && (
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                    {answer}
                </p>
            )}
        </button>
    );
}
