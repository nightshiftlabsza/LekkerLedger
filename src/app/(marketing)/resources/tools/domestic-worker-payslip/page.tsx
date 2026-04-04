import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { FreePayslipGenerator } from "@/components/marketing/free-payslip-generator";
import { ComplianceDisclaimer } from "@/components/seo/compliance-disclaimer";
import { JsonLd, breadcrumbSchema } from "@/components/seo/json-ld";
import { CANONICAL_SITE_URL } from "@/lib/seo";

export const metadata = {
    title: "Free Domestic Worker Payslip Generator | LekkerLedger",
    description: "Create a domestic worker payslip PDF for this month. Enter the pay details and we will email one free payslip PDF per email address each calendar month.",
    alternates: {
        canonical: "/resources/tools/domestic-worker-payslip",
    },
};

export default function PayslipGeneratorPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />
            <main className="marketing-tool-shell py-10 sm:py-14">
                <div className="mb-8">
                    <Link
                        href="/resources/tools"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to tools
                    </Link>
                </div>

                <section className="mb-10 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-8 shadow-[var(--shadow-md)] sm:px-8 sm:py-10">
                    <div className="marketing-tool-reading mx-auto space-y-4 text-center">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">Free domestic worker payslip tool</p>
                        <h1 className="type-h1" style={{ color: "var(--text)" }}>Create this month&apos;s payslip</h1>
                        <p className="text-base leading-7 sm:text-lg" style={{ color: "var(--text-muted)" }}>
                            Enter the month, pay rate, normal days worked, and any extra hours. We email the PDF after a successful send, with one free payslip per email address each calendar month.
                        </p>
                    </div>
                </section>

                <FreePayslipGenerator />

                <div className="mx-auto mt-16 max-w-3xl space-y-10">
                    {/* Related Resources */}
                    <div className="space-y-4">
                        <h2 className="type-h3 font-semibold" style={{ color: "var(--text)" }}>Related Resources</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                { href: "/calculator", label: "Wage & UIF Calculator" },
                                { href: "/uif-calculator", label: "UIF-Specific Calculator" },
                                { href: "/resources/guides/uif-for-domestic-workers", label: "UIF for Domestic Workers Guide" },
                                { href: "/resources/guides/domestic-worker-minimum-wage-2026", label: "2026 Minimum Wage Guide" },
                                { href: "/resources/checklists/household-employer-monthly", label: "Monthly Compliance Checklist" },
                                { href: "/resources/guides/4-hour-minimum-pay-rule", label: "The 4-Hour Minimum Pay Rule" },
                            ].map((link) => (
                                <Link key={link.href} href={link.href} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-sm font-medium transition-colors hover:border-[var(--primary)]/40" style={{ color: "var(--text)" }}>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <ComplianceDisclaimer />
                </div>
            </main>

            <JsonLd schema={{
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Domestic Worker Payslip Generator",
                url: `${CANONICAL_SITE_URL}/resources/tools/domestic-worker-payslip`,
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "ZAR",
                },
                description: "Create a domestic worker payslip PDF for this month. Enter the pay details and we will email one free payslip PDF per email address each calendar month.",
            }} />
            <JsonLd schema={breadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Resources", path: "/resources" },
                { name: "Tools", path: "/resources/tools" },
                { name: "Payslip Generator", path: "/resources/tools/domestic-worker-payslip" },
            ])} />
        </div>
    );
}
