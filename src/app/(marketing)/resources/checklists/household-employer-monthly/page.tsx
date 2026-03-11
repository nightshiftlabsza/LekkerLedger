import Link from "next/link";
import { ArrowLeft, CheckSquare, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Household Employer Monthly Checklist | LekkerLedger",
  description: "Your step-by-step monthly compliance checklist for domestic workers in South Africa. Pay, UIF, and record-keeping made simple.",
};

export default function MonthlyChecklistPage() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main className="flex-1 px-4 py-10 sm:py-16 content-container-wide">
                <article className="max-w-3xl mx-auto space-y-12 pb-20">
                    <div className="space-y-6">
                        <Link
                            href="/resources/checklists"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to checklists
                        </Link>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <CheckSquare className="h-6 w-6 text-emerald-500" />
                                </div>
                                <span className="type-label text-[var(--text)]">Compliance Checklist</span>
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Monthly Household Employer Checklist
                            </h1>
                            <p className="text-xl leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                                A foolproof, step-by-step guide to ensuring your domestic worker's payroll and compliance are perfectly handled every single month.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        {/* STEP 1 */}
                        <div className="relative pl-8 sm:pl-12">
                            <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white shadow-sm ring-4 ring-[var(--bg)]">
                                1
                            </div>
                            <div className="absolute left-4 top-8 -bottom-12 w-px bg-[var(--border)]" />
                            
                            <div className="space-y-4 pt-1">
                                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                                    <Calendar className="h-5 w-5 text-[var(--text-muted)]" /> Review Hours & Leave
                                </h2>
                                <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Before calculating pay, ensure you have an accurate record of the time worked this month.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Tally all ordinary hours worked. Did they work any agreed overtime?</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Note any public holidays worked (must be paid at double time).</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Record any sick leave taken and request a medical certificate if they were off for more than 2 consecutive days, or more than twice in 8 weeks.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* STEP 2 */}
                        <div className="relative pl-8 sm:pl-12">
                            <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white shadow-sm ring-4 ring-[var(--bg)]">
                                2
                            </div>
                            <div className="absolute left-4 top-8 -bottom-12 w-px bg-[var(--border)]" />
                            
                            <div className="space-y-4 pt-1">
                                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                                    <CreditCard className="h-5 w-5 text-[var(--text-muted)]" /> Calculate & Generate Payslip
                                </h2>
                                <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Translate those hours into compliant numbers and issue the mandatory written physical/digital payslip.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-sm" style={{ color: "var(--text)" }}>Verify the rate against the <Link href="/resources/guides/domestic-worker-minimum-wage-2026" className="text-[var(--primary)] hover:underline">National Minimum Wage</Link>.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Calculate the 1% UIF deduction from Gross Pay.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Generate the PDF payslip and send it to your employee via WhatsApp or email. <Link href="/resources/tools/domestic-worker-payslip" className="text-[var(--primary)] hover:underline">Use our free generator</Link>.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* STEP 3 */}
                        <div className="relative pl-8 sm:pl-12">
                            <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white shadow-sm ring-4 ring-[var(--bg)]">
                                3
                            </div>
                            
                            <div className="space-y-4 pt-1">
                                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                                    <ShieldCheck className="h-5 w-5 text-[var(--text-muted)]" /> Make Payment & Declare UIF
                                </h2>
                                <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Finalize the transfer and inform the government. <b>Due by the 7th of the following month.</b>
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 p-0 flex items-center justify-center bg-emerald-500 border-emerald-500">
                                            <div className="h-2 w-2 rounded-sm bg-white" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Transfer the specific <i>Net Pay</i> amount to the employee's bank account.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Log into <a href="https://www.ufiling.co.za" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">uFiling</a> and submit the monthly return declaration.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded border border-[var(--border)] shrink-0 flex items-center justify-center">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-transparent" />
                                        </div>
                                        <span className="text-sm" style={{ color: "var(--text)" }}>Pay the total 2% UIF contribution (1% deducted + 1% employer contribution) using the generated reference number.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 mt-12 border-t border-[var(--border)]">
                        <div className="bg-[var(--surface-raised)] rounded-2xl p-8 text-center space-y-4">
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Too many steps? Automate it.</h3>
                            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                                LekkerLedger combines steps 1 and 2 into a single process. Enter the hours once, and we calculate everything, handle the minimum wage checks, and generate the PDF automatically.
                            </p>
                            <div className="pt-4">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-colors"
                                >
                                    Start using LekkerLedger
                                </Link>
                            </div>
                        </div>
                    </div>

                </article>
            </main>
        </div>
    );
}
