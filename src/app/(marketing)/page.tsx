import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    Calendar,
    ChevronDown,
    FileText,
    Users,
} from "lucide-react";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { calculatePayslip } from "@/lib/calculator";
import { getNMWForDate } from "@/lib/legal/registry";
import type { Employee, PayslipInput } from "@/lib/schema";
import { MarketingHeader } from "../../../components/layout/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { pageOG } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Domestic Worker Payslips, UIF & Payroll Records | LekkerLedger South Africa",
    description:
        "Create domestic worker payslips, calculate UIF, track leave, store contracts, and keep payroll records organised for South African household employers.",
    alternates: { canonical: "/" },
    ...pageOG(
        "Domestic Worker Payslips, UIF & Payroll Records | LekkerLedger South Africa",
        "Create domestic worker payslips, calculate UIF, track leave, store contracts, and keep payroll records organised for South African household employers.",
        "/",
    ),
};

const homepageFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "Will this help me know what to do each month?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. LekkerLedger helps you reuse the same worker details, run the month clearly, and keep the paperwork tidy so you are not starting from scratch every time.",
            },
        },
        {
            "@type": "Question",
            name: "What if I am not sure about the rules or worried about making a mistake?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "You do not need to know everything before you start. LekkerLedger helps you keep the records organised and review the main figures clearly. For unusual situations, verify against official guidance before you rely on the record.",
            },
        },
        {
            "@type": "Question",
            name: "Where are employee records stored?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Paid accounts store records in end-to-end encrypted cloud storage, accessible from any device you sign into. Free users can email themselves one payslip PDF per email address each calendar month without creating an account.",
            },
        },
        {
            "@type": "Question",
            name: "Can I start with one employee, and what changes when I upgrade?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Free lets you email yourself one payslip PDF per email address each calendar month so you can try the flow before paying. Standard adds leave tracking, contracts, documents, cloud-secured records, and annual exports. Pro adds multiple households, unlimited employees, and longer archive access when you need separate records for more than one home.",
            },
        },
        {
            "@type": "Question",
            name: "What happens if I change devices later?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Paid accounts store everything in the cloud. Just sign in on any device and your records are there. Free users receive the PDF by email each time, so there is nothing to restore inside the app.",
            },
        },
    ],
};

const SAMPLE_FIGURE_GRID = [
    "hidden md:grid md:grid-cols-[minmax(10rem,1.8fr)_minmax(3.75rem,0.65fr)_minmax(5rem,0.82fr)_minmax(5.5rem,0.95fr)] md:gap-x-3",
    "min-[1440px]:grid-cols-[minmax(11rem,1.85fr)_minmax(4rem,0.68fr)_minmax(5.5rem,0.86fr)_minmax(6rem,0.98fr)] min-[1440px]:gap-x-4",
].join(" ");
const HERO_TRUST_POINTS = [
    "UIF is shown clearly on every payslip.",
    "Keep contracts, payslips, and exports in one place.",
    "Stop rebuilding monthly records from scratch.",
] as const;

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
        startDateIsApproximate: false,
        leaveCycleStartDate: "",
        leaveCycleEndDate: "",
        annualLeaveBalanceAsOfDate: "",
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
            <JsonLd schema={homepageFaqSchema} />
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <Hero sample={sample} />
                <HowItWorks />
                <WhatYouKeep />
                <PricingPreview />
                <FAQPreview />
            </main>
        </div>
    );
}

