import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";

export const metadata = {
  title: "Household Employment Checklists | LekkerLedger",
  description: "Step-by-step checklists to ensure you're meeting all your monthly and annual obligations for your domestic worker in South Africa.",
};

const checklists = [
    {
        title: "Household Employer Monthly Checklist",
        description: "Your master checklist for the month: tracking hours, generating the payslip, saving records, and declaring UIF on uFiling.",
        href: "/resources/checklists/household-employer-monthly",
        frequency: "Monthly"
    }
];

export default function ChecklistsIndex() {
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
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <CheckSquare className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h1 className="type-h1" style={{ color: "var(--text)" }}>
                                Compliance Checklists
                            </h1>
                        </div>
                        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
                            Step-by-step guides to ensure you never miss a requirement or deadline.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {checklists.map((checklist) => (
                            <Link key={checklist.href} href={checklist.href} className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/30">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 max-w-2xl">
                                        <h2 className="text-xl font-bold group-hover:text-emerald-500 transition-colors" style={{ color: "var(--text)" }}>
                                            {checklist.title}
                                        </h2>
                                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            {checklist.description}
                                        </p>
                                    </div>
                                    <p className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                                        {checklist.frequency}
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
