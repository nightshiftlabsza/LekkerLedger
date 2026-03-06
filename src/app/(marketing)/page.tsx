"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowRight,
    Calendar,
    Check,
    ChevronDown,
    FileText,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculatePayslip } from "@/lib/calculator";
import { getNMWForDate } from "@/lib/legal/registry";
import type { Employee, PayslipInput } from "@/lib/schema";
import { PLANS, PLAN_ORDER, type BillingCycle, getPlanPricePresentation } from "@/config/plans";
import { MarketingHeader } from "../../../components/layout/marketing-header";

const TRUST_SIGNALS = [
    "No central LekkerLedger employee database",
    "Optional backup in your own Google Drive",
    "14-day refund policy",
    "Built for South African households",
] as const;

const SAMPLE_FIGURE_GRID = "grid grid-cols-[minmax(0,1fr)_3.75rem_5.5rem_6rem] gap-x-4 sm:grid-cols-[minmax(0,1fr)_5rem_6.75rem_7rem]";

function formatRand(value: number) {
    return `R ${value.toFixed(2)}`;
}

function formatIdNumber(idNumber: string) {
    if (idNumber.length !== 13) {
        return idNumber;
    }

    return `${idNumber.slice(0, 6)} ${idNumber.slice(6, 10)} ${idNumber.slice(10)}`;
}

function buildHomepageSample(referenceDate: Date) {
    const payPeriodStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const payPeriodEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    const hourlyRate = getNMWForDate(payPeriodEnd);

    const employee: Employee = {
        id: "sample-zanele-khumalo",
        householdId: "sample-household",
        name: "Zanele Khumalo",
        idNumber: "9002150836082",
        role: "Domestic Worker",
        hourlyRate,
        phone: "",
        startDate: payPeriodStart.toISOString(),
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        frequency: "Monthly",
    };

    const payslip: PayslipInput = {
        id: "sample-payslip-march",
        householdId: "sample-household",
        employeeId: employee.id,
        payPeriodStart,
        payPeriodEnd,
        ordinaryHours: 176,
        overtimeHours: 0,
        sundayHours: 0,
        publicHolidayHours: 0,
        daysWorked: 22,
        shortFallHours: 0,
        hourlyRate,
        includeAccommodation: false,
        accommodationCost: 0,
        otherDeductions: 0,
        createdAt: payPeriodEnd,
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
    };

    const monthLabel = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(payPeriodEnd);
    const periodLabel = `${payPeriodStart.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} - ${payPeriodEnd.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`;

    return {
        employer: {
            name: "Nomsa Dlamini",
            address: "18 Acacia Avenue, Northcliff, Johannesburg, 2195",
        },
        employee,
        payslip,
        breakdown: calculatePayslip(payslip),
        monthLabel,
        periodLabel,
        leaveDaysRemaining: 4.5,
    };
}

export default function HomePage() {
    const referenceDate = new Date();

    return (
        <div className="min-h-screen flex flex-col selection:bg-amber-200" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <Hero sample={buildHomepageSample(referenceDate)} />
                <HowItWorks />
                <WhyPeoplePay />
                <PricingPreview />
                <FAQPreview />
            </main>
        </div>
    );
}

function Hero({ sample }: { sample: ReturnType<typeof buildHomepageSample> }) {
    return (
        <section className="relative overflow-hidden border-b border-[var(--border)]" style={{ backgroundColor: "var(--bg)" }}>
            <div className="absolute inset-x-0 top-24 h-px bg-[var(--border)]" />

            <div className="relative content-container-wide px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,34rem)_minmax(24rem,1fr)] 2xl:grid-cols-[minmax(0,34rem)_minmax(28rem,40rem)_minmax(16rem,20rem)] 2xl:items-start">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]">
                            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                            Household payroll records
                        </div>

                        <div className="max-w-[34rem] space-y-4">
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Run household payroll clearly, keep payslips on record, and come back later for annual paperwork.
                            </h1>
                            <p className="type-body-large max-w-[34rem]" style={{ color: "var(--text-muted)" }}>
                                LekkerLedger gives South African households one calm place for monthly pay runs, document history, and the records you may need later.
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
                                    See full pricing
                                </Link>
                                <Link href="/legal/privacy" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]">
                                    How storage works
                                </Link>
                            </div>
                        </div>

                        <p className="max-w-[34rem] text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                            Start free with basic payslips. Upgrade when you need proper records, private backup, or more household headroom.
                        </p>
                    </div>

                    <SamplePayslipCard sample={sample} />

                    <HeroTrustRail className="hidden gap-3 2xl:grid" />
                </div>

                <HeroTrustRail className="mt-6 grid gap-3 sm:grid-cols-2 2xl:hidden" />
            </div>
        </section>
    );
}

