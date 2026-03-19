import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata = {
  title: "Household Employment Guides | LekkerLedger",
  description: "Plain-English guides on South African labour laws for domestic workers. Understand UIF, minimum wage, and BCEA rules.",
  alternates: {
    canonical: "/resources/guides",
  },
};

const guides = [
    {
        title: "UIF for Domestic Workers",
        description: "The complete guide to understanding the 24-hour rule, calculating 1%+1% deductions, and managing declaring your employee.",
        href: "/resources/guides/uif-for-domestic-workers",
    },
    {
        title: "2026 Minimum Wage Guide",
        description: "What the National Minimum Wage changes mean for your household, and how to stay compliant with R30.23/hr.",
        href: "/resources/guides/domestic-worker-minimum-wage-2026",
    },
    {
        title: "The 4-Hour Minimum Pay Rule",
        description: "Understanding BCEA Section 9A: Why you must pay for at least four hours even if your employee works less.",
        href: "/resources/guides/4-hour-minimum-pay-rule",
    },
    {
        title: "CCMA & Disciplinary Guide",
        description: "How to handle warnings, fair dismissals, and documentation before a domestic worker dispute reaches the CCMA.",
        href: "/resources/guides/ccma-and-disciplinary-procedures",
    },
    {
        title: "COIDA & Return of Earnings",
        description: "What domestic employers must do for Compensation Fund registration, annual ROE filing, and injury-risk compliance.",
        href: "/resources/guides/coida-and-roe-compliance",
    },
    {
        title: "uFiling Errors & CSV Uploads",
        description: "Fix common uFiling portal errors like session timeouts and 'Employee not declared' by switching to CSV uploads.",
        href: "/ufiling-errors",
    },
];

export default function GuidesIndex() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main className="flex-1 px-4 py-10 sm:py-16 content-container-wide">
                <div className="space-y-12 max-w-4xl mx-auto">
                    <div className="space-y-4">
                        <Link
                            href="/resources"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to resources
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary)]/10 rounded-xl">
                                <BookOpen className="h-8 w-8 text-[var(--primary)]" />
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Compliance Guides
                            </h1>
                        </div>
                        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
                            Plain-English guides translating South African labour law into practical steps for household employers.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {guides.map((guide) => (
                            <Link key={guide.href} href={guide.href} className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-[var(--primary)]/30">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 max-w-2xl">
                                        <h2 className="text-xl font-bold group-hover:text-[var(--primary)] transition-colors" style={{ color: "var(--text)" }}>
                                            {guide.title}
                                        </h2>
                                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            {guide.description}
                                        </p>
                                    </div>
                                    <span className="text-[var(--primary)] group-hover:translate-x-1 transition-transform text-sm">&rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
