import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata = {
  title: "Household Employment Templates | LekkerLedger",
  description: "Standardised employment contracts, warning letters, and certificates for South African domestic workers.",
};

const templates = [
    {
        title: "Domestic Worker Contract Template",
        description: "A legally compliant, customisable contract covering duties, working hours, and the BCEA 9A short-shift rule.",
        href: "/resources/templates/domestic-worker-contract",
        format: "Word / PDF"
    }
];

export default function TemplatesIndex() {
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
                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                <FileText className="h-8 w-8 text-purple-500" />
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Document Templates
                            </h1>
                        </div>
                        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
                            Downloadable, customisable templates to formalise your household employment relationships.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {templates.map((template) => (
                            <Link key={template.href} href={template.href} className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-purple-500/30">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 max-w-2xl">
                                        <h2 className="text-xl font-bold group-hover:text-purple-500 transition-colors" style={{ color: "var(--text)" }}>
                                            {template.title}
                                        </h2>
                                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            {template.description}
                                        </p>
                                    </div>
                                    <p className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                                        {template.format}
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
