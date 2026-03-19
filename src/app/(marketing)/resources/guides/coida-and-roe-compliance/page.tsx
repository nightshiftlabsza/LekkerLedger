import Link from "next/link";
import { ArrowLeft, ArrowRight, Stethoscope, FileSpreadsheet, Hospital, ExternalLink } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { ComplianceDisclaimer } from "@/components/seo/compliance-disclaimer";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata = {
  title: "COIDA & Return of Earnings Guide for Domestic Employers | LekkerLedger",
  description: "Understand your legal obligations for the Compensation Fund (COIDA) and annual Return of Earnings (ROE) for domestic workers in South Africa.",
  alternates: {
    canonical: "/resources/guides/coida-and-roe-compliance",
  },
};

export default function COIDAGuidePage() {
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
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Stethoscope className="h-6 w-6 text-blue-500" />
                                </div>
                                <span className="type-label text-[var(--text)]">Risk Management Hub</span>
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                COIDA & Return of Earnings (ROE)
                            </h1>
                            <p className="text-xl leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                                Historically excluded, domestic workers are now fully covered by the Compensation for Occupational Injuries and Diseases Act (COIDA). Here is what household employers must do.
                            </p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-base leading-relaxed space-y-8" style={{ color: "var(--text-muted)" }}>
                        
                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">What is COIDA?</h2>
                            <p>
                                COIDA provides for compensation to employees who are injured, contract a disease, or are killed as a result of their work. Think of it as mandatory workplace injury insurance administered by the state.
                            </p>
                            <p>
                                Following a landmark 2020 Constitutional Court ruling, <b>domestic workers can now claim from the Compensation Fund</b> if they are injured on duty (e.g., falling off a ladder while cleaning windows, or a severe burn/chemical exposure while working).
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">Are all household employers required to register?</h2>
                            <p>
                                Yes. Just like UIF, if you employ a domestic worker, gardener, nanny, or driver, you are legally obligated to register with the Compensation Fund as an employer of domestic staff. 
                            </p>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-3 mt-4">
                                <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                                    <Hospital className="h-5 w-5 text-red-500" />
                                    The Risk of Non-Compliance
                                </h3>
                                <p className="text-sm">
                                    If your unregistered employee is severely injured on your property while performing their duties, they can still claim from the Fund. However, the Fund will then investigate you. <b>You can be held personally and criminally liable for their medical bills, long-term disability payouts, plus severe penalties from the Department of Labour equivalent to the capitalized value of the claim.</b> The financial risk to the employer is massive.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">How much does it cost?</h2>
                            <p>
                                Unlike UIF (which is a monthly 2% deduction), COIDA is an <b>annual, employer-only payment.</b> You cannot deduct a cent of the COIDA assessment from your employee&apos;s wages.
                            </p>
                            <p>
                                Every year, the Compensation Commissioner sets industry-specific assessment rates. Domestic employers are classified under a specific low-risk sub-class. You pay a tiny percentage (often around 1% or less) of the <i>total annual earnings</i> of your domestic staff.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="type-h2 text-[var(--text)] font-semibold">What is the &quot;Return of Earnings&quot; (ROE)?</h2>
                            <p>
                                Because COIDA is based on how much you pay your staff annually, you must tell the Department how much you paid them. This process is called submitting the <b>Return of Earnings (ROE)</b>.
                            </p>
                            
                            <div className="space-y-4 mt-6">
                                <div className="flex gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
                                    <FileSpreadsheet className="h-6 w-6 text-blue-500 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-[var(--text)] text-sm mb-1">The Filing Season</h3>
                                        <p className="text-sm">The ROE filing season usually opens in April and closes at the end of May every year. You must declare the exact total amount paid to your employee(s) between 1 March of the previous year and 28 February of the current year.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
                                    <FileSpreadsheet className="h-6 w-6 text-emerald-500 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-[var(--text)] text-sm mb-1">The Notice of Assessment</h3>
                                        <p className="text-sm">After you submit your ROE online, the system automatically generates a &quot;Notice of Assessment&quot; (an invoice). You then have 30 days to pay that invoice directly to the Compensation Fund to remain in good standing.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>

                    <ComplianceDisclaimer />

                    {/* Related Guides */}
                    <div className="space-y-4">
                        <h2 className="type-h3 font-semibold" style={{ color: "var(--text)" }}>Related Guides</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                { href: "/resources/guides/ccma-and-disciplinary-procedures", label: "CCMA & Disciplinary Procedures" },
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
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Simplify your annual ROE filing</h3>
                            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                                When ROE season arrives, many employers scramble to reconstruct their annual wage bill from bank statements. LekkerLedger tracks payslip totals throughout the year so the figures are ready when you need them.
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
                                    Automate Record-Keeping
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--border)] mt-8 space-y-4">
                        <h3 className="font-bold text-[var(--text)]">Official Verification Links</h3>
                        <a
                            href="https://cfonline.labour.gov.za"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                        >
                            Compeasy Portal (Online filing) <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </article>

                <JsonLd schema={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: [
                        {
                            "@type": "Question",
                            name: "Do domestic employers need to register for COIDA in South Africa?",
                            acceptedAnswer: {
                                "@type": "Answer",
                                text: "Yes. Following a Constitutional Court ruling, domestic workers are covered by COIDA. Household employers must register with the Compensation Fund. Visit the Compeasy portal (cfonline.labour.gov.za) for current registration requirements.",
                            },
                        },
                        {
                            "@type": "Question",
                            name: "When is the Return of Earnings due for domestic employers?",
                            acceptedAnswer: {
                                "@type": "Answer",
                                text: "The ROE filing season typically opens in April and closes at the end of May each year. You declare the total amount paid to employees between 1 March of the previous year and 28 February of the current year. Check the Compeasy portal for the current year's exact deadlines.",
                            },
                        },
                    ],
                }} />
            </main>
        </div>
    );
}
