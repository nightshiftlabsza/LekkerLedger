"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowRight,
    Calendar,
    ChevronDown,
    FileText,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingBillingToggle, MarketingPlanCards } from "@/components/marketing/pricing";
import { calculatePayslip } from "@/lib/calculator";
import { getNMWForDate } from "@/lib/legal/registry";
import type { Employee, PayslipInput } from "@/lib/schema";
import { HOMEPAGE_PRICING_LINK_LABEL, PRICING_PAGE_SUBTITLE, PRICING_PAGE_TITLE } from "@/src/config/pricing-display";
import { useMarketingBillingCycle } from "@/src/lib/use-marketing-billing-cycle";
import { MarketingHeader } from "../../../components/layout/marketing-header";
import { AuthModal } from "@/components/auth/auth-modal";
import { Suspense } from "react";

const SAMPLE_FIGURE_GRID = "grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-2 sm:gap-x-4 sm:grid-cols-[minmax(0,1fr)_5rem_6.75rem_7rem]";

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
        address: "",
        startDate: payPeriodStart.toISOString(),
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        frequency: "Monthly"
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
    const sample = buildHomepageSample(referenceDate);

    return (
        <div className="min-h-screen flex flex-col selection:bg-[var(--accent-subtle)]" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <Hero sample={sample} />
                <HowItWorks />
                <WhatYouKeep />
                <PricingPreview />
                <FAQPreview />
            </main>

            <Suspense fallback={null}>
                <AuthModal />
            </Suspense>
        </div>
    );
}

function Hero({ sample }: { sample: ReturnType<typeof buildHomepageSample> }) {
    return (
        <section className="relative overflow-hidden border-b border-[var(--border)]" style={{ backgroundColor: "var(--bg)" }}>
            <div className="absolute inset-x-0 top-24 h-px bg-[var(--border)]" />

            <div className="relative content-container-wide px-4 py-8 sm:px-6 md:py-10 lg:px-8 lg:py-14">
                <div className="grid gap-10 xl:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] xl:items-center 2xl:gap-16">
                    <div className="max-w-[38rem] space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]">
                            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                            For South African household employers
                        </div>

                        <div className="space-y-4">
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Payslips and household employment records in one place.
                            </h1>
                            <p className="max-w-[34rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                                Track monthly pay, show UIF deductions clearly on payslips, and keep records available when you need them.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link href="/dashboard">
                                <Button className="h-12 rounded-xl bg-[var(--primary)] px-7 text-base font-bold text-white shadow-[var(--shadow-2)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]">
                                    Start free <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <p className="text-xs font-medium leading-6" style={{ color: "var(--text-muted)" }}>
                                Free to start. No account needed. Upgrade for backup and records.
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-[46rem] xl:justify-self-end">

                        <SamplePayslipCard sample={sample} />
                    </div>
                </div>
            </div>
        </section>
    );
}

