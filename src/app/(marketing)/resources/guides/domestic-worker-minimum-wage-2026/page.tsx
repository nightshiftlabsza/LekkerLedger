import Link from "next/link";
import { ArrowLeft, ExternalLink, Calculator, DollarSign, Info, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata = {
  title: "2026 Domestic Worker Minimum Wage Guide | LekkerLedger",
  description: "A complete guide to the 2026 South African National Minimum Wage for domestic workers, nannies, and gardeners. Current rate: R30.23 per hour.",
};

export default function NMW2026GuidePage() {
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
                                2026 Domestic Worker Minimum Wage Guide
                            </h1>
                            <p className="text-xl leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                                Navigating the annual National Minimum Wage (NMW) increases can be confusing. Here is exactly what household employers need to know for 2026.
                            </p>
                        </div>
                    </div>

                    <Alert variant="default" className="border-[var(--primary)]/20 bg-[var(--primary)]/5">
                        <Info className="h-4 w-4 text-[var(--primary)]" />
                        <AlertTitle className="text-[var(--text)] font-semibold">Current Rate: R30.23</AlertTitle>
                        <AlertDescription className="text-sm text-[var(--text-muted)] leading-relaxed">
                            The National Minimum Wage for domestic workers is currently gazetted at <b>R30.23 per ordinary hour worked</b>. Ensure all your contracts and payslips meet or exceed this rate.
                        </AlertDescription>
                    </Alert>

                    <div className="prose prose-slate max-w-none text-base leading-relaxed space-y-8" style={{ color: "var(--text-muted)" }}>
                        
                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Equalization is Complete</h2>
                            <p>
                                Historically, domestic workers (which includes gardeners, nannies, caregivers, and domestic drivers) had a lower minimum wage tier than general workers. 
                                However, as of recent years, domestic worker wages have been 100% equalized with the National Minimum Wage. There is no longer a &quot;discounted&quot; tier for domestic labor.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Calculating Daily and Monthly Wages</h2>
                            <p>
                                The law sets an <i>hourly</i> minimum wage. Therefore, daily and monthly minimums depend entirely on the hours agreed upon in your employment contract.
                            </p>
                            
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-[var(--text)]">Standard 8-Hour Day</h3>
                                        <DollarSign className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <p className="text-sm border-b border-[var(--border)] pb-2">8 hours × R30.23</p>
                                    <p className="text-lg font-bold text-[var(--text)]">R241.84 per day</p>
                                </div>
                                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-[var(--text)]">Standard Full Month (21.67 Days)</h3>
                                        <DollarSign className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <p className="text-sm border-b border-[var(--border)] pb-2">173.33 hours × R30.23</p>
                                    <p className="text-lg font-bold text-[var(--text)]">R5,240.24 per month</p>
                                </div>
                            </div>
                            <p className="text-xs mt-2"><i>Note: 21.67 is the standard Department of Employment and Labour multiplier for average working days in a month for a 5-day week.</i></p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Are there any exemptions?</h2>
                            <p>
                                No. It is illegal to pay below the National Minimum Wage, even if the domestic worker agrees to it. A contract clause agreeing to a rate lower than R30.23/hr is legally void and unenforceable. 
                            </p>
                            <p>
                                Furthermore, you cannot calculate the value of &quot;payment in kind&quot; (such as free accommodation, transport allowances, or food rations) to make up the R30.23 minimum. <b>The R30.23 must be paid in cash (or EFT) for ordinary hours worked.</b> Allowances are calculated in addition to this minimum base.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">The Short Shift Rule</h2>
                            <p>
                                Keep in mind Section 9A of the BCEA: If your domestic worker comes in for a shift that is shorter than four hours (e.g., they come in to quickly iron for 2 hours), <b>you must still pay them for a minimum of four hours.</b>
                            </p>
                            <Link href="/resources/guides/4-hour-minimum-pay-rule" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline">
                                Read our full guide on the 4-Hour Minimum Pay Rule <ArrowRight className="h-4 w-4" />
                            </Link>
                        </section>

                    </div>

                    <div className="pt-8 mt-12 border-t border-[var(--border)]">
                        <div className="bg-[var(--surface-raised)] rounded-2xl p-8 text-center space-y-4">
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Never worry about rate changes again</h3>
                            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                                LekkerLedger automatically updates its internal calculator every time the government gazettes a new minimum wage. When you generate a payslip, we&apos;ll warn you if the calculated rate drops below the legal minimum for that specific date.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link
                                    href="/calculator"
                                    className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[var(--surface-1)] border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors w-full sm:w-auto gap-2"
                                >
                                    <Calculator className="h-4 w-4" /> Check your math
                                </Link>
                                <Link
                                    href="/payroll/new"
                                    className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-colors w-full sm:w-auto"
                                >
                                    Generate a Compliant Payslip
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-[var(--border)] space-y-4">
                        <h3 className="font-bold text-[var(--text)]">Official Verification Links</h3>
                        <a 
                            href="https://www.labour.gov.za" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                        >
                            Department of Employment and Labour <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>

                </article>
            </main>
        </div>
    );
}


