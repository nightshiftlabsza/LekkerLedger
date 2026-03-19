import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { FreePayslipGenerator } from "@/components/marketing/free-payslip-generator";
import { ComplianceDisclaimer } from "@/components/seo/compliance-disclaimer";
import { JsonLd } from "@/components/seo/json-ld";
import { CANONICAL_SITE_URL } from "@/lib/seo";

export const metadata = {
    title: "Free Domestic Worker Payslip Generator | LekkerLedger",
    description: "Create a compliant domestic worker payslip PDF in minutes. No account required. Payroll figures stay on your device until you download the PDF.",
    alternates: {
        canonical: "/resources/tools/domestic-worker-payslip",
    },
};

export default function PayslipGeneratorPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />
            <main className="content-container-wide px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <div className="mb-8">
                    <Link
                        href="/resources/tools"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to tools
                    </Link>
                </div>

                <div className="max-w-3xl mx-auto mb-10 space-y-3">
                    <h1 className="type-h1" style={{ color: "var(--text)" }}>Free Domestic Worker Payslip Generator</h1>
                    <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        South African employers must provide a written payslip to domestic workers each pay period. Enter the details below to generate a PDF payslip. No account needed — your figures stay on this device until you download.
                    </p>
                </div>

                <FreePayslipGenerator />

                <div className="max-w-3xl mx-auto mt-16 space-y-10">
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
                description: "Generate a compliant payslip PDF for your South African domestic worker. Free, no account required.",
            }} />
        </div>
    );
}
