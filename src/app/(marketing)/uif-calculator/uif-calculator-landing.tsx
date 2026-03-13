"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";

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
    const [monthlySalary, setMonthlySalary] = React.useState("3500");

    const parsedSalary = React.useMemo(() => {
        const normalised = monthlySalary.replaceAll(/[^\d.]/g, "");
        const parsed = Number.parseFloat(normalised);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [monthlySalary]);

    const employeeContribution = parsedSalary * 0.01;
    const employerContribution = parsedSalary * 0.01;
    const totalContribution = employeeContribution + employerContribution;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main id="main-content" className="flex-1">
                <section className="border-b border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 md:py-24 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <div className="space-y-6 max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                    UIF guide + calculator
                                </div>
                                <div className="space-y-4">
                                    <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                        Domestic worker UIF calculator (South Africa)
                                    </h1>
                                    <p className="max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        Work out the UIF amount for a domestic worker&apos;s monthly salary, understand what the deduction covers, and see what both the employee and employer should contribute.
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
                                            Monthly salary
                                        </span>
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 shadow-[var(--shadow-1)]">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={monthlySalary}
                                                onChange={(event) => setMonthlySalary(event.target.value)}
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
                                        This calculator shows the simple 1% employee contribution and 1% employer contribution on the monthly salary entered above. For edge cases or unusual pay structures, confirm the current UIF rules before filing.
                                    </p>
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
                                    What is UIF?
                                </h2>
                                <div className="mt-4 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        UIF stands for the Unemployment Insurance Fund. It is a South African social insurance system that helps eligible workers with short-term support when they lose income because of unemployment, maternity, illness, adoption, or death.
                                    </p>
                                    <p>
                                        For household employers, UIF is one of the core monthly payroll responsibilities. If you employ a domestic worker and they fall within the UIF rules, you deduct the employee portion and add the employer portion before paying it over.
                                    </p>
                                </div>
                            </article>

                            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[var(--shadow-1)]">
                                <h2 className="type-h3" style={{ color: "var(--text)" }}>
                                    How UIF works for domestic workers
                                </h2>
                                <div className="mt-4 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    <p>
                                        Domestic workers are generally included in UIF when they work enough hours for an employer to qualify. The household employer is responsible for registering where required, deducting the worker&apos;s contribution correctly, adding the employer contribution, and keeping the records tidy.
                                    </p>
                                    <p>
                                        In practice, this means UIF should be reflected clearly on the payslip each month so both sides can see what was deducted and what the employer added.
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
                                                The simple rule is that the employee contributes 1% of the monthly salary, and the employer contributes another 1%. Together, that makes a total UIF contribution of 2%.
                                            </p>
                                            <p>
                                                Example: if the monthly salary is {formatCurrency(3500)}, the employee UIF amount is {formatCurrency(35)}, the employer UIF amount is {formatCurrency(35)}, and the total paid over is {formatCurrency(70)}.
                                            </p>
                                            <p>
                                                The safest way to avoid under-deducting or over-deducting is to calculate UIF as part of your normal payroll process every month instead of doing it manually from memory.
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
                                                "The deduction should appear clearly on the payslip.",
                                                "Keeping monthly payroll records tidy makes UIF reporting easier later.",
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

                <section className="border-t border-[var(--border)]" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div className="content-container-wide px-4 py-16 sm:px-6 lg:px-8">
                        <div className="rounded-[32px] border border-[var(--primary)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-2)] lg:p-10">
                            <div className="grid gap-6 lg:grid-cols-[1.15fr_auto] lg:items-center">
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                                        Proper payroll records
                                    </p>
                                    <h2 className="type-h2" style={{ color: "var(--text)" }}>
                                        Create proper payslips with UIF calculated automatically in LekkerLedger
                                    </h2>
                                    <p className="max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        Stop calculating UIF from scratch every month. Create payslips, keep deductions consistent, and keep your household payroll records clean from the start.
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
