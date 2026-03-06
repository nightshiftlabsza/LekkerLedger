"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
    const currentYear = new Date().getFullYear();
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-6 border border-[var(--primary)]/20">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Refund & Cancellation</h1>
                    <p className="text-zinc-500 font-medium">Updated periodically • Consumer Protection Act aware</p>
                </header>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-400 leading-relaxed font-medium">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">1. Our Plans</h2>
                        <p>
                            LekkerLedger offers two upgrade options:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Annual Support (R99/yr):</strong> A yearly renewal. You can cancel at any time to stop the next renewal. Access continues until the end of your current annual period.</li>
                            <li><strong>Lekker Pro (R299):</strong> A once-off lifetime payment. No renewal, no recurring fees. Our 14-day &ldquo;No Questions Asked&rdquo; refund guarantee applies.</li>
                        </ul>
                        <p>
                            If you are unsatisfied with any purchase for any reason within 14 days of the transaction date, we will issue a full refund — no questions asked.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">2. Cancellation (Annual Support only)</h2>
                        <p>
                            Annual Support renews yearly. You can cancel at any time via your Settings page — there are no cancellation fees. Upon cancellation, your access continues until the end of the current annual period and will not renew. Lekker Pro is a once-off payment with no renewal to cancel.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">3. No Exceptions</h2>
                        <p>
                            Our 14-day refund guarantee is unconditional. It applies regardless of whether you have used the Pro features. Simply request a refund within 14 days of your purchase date and we will process it in full.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">4. How to Request a Refund</h2>
                        <p>
                            To request a refund, please email support@lekkerledger.co.za with your transaction details. We manually review all requests within 48 hours.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">5. Cooling-off Period</h2>
                        <p>
                            In accordance with Section 44 of the Electronic Communications and Transactions Act, you are entitled to a cooling-off period if the transaction was a result of direct marketing. Our 14-day refund guarantee exceeds this requirement and applies to all purchases.
                        </p>
                    </section>
                </div>

                <footer className="pt-20 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-600">© {currentYear} LekkerLedger. All rights reserved. Crafted by Nightshift Labs in South Africa.</p>
                </footer>
            </div>
        </div>
    );
}

