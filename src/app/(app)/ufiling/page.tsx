import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { ArrowRight, CircleAlert, Download, FileSpreadsheet, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UFilingClient } from "@/components/ufiling/ufiling-client";

export default function UFilingPage() {
    const guideSteps = [
        {
            title: "What this exports",
            body: "Generate a UIF CSV from locked payroll records so you can upload the figures to uFiling and review them before submission.",
            icon: FileSpreadsheet,
        },
        {
            title: "Who it is for",
            body: "Household employers who already ran payroll for the month and need a cleaner way to prepare the UIF declaration figures.",
            icon: UserRoundCheck,
        },
        {
            title: "What you need first",
            body: "A UIF reference number, employee ID details, and at least one locked payroll month so the export reflects a reviewed record.",
            icon: ShieldCheck,
        },
    ] as const;

    return (
        <div className="space-y-6 pb-20">
            <PageHeader title="uFiling Export" subtitle="Prepare UIF declaration CSV files for uFiling and the Department of Employment and Labour process" />
            <Card className="border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]">
                <CardContent className="space-y-5 p-4 sm:p-6">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] xl:items-start">
                        <div className="space-y-4">
                            <p className="max-w-[62ch] text-sm leading-6 text-[var(--text-muted)]">
                                This page helps you prepare the CSV file for UIF submission. LekkerLedger prepares the export from your payroll records, but you still review and submit it in the official uFiling process.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <a href="#ufiling-export-tool" className="sm:w-auto">
                                    <Button className="w-full sm:w-auto h-11 rounded-xl bg-[var(--primary)] px-5 font-bold text-white hover:bg-[var(--primary-hover)] gap-2">
                                        Generate UIF CSV <Download className="h-4 w-4" />
                                    </Button>
                                </a>
                                <Link
                                    href="https://www.ufiling.co.za/uif/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--primary)]/25 hover:text-[var(--primary)]"
                                >
                                    Official uFiling help <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div
                            className="rounded-[24px] border border-[var(--focus)]/20 px-4 py-4 text-sm leading-6"
                            style={{ background: "linear-gradient(180deg, rgba(255,252,248,0.98) 0%, rgba(196,122,28,0.06) 100%)" }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-xl bg-[var(--focus)]/12 p-2 text-[var(--focus)]">
                                    <CircleAlert className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Verify before submission</p>
                                    <p className="text-sm text-[var(--text)]">
                                        Check the export against the latest Department of Employment and Labour guidance. LekkerLedger prepares the figures, but it does not submit on your behalf.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {guideSteps.map((step) => {
                            const Icon = step.icon;

                            return (
                                <div key={step.title} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-[var(--primary)]">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-sm font-black text-[var(--text)]">{step.title}</h2>
                                            <p className="text-sm leading-6 text-[var(--text-muted)]">{step.body}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
            <div id="ufiling-export-tool" className="scroll-mt-24">
                <UFilingClient />
            </div>
        </div>
    );
}
