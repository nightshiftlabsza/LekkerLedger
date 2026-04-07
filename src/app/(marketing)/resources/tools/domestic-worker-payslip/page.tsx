import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { FreePayslipGenerator } from "@/components/marketing/free-payslip-generator";
import { ComplianceDisclaimer } from "@/components/seo/compliance-disclaimer";
import { JsonLd, breadcrumbSchema } from "@/components/seo/json-ld";
import { CANONICAL_SITE_URL, pageOG } from "@/lib/seo";

const pageTitle = "Free Domestic Worker Payslip Generator | LekkerLedger";
const pageDescription = "Create a free domestic worker payslip PDF for South Africa. Enter pay details, hours worked, and UIF to email one free payslip per month.";

export const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    alternates: {
        canonical: "/resources/tools/domestic-worker-payslip",
    },
    ...pageOG(pageTitle, pageDescription, "/resources/tools/domestic-worker-payslip"),
};

const helperItems = [
    "Create a domestic worker payslip for the current month",
    "Show UIF deducted from pay clearly",
    "Include overtime, Sunday work, and public holiday hours",
    "Email a PDF payslip for your records",
];

const supportingLinks = [
    { href: "/uif-calculator", label: "UIF calculator" },
    { href: "/resources/guides/uif-for-domestic-workers", label: "UIF for Domestic Workers Guide" },
    { href: "/resources/checklists/household-employer-monthly", label: "Monthly Compliance Checklist" },
];

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
                        <h1 className="type-h1" style={{ color: "var(--text)" }}>Free Domestic Worker Payslip Generator (South Africa)</h1>
                        <p className="text-base leading-7 sm:text-lg" style={{ color: "var(--text-muted)" }}>
                            Create a domestic worker payslip PDF for South Africa. Enter the month, pay details, and hours worked to generate a clear payslip with UIF shown separately. One free payslip PDF per email address each calendar month.
                        </p>
                    </div>
                </section>

                <section className="marketing-tool-reading mb-10">
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h2 className="type-h3 font-semibold" style={{ color: "var(--text)" }}>What this payslip generator helps with</h2>
                                <p className="text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                    Use this for a domestic worker, nanny, gardener, or caregiver employed by a South African household.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {helperItems.map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm leading-6"
                                        style={{ color: "var(--text)" }}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <FreePayslipGenerator />

                <div className="mx-auto mt-16 max-w-3xl space-y-10">
                    <div className="space-y-4">
                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                            <p className="text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                Need more than one free payslip a month?{" "}
                                <Link href="/pricing" className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline">
                                    Use LekkerLedger
                                </Link>{" "}
                                to keep monthly payslips, contracts, leave, and records together.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {supportingLinks.map((link) => (
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
                name: "Free Domestic Worker Payslip Generator",
                url: `${CANONICAL_SITE_URL}/resources/tools/domestic-worker-payslip`,
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "ZAR",
                },
                description: pageDescription,
            }} />
            <JsonLd schema={breadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Resources", path: "/resources" },
                { name: "Tools", path: "/resources/tools" },
                { name: "Domestic Worker Payslip Generator", path: "/resources/tools/domestic-worker-payslip" },
            ])} />
        </div>
    );
}