function HeroTrustRail({ className = "" }: { className?: string }) {
    return (
        <div className={className}>
            {TRUST_SIGNALS.map((item) => (
                <div key={item} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4 shadow-[var(--shadow-1)]">
                    <div className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                        <p className="text-sm leading-6" style={{ color: "var(--text)" }}>
                            {item}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function SamplePayslipCard({ sample }: { sample: ReturnType<typeof buildHomepageSample> }) {
    return (
        <div className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[0_20px_50px_rgba(16,24,40,0.10)]">
            <div
                className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"
                style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.10) 0%, rgba(196, 122, 28, 0.08) 100%)" }}
            >
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                        LekkerLedger
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                        Sample payslip
                    </p>
                </div>
                <p
                    className="rounded-full border border-[var(--focus)]/20 bg-white/70 px-3 py-1.5 text-xs font-semibold shadow-sm"
                    style={{ color: "var(--text)" }}
                >
                    {sample.monthLabel}
                </p>
            </div>

            <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
                    <div>
                        <h2 className="font-[family:var(--font-serif)] text-2xl font-semibold" style={{ color: "var(--text)" }}>
                            PAYSLIP
                        </h2>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                            Household payroll record
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Pay period
                        </p>
                        <p className="mt-2 rounded-full bg-[var(--accent-subtle)] px-3 py-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
                            {sample.periodLabel}
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <SamplePartyBlock
                        label="Employer"
                        value={sample.employer.name}
                        detail={<p>{sample.employer.address}</p>}
                    />
                    <SamplePartyBlock
                        label="Employee"
                        value={sample.employee.name}
                        detail={
                            <>
                                <p>{sample.employee.role}</p>
                                <p className="tabular-nums">ID {formatIdNumber(sample.employee.idNumber)}</p>
                            </>
                        }
                    />
                    <SamplePartyBlock
                        label="Month"
                        value={sample.monthLabel}
                        detail={
                            <>
                                <p>{sample.payslip.daysWorked} days worked</p>
                                <p style={{ color: "var(--primary)" }}>{sample.leaveDaysRemaining.toFixed(1)} leave days remaining</p>
                            </>
                        }
                    />
                </div>

                <div
                    className="mt-6 rounded-[22px] border border-[var(--border)] p-4"
                    style={{ background: "linear-gradient(180deg, rgba(255, 252, 248, 0.96) 0%, rgba(0, 122, 77, 0.03) 100%)" }}
                >
                    <div className={`${SAMPLE_FIGURE_GRID} border-b border-[var(--border)] pb-3 text-[10px] font-black uppercase tracking-[0.16em]`} style={{ color: "var(--text-muted)" }}>
                        <span>Description</span>
                        <span className="text-right">Hours</span>
                        <span className="text-right">Rate</span>
                        <span className="text-right">Total</span>
                    </div>

                    <div className="space-y-1 pt-2">
                        <SampleFigureRow
                            label="Ordinary Hours"
                            hours={`${sample.payslip.ordinaryHours}h`}
                            rate={`${formatRand(sample.breakdown.hourlyRate)}/hr`}
                            total={formatRand(sample.breakdown.ordinaryPay)}
                        />
                        <SampleFigureRow label="Gross Earnings" hours="" rate="" total={formatRand(sample.breakdown.grossPay)} bold />
                        <SampleFigureRow label="UIF (Employee 1%)" hours="" rate="" total={`- ${formatRand(sample.breakdown.deductions.uifEmployee)}`} />
                        <SampleFigureRow label="Total Deductions" hours="" rate="" total={formatRand(sample.breakdown.deductions.total)} bold />
                    </div>
                </div>

                <div
                    className="mt-4 rounded-[22px] border border-[var(--focus)]/20 p-4"
                    style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.08) 0%, rgba(196, 122, 28, 0.08) 100%)" }}
                >
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Net amount paid
                            </p>
                            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                Based on the payroll details above.
                            </p>
                        </div>
                        <p className="font-[family:var(--font-serif)] text-3xl font-semibold tabular-nums" style={{ color: "var(--primary-pressed)" }}>
                            {formatRand(sample.breakdown.netPay)}
                        </p>
                    </div>
                </div>

                <p className="mt-4 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                    Sample only. Your real payslips are generated from your own payroll records.
                </p>
            </div>
        </div>
    );
}

function SamplePartyBlock({ label, value, detail }: { label: string; value: string; detail?: React.ReactNode }) {
    return (
        <div
            className="rounded-[18px] border border-[var(--border)] px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            style={{ background: "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(0, 122, 77, 0.03) 100%)" }}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                {value}
            </p>
            {detail ? (
                <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {detail}
                </div>
            ) : null}
        </div>
    );
}

