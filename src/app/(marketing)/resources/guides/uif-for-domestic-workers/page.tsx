import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, CheckSquare, Info } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata = {
  title: "Complete Guide to UIF for Domestic Workers | LekkerLedger",
  description: "Understand the 24-hour rule, calculate the 1%+1% deductions, and learn how to manage UIF declarations for your South African domestic worker.",
};

export default function UIFGuidePage() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main className="flex-1 px-4 py-10 sm:py-16 content-container-wide">
                <article className="max-w-3xl mx-auto space-y-12 pb-20">
                    <div className="space-y-6">
                        <Link
                            href="/resources/guides"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to guides
                        </Link>
                        
                        <div className="space-y-4">
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                The Complete Guide to UIF for Domestic Workers
                            </h1>
                            <p className="text-xl leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                                From the 24-hour rule to the 1%+1% calculation, here is everything you need to know about Unemployment Insurance Fund (UIF) compliance for your household employee.
                            </p>
                        </div>
                    </div>

                    <Alert variant="default" className="border-[var(--primary)]/20 bg-[var(--primary)]/5">
                        <Info className="h-4 w-4 text-[var(--primary)]" />
                        <AlertTitle className="text-[var(--text)] font-semibold">Important Note</AlertTitle>
                        <AlertDescription className="text-sm text-[var(--text-muted)] leading-relaxed">
                            LekkerLedger helps household employers calculate deductions and prepare records. It is not legal advice. Always verify requirements against official SARS or Department of Employment and Labour sources before relying on them.
                        </AlertDescription>
                    </Alert>

                    <div className="prose prose-slate max-w-none text-base leading-relaxed space-y-8" style={{ color: "var(--text-muted)" }}>
                        
                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Who Needs to Pay UIF? The 24-Hour Rule</h2>
                            <p>
                                In South Africa, if a domestic worker, gardener, nanny, or driver works for you for <b>24 hours or more per month</b>, you must register them for UIF. It does not matter if they work for multiple employers; each employer must register their pro-rata hours and pay their share of the UIF.
                            </p>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-3">
                                <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-emerald-500" />
                                    The Rule of Thumb
                                </h3>
                                <p className="text-sm">If your employee works for you for one full day (8 hours) a week, that equals roughly 32 hours a month. This crosses the 24-hour threshold, meaning UIF registration is mandatory by law.</p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">How is UIF Calculated?</h2>
                            <p>
                                The total UIF contribution is <b>2% of the employee&apos;s gross monthly remuneration</b>. This is split evenly between the employer and the employee:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><b>1% is deducted</b> from the employee&apos;s gross wage.</li>
                                <li><b>1% is contributed</b> by the employer out of their own pocket.</li>
                            </ul>
                            <div className="rounded-xl bg-blue-500/10 p-6 space-y-3 border border-blue-500/20">
                                <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                                    Example Calculation
                                </h3>
                                <div className="text-sm space-y-2">
                                    <p>Suppose your domestic worker earns R4,000 per month gross.</p>
                                    <p>Employee Deduction: R4,000 x 1% = <b>R40.00</b></p>
                                    <p>Employer Contribution: R4,000 x 1% = <b>R40.00</b></p>
                                    <p>Total Paid to UIF: <b>R80.00</b> per month.</p>
                                </div>
                            </div>
                            <p className="text-sm">
                                <i>Note: There is a maximum earnings ceiling set by SARS (currently R17,712 per month). For most domestic worker salaries, this ceiling does not apply, and you simply calculate 2% of the total amount.</i>
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">How to Register and Declare</h2>
                            <p>
                                You cannot simply deduct the money and keep it; it must be paid to the fund. You must register as a domestic employer and register your domestic worker.
                            </p>
                            <ol className="list-decimal pl-6 space-y-3">
                                <li><b>Register the Employer:</b> Submit a UI-8D form.</li>
                                <li><b>Register the Employee:</b> Submit a UI-19 form.</li>
                                <li><b>Monthly Declarations:</b> Every month, you must declare the hours worked and the salary paid, and pay the 2% contribution. Most employers do this electronically via the uFiling portal.</li>
                            </ol>
                            <p>
                                Payment is due by the <b>7th of every month</b> for the previous month&apos;s pay cycle.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">What Happens if You Don&apos;t Pay?</h2>
                            <p>
                                Failing to register for UIF or failing to pay the monthly contributions is a criminal offense. If your domestic worker leaves your employment (e.g., dismissal, retrenchment, or the end of a contract) or goes on maternity leave, they will go to the Department of Labour to claim their benefits. 
                            </p>
                            <p>
                                If the Department finds that you have not been paying your contributions, you will be liable for all back-pay, plus penalties, and interest.
                            </p>
                        </section>

                    </div>

                    <div className="pt-8 mt-12 border-t border-[var(--border)]">
                        <div className="bg-[var(--surface-raised)] rounded-2xl p-8 text-center space-y-4">
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Automate your calculations</h3>
                            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                                Use LekkerLedger&apos;s free minimum wage and UIF calculator to instantly get the correct deductions for this month. Or use our payroll tool to generate a compliant payslip automatically.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link
                                    href="/calculator"
                                    className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[var(--surface-1)] border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors w-full sm:w-auto"
                                >
                                    Use Quick Calculator
                                </Link>
                                <Link
                                    href="/payroll/new"
                                    className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-colors w-full sm:w-auto"
                                >
                                    Generate Payslip
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-[var(--border)] space-y-4">
                        <h3 className="font-bold text-[var(--text)]">Official Verification Links</h3>
                        <a 
                            href="https://www.ufiling.co.za" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline mr-6"
                        >
                            Official uFiling Portal <ExternalLink className="h-3 w-3" />
                        </a>
                        <a 
                            href="https://www.sars.gov.za/tax-types/uif/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                        >
                            SARS UIF Information <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>

                </article>
            </main>
        </div>
    );
}
