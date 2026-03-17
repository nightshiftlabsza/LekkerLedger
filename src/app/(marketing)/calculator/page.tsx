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
            "name": "How is domestic worker UIF calculated in South Africa?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "UIF is calculated as 2% of gross pay: 1% deducted from the employee's salary and 1% contributed by the employer."
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
                                Wage & UIF calculator
                            </h1>
                            <p className="text-sm leading-relaxed font-medium sm:text-base" style={{ color: "var(--text-muted)" }}>
                                Get a quick estimate of gross pay, UIF deductions, and net pay based on hours worked and hourly rate.
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
                            This is an estimate only. For a full payslip with all deductions and allowances,{" "}
                            <Link href="/payroll/new" className="underline hover:text-[var(--primary)] transition-colors">
                                create your first payslip
                            </Link>.
                        </p>
                    </section>

                    <aside className="space-y-6 xl:sticky xl:top-6">
                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <h2 className="type-h3" style={{ color: "var(--text)" }}>How to use this UIF calculator</h2>
                            <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                Enter the number of hours your domestic worker worked this month. The calculator automatically fetches the current National Minimum Wage to calculate the gross pay.
                                It then calculates the UIF deduction (1% of gross pay from the employee) and the net pay (Gross Pay minus UIF).
                            </p>
                        </div>

                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <h2 className="type-h3" style={{ color: "var(--text)" }}>Frequently Asked Questions</h2>
                            <div className="mt-4 space-y-4">
                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>How is domestic worker UIF calculated in South Africa?</h3>
                                    <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>UIF is calculated as 2% of gross pay in total. This is made up of 1% deducted from the employee&apos;s salary and 1% contributed by the employer.</p>
                                </div>
                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>What is the minimum wage for domestic workers?</h3>
                                    <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>The minimum wage is updated annually by the Department of Employment and Labour. Our calculator automatically uses the correct rate based on the current date.</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <h2 className="type-h3" style={{ color: "var(--text)" }}>Related Resources</h2>
                            <ul className="mt-4 space-y-3 text-sm font-medium">
                                <li>
                                    <Link href="/resources/guides/uif-for-domestic-workers" className="text-[var(--primary)] hover:underline">
                                        The complete guide to UIF for domestic workers
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/resources/tools/domestic-worker-payslip" className="text-[var(--primary)] hover:underline">
                                        Use our free payslip generator to create an official record
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/resources" className="text-[var(--primary)] hover:underline">
                                        Browse all household employer resources
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