function Hero({ sample }: Readonly<{ sample: ReturnType<typeof buildHomepageSample> }>) {
    return (
        <section className="relative overflow-hidden border-b border-[var(--border)]" style={{ backgroundColor: "var(--bg)" }}>
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-64 w-[min(92vw,72rem)] -translate-x-1/2 bg-[radial-gradient(circle,rgba(0,122,77,0.04)_0%,transparent_72%)]" />
                <div className="absolute inset-x-0 top-24 h-px bg-[var(--border)]" />
            </div>

            <div className="marketing-shell relative py-8 sm:py-10 lg:py-12 xl:py-14">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,35rem)_minmax(0,1.1fr)] lg:items-start xl:grid-cols-[minmax(0,37rem)_minmax(0,1.2fr)] xl:gap-14">
                    <div className="max-w-[40rem] space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]">
                            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                            <span>For South African household employers</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Domestic worker payslips and UIF for South African households
                            </h1>
                            <p className="max-w-[35rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                                Create monthly payslips, show UIF clearly, track leave, and keep contracts and records together for your domestic worker, nanny, gardener, or caregiver.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
                                <Link
                                    href="/resources/tools/domestic-worker-payslip"
                                    className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 self-start rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold leading-5 text-center text-white shadow-[var(--shadow-2)] transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] sm:px-7 sm:text-base"
                                >
                                    Generate a free domestic worker payslip <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/calculator"
                                    className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-3 text-sm font-bold leading-5 text-center text-[var(--text)] transition-colors hover:border-[var(--primary)]/30 hover:bg-[var(--surface-1)] sm:px-7"
                                >
                                    Check UIF and take-home pay
                                </Link>
                            </div>
                            <p className="text-xs font-medium leading-6" style={{ color: "var(--text-muted)" }}>
                                Start with the free payslip tool, or use the{" "}
                                <Link href="/uif-calculator" className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline">
                                    UIF calculator
                                </Link>{" "}
                                when you only need a quick check before payday.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                            {HERO_TRUST_POINTS.map((point) => (
                                <div
                                    key={point}
                                    className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm leading-6 shadow-[var(--shadow-sm)]"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    <span className="mb-2 block h-2 w-2 rounded-full bg-[var(--primary)]" />
                                    {point}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:justify-self-end lg:pl-4">
                        <SamplePayslipCard sample={sample} />
                    </div>
                </div>
            </div>
        </section>
    );
}

function SamplePayslipCard({ sample }: Readonly<{ sample: ReturnType<typeof buildHomepageSample> }>) {
    return (
        <div
            className="marketing-proof-shell mx-auto overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[0_20px_50px_rgba(16,24,40,0.10)] lg:mx-0"
            data-testid="sample-payslip-card"
        >
            <div
                className="border-b border-[var(--border)] px-5 py-4 sm:px-6 sm:py-5"
                style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.06) 0%, rgba(0, 122, 77, 0.02) 100%)" }}
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                            LekkerLedger
                        </p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
                            Sample payslip preview
                        </p>
                    </div>
                    <p className="rounded-full border border-[var(--focus)]/20 bg-[var(--surface-1)] px-3 py-1.5 text-sm font-semibold shadow-sm" style={{ color: "var(--text)" }}>
                        {sample.monthLabel}
                    </p>
                </div>
                <p className="mt-3 max-w-[38ch] text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                    Gross earnings, UIF deduction, and net pay stay easy to scan before you create the full record.
                </p>
            </div>

            <div className="grid gap-5 p-5 sm:p-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                        <div>
                            <h2
                                className="font-[family:var(--font-serif)] font-semibold"
                                style={{ color: "var(--text)", fontSize: "clamp(1.5rem, 1.25rem + 0.7vw, 2rem)" }}
                            >
                                PAYSLIP
                            </h2>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                                Household payroll record
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                Pay period
                            </p>
                            <p
                                className="mt-2 rounded-full bg-[var(--accent-subtle)] px-3 py-1.5 font-semibold"
                                style={{ color: "var(--text)", fontSize: "clamp(0.82rem, 0.76rem + 0.15vw, 0.95rem)" }}
                            >
                                {sample.periodLabel}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                        <SamplePartyBlock
                            label="Employer"
                            value={sample.employer.name}
                            detail={
                                <>
                                    <p className="sm:hidden">Johannesburg household employer</p>
                                    <p className="hidden sm:block">{sample.employer.address}</p>
                                </>
                            }
                        />
                        <SamplePartyBlock
                            label="Employee"
                            value={sample.employee.name}
                            detail={
                                <>
                                    <p>{sample.employee.role}</p>
                                    <p className="hidden sm:block tabular-nums">ID {formatIdNumber(sample.employee.idNumber)}</p>
                                </>
                            }
                        />
                        <SamplePartyBlock
                            className="sm:col-span-2 2xl:col-span-1"
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
                        className="mt-4 overflow-hidden rounded-[22px] border border-[var(--border)] p-4 sm:p-5"
                        style={{ background: "linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(0, 122, 77, 0.03) 100%)" }}
                    >
                        <div
                            className={`${SAMPLE_FIGURE_GRID} items-end border-b border-[var(--border)] pb-3 text-[10px] font-black uppercase tracking-[0.16em]`}
                            data-testid="sample-payslip-ledger-header"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <span className="block min-w-0 pr-4">Description</span>
                            <span className="block min-w-0 text-right">Hours</span>
                            <span className="block min-w-0 text-right">Rate</span>
                            <span className="block min-w-0 text-right">Total</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 md:hidden">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                                    Pay breakdown
                                </p>
                                <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                                    Earnings, deductions, and totals reformatted for smaller screens.
                                </p>
                            </div>
                        </div>

                        <div className="divide-y divide-[var(--border)] pt-2">
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

                    <p className="mt-4 text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                        Sample only. Your real payslips are created from your own payroll records and kept with the rest of your monthly pay paperwork.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3">
                    <ProofMetric label="Gross earnings" value={formatRand(sample.breakdown.grossPay)} />
                    <ProofMetric label="UIF deduction" value={`- ${formatRand(sample.breakdown.deductions.uifEmployee)}`} />
                    <ProofMetric className="min-[360px]:col-span-2 md:col-span-1" label="Net pay" value={formatRand(sample.breakdown.netPay)} emphasis />
                    <div
                        className="hidden rounded-[20px] border border-[var(--focus)]/20 p-4 md:col-span-3 md:block"
                        style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.06) 0%, rgba(0, 122, 77, 0.02) 100%)" }}
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            Why this matters
                        </p>
                        <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                            Keep monthly payslips, contracts, exports, and payroll records together in one calm workspace.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProofMetric({
    className,
    label,
    value,
    emphasis = false,
}: Readonly<{
    className?: string;
    label: string;
    value: string;
    emphasis?: boolean;
}>) {
    return (
        <div
            className={`min-w-0 rounded-[20px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className ?? ""}`}
            style={emphasis ? { background: "linear-gradient(135deg, rgba(0, 122, 77, 0.06) 0%, rgba(255, 255, 255, 1) 100%)" } : undefined}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: emphasis ? "var(--primary)" : "var(--text-muted)" }}>
                {label}
            </p>
            <p
                className="mt-2 min-w-0 whitespace-nowrap font-[family:var(--font-serif)] font-semibold tabular-nums"
                style={{
                    color: emphasis ? "var(--primary-pressed)" : "var(--text)",
                    fontSize: "clamp(1.15rem, 1rem + 0.5vw, 1.55rem)",
                    lineHeight: 1.2,
                }}
            >
                {value}
            </p>
        </div>
    );
}

