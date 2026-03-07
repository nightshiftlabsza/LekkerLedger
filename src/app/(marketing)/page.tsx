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
import { PLANS, PLAN_ORDER, type BillingCycle, getPlanPricePresentation } from "@/src/config/plans";
import { MarketingHeader } from "../../../components/layout/marketing-header";

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
    const sample = buildHomepageSample(referenceDate);

    return (
        <div className="min-h-screen flex flex-col selection:bg-amber-200" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <Hero />
                <SampleProof sample={sample} />
                <HowItWorks />
                <WhatYouKeep />
                <PricingPreview />
                <FAQPreview />
            </main>
        </div>
    );
}

function Hero() {
    return (
        <section className="relative overflow-hidden border-b border-[var(--border)]" style={{ backgroundColor: "var(--bg)" }}>
            <div className="absolute inset-x-0 top-24 h-px bg-[var(--border)]" />

            <div className="relative content-container-wide px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
                <div className="max-w-[38rem] space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]">
                        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                        For South African household employers
                    </div>

                    <div className="space-y-4">
                        <h1 className="type-h1" style={{ color: "var(--text)" }}>
                            Household payroll records without the cost and complexity of business payroll software.
                        </h1>
                    </div>

                    <div className="space-y-3">
                        <Link href="/onboarding">
                            <Button className="h-12 rounded-xl bg-[var(--primary)] px-7 text-base font-bold text-white shadow-[var(--shadow-2)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]">
                                Start free <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <p className="text-xs font-medium leading-6" style={{ color: "var(--text-muted)" }}>
                            Free to start. No account needed. Upgrade for backup and records.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SampleProof({ sample }: { sample: ReturnType<typeof buildHomepageSample> }) {
    return (
        <section style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:items-start">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Sample payslip
                        </p>
                        <h2 className="type-h2 max-w-[14ch]" style={{ color: "var(--text)" }}>
                            See what the monthly record looks like.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            A real household run produces a clear monthly payslip with UIF shown in the same document, ready to review or download.
                        </p>
                    </div>

                    <SamplePayslipCard sample={sample} />
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
                        <p className="rounded-full border border-[var(--focus)]/20 bg-white/70 px-3 py-1.5 text-sm font-semibold shadow-sm" style={{ color: "var(--text)" }}>
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
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/70 pb-3 last:border-b-0 last:pb-0">
            <div>
                <p className="text-sm font-semibold" style={{ color: strong ? "var(--text)" : "var(--text-muted)" }}>
                    {label}
                </p>
            </div>
            <p
                className={`text-right font-[family:var(--font-serif)] text-lg font-semibold tabular-nums ${emphasis ? "text-[var(--primary-pressed)]" : ""}`}
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

function WhatYouKeep() {
    const recordTypes = [
        {
            title: "Payslips",
            body: "Monthly pay records with UIF shown clearly and ready to download when you need them again.",
        },
        {
            title: "Contracts",
            body: "Starter templates and saved contract files so the employment paperwork stays in one place.",
        },
        {
            title: "Exports",
            body: "UIF and annual paperwork exports when you need to prepare submissions or keep a clean handover file.",
        },
        {
            title: "History",
            body: "Older periods, document trail, and archive access so you can answer questions later without rebuilding records.",
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
                            Not just a payslip. Your household employment record trail.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger is for households that want the monthly payslip and the supporting record trail to stay together over time.
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

function PricingPreview() {
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("yearly");
    const homepageBullets: Record<string, string[]> = {
        free: ["1 active employee", "Basic monthly payslips", "Stored on this device"],
        standard: ["Up to 3 active employees", "Leave, contracts, and documents", "Private Google Drive backup"],
        pro: ["Unlimited employees", "Multiple households (for example: main home + holiday home)", "5-year archive"],
    };

    return (
        <section id="pricing-preview" className="scroll-mt-24" style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Pricing preview
                        </p>
                        <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                            Choose the plan that fits your household.
                        </h2>
                        <p className="text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            Free covers one worker and basic payslips. Standard adds proper records, documents, and backup. Pro adds multiple households and longer archive access.
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

                <div className="mt-8 rounded-[20px] border border-[var(--border)] bg-[var(--surface-1)] px-5 py-4 shadow-[var(--shadow-1)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                        Proof point
                    </p>
                    <Link href="/examples" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline">
                        See what a payslip looks like <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
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
                                        <div className="space-y-2">
                                            <Link href="/onboarding">
                                                <Button className="h-11 w-full rounded-xl bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)]">
                                                    Start free
                                                </Button>
                                            </Link>
                                            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                                                No account needed for Free. Upgrade later for Google Drive backup.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Link
                                                href="/onboarding"
                                                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-sm font-bold text-[var(--text)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                            >
                                                {`Choose ${plan.label}`}
                                            </Link>
                                            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                                                14-day refund on paid upgrades.
                                            </p>
                                        </div>
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
            q: "Will this help me know what to do each month?",
            a: "Yes. LekkerLedger helps you reuse the same worker details, run the month clearly, and keep the paperwork tidy so you are not starting from scratch every time.",
        },
        {
            q: "What if I am not sure about the rules or worried about making a mistake?",
            a: "You do not need to know everything before you start. LekkerLedger helps you keep the records organised and review the main figures clearly. For unusual situations, verify against official guidance before you rely on the record.",
        },
        {
            q: "Are employee records stored on LekkerLedger servers?",
            a: "Employee records stay on your device by default. Paid plans can add optional backup in the Google Drive app data area in your own Google account.",
        },
        {
            q: "Can I start with one employee, and what changes when I upgrade?",
            a: "Yes. Free supports one active employee and basic payslips, so you can try the monthly flow before paying. Standard adds leave tracking, contracts, documents, backup, and annual exports. Pro adds multiple households, unlimited employees, and longer archive access when you need separate records for more than one home.",
        },
        {
            q: "What happens if I change devices later?",
            a: "Free is simplest on one device. Paid backup lets you restore records later in your own Google account when you change browsers or devices.",
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