function SamplePayslipCard({ sample }: { sample: ReturnType<typeof buildHomepageSample> }) {
    return (
        <div className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[0_20px_50px_rgba(16,24,40,0.10)]" data-testid="sample-payslip-card">
            <div className="sm:hidden">
                <div
                    className="border-b border-[var(--border)] px-5 py-4"
                    style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.10) 0%, rgba(196, 122, 28, 0.08) 100%)" }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                                LekkerLedger
                            </p>
                            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
                                Sample payroll record
                            </p>
                        </div>
                        <p className="rounded-full border border-[var(--focus)]/20 bg-[var(--surface-1)] px-3 py-1.5 text-sm font-semibold shadow-sm" style={{ color: "var(--text)" }}>
                            {sample.monthLabel}
                        </p>
                    </div>
                    <p className="mt-3 max-w-[28ch] text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                        A calmer mobile preview: the real document keeps the official layout, but the phone preview focuses on the key figures first.
                    </p>
                </div>

                <div className="space-y-4 p-5">
                    <div className="grid gap-3">
                        <CompactPartyBlock label="Employer" value={sample.employer.name} detail={sample.employer.address} />
                        <CompactPartyBlock label="Employee" value={sample.employee.name} detail={`${sample.employee.role} · ${sample.payslip.daysWorked} days worked`} />
                        <CompactPartyBlock label="Pay period" value={sample.periodLabel} detail={`${sample.leaveDaysRemaining.toFixed(1)} leave days remaining`} />
                    </div>

                    <div className="rounded-[22px] border border-[var(--border)] p-4" style={{ background: "linear-gradient(180deg, rgba(255, 252, 248, 0.96) 0%, rgba(0, 122, 77, 0.03) 100%)" }}>
                        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                            This month
                        </p>
                        <div className="mt-3 space-y-3">
                            <CompactFigureRow label="Ordinary hours" value={`${sample.payslip.ordinaryHours}h @ ${formatRand(sample.breakdown.hourlyRate)}/hr`} />
                            <CompactFigureRow label="Gross earnings" value={formatRand(sample.breakdown.grossPay)} strong />
                            <CompactFigureRow label="UIF deduction" value={`- ${formatRand(sample.breakdown.deductions.uifEmployee)}`} />
                            <CompactFigureRow label="Net pay" value={formatRand(sample.breakdown.netPay)} strong emphasis />
                        </div>
                    </div>

                    <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                        Sample only. Real payslips keep the full official layout when you open or download the document.
                    </p>
                </div>
            </div>

            <div className="hidden sm:block">
                <div
                    className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"
                    style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.10) 0%, rgba(196, 122, 28, 0.08) 100%)" }}
                >
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                            LekkerLedger
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                            Payroll sample
                        </p>
                    </div>
                    <p
                        className="rounded-full border border-[var(--focus)]/20 bg-[var(--surface-1)] px-3 py-1.5 text-xs font-semibold shadow-sm"
                        style={{ color: "var(--text)" }}
                    >
                        {sample.monthLabel}
                    </p>
                </div>

                <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                        <div>
                            <h2 className="font-[family:var(--font-serif)] text-xl font-semibold" style={{ color: "var(--text)" }}>
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

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                        className="mt-4 rounded-[22px] border border-[var(--border)] p-4"
                        style={{ background: "linear-gradient(180deg, rgba(255, 252, 248, 0.96) 0%, rgba(0, 122, 77, 0.03) 100%)" }}
                    >
                        <div className={`${SAMPLE_FIGURE_GRID} border-b border-[var(--border)] pb-2 text-[10px] font-black uppercase tracking-[0.16em]`} style={{ color: "var(--text-muted)" }}>
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
                        className="mt-3 rounded-[22px] border border-[var(--focus)]/20 p-4"
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
                            <p className="font-[family:var(--font-serif)] text-2xl font-semibold tabular-nums" style={{ color: "var(--primary-pressed)" }}>
                                {formatRand(sample.breakdown.netPay)}
                            </p>
                        </div>
                    </div>

                    <p className="mt-4 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                        Sample only. Your real payslips are generated from your own payroll records.
                    </p>
                </div>
            </div>
        </div>
    );
}

function CompactPartyBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                {label}
            </p>
            <p className="mt-2 text-base font-semibold leading-6" style={{ color: "var(--text)" }}>
                {value}
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                {detail}
            </p>
        </div>
    );
}

function CompactFigureRow({
    label,
    value,
    strong = false,
    emphasis = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
    emphasis?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-2 sm:gap-4 border-b border-[var(--border)]/70 pb-3 last:border-b-0 last:pb-0">
            <div>
                <p className="text-sm font-semibold" style={{ color: strong ? "var(--text)" : "var(--text-muted)" }}>
                    {label}
                </p>
            </div>
            <p
                className={`text-right font-[family:var(--font-serif)] text-base sm:text-lg font-semibold tabular-nums ${emphasis ? "text-[var(--primary-pressed)]" : ""}`}
                style={{ color: emphasis ? "var(--primary-pressed)" : "var(--text)" }}
            >
                {value}
            </p>
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
            title: "Add your worker",
            body: "Save the worker’s details and pay setup so it can be reused each month.",
        },
        {
            icon: Calendar,
            title: "Generate the payslip",
            body: "Review hours worked, leave, deductions, and UIF amounts before creating the payslip.",
        },
        {
            icon: FileText,
            title: "Keep the record trail",
            body: "Payslips and related documents stay organised so they’re easy to retrieve later when needed for UIF submissions or other employment paperwork.",
        },
    ];

    return (
        <section id="how-it-works" style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">                <div className="max-w-3xl space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                    How it works
                </p>
                <h2 className="type-h2 max-w-[28ch]" style={{ color: "var(--text)" }}>
                    Set up once. Generate payslips. Keep the records together.
                </h2>
                <p className="max-w-[44rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                    LekkerLedger helps household employers record pay, generate payslips, and keep the employment documents that may be needed later for UIF submissions or other household employment administration.
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

                <div className="mt-10 flex justify-center">
                    <Link href="/rules" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-6 py-3 text-sm font-bold text-[var(--primary)] transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--surface-1)]">
                        View the complete household checklist <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

