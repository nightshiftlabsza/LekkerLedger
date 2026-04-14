"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { ComplianceDisclaimer } from "@/components/seo/compliance-disclaimer";
import { LEGAL_REGISTRY } from "@/lib/legal/registry";

const currency = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
    return currency.format(Number.isFinite(value) ? value : 0);
}

export function UifCalculatorLanding() {
    const [monthlyPay, setMonthlyPay] = React.useState("3500");

    const parsedPay = React.useMemo(() => {
        const normalised = monthlyPay.replaceAll(/[^\d.]/g, "");
        const parsed = Number.parseFloat(normalised);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [monthlyPay]);

    const cappedPay = Math.min(parsedPay, LEGAL_REGISTRY.UIF.MONTHLY_CAP);
    const employeeContribution = cappedPay * LEGAL_REGISTRY.UIF.RATE;
    const employerContribution = cappedPay * LEGAL_REGISTRY.UIF.RATE;
    const totalContribution = employeeContribution + employerContribution;
    const isCapped = parsedPay > LEGAL_REGISTRY.UIF.MONTHLY_CAP;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <section className="border-b border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <div className="space-y-6 max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                    UIF deduction calculator
                                </div>
                                <div className="space-y-4">
                                    <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                        UIF deduction calculator for domestic workers
                                    </h1>
                                    <p className="max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        Calculate the employee and employer UIF contribution from the month&apos;s pay, check the current ceiling, and see the total due for that month.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {[
                                        "Employee contribution: 1%",
                                        "Employer contribution: 1%",
                                        "Total UIF paid: 2%",
                                    ].map((item) => (
                                        <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4 text-sm font-semibold shadow-[var(--shadow-1)]" style={{ color: "var(--text)" }}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                    UIF usually applies when the worker works more than {LEGAL_REGISTRY.UIF.THRESHOLD_HOURS} hours a month for that employer. Contributions are capped at monthly pay of {formatCurrency(LEGAL_REGISTRY.UIF.MONTHLY_CAP)}.
                                </p>
                            </div>

                            <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-2)] sm:p-7">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-[var(--primary)] p-3 text-white">
                                        <Calculator className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                            UIF calculator
                                        </p>
                                        <h2 className="type-h3" style={{ color: "var(--text)" }}>
                                            Estimate the monthly UIF amount
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-5">
                                    <label className="block space-y-2">
                                        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                                            Monthly pay
                                        </span>
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 shadow-[var(--shadow-1)]">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={monthlyPay}
                                                onChange={(event) => setMonthlyPay(event.target.value)}
                                                placeholder="3500"
                                                className="w-full border-0 bg-transparent text-2xl font-semibold outline-none"
                                                style={{ color: "var(--text)" }}
                                            />
                                        </div>
                                    </label>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                Employee 1%
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold type-mono" style={{ color: "var(--text)" }}>
                                                {formatCurrency(employeeContribution)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                Employer 1%
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold type-mono" style={{ color: "var(--text)" }}>
                                                {formatCurrency(employerContribution)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--primary)] bg-[var(--primary)]/5 p-4">
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                                Total to UIF
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold type-mono" style={{ color: "var(--text)" }}>
                                                {formatCurrency(totalContribution)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        This calculator shows the monthly 1% employee contribution and 1% employer contribution on the pay entered above.
                                    </p>
                                    <div className="space-y-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        <p>
                                            UIF usually applies when the worker works more than {LEGAL_REGISTRY.UIF.THRESHOLD_HOURS} hours a month for that employer.
                                        </p>
                                        {isCapped ? (
                                            <p>
                                                UIF is calculated only up to the current ceiling of {formatCurrency(LEGAL_REGISTRY.UIF.MONTHLY_CAP)} a month. That means the employee part is capped at {formatCurrency(LEGAL_REGISTRY.UIF.MAX_EMPLOYEE_CONTRIBUTION)} and the total monthly UIF is capped at {formatCurrency(LEGAL_REGISTRY.UIF.MAX_TOTAL_CONTRIBUTION)}.
                                            </p>
                                        ) : null}
                                        <p>
                                            UIF is generally payable by the 7th of the following month, or the last business day before if the 7th is not a business day.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <h2 className="type-h3" style={{ color: "var(--text)" }}>
                                    What this deduction means
                                </h2>
                                <div className="mt-4 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        UIF stands for the Unemployment Insurance Fund. It is a South African social insurance system that helps eligible workers with short-term support when they lose income because of unemployment, maternity, illness, adoption, or death.
                                    </p>
                                    <p>
                                        For household employers, this is a monthly deduction and employer contribution. When UIF applies, you deduct the worker&apos;s 1% share, add the employer&apos;s 1% share, and pay the combined amount over.
                                    </p>
                                </div>
                            </article>

                            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <h2 className="type-h3" style={{ color: "var(--text)" }}>
                                    How UIF works for domestic workers
                                </h2>
                                <div className="mt-4 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        UIF usually applies when the worker works more than {LEGAL_REGISTRY.UIF.THRESHOLD_HOURS} hours a month for that employer. The household employer handles the worker deduction, adds the matching employer contribution, and keeps the monthly figures straight.
                                    </p>
                                    <p>
                                        Where UIF applies, it should be shown clearly so both sides can see what was deducted from pay and what the employer added.
                                    </p>
                                </div>
                            </article>

                            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)] lg:col-span-2">
                                <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
                                    <div>
                                        <h2 className="type-h3" style={{ color: "var(--text)" }}>
                                            How much UIF should I deduct?
                                        </h2>
                                        <div className="mt-4 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            <p>
                                                The simple rule is that the employee contributes 1% of the monthly pay, and the employer contributes another 1%. Together, that makes a total UIF contribution of 2%.
                                            </p>
                                            <p>
                                                Example: if the monthly pay is {formatCurrency(3500)}, the employee UIF amount is {formatCurrency(35)}, the employer UIF amount is {formatCurrency(35)}, and the total paid over is {formatCurrency(70)}.
                                            </p>
                                            <p>
                                                Once the monthly pay goes above {formatCurrency(LEGAL_REGISTRY.UIF.MONTHLY_CAP)}, UIF is still calculated only up to that ceiling.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-[var(--primary)] bg-[var(--primary)]/5 p-6 shadow-[var(--shadow-1)]">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-2xl bg-[var(--primary)] p-3 text-white">
                                                <ShieldCheck className="h-5 w-5" />
                                            </div>
                                            <h3 className="type-h3" style={{ color: "var(--text)" }}>
                                                Quick reminder
                                            </h3>
                                        </div>
                                        <ul className="mt-5 space-y-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            {[
                                                "UIF is not only the employee deduction. The employer must contribute too.",
                                                "Where UIF applies, it should be shown clearly on the payslip.",
                                                "The current employee maximum is R177.12 a month, and the total monthly maximum is R354.24.",
                                            ].map((item) => (
                                                <li key={item} className="flex items-start gap-3">
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="border-t border-[var(--border)]">
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <h2 className="type-h3 font-semibold" style={{ color: "var(--text)" }}>Useful links</h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    { href: "/resources/guides/uif-for-domestic-workers", label: "How UIF works for domestic workers" },
                                    { href: "/resources/tools/domestic-worker-payslip", label: "Domestic worker payslip template" },
                                    { href: "/calculator", label: "Domestic worker pay calculator" },
                                    { href: "/ufiling-errors", label: "Fix common uFiling errors" },
                                ].map((link) => (
                                    <Link key={link.href} href={link.href} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-sm font-medium transition-colors hover:border-[var(--primary)]/40" style={{ color: "var(--text)" }}>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                            <ComplianceDisclaimer />
                        </div>
                    </div>
                </section>

                <section className="border-t border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="rounded-[32px] border border-[var(--primary)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-2)] lg:p-10">
                            <div className="grid gap-6 lg:grid-cols-[1.15fr_auto] lg:items-center">
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                        Paid plans
                                    </p>
                                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                                        Keep UIF with the month when you need more than a quick estimate
                                    </h2>
                                    <p className="max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        Need UIF shown on each payslip and kept with the month? Paid plans keep payslips, leave, contracts, and exports together.
                                    </p>
                                </div>
                                <div>
                                    <Link href="/dashboard">
                                        <Button className="w-full justify-center gap-2 px-6 py-6 text-base font-bold lg:w-auto">
                                            Start free
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
