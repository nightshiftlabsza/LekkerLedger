"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, LifeBuoy, Mail, HelpCircle, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20">
                        <LifeBuoy className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Support & Contact</h1>
                    <p className="text-zinc-500 font-medium text-lg">We are here to help you get your household payroll set up correctly.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Legal/Compliance Help */}
                    <Link href="/rules" className="block group">
                        <div className="glass-panel border-2 border-[var(--border)] p-6 rounded-2xl h-full transition-all group-hover:border-[var(--primary)]/50 group-hover:shadow-lg">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)]">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Compliance Guide</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                Unsure about the National Minimum Wage, UIF thresholds, or leave entitlements? Check our compliance guide for official sources and plain-English summaries.
                            </p>
                        </div>
                    </Link>

                    {/* App Usage/Bugs Help */}
                    <a href="mailto:support@lekkerledger.co.za?subject=App%20Support" className="block group">
                        <div className="glass-panel border-2 border-[var(--primary)]/30 p-6 rounded-2xl h-full transition-all group-hover:border-[var(--primary)] group-hover:shadow-[0_0_20px_rgba(196,122,28,0.15)] bg-[var(--primary)]/5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Email Support</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
                                Found a bug? Confused about how to sync your Google Drive? Our team usually responds within 24 working hours to help you out.
                            </p>
                            <span className="text-[var(--primary)] font-bold text-sm">support@lekkerledger.co.za &rarr;</span>
                        </div>
                    </a>
                </div>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-10 text-zinc-400 leading-relaxed font-medium mt-16 pt-12 border-t border-[var(--border)]">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-[var(--text)]">Troubleshooting FAQs</h2>

                        <div className="space-y-6">
                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-rose-500" /> &quot;My payslip disappeared after I closed the browser!&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    If you are using LekkerLedger in <strong>Incognito or Private Browsing</strong> mode, your browser will delete all local storage data when the window is closed. To save payslips long-term, please use standard browsing mode.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-rose-500" /> &quot;It says Google Drive Sync failed&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    This usually happens if your browser blocks third-party cookies or pop-ups. Make sure you allow pop-ups for lekkerledger.co.za to complete the Google Sign-in flow.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--text-muted)]" /> &quot;Can I generate payslips for previous months?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    Absolutely. You can change the Pay Period dates when starting a new monthly payroll in the app. Just select dates in the past, and it will calculate using the historical minimum wage for that year.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}
