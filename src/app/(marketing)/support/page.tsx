"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, LifeBuoy, Mail, HelpCircle, BookOpen, AlertCircle, FolderSync, WalletCards } from "lucide-react";
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
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]">
                        <LifeBuoy className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Support & Contact</h1>
                    <p className="text-lg font-medium text-[var(--text-muted)]">We are here to help you get your household payroll set up correctly and keep the record trail tidy.</p>
                    <p className="text-sm font-semibold text-[var(--text-muted)]">Email support replies within 1-4 business days in South Africa, Monday to Friday, excluding public holidays.</p>
                </header>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Legal/Compliance Help */}
                    <Link href="/rules" className="block group">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 h-full transition-all group-hover:border-[var(--primary)]/50 group-hover:shadow-[var(--shadow-md)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)]">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Household checklist</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                Unsure what to check each month or each year? Open the household checklist for plain-language steps, official sources, and calmer guidance.
                            </p>
                        </div>
                    </Link>

                    {/* App Usage/Bugs Help */}
                    <a href="mailto:support@lekkerledger.co.za?subject=App%20Support" className="block group">
                        <div className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-6 h-full transition-all group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Email Support</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
                                Found a bug? Confused about backup, payslips, or billing? Our team replies within 1-4 business days in South Africa, Monday to Friday, excluding public holidays.
                            </p>
                            <span className="text-[var(--primary)] font-bold text-sm">support@lekkerledger.co.za &rarr;</span>
                        </div>
                    </a>

                    <Link href="/storage" className="block group">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 h-full transition-all group-hover:border-[var(--primary)]/50 group-hover:shadow-[var(--shadow-md)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)]">
                                    <FolderSync className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Storage & Backup</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                Learn how local storage works, when encrypted sync is used, and what stays on your device.
                            </p>
                        </div>
                    </Link>

                    <Link href="/legal/refunds" className="block group">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 h-full transition-all group-hover:border-[var(--primary)]/50 group-hover:shadow-[var(--shadow-md)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)]">
                                    <WalletCards className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Refunds & Billing</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                Read the 14-day refund policy, billing basics, and what happens when you cancel a paid plan.
                            </p>
                        </div>
                    </Link>
                </div>

                <div className="policy-copy mt-16 max-w-none space-y-10 border-t border-[var(--border)] pt-12 leading-relaxed font-medium">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-[var(--text)]">Troubleshooting FAQs</h2>

                        <div className="space-y-6">
                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--text)]"><AlertCircle className="h-4 w-4 text-[var(--danger)]" /> &quot;Why did I see an R1 charge when I started the trial?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    That R1 charge is a card-verification step through Paystack so LekkerLedger can save a reusable payment method for the end of the 14-day trial. It is not the main Standard or Pro subscription charge.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--text-muted)]" /> &quot;How do I stop the first real charge after the trial?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    Open Settings, go to Plan, and cancel renewal before the trial ends. You will keep access until the trial end date already shown in the app, but the first real subscription charge will not go through.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--text-muted)]" /> &quot;When does a referral free month unlock?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    A referral month unlocks only after the referred person finishes the trial, has their first real paid Standard or Pro charge succeed, and then passes the 14-day refund window without a refund or chargeback.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--text)]"><AlertCircle className="h-4 w-4 text-[var(--danger)]" /> &quot;My payslip disappeared after I closed the browser!&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    If you are using LekkerLedger in <strong>Incognito or Private Browsing</strong> mode, your browser will delete all local storage data when the window is closed. To save payslips long-term, please use standard browsing mode.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--text)]"><AlertCircle className="h-4 w-4 text-[var(--danger)]" /> &quot;It says sync failed&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    This usually happens if your browser blocks third-party cookies or pop-ups. Make sure you allow pop-ups for lekkerledger.co.za to complete the sign-in flow.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--text-muted)]" /> &quot;Which browser works best?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    LekkerLedger works best in a recent version of Chrome or Edge on Android or Windows. Avoid Incognito or Private Browsing for normal use. If a screen looks stuck on an older device, reopen the app in Chrome or Edge and try again there.
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

