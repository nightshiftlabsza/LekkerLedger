import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calculator, CheckSquare } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { pageOG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Household Employment Resources | LekkerLedger",
  description: "Guides, tools, and checklists for South African household employers. Everything you need to manage domestic worker compliance.",
  alternates: {
    canonical: "/resources",
  },
  ...pageOG(
    "Household Employment Resources | LekkerLedger",
    "Guides, tools, and checklists for South African household employers. Everything you need to manage domestic worker compliance.",
    "/resources",
  ),
};

const resourceSections = [
    {
        title: "Tools & Calculators",
        description: "Interactive tools to calculate wages, UIF, and generate payslips.",
        icon: Calculator,
        href: "/resources/tools",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        items: [
            { name: "UIF & Wage Calculator", href: "/calculator" },
            { name: "Free Payslip Generator", href: "/resources/tools/domestic-worker-payslip" },
            { name: "UIF-Specific Calculator", href: "/uif-calculator" },
            { name: "Fix uFiling Errors", href: "/ufiling-errors" },
        ]
    },
    {
        title: "Guides & Rules",
        description: "Clear explanations of South African labour laws for domestic workers.",
        icon: BookOpen,
        href: "/resources/guides",
        color: "text-[var(--primary)]",
        bg: "bg-[var(--primary)]/10",
        items: [
            { name: "UIF for Domestic Workers", href: "/resources/guides/uif-for-domestic-workers" },
            { name: "2026 Minimum Wage", href: "/resources/guides/domestic-worker-minimum-wage-2026" },
            { name: "The 4-Hour Minimum Pay Rule", href: "/resources/guides/4-hour-minimum-pay-rule" },
            { name: "CCMA & Disciplinary Guide", href: "/resources/guides/ccma-and-disciplinary-procedures" },
            { name: "COIDA & ROE Guide", href: "/resources/guides/coida-and-roe-compliance" },
        ]
    },
    {
        title: "Checklists",
        description: "Step-by-step guides to ensure you're meeting all your monthly and annual obligations.",
        icon: CheckSquare,
        href: "/resources/checklists",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        items: [
            { name: "Household Employer Monthly Checklist", href: "/resources/checklists/household-employer-monthly" },
        ]
    }
];

export default function ResourcesHub() {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main className="flex-1 px-4 py-10 sm:py-16 content-container-wide">
                <div className="space-y-12 max-w-5xl mx-auto">
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to home
                        </Link>
                        <h1 className="type-h1" style={{ color: "var(--text)" }}>
                            Household Employment Resources
                        </h1>
                        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
                            Everything you need to confidently manage your household employees in South Africa. From free payslip generators to plain-English guides on labour laws.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {resourceSections.map((section) => (
                            <div key={section.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 sm:p-8 shadow-sm transition-shadow hover:shadow-md flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl ${section.bg}`}>
                                        <section.icon className={`h-6 w-6 ${section.color}`} />
                                    </div>
                                    <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                                        <Link href={section.href} className="hover:underline">
                                            {section.title}
                                        </Link>
                                    </h2>
                                </div>
                                <p className="text-sm mb-6 flex-1" style={{ color: "var(--text-muted)" }}>{section.description}</p>
                                
                                <div className="space-y-3">
                                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Popular</p>
                                    <ul className="space-y-2">
                                        {section.items.map(item => (
                                            <li key={item.name}>
                                                <Link href={item.href} className="text-sm font-medium hover:underline text-[var(--primary)]">
                                                    {item.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] p-8 text-center space-y-4">
                        <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Looking to automate your household payroll?</h3>
                        <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger helps you generate compliant payslips, track UIF, and securely store employment records, all from your phone.
                        </p>
                        <Link href="/resources/tools/domestic-worker-payslip" className="inline-block mt-4 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] transition-colors">
                            Try the free payslip tool
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
