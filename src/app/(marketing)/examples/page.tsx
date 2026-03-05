"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamplesPage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-6 border border-[var(--primary)]/20">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Example Payslips</h1>
                    <p className="text-zinc-500 font-medium text-lg">See what your employee&apos;s generated payslip will look like in the app.</p>
                </header>

                <div className="glass-panel border-2 border-[var(--border)] p-6 sm:p-10 rounded-3xl relative overflow-hidden bg-[var(--surface-1)]">
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div>
                            <h2 className="text-2xl font-black text-[var(--text)] mb-4">Professional, compliant A4 PDFs</h2>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-6 font-medium">
                                Everything is generated locally on your device in high-quality PDF format. Payslips include all legally mandated fields under the Basic Conditions of Employment Act.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex gap-2 text-sm text-[var(--text)] font-medium">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <span>Employer & Employee Details + ID numbers</span>
                                </li>
                                <li className="flex gap-2 text-sm text-[var(--text)] font-medium">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <span>Ordinary vs Overtime hour breakdown</span>
                                </li>
                                <li className="flex gap-2 text-sm text-[var(--text)] font-medium">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <span>UIF deductions dynamically calculated</span>
                                </li>
                                <li className="flex gap-2 text-sm text-[var(--text)] font-medium">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <span>Leave balance summary and accrual</span>
                                </li>
                            </ul>
                            <Link href="/onboarding">
                                <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold shadow-lg shadow-[var(--primary)]/20 h-12 px-6 rounded-xl w-full sm:w-auto">
                                    Generate Your First Payslip <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Fake payslip visual representation */}
                        <div className="bg-white rounded-xl shadow-2xl p-6 border border-zinc-200 aspect-[1/1.4] w-full max-w-[320px] mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="text-center pb-4 border-b-2 border-zinc-200 mb-4">
                                <h3 className="font-bold text-zinc-900 text-lg">PAYSLIP</h3>
                                <p className="text-xs text-zinc-500">March 2026</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs mb-6 text-zinc-600">
                                <div>
                                    <p className="font-bold text-zinc-900">Employer:</p>
                                    <p>Sarah Jenkins</p>
                                    <p>12 Protea Ave</p>
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900">Employee:</p>
                                    <p>Maria Kgosana</p>
                                    <p>ID: 800101...</p>
                                </div>
                            </div>

                            <table className="w-full text-xs text-zinc-600 mb-6">
                                <thead>
                                    <tr className="border-b border-zinc-200 pb-2 text-left text-zinc-900">
                                        <th className="font-bold pb-2">Description</th>
                                        <th className="font-bold pb-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-2 pt-3">Ordinary Hours (160h)</td>
                                        <td className="py-2 pt-3 text-right">R 4,836.80</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">Overtime (10h)</td>
                                        <td className="py-2 text-right">R 453.45</td>
                                    </tr>
                                    <tr className="font-bold text-zinc-900 border-t border-zinc-100">
                                        <td className="py-2">Gross Pay</td>
                                        <td className="py-2 text-right">R 5,290.25</td>
                                    </tr>
                                    <tr className="text-red-600">
                                        <td className="py-2">UIF Deduction (1%)</td>
                                        <td className="py-2 text-right">- R 52.90</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="border-t-2 border-zinc-900 pt-3 flex justify-between items-center text-zinc-900">
                                <span className="font-black text-sm">NET PAY</span>
                                <span className="font-black text-lg">R 5,237.35</span>
                            </div>

                            <div className="mt-8 text-center opacity-30">
                                <div className="h-6 w-24 mx-auto rounded bg-zinc-300"></div>
                                <p className="text-[8px] mt-2">Generated securely with LekkerLedger</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-[var(--border)] text-center pb-8">
                    <p className="text-[var(--text-muted)] font-medium mb-4">No data leaves your device during PDF generation.</p>
                    <Link href="/">
                        <Button variant="outline" className="font-bold rounded-xl border-[var(--border)] text-[var(--text)]">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
