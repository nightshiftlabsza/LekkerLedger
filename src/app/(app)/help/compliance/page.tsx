"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function CompliancePage() {
    const router = useRouter();

    return (
        <>
            <PageHeader title="Compliance Guide" subtitle="SA domestic worker regulations" />

            <div className="text-center space-y-2 mb-6">
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(196,122,28,0.1)", color: "var(--amber-500)" }}>
                    <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                    The 4 Golden Rules
                </h2>
                <p className="text-sm mt-2 font-medium" style={{ color: "var(--amber-600)" }}>
                    <ShieldCheck className="inline-block h-4 w-4 mr-1 mb-0.5" /> Note: LekkerLedger is a record-keeping tool, not a law firm. This guide is for educational purposes.
                </p>
            </div>

            <div className="space-y-4">
                <div className="p-5 rounded-2xl animate-slide-up" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--amber-500)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>1. Minimum Wage is R30.23/hr</h3>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                As of 2026, the absolute legal minimum you can pay a domestic worker is R30.23 per hour worked.
                                <br />
                                <a href="https://www.gov.za/documents/notices/national-minimum-wage-act-national-minimum-wage-9-jan-2025" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline text-xs mt-2 block">Source: Dept. of Employment & Labour (2026)</a>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "50ms", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--amber-500)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>2. The 4-Hour Daily Minimum</h3>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                Even if your employee only works for 1 or 2 hours on a given day, you are legally required to pay them for a minimum of 4 hours.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "100ms", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--amber-500)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>3. Unemployment Insurance Fund (UIF)</h3>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                If your employee works <strong>more than 24 hours in a month</strong>, you must register them for UIF. You deduct 1% from their gross pay, and contribute another 1% yourself (total 2%). LekkerLedger handles this calculation automatically.
                                <br />
                                <a href="https://www.gov.za/services/uif/register-uif" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline text-xs mt-2 block">Source: Register with the UIF</a>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "150ms", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--amber-500)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>4. Mandatory Leave Entitlements</h3>
                            <div className="text-sm mt-2 space-y-2" style={{ color: "var(--text-secondary)" }}>
                                <p><strong>Annual Leave:</strong> 1 day for every 17 days worked (or 15 days per year).</p>
                                <p><strong>Sick Leave:</strong> 30 days over a 36-month cycle (about 10 days per year).</p>
                                <p><strong>Family Responsibility:</strong> 3 days per year, but only after they have worked for you for 4 months.</p>
                                <p><strong>Public Holidays:</strong> Paid at double the normal rate if worked.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 pb-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <Button className="w-full gap-2 h-12 text-base font-bold" onClick={() => router.back()}>
                    <CheckCircle2 className="h-5 w-5" /> I Understand
                </Button>
            </div>
        </>
    );
}