function SampleFigureRow({ label, hours, rate, total, bold = false }: { label: string; hours: string; rate: string; total: string; bold?: boolean }) {
    return (
        <div className={`${SAMPLE_FIGURE_GRID} items-baseline py-2 text-[13px] sm:text-sm`}>
            <span className={`pr-2 ${bold ? "font-semibold" : ""}`} style={{ color: bold ? "var(--text)" : "var(--text-muted)" }}>
                {label}
            </span>
            <span className="text-right tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {hours}
            </span>
            <span className="text-right tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {rate}
            </span>
            <span className={`text-right tabular-nums whitespace-nowrap ${bold ? "font-semibold" : ""}`} style={{ color: "var(--text)" }}>
                {total}
            </span>
        </div>
    );
}

function HowItWorks() {
    const steps = [
        {
            icon: Users,
            title: "Add your worker once",
            body: "Save the household worker details and pay basics you want to reuse each month.",
        },
        {
            icon: Calendar,
            title: "Run the month clearly",
            body: "Check hours, leave, deductions, and UIF before you generate the payslip.",
        },
        {
            icon: FileText,
            title: "Keep the paperwork ready",
            body: "Return later for older periods, document history, contracts, and annual paperwork.",
        },
    ];

    return (
        <section id="how-it-works" style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="max-w-3xl space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                        How it works
                    </p>
                    <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                        Keep the month clear, then keep the records ready.
                    </h2>
                    <p className="max-w-[40rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                        LekkerLedger is built to help a household employer set things up once, run payroll calmly, and keep the record trail tidy.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {steps.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <div key={step.title} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                                <div className="flex items-start gap-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)]">
                                        <Icon className="h-5 w-5 text-[var(--primary)]" />
                                    </span>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                            Step {index + 1}
                                        </p>
                                        <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>
                                            {step.title}
                                        </h3>
                                        <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                            {step.body}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function WhyPeoplePay() {
    const reasons = [
        {
            title: "Proper records, not just payslips",
            body: "Standard adds leave tracking, contracts, document history, and annual exports for households that want the paperwork done properly.",
        },
        {
            title: "Private backup in your own account",
            body: "Paid plans can back up into your own Google Drive app-data area so you are not relying on one browser or one device.",
        },
        {
            title: "More headroom when the admin grows",
            body: "Pro adds multiple households, unlimited employees, and a longer archive when you need more control.",
        },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:items-start">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Why households upgrade
                        </p>
                        <h2 className="type-h2 max-w-[14ch]" style={{ color: "var(--text)" }}>
                            Standard is where proper records start.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            Free is the starter path for basic payslips. Standard and Pro are for households that want paperwork, backup, and cleaner annual admin.
                        </p>
                        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                            <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                Upgrade because the records matter, not because a free watermark forces you.
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
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("yearly");
    const homepageBullets: Record<string, string[]> = {
        free: ["1 active employee", "Basic monthly payslips", "Stored on this device"],
        standard: ["Up to 3 active employees", "Leave, contracts, and documents", "Private Google Drive backup"],
        pro: ["Unlimited employees", "Multi-household workspace", "5-year archive"],
    };

    return (
        <section style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Pricing preview
                        </p>
                        <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                            Payslips and paperwork for domestic workers, made simple.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            Start free with basic payslips. Upgrade for contracts, record history, reminders, and private backup in your own Google Drive.
                        </p>
                    </div>

                    <div className="space-y-2">
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
                        <p className="text-right text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                            Yearly lowers the monthly cost.
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {PLAN_ORDER.map((planId) => {
                        const plan = PLANS[planId];
                        const featured = plan.id === "standard";
                        const cycle = plan.id === "free" ? "monthly" : billingCycle;
                        const pricePresentation = getPlanPricePresentation(plan, cycle);

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
                                                {pricePresentation.primaryPrice}
                                            </span>
                                            {pricePresentation.periodLabel ? (
                                                <span className="pb-1 text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                    {pricePresentation.periodLabel}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                                            {pricePresentation.helperText}
                                        </p>
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
                                        <Link
                                            href="/pricing"
                                            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm font-bold text-[var(--text)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                        >
                                            See plan detail
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-start sm:justify-end">
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
            q: "Can I start with one employee?",
            a: "Yes. Free supports one active employee and basic payslips, so you can try the monthly flow before paying.",
        },
        {
            q: "What changes when I upgrade?",
            a: "Standard adds leave tracking, contracts, documents, backup, and annual exports. Pro adds multiple households, unlimited employees, and longer archive access.",
        },
        {
            q: "Do I need to know all the rules before I sign up?",
            a: "No. You can start by getting the monthly record-keeping under control and read more later if a question comes up.",
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
                        Short answers to common signup hesitations.
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