function WhatYouKeep() {
    const recordTypes = [
        {
            title: "Payslips",
            body: "Monthly pay records showing wages, deductions, and UIF amounts.",
        },
        {
            title: "Contracts",
            body: "Starter templates and saved employment agreements so the employment paperwork stays together.",
        },
        {
            title: "Exports",
            body: "Downloadable records when you need to prepare UIF paperwork or other documentation.",
        },
        {
            title: "History",
            body: "Access older periods and documents without rebuilding records.",
        },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:items-start">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            What you keep
                        </p>
                        <h2 className="type-h2 max-w-[14ch]" style={{ color: "var(--text)" }}>
                            Not just a payslip. Your household record trail.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger ensures your monthly payslips and supporting documents stay together, organized, and ready for any future requirement.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {recordTypes.map((item) => (
                            <div key={item.title} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
                                <h3 className="text-lg font-black" style={{ color: "var(--text)" }}>
                                    {item.title}
                                </h3>
                                <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                    {item.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

import { useInlinePaidPlanCheckout } from "@/components/billing/inline-paid-plan-checkout";

function PricingPreview() {
    const [billingCycle, setBillingCycle] = useMarketingBillingCycle();
    const { startCheckout, loadingPlanId, dialog } = useInlinePaidPlanCheckout({ billingCycle });

    return (
        <section id="pricing-preview" className="scroll-mt-24" style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Pricing preview
                        </p>
                        <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                            {PRICING_PAGE_TITLE}
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            {PRICING_PAGE_SUBTITLE}
                        </p>
                    </div>

                    <MarketingBillingToggle billingCycle={billingCycle} onChange={setBillingCycle} align="right" />
                </div>

                <div className="mt-8">
                    <MarketingPlanCards
                        billingCycle={billingCycle}
                        compact
                        onSelect={startCheckout}
                        isLoadingPlanId={loadingPlanId}
                    />
                </div>

                <div className="mt-8 flex justify-start sm:justify-end">
                    <Link href="/pricing" aria-label="See full pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline">
                        {HOMEPAGE_PRICING_LINK_LABEL} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
            {dialog}
        </section>
    );
}

function FAQPreview() {
    const faqs = [
        {
            q: "Will this help me know what to do each month?",
            a: "Yes. LekkerLedger helps you reuse the same worker details, run the month clearly, and keep the paperwork tidy so you are not starting from scratch every time.",
        },
        {
            q: "What if I am not sure about the rules or worried about making a mistake?",
            a: "You do not need to know everything before you start. LekkerLedger helps you keep the records organised and review the main figures clearly. For unusual situations, verify against official guidance before you rely on the record.",
        },
        {
            q: "Are employee records stored on LekkerLedger servers?",
            a: "Employee records stay on your device by default. Paid plans can add optional end-to-end encrypted cloud sync to keep your records accessible across all your devices.",
        },
        {
            q: "Can I start with one employee, and what changes when I upgrade?",
            a: "Yes. Free supports one active employee and basic payslips, so you can try the monthly flow before paying. Standard adds leave tracking, contracts, documents, backup, and annual exports. Pro adds multiple households, unlimited employees, and longer archive access when you need separate records for more than one home.",
        },
        {
            q: "What happens if I change devices later?",
            a: "Free is simplest on one device. Paid cloud sync lets you restore records instantly on any new browser or device after logging into your LekkerLedger account.",
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
                        Questions households ask before they start.
                    </h2>
                    <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                        Short answers to the practical questions that usually come up before the first monthly run.
                    </p>
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
    return (
        <details
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5 transition-all hover:border-[var(--primary)]/30"
            style={{ backgroundColor: "var(--surface-1)" }}
        >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {question}
                </h3>
                <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            </summary>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                {answer}
            </p>
        </details>
    );
}









