import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata = {
  title: "Household Payroll Tools & Calculators | LekkerLedger",
  description: "Free tools to calculate UIF, domestic worker wages, and generate compliant South African payslips.",
  alternates: {
    canonical: "/resources/tools",
  },
};

const tools = [
    {
        title: "Free Payslip Generator",
        description: "Create a fully compliant payslip for your domestic worker in minutes. It handles the mandatory fields like ordinary hours, minimum wage checks, and UIF deductions.",
        href: "/resources/tools/domestic-worker-payslip",
        type: "Generator"
    },
    {
        title: "UIF & Wage Calculator",
        description: "A quick calculator to run the numbers on gross pay, the 1%+1% UIF contribution, and net pay before you commit.",
        href: "/calculator",
        type: "Calculator"
    },
    {
        title: "UIF-Specific Calculator",
        description: "Enter a monthly salary and instantly see the employee and employer UIF contributions with a plain-English explanation of how UIF works.",
        href: "/uif-calculator",
        type: "Calculator"
    },
    {
        title: "uFiling Error Troubleshooter",
        description: "Fix common uFiling portal errors like session timeouts and 'Employee not declared' by switching to CSV uploads.",
        href: "/ufiling-errors",
        type: "Troubleshooting"
    },
];

export default function ToolsIndex() {
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
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Calculator className="h-8 w-8 text-blue-500" />
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Tools & Calculators
                            </h1>
                        </div>
                        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
                            Interactive tools to simplify the math and output the documents you need.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {tools.map((tool) => (
                            <Link key={tool.href} href={tool.href} className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-blue-500/30">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 max-w-2xl">
                                        <h2 className="text-xl font-bold group-hover:text-blue-500 transition-colors" style={{ color: "var(--text)" }}>
                                            {tool.title}
                                        </h2>
                                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            {tool.description}
                                        </p>
                                    </div>
                                    <p className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                                        {tool.type}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
