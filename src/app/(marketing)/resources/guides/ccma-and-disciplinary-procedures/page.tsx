import Link from "next/link";
import { ArrowLeft, ArrowRight, Gavel, AlertOctagon, FileWarning, ExternalLink } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { ComplianceDisclaimer } from "@/components/seo/compliance-disclaimer";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata = {
  title: "CCMA & Disciplinary Guide for Domestic Employers | LekkerLedger",
  description: "How to handle warnings, fair dismissals, and CCMA disputes with your domestic worker in South Africa. Protect yourself with proper documentation.",
  alternates: {
    canonical: "/resources/guides/ccma-and-disciplinary-procedures",
  },
};

export default function CCMAGuidePage() {
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
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <Gavel className="h-6 w-6 text-red-500" />
                                </div>
                                <span className="type-label text-[var(--text)]">Risk Management Hub</span>
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Disciplinary Procedures & The CCMA
                            </h1>
                            <p className="text-xl leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                                The Commission for Conciliation, Mediation and Arbitration (CCMA) handles thousands of unresolved domestic worker disputes every year. Here is how household employers can ensure procedural and substantive fairness.
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-base leading-relaxed space-y-8" style={{ color: "var(--text-muted)" }}>
                        
                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">The Myth of &quot;Just Firing Them&quot;</h2>
                            <p>
                                A common misconception among South African household employers is that domestic workers can be dismissed without consequence, or simply be given a month&apos;s pay in lieu of notice and asked to leave immediately. <b>This is illegal and will almost certainly result in a CCMA dispute for Unfair Dismissal.</b>
                            </p>
                            <p>
                                By law, a dismissal must satisfy two criteria:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><b>Substantive Fairness:</b> Was there a valid, irrefutable reason to dismiss them? (e.g., ongoing misconduct, verifiable theft, or operational requirements/retrenchment).</li>
                                <li><b>Procedural Fairness:</b> Was the correct, legally defined process followed before the dismissal? (e.g., progressive warnings, a formal hearing, the right to represent themselves).</li>
                            </ul>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 mt-4">
                                <p className="text-sm font-bold text-red-500">
                                    Failure on either front can result in the CCMA ordering the employer to pay up to 12 months&apos; salary in compensation to the employee.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Progressive Discipline (Warnings)</h2>
                            <p>
                                Except for cases of severe gross misconduct (like assault, proven theft, or extreme insubordination), you cannot dismiss an employee for a first offense. You must follow a track of progressive discipline.
                            </p>
                            
                            <div className="space-y-4 mt-6">
                                <div className="flex gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
                                    <FileWarning className="h-6 w-6 text-amber-500 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-[var(--text)] text-sm mb-1">1. Verbal Warning</h3>
                                        <p className="text-sm">For minor infractions (e.g., occasional late arrival). Even though it&apos;s &quot;verbal&quot;, you must document the date, time, and topic discussed in a logbook or your digital vault.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
                                    <FileWarning className="h-6 w-6 text-orange-500 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-[var(--text)] text-sm mb-1">2. First Written Warning</h3>
                                        <p className="text-sm">If the behavior repeats. Usually valid for 3 to 6 months. Must be signed by the employee to acknowledge receipt (they are not agreeing to the charge, only that they received the document).</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
                                    <AlertOctagon className="h-6 w-6 text-red-500 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-[var(--text)] text-sm mb-1">3. Final Written Warning</h3>
                                        <p className="text-sm">If the behavior continues despite previous warnings. Usually valid for 12 months. States clearly that further infractions will lead to a disciplinary hearing and possible dismissal.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">The Disciplinary Hearing</h2>
                            <p>
                                Even if the employee commits an instantly dismissable offense (gross misconduct) or has exhausted their final written warning, <b>you must hold a disciplinary hearing</b> before terminating the contract.
                            </p>
                            <p>The employee has the right to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Be notified of the hearing and the charges in writing at least 48 hours in advance.</li>
                                <li>Have an interpreter present.</li>
                                <li>Bring a representative (a fellow employee or union rep, but generally not an outside lawyer unless agreed upon).</li>
                                <li>State their case, bring witnesses, and question the employer&apos;s evidence.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Why Documentation is Everything</h2>
                            <p>
                                If a dispute reaches the CCMA, the Commissioner will ask for a &quot;Paper Trail&quot;. If you have no signed employment contract, no attendance records, no payslips, and no signed warning letters, the CCMA will likely side with the employee&apos;s version of events.
                            </p>
                            <p className="font-medium text-[var(--text)]">
                                Memory is not evidence. A digitally signed, timestamped document is.
                            </p>
                        </section>

                    </div>

                    <ComplianceDisclaimer />

                    {/* Related Guides */}
                    <div className="space-y-4">
                        <h2 className="type-h3 font-semibold" style={{ color: "var(--text)" }}>Related Guides</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                { href: "/resources/guides/coida-and-roe-compliance", label: "COIDA & Return of Earnings" },
                                { href: "/resources/guides/uif-for-domestic-workers", label: "UIF for Domestic Workers" },
                                { href: "/resources/checklists/household-employer-monthly", label: "Monthly Compliance Checklist" },
                                { href: "/resources/tools/domestic-worker-payslip", label: "Free Payslip Generator" },
                            ].map((link) => (
                                <Link key={link.href} href={link.href} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-sm font-medium transition-colors hover:border-[var(--primary)]/40" style={{ color: "var(--text)" }}>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 mt-12 border-t border-[var(--border)]">
                        <div className="bg-[var(--surface-raised)] rounded-2xl p-8 text-center space-y-4 border border-[var(--border)]">
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Keep your documentation organised</h3>
                            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                                Finding a warning letter from months ago is difficult during a dispute. LekkerLedger Pro provides secure, cloud-based record storage for payslips, contracts, and warnings.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[var(--surface-1)] border border-[var(--border)] text-sm font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors w-full sm:w-auto"
                                >
                                    Compare Plans
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[var(--primary)] text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-colors w-full sm:w-auto"
                                >
                                    Start Using LekkerLedger
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--border)] mt-8 space-y-4">
                        <h3 className="font-bold text-[var(--text)]">Official Verification Links</h3>
                        <a
                            href="https://www.ccma.org.za"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                        >
                            Visit the Official CCMA Website <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </article>

                <JsonLd schema={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: [
                        {
                            "@type": "Question",
                            name: "Can I dismiss my domestic worker without a hearing in South Africa?",
                            acceptedAnswer: {
                                "@type": "Answer",
                                text: "No. South African labour law requires both substantive fairness (a valid reason) and procedural fairness (following the correct process, including a disciplinary hearing) before dismissal. Failure to meet either criterion may result in an unfair dismissal finding at the CCMA. Visit ccma.org.za for official guidance.",
                            },
                        },
                        {
                            "@type": "Question",
                            name: "What compensation can the CCMA award for unfair dismissal of a domestic worker?",
                            acceptedAnswer: {
                                "@type": "Answer",
                                text: "The CCMA may order compensation of up to 12 months' salary for an unfair dismissal finding. The exact amount depends on the circumstances. Consult the CCMA website or a labour law professional for guidance on your situation.",
                            },
                        },
                    ],
                }} />
            </main>
        </div>
    );
}
