import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Download, Calculator } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Free Domestic Worker Payslip Generator | LekkerLedger",
  description: "Create compliant South African payslips for your domestic worker in minutes. Automatic UIF and minimum wage calculations.",
};

export default function PayslipGeneratorPage() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main className="flex-1">
                {/* HERO SECTION */}
                <section className="px-4 py-16 sm:py-24 content-container-wide">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <Link
                            href="/resources/tools"
                            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to tools
                        </Link>
                        <h1 className="type-h1 max-w-3xl mx-auto" style={{ color: "var(--text)" }}>
                            Free Domestic Worker Payslip Generator
                        </h1>
                        <p className="text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
                            Generate legally compliant South African payslips in minutes. We handle the math for minimum wage bounds and the 1%+1% UIF calculation.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link href="#payslip-rules">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full shadow-md">
                                    <Calculator className="mr-2 h-5 w-5" />
                                    See payslip requirements
                                </Button>
                            </Link>
                            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Free path. No credit card. No dashboard account needed.</span>
                        </div>
                    </div>
                </section>

                {/* WHY USE LEKKERLEDGER SECTION */}
                <section className="bg-[var(--surface-1)] border-y border-[var(--border)] px-4 py-16">
                    <div className="max-w-5xl mx-auto content-container-wide">
                        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
                            <div className="space-y-4">
                                <div className="mx-auto md:mx-0 h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Fully Compliant</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Includes all mandatory Department of Employment and Labour fields, ensuring you meet BCEA record-keeping requirements.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="mx-auto md:mx-0 h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <ShieldCheck className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Auto-Calculations</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Automatically calculates the correct 1% UIF deduction and triggers warnings if pay dips below the National Minimum Wage.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="mx-auto md:mx-0 h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                                    <Download className="h-6 w-6 text-purple-500" />
                                </div>
                                <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Professional PDF</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Generates a clean, professional PDF that you can instantly share via WhatsApp or email with your employee.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SEO CONTENT SECTION */}
                <section className="px-4 py-16 content-container sm:py-24">
                    <div className="max-w-3xl mx-auto space-y-12">
                        <div id="payslip-rules" className="space-y-6">
                            <h2 className="type-h2" style={{ color: "var(--text)" }}>What must a South African payslip include?</h2>
                            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                According to Section 33 of the Basic Conditions of Employment Act (BCEA), household employers must provide domestic workers with written particulars of payment. A compliant payslip must include:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Employer's name and address",
                                    "Employee's name and occupation (e.g., Domestic Worker, Gardener)",
                                    "The period for which the payment is made",
                                    "The employee's remuneration in money (Gross Pay)",
                                    "Any deductions made (e.g., UIF)",
                                    "The actual amount paid to the employee (Net Pay)",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" />
                                        <span className="text-base" style={{ color: "var(--text-muted)" }}>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h2 className="type-h2" style={{ color: "var(--text)" }}>How LekkerLedger helps</h2>
                            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Creating a payslip manually every month is tedious and error-prone. Our generator is built specifically for the South African context. It knows the current National Minimum Wage and automatically calculates the 1% UIF deduction. Wait, there&apos;s more—when you generate a payslip through LekkerLedger, we automatically save the record for the mandatory 3-year retention period required by law.
                            </p>
                        </div>

                        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-6">
                            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Need the full paid dashboard as well?</h3>
                            <Link href="/pricing" className="inline-block">
                                <Button size="lg" className="h-12 px-8 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full">
                                    View paid plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
