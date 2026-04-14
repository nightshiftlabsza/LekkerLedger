"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CalculatorHero } from "@/components/calculator-hero";
import { getNMWRecordForDate } from "@/lib/legal/registry";
import { JsonLd } from "@/components/seo/json-ld";

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "When does UIF usually apply for a domestic worker?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "UIF usually applies when the worker works more than 24 hours a month for that employer."
            }
        },
        {
            "@type": "Question",
            "name": "What is the minimum wage for domestic workers?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "The minimum wage is updated annually by the Department of Employment and Labour. Our calculator automatically uses the correct rate based on the current date."
            }
        }
    ]
};

export default function CalculatorPage() {
    const nmwRecord = getNMWRecordForDate(new Date());
    const effectiveDate = new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(nmwRecord.effectiveDate));

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <JsonLd schema={faqSchema} />
            <MarketingHeader />

            <main className="content-container-wide flex-1 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                <div className="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] xl:items-start">
                    <section className="min-w-0 space-y-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to home
                        </Link>

                        <div className="max-w-3xl space-y-3">
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Domestic worker pay calculator
                            </h1>
                            <p className="text-sm leading-relaxed font-medium sm:text-base" style={{ color: "var(--text-muted)" }}>
                                Estimate monthly gross pay, take-home pay, and a quick UIF deduction from the hours worked and hourly rate you enter.
                                This uses the current National Minimum Wage for domestic workers.
                            </p>
                            <p className="text-xs font-semibold leading-relaxed sm:text-sm" style={{ color: "var(--text-muted)" }}>
                                Minimum wage shown is effective from {effectiveDate}.{" "}
                                <span>
                                    <a href={nmwRecord.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--primary)] transition-colors">Source</a>.
                                </span>
                            </p>
                        </div>

                        <CalculatorHero startHref="/payroll/new" />

                        <p className="border-t border-[var(--border)] pt-8 text-sm font-medium sm:text-base" style={{ color: "var(--text-muted)" }}>
                            This is an estimate only. Use it to sense-check pay before payday, then{" "}
                            <Link href="/payroll/new" className="underline hover:text-[var(--primary)] transition-colors">
                                create a full payslip
                            </Link>.
                        </p>
                    </section>

                    <aside className="space-y-6 xl:sticky xl:top-6">
                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <h2 className="type-h3" style={{ color: "var(--text)" }}>What this pay estimate shows</h2>
                            <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                Enter the hours worked this month and the hourly rate. The calculator uses the current National Minimum Wage when the entered rate is too low, then shows gross pay, a quick UIF estimate, and take-home pay.
                            </p>
                        </div>

                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <h2 className="type-h3" style={{ color: "var(--text)" }}>Frequently Asked Questions</h2>
                            <div className="mt-4 space-y-4">
                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>When does UIF usually apply?</h3>
                                    <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>UIF usually applies when the worker works more than 24 hours a month for that employer.</p>
                                </div>
                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>What is the minimum wage for domestic workers?</h3>
                                    <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>The minimum wage is updated annually by the Department of Employment and Labour. Our calculator automatically uses the correct rate based on the current date.</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <h2 className="type-h3" style={{ color: "var(--text)" }}>Useful links</h2>
                            <ul className="mt-4 space-y-3 text-sm font-medium">
                                <li>
                                    <Link href="/resources/guides/uif-for-domestic-workers" className="text-[var(--primary)] hover:underline">
                                        How UIF works for domestic workers
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/resources/tools/domestic-worker-payslip" className="text-[var(--primary)] hover:underline">
                                        Domestic worker payslip template
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/uif-calculator" className="text-[var(--primary)] hover:underline">
                                        UIF deduction calculator
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/resources/checklists/household-employer-monthly" className="text-[var(--primary)] hover:underline">
                                        Monthly household employer checklist
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/resources/guides/4-hour-minimum-pay-rule" className="text-[var(--primary)] hover:underline">
                                        4-hour minimum pay rule
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
