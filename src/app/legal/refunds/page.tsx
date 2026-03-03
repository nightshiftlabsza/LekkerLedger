"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mb-6 border border-green-500/20">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Refund & Cancellation</h1>
                    <p className="text-zinc-500 font-medium">Last Updated: March 2, 2026 • CPA Compliant</p>
                </header>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-400 leading-relaxed font-medium">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">1. Pro Subscriptions</h2>
                        <p>
                            LekkerLedger offers premium features under a subscription model. We offer a 7-day &ldquo;No Questions Asked&rdquo; refund policy for first-time subscribers as per the Consumer Protection Act (CPA) regarding digital services.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">2. Cancellation Policy</h2>
                        <p>
                            You can cancel your subscription at any time via your Settings page. There are no cancellation fees. Upon cancellation, you will continue to have access to Pro features until the end of your current billing cycle.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">3. Usage of Generated Documents</h2>
                        <p>
                            Please note that generating a &ldquo;Pro&rdquo; document (e.g., an automated Employment Contract) consumes the value of the service for that month. Refunds may be denied if major Pro features have been utilized extensively within the refund window.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">4. How to Request a Refund</h2>
                        <p>
                            To request a refund, please email nightshiftlabsza@gmail.com with your transaction details. We manually review all requests within 48 hours.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">5. Cooling-off Period</h2>
                        <p>
                            In accordance with Section 44 of the Electronic Communications and Transactions Act, you are entitled to a 7-day cooling-off period if the transaction was a result of direct marketing.
                        </p>
                    </section>
                </div>

                <footer className="pt-20 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-600">© 2026 LekkerLedger. All rights reserved. Crafted by Nightshift Labs in South Africa.</p>
                </footer>
            </div>
        </div>
    );
}
