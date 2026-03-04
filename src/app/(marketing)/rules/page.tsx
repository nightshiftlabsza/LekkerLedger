"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RulesPage() {

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            {/* Header */}
            <header className="sticky top-0 z-30 px-4 py-4 glass-panel shadow-[var(--shadow-sm)]" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-[var(--surface-2)]">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text)" }}>
                            Legal Guide
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
                <div className="text-center space-y-2 mb-6">
                    <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(196,122,28,0.1)", color: "var(--primary)" }}>
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                        The 4 Golden Rules
                    </h2>
                    <p className="text-sm mt-2 font-medium" style={{ color: "var(--primary)" }}>
                        <ShieldCheck className="inline-block h-4 w-4 mr-1 mb-0.5" /> Note: LekkerLedger is a record-keeping tool, not a law firm. This guide is for educational purposes.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Rule 1 */}
                    <div className="p-5 rounded-2xl animate-slide-up" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <ShieldCheck className="h-5 w-5" style={{ color: "var(--primary)" }} />
                            </div>
                            <div>
                                <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>1. Minimum Wage is R30.23/hr</h3>
                                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    As of 2026, the legal minimum you can pay a domestic worker is R30.23 per hour worked.
                                    <br />
                                    <a href="https://www.gov.za/documents/notices/national-minimum-wage-act-national-minimum-wage-9-jan-2025" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline text-xs mt-2 block">Source: Dept. of Employment & Labour (2026)</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 2 */}
                    <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "50ms", backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <ShieldCheck className="h-5 w-5" style={{ color: "var(--primary)" }} />
                            </div>
                            <div>
                                <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>2. The 4-Hour Daily Minimum</h3>
                                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Even if your employee only works for 1 or 2 hours on a given day, you are legally required to pay them for a minimum of 4 hours.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 3 */}
                    <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "100ms", backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <ShieldCheck className="h-5 w-5" style={{ color: "var(--primary)" }} />
                            </div>
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

                    {/* Rule 4 */}
                    <div className="p-5 rounded-2xl animate-slide-up" style={{ animationDelay: "150ms", backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <ShieldCheck className="h-5 w-5" style={{ color: "var(--primary)" }} />
                            </div>
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
                </div>

                <div className="pt-6 pb-8 animate-slide-up space-y-4" style={{ animationDelay: "200ms" }}>
                    <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        This guide is informational only and does not constitute legal advice. Always verify against <a href="https://www.gov.za" target="_blank" rel="noopener noreferrer" className="underline">official government sources</a>. Last updated: March 2026.
                    </p>
                    <Link href="/">
                        <Button className="w-full gap-2 h-12 text-base font-bold">
                            <ChevronLeft className="h-5 w-5" /> Back to Home
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
