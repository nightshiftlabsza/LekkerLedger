"use client";

import Link from "next/link";
import { ShieldCheck, ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function CoidaHelpPage() {
    return (
        <div className="space-y-6 pb-8">
            <PageHeader
                title="Compensation Fund Guide"
                subtitle="Compensation for Occupational Injuries and Diseases Act (COIDA)"
            />

            <div className="space-y-4">
                <div className="p-5 rounded-2xl" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                        <div className="space-y-2">
                            <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>What COIDA covers</h2>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                The Compensation for Occupational Injuries and Diseases Act (COIDA) covers work-related injuries and diseases through the Compensation Fund.
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                LekkerLedger helps you prepare record summaries for your annual Return of Earnings (ROE), but you must still verify details and submit through the official channels yourself. COIDA is one of the areas where the legal expectation matters, so keeping the paperwork tidy early usually saves stress later.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <h2 className="font-bold text-base mb-3" style={{ color: "var(--text)" }}>Useful links</h2>
                    <div className="space-y-3 text-sm">
                        <a href="https://www.labour.gov.za/compensation-for-occupational-injuries-and-diseases-act" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-[var(--primary)] hover:underline">
                            Official Compensation Fund guidance <ExternalLink className="h-4 w-4" />
                        </a>
                        <Link href="/compliance/coida/roe" className="flex items-center gap-2 font-semibold text-[var(--primary)] hover:underline">
                            Open the Return of Earnings (ROE) Pack
                        </Link>
                        <Link href="/help/compliance" className="flex items-center gap-2 font-semibold text-[var(--primary)] hover:underline">
            Open the household checklist
                        </Link>
                    </div>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    This guide is informational only and does not constitute legal advice. The goal is to make the rules easier to follow without alarmism, so verify requirements on official government sources before you rely on them.
                </p>

                <Link href="/dashboard">
                    <Button className="w-full gap-2 h-12 text-base font-bold">
                        <ChevronLeft className="h-5 w-5" /> Go to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}

