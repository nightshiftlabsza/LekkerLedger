"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ComplianceInlineBadge } from "@/components/ui/compliance-badge";

export default function CompliancePage() {

    return (
        <>
            <PageHeader title="Compliance Guide" subtitle="SA domestic worker regulations" />

            <div className="text-center space-y-2 mb-6">
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(196,122,28,0.1)", color: "var(--primary)" }}>
                    <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                    The 4 Golden Rules
                </h2>
                <p className="text-sm mt-2 font-medium" style={{ color: "var(--primary-hover)" }}>
                    <ShieldCheck className="inline-block h-4 w-4 mr-1 mb-0.5" /> Note: LekkerLedger is a record-keeping tool, not a law firm. This guide is for educational purposes.
                </p>
            </div>

            <div className="space-y-4">
                <div className="p-5 rounded-2xl animate-slide-up" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                        <div>
                            <h3 className="font-bold text-base flex w-full flex-wrap gap-2 items-center" style={{ color: "var(--text)" }}>1. Minimum Wage is <ComplianceInlineBadge type="nmw" /></h3>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                The current National Minimum Wage reference for domestic workers is <ComplianceInlineBadge type="nmw" /> per hour worked.
                                <br />
                                <a href="https://www.gov.za/documents/notices/national-minimum-wage-act-national-minimum-wage-9-jan-2025" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline text-xs mt-2 block">Source: Department of Employment & Labour notice</a>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "50ms", backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>2. The 4-Hour Daily Minimum</h3>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Even if your employee only works for 1 or 2 hours on a given day, you are legally required to pay them for a minimum of 4 hours.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "100ms", backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>3. Unemployment Insurance Fund (UIF)</h3>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                If your employee works <strong>more than 24 hours in a month</strong>, you must register them for UIF. You deduct 1% from their gross pay, and contribute another 1% yourself (total 2%). LekkerLedger includes UIF calculation tools to help with this.
                                <br />
                                <a href="https://www.gov.za/services/uif/register-uif" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline text-xs mt-2 block">Source: Register with the UIF</a>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "150ms", backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>4. Mandatory Leave Entitlements</h3>
                            <div className="text-sm mt-2 space-y-2" style={{ color: "var(--text-muted)" }}>
                                <p><strong>Annual Leave:</strong> 1 day for every 17 days worked (or 15 days per year).</p>
                                <p><strong>Sick Leave:</strong> 30 days over a 36-month cycle (about 10 days per year).</p>
                                <p><strong>Family Responsibility:</strong> 3 days per year, but only after they have worked for you for 4 months.</p>
                                <p><strong>Public Holidays:</strong> Paid at double the normal rate if worked.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "200ms", backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                        <div>
                            <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>5. Injury & Disease Protection (COIDA)</h3>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Domestic employers must register with the Compensation Fund where required. Assessment rates can change by year and employer class, so check the current notice before relying on a percentage. Accepted claims may help with medical costs or lost wages, subject to the Fund&apos;s process.
                                <br />
                                <a href="https://www.labour.gov.za/compensation-for-occupational-injuries-and-diseases-act" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline text-xs mt-2 block">Source: COID Act</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 pb-8 animate-slide-up space-y-4" style={{ animationDelay: "200ms" }}>
                <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    This guide is informational only and does not constitute legal advice. Always verify against <a href="https://www.gov.za" target="_blank" rel="noopener noreferrer" className="underline">official government sources</a>. Guidance can change. Check the linked sources before relying on this page.
                </p>
                <Link href="/dashboard">
                    <Button className="w-full gap-2 h-12 text-base font-bold">
                        <ChevronLeft className="h-5 w-5" /> Go to Dashboard
                    </Button>
                </Link>
            </div>
        </>
    );
}
