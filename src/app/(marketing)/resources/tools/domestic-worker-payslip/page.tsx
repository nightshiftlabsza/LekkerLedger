import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { FreePayslipGenerator } from "@/components/marketing/free-payslip-generator";
import { ComplianceDisclaimer } from "@/components/seo/compliance-disclaimer";
import { JsonLd, breadcrumbSchema } from "@/components/seo/json-ld";
import { CANONICAL_SITE_URL, pageOG } from "@/lib/seo";

const pageTitle = "Free Domestic Worker Payslip Template & Generator | LekkerLedger";
const pageDescription = "Create a domestic worker payslip template and PDF for this month. Enter the pay details and email yourself one free payslip each calendar month.";

export const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    alternates: {
        canonical: "/resources/tools/domestic-worker-payslip",
    },
    ...pageOG(pageTitle, pageDescription, "/resources/tools/domestic-worker-payslip"),
};

const helperItems = [
    "Employer and worker details",
    "Pay period for this month",
    "Wages, deductions, and actual amount paid",
    "Hours and rates where they matter",
];

const supportingLinks = [
    { href: "/uif-calculator", label: "UIF deduction calculator" },
    { href: "/resources/guides/uif-for-domestic-workers", label: "How UIF works for domestic workers" },
    { href: "/resources/checklists/household-employer-monthly", label: "Monthly household employer checklist" },
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
                        <h1 className="type-h1" style={{ color: "var(--text)" }}>Free Domestic Worker Payslip Template &amp; Generator</h1>
                        <p className="text-base leading-7 sm:text-lg" style={{ color: "var(--text-muted)" }}>
                            Create a domestic worker payslip template and PDF for this month. Enter the pay details, check the figures, and email yourself one free payslip per email address each calendar month.
                        </p>
                        <p className="text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                            Where UIF applies, it should be shown clearly. LekkerLedger shows UIF clearly when it applies.
                        </p>
                    </div>
                </section>

                <section className="marketing-tool-reading mb-10">
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h2 className="type-h3 font-semibold" style={{ color: "var(--text)" }}>What this includes</h2>
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
                                Free covers one emailed payslip each calendar month. Paid plans keep leave, contracts, documents, exports, and longer history together.{" "}
                                <Link href="/pricing" className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline">
                                    See the paid plans
                                </Link>{" "}
                                when you need more than the free page.
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
                name: "Free Domestic Worker Payslip Template & Generator",
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
                { name: "Domestic Worker Payslip Template & Generator", path: "/resources/tools/domestic-worker-payslip" },
            ])} />
        </div>
    );
}
