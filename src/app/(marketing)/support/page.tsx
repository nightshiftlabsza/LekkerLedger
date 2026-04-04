"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, LifeBuoy, Mail, HelpCircle, BookOpen, AlertCircle, FolderSync, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    PAID_PLAN_START_AND_REFUND_SUMMARY,
    REFERRAL_REWARD_PENDING_SUMMARY,
    REFUND_WINDOW_LABEL,
} from "@/config/plans";
import { PRIVACY_EMAIL, SUPPORT_EMAIL } from "@/config/brand";

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="content-container-wide px-4 py-12 sm:px-6 sm:py-20 lg:px-8 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="max-w-3xl space-y-4">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]">
                        <LifeBuoy className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Support & Contact</h1>
                    <p className="text-lg font-medium text-[var(--text-muted)]">We are here to help you get your household payroll set up correctly and keep the record trail tidy.</p>
                    <p className="text-sm font-semibold text-[var(--text-muted)]">Email support replies within 1-4 business days in South Africa, Monday to Friday, excluding public holidays.</p>
                </header>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Legal/Compliance Help */}
                    <Link href="/resources/checklists" className="block group">
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
                    <div className="group">
                        <div className="h-full rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-6 transition-all group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Email Support</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
                                Found a bug? Confused about backup, payslips, or billing? Our team replies within 1-4 business days in South Africa, Monday to Friday, excluding public holidays.
                            </p>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-2">
                                Privacy, data-rights, or security reports should go to{" "}
                                <a href={`mailto:${PRIVACY_EMAIL}`} className="font-semibold text-[var(--primary)] hover:underline">{PRIVACY_EMAIL}</a>.
                            </p>
                            <a
                                href={`mailto:${SUPPORT_EMAIL}?subject=App%20Support`}
                                className="inline-flex text-sm font-bold text-[var(--primary)] hover:underline"
                            >
                                {SUPPORT_EMAIL} &rarr;
                            </a>
                        </div>
                    </div>

                    <Link href="/storage" className="block group">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 h-full transition-all group-hover:border-[var(--primary)]/50 group-hover:shadow-[var(--shadow-md)]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)]">
                                    <FolderSync className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text)]">Storage & Backup</h3>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                Learn how encrypted cloud storage works for paid accounts and how the free payslip PDF flow works.
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
                                Read the {REFUND_WINDOW_LABEL} refund policy, billing basics, and what happens when you cancel a paid plan.
                            </p>
                        </div>
                    </Link>
                </div>

                <div className="mt-16 border-t border-[var(--border)] pt-12">
                    <div className="policy-copy max-w-4xl space-y-10 leading-relaxed font-medium">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-[var(--text)]">Troubleshooting FAQs</h2>

                        <div className="space-y-6">
                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--text)]"><AlertCircle className="h-4 w-4 text-[var(--danger)]" /> &quot;When does a paid plan start billing?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    {PAID_PLAN_START_AND_REFUND_SUMMARY}
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--text-muted)]" /> &quot;How do I stop renewal on a paid plan?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    Open Settings, go to Plan, and cancel renewal before the next renewal date. You will keep access until the end of the period you have already paid for.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--text-muted)]" /> &quot;When does a referral free month unlock?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    {REFERRAL_REWARD_PENDING_SUMMARY}
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--text)]"><AlertCircle className="h-4 w-4 text-[var(--danger)]" /> &quot;My payslip disappeared after I closed the browser!&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    If you are a paid user, sign in to access your cloud-stored records. If you used the free payslip tool, the PDF was available for download during the session only — generate it again if needed.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--text)]"><AlertCircle className="h-4 w-4 text-[var(--danger)]" /> &quot;It says sync failed&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    Refresh the page and sign in again before retrying the action. LekkerLedger login and signup stay in the same browser tab, so if sync still looks stuck after a refresh, email support with the page you were on and the message you saw.
                                </p>
                            </div>

                            <div className="border border-[var(--border)] p-5 rounded-xl bg-[var(--surface-1)]">
                                <h3 className="text-lg font-bold text-[var(--text)] mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--text-muted)]" /> &quot;Which browser works best?&quot;</h3>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                    LekkerLedger is built for current mobile and desktop browsers. If a screen looks wrong, update your browser first, then refresh the page and sign in again before contacting support.
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
        </div>
    );
}

