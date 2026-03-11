import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Domestic Worker Employment Contract Template | LekkerLedger",
  description: "Download a legally compliant South African domestic worker employment contract. Fully customisable Word and PDF formats.",
};

export default function ContractTemplatePage() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main className="flex-1">
                {/* HERO SECTION */}
                <section className="px-4 py-16 sm:py-24 content-container-wide">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <Link
                            href="/resources/templates"
                            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to templates
                        </Link>
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                            <FileText className="h-8 w-8 text-purple-500" />
                        </div>
                        <h1 className="type-h1 max-w-3xl mx-auto" style={{ color: "var(--text)" }}>
                            Free Domestic Worker Contract Template
                        </h1>
                        <p className="text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
                            A formal, written agreement is required by law. Download our free, basic template to protect both you and your household employee.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700 rounded-full cursor-not-allowed opacity-70">
                                <Download className="mr-2 h-5 w-5" />
                                Download Basic PDF (Coming Soon)
                            </Button>
                            <Link href="/dashboard">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md">
                                    Unlock Pro Word Template
                                </Button>
                            </Link>
                        </div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            *Basic PDF available soon. LekkerLedger Pro users have immediate access to editable Word versions and our secure document vault.
                        </p>
                    </div>
                </section>

                {/* WHY USE A CONTRACT SECTION */}
                <section className="bg-[var(--surface-1)] border-y border-[var(--border)] px-4 py-16">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <h2 className="type-h2 text-center" style={{ color: "var(--text)" }}>Why you need a written contract</h2>
                        <div className="grid gap-6">
                            <div className="flex gap-4 p-6 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)]">
                                <ShieldCheck className="h-6 w-6 text-purple-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-[var(--text)] text-lg mb-2">It&apos;s the Law (Section 29 of the BCEA)</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        The Basic Conditions of Employment Act strictly requires employers to provide &quot;written particulars of employment&quot; to domestic workers on their first day of work. You cannot rely on a verbal agreement.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-6 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)]">
                                <ShieldCheck className="h-6 w-6 text-purple-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-[var(--text)] text-lg mb-2">Protects You at the CCMA</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        If an employment dispute goes to the Commission for Conciliation, Mediation and Arbitration (CCMA), the first document they will ask for is the signed contract. Without it, the burden of proof is heavily stacked against the employer.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-6 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)]">
                                <ShieldCheck className="h-6 w-6 text-purple-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-[var(--text)] text-lg mb-2">Sets Clear Expectations</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        A contract clearly defines working hours, expected duties, the wage agreement, and the procedure for sick leave, preventing daily misunderstandings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WHAT IT INCLUDES */}
                <section className="px-4 py-16 content-container sm:py-24">
                    <div className="max-w-3xl mx-auto space-y-12">
                        <div className="space-y-6">
                            <h2 className="type-h2" style={{ color: "var(--text)" }}>What our template covers</h2>
                            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Our domestic worker contract template is drafted based on standard Department of Employment and Labour sample structures. It includes essential clauses for:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Employer and Employee Details",
                                    "Commencement Date and Job Description",
                                    "Ordinary hours of work and the 4-Hour Minimum Pay Rule",
                                    "Wage structure (Daily/Hourly rate and total gross)",
                                    "Overtime, Sunday work, and Public Holidays",
                                    "Leave entitlements (Annual, Sick, Maternity, and Family Responsibility)",
                                    "Deductions (UIF)",
                                    "Termination conditions and notice periods",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                                        <span className="text-base" style={{ color: "var(--text-muted)" }}>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-6">
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Store documents securely in the cloud</h3>
                            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                                Printing is half the battle. You must retain employment records for 3 years. LekkerLedger Pro provides a secure digital vault for all contracts, warning letters, and certificates.
                            </p>
                            <Link href="/dashboard" className="inline-block">
                                <Button size="lg" className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                                    Access Pro Upgrades
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
