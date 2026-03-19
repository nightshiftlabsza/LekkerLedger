import Link from "next/link";
import { ArrowLeft, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata = {
  title: "The 4-Hour Minimum Pay Rule for Domestic Workers | LekkerLedger",
  description: "Understand Section 9A of the BCEA: Why South African household employers must pay for at least four hours of work, even for short shifts.",
  alternates: {
    canonical: "/resources/guides/4-hour-minimum-pay-rule",
  },
};

export default function FourHourRuleGuidePage() {
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
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                                    <Clock className="h-6 w-6 text-[var(--primary)]" />
                                </div>
                                <span className="type-label text-[var(--text)]">Labour Law Guide</span>
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                The 4-Hour Minimum Pay Rule
                            </h1>
                            <p className="text-xl leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                                A critical, often-missed piece of South African labour law that catches many household employers completely off guard.
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-base leading-relaxed space-y-8" style={{ color: "var(--text-muted)" }}>
                        
                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">What is the 4-Hour Rule?</h2>
                            <p>
                                Section 9A of the Basic Conditions of Employment Act (BCEA) guarantees a minimum daily payment for low-earning employees. It states that an employee who works for less than four hours on any day must be paid for four hours of work.
                            </p>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-4">
                                <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    The Rule stated simply:
                                </h3>
                                <p className="text-sm font-medium">
                                    If you ask your domestic worker to come in for just 2 hours to do some quick ironing or cleaning, <b>you must legally pay them for 4 hours of work.</b>
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Why does this rule exist?</h2>
                            <p>
                                The law is designed to protect vulnerable workers from exploitation and to acknowledge the fixed costs of working. From the government&apos;s perspective:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>The worker still has to pay the same amount for taxi fare whether they work for 2 hours or 8 hours.</li>
                                <li>The commute takes up a significant portion of their day.</li>
                                <li>Calling someone in for a tiny fractional shift prevents them from easily taking on another, longer job on that same day.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Who does it apply to?</h2>
                            <p>
                                Section 9A applies to any employee who earns less than the BCEA earnings threshold. Given the current threshold (which is over R250,000 per year), <b>this rule applies to virtually all domestic workers, nannies, and gardeners in South Africa.</b>
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Practical Examples</h2>
                            <p>Let&apos;s look at how this works in practice, assuming the current minimum wage of R30.23 per hour (2026 rate).</p>
                            
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-5 space-y-2">
                                    <h3 className="font-bold text-[var(--text)] text-sm uppercase tracking-wide">Wrong Way</h3>
                                    <p className="text-sm">The employer asks the gardener to come in for 2 hours to clear some dead branches.</p>
                                    <p className="text-sm">The employer pays for 2 hours (R60.46).</p>
                                    <p className="text-xs font-bold text-red-600 mt-2">Result: Illegal underpayment.</p>
                                </div>
                                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5 space-y-2">
                                    <h3 className="font-bold text-[var(--text)] text-sm uppercase tracking-wide">Right Way</h3>
                                    <p className="text-sm">The employer asks the gardener to come in for 2 hours.</p>
                                    <p className="text-sm">The employer pays for the mandatory minimum of 4 hours (R120.92).</p>
                                    <p className="text-xs font-bold text-emerald-600 mt-2">Result: Fully compliant.</p>
                                </div>
                            </div>
                            <p className="text-sm mt-4">
                                <i>Tip: If you are going to call an employee in, try to consolidate tasks so that you get the full four hours of value, as you must pay for it regardless.</i>
                            </p>
                        </section>
                        
                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">What if the employee leaves early?</h2>
                            <p>
                                If the employee was scheduled for a full day (e.g., 8 hours) but asks to go home after 2 hours for personal reasons (sick child, appointment), the rule <b>does not</b> force you to pay them for 4 hours. You only pay for the 2 hours worked, because you did not initiate the short shift.
                            </p>
                            <p>
                                However, if <i>you</i> send them home early because there is no more work or the power is out, you must honor the 4-hour minimum pay.
                            </p>
                        </section>

                    </div>

                    <div className="pt-8 mt-12 border-t border-[var(--border)]">
                        <div className="bg-[var(--surface-raised)] rounded-2xl p-8 text-center space-y-4">
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Manage fractional hours easily</h3>
                            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                                Generating a payslip with partial hours or minimum required payouts can get messy on paper. LekkerLedger helps you record exact hours and generates a spotless, compliant digital payslip in seconds.
                            </p>
                            <div className="pt-4">
                                <Link
                                    href="/payroll/new"
                                    className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-colors"
                                >
                                    Generate a Compliant Payslip
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-[var(--border)] mt-8 space-y-4">
                        <h3 className="font-bold text-[var(--text)]">Official Verification Links</h3>
                        <a 
                            href="https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/amendmentaBasic%20Conditions%20of%20Employment%20Act.pdf" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                        >
                            Read Section 9A of the BCEA Amendment Act (PDF) <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </article>
            </main>
        </div>
    );
}