function SamplePartyBlock({
    className,
    label,
    value,
    detail,
}: Readonly<{
    className?: string;
    label: string;
    value: string;
    detail?: ReactNode;
}>) {
    return (
        <div
            className={`rounded-[18px] border border-[var(--border)] px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className ?? ""}`}
            style={{ background: "linear-gradient(180deg, #FFFFFF 0%, rgba(0, 122, 77, 0.03) 100%)" }}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                {value}
            </p>
            {detail ? (
                <div className="mt-2 space-y-1 break-words text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                    {detail}
                </div>
            ) : null}
        </div>
    );
}

function SampleFigureRow({ label, hours, rate, total, bold = false }: Readonly<{ label: string; hours: string; rate: string; total: string; bold?: boolean }>) {
    const detailItems = [
        hours ? { label: "Hours", value: hours } : null,
        rate ? { label: "Rate", value: rate } : null,
    ].filter((item): item is { label: string; value: string } => item !== null);

    return (
        <>
            <div
                className={`${SAMPLE_FIGURE_GRID} items-start py-3`}
                data-testid="sample-payslip-ledger-row"
                style={{ fontSize: "clamp(0.82rem, 0.78rem + 0.14vw, 0.94rem)" }}
            >
                <span
                    className={`block min-w-0 break-words pr-4 leading-6 ${bold ? "font-semibold" : ""}`}
                    style={{ color: bold ? "var(--text)" : "var(--text-muted)" }}
                >
                    {label}
                </span>
                <span className="block min-w-0 justify-self-end text-right tabular-nums whitespace-nowrap leading-6" style={{ color: "var(--text-muted)" }}>
                    {hours}
                </span>
                <span className="block min-w-0 justify-self-end text-right tabular-nums whitespace-nowrap leading-6" style={{ color: "var(--text-muted)" }}>
                    {rate}
                </span>
                <span
                    className={`block min-w-0 justify-self-end text-right tabular-nums whitespace-nowrap leading-6 ${bold ? "font-semibold" : ""}`}
                    style={{ color: "var(--text)" }}
                >
                    {total}
                </span>
            </div>

            <div
                className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:hidden"
                style={bold ? { background: "linear-gradient(135deg, rgba(0, 122, 77, 0.06) 0%, rgba(255, 255, 255, 0.98) 100%)" } : undefined}
            >
                <div className="flex items-start justify-between gap-3">
                    <p className={`max-w-[12rem] text-sm leading-5 ${bold ? "font-semibold" : "font-medium"}`} style={{ color: bold ? "var(--text)" : "var(--text-muted)" }}>
                        {label}
                    </p>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: bold ? "var(--primary)" : "var(--text-muted)" }}>
                            Total
                        </p>
                        <p className={`mt-1 text-base leading-5 tabular-nums ${bold ? "font-semibold" : "font-medium"}`} style={{ color: "var(--text)" }}>
                            {total}
                        </p>
                    </div>
                </div>

                {detailItems.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {detailItems.map((item) => (
                            <div
                                key={`${label}-${item.label}`}
                                className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2"
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                    {item.label}
                                </p>
                                <p className="mt-1 text-sm font-medium leading-5 tabular-nums" style={{ color: "var(--text)" }}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </>
    );
}

function HowItWorks() {
    const steps = [
        {
            icon: Users,
            title: "Add your worker once",
            body: "Save their details, pay setup, and leave basics so you can reuse them each month.",
        },
        {
            icon: Calendar,
            title: "Create the month's payslip with UIF shown clearly",
            body: "Review hours, leave, and deductions with UIF shown clearly before you finalise the payslip.",
        },
        {
            icon: FileText,
            title: "Keep leave, contracts, and records ready",
            body: "Keep the month organised so your records are ready for uFiling and household employment paperwork.",
        },
    ];

    return (
        <section id="how-it-works" style={{ backgroundColor: "var(--bg)" }}>
            <div className="marketing-shell marketing-section">
                <div className="max-w-3xl space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                        How it works
                    </p>
                    <h2 className="type-h2 max-w-[26ch]" style={{ color: "var(--text)" }}>
                        Run monthly domestic worker admin without spreadsheets or guesswork
                    </h2>
                    <p className="max-w-[44rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                        LekkerLedger helps household employers run the month clearly, keep payroll records together, and follow the same process each time. If you want a fuller checklist, start with the{" "}
                        <Link href="/resources/checklists/household-employer-monthly" className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline">
                            monthly employer checklist
                        </Link>
                        .
                    </p>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
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

                <div className="mt-7 flex justify-center">
                    <Link href="/resources/checklists/household-employer-monthly" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-6 py-3 text-sm font-bold text-[var(--primary)] transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--surface-1)]">
                        View the monthly employer checklist <ArrowRight className="h-4 w-4" />
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
            body: "Monthly pay records with UIF shown clearly.",
        },
        {
            title: "Contracts",
            body: "Drafts and signed agreements kept together.",
        },
        {
            title: "Exports",
            body: "Files ready for UIF or year-end admin.",
        },
        {
            title: "History",
            body: "Find older records without rebuilding them.",
        },
    ];

    return (
        <section style={{ backgroundColor: "var(--bg)" }}>
            <div className="marketing-shell marketing-section">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:items-start">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                            What you keep
                        </p>
                        <h2 className="type-h2 max-w-[18ch]" style={{ color: "var(--text)" }}>
                            Everything you need for monthly pay and paperwork
                        </h2>
                        <p className="max-w-[34rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger keeps your monthly pay records and supporting documents together so you are not scrambling later. See the{" "}
                            <Link href="/resources/guides/uif-for-domestic-workers" className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline">
                                UIF guide for domestic workers
                            </Link>{" "}
                            when you need the rules in plain English.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {recordTypes.map((item) => (
                            <div key={item.title} className="h-full rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-1)]">
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
            q: "Where are employee records stored?",
            a: "Paid accounts store records in end-to-end encrypted cloud storage, accessible from any device you sign into. Free users can email themselves one payslip PDF per email address each calendar month without creating an account.",
        },
        {
            q: "Can I start with one employee, and what changes when I upgrade?",
            a: "Yes. Free lets you email yourself one payslip PDF per email address each calendar month so you can try the flow before paying. Standard adds leave tracking, contracts, documents, cloud-secured records, and annual exports. Pro adds multiple households, unlimited employees, and longer archive access when you need separate records for more than one home.",
        },
        {
            q: "What happens if I change devices later?",
            a: "Paid accounts store everything in the cloud. Just sign in on any device and your records are there. Free users receive the PDF by email each time, so there is nothing to restore inside the app.",
        },
    ];

    return (
        <section id="faq" style={{ backgroundColor: "var(--bg)" }}>
            <div className="marketing-reading-shell marketing-section">
                <div className="mb-6 max-w-2xl space-y-3">
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

function FAQItem({ question, answer }: Readonly<{ question: string; answer: string }>) {
    return (
        <details
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5 transition-all hover:border-[var(--primary)]/30"
            style={{ backgroundColor: "var(--surface-1)" }}
        >
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-1">
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
