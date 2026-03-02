"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Privacy Policy</h1>
                    <p className="text-zinc-500 font-medium">Last Updated: March 2, 2026 • POPIA Compliant</p>
                </header>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-400 leading-relaxed font-medium">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">1. Introduction</h2>
                        <p>
                            LekkerLedger ("we", "us", or "our") is committed to protecting your privacy in accordance with the Protection of Personal Information Act (POPIA) of South Africa. This policy explains how we handle your information.
                        </p>
                    </section>

                    <section className="space-y-4 text-amber-500/90 italic p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <p>
                            <strong>Important:</strong> LekkerLedger is a "privacy-first" tool. We have no central database for your employee data. All payroll data is stored locally on your device or in your personal private Google Drive/iCloud sync.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">2. Information We Collect</h2>
                        <p>We only collect the minimum amount of data necessary to provide our service:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Local Data:</strong> Names, ID numbers, and salaries of employees you input are stored ONLY on your device.</li>
                            <li><strong>Usage Data:</strong> We may collect anonymous telemetry (e.g., button clicks) to improve the app, which cannot be traced back to your employees.</li>
                            <li><strong>Subscription Data:</strong> If you upgrade to Pro, payment processing is handled by third-party providers (e.g., PayStack or Stripe); we do not store your credit card details.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">3. How We Use Data</h2>
                        <p>Your data is used solely to generate payslips, UI updates, and compliance reports on your behalf. We do not sell or trade your personal information.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">4. POPIA Compliance & Your Rights</h2>
                        <p>As per POPIA, you have the following rights regarding the data you process using LekkerLedger:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Right to access and correct information.</li>
                            <li>Right to object to processing.</li>
                            <li>Right to request deletion (which you can do by clearing your browser storage).</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">5. Contact Us</h2>
                        <p>For any privacy-related queries, please contact nightshiftlabsza@gmail.com.</p>
                    </section>
                </div>

                <footer className="pt-20 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-600">© 2026 LekkerLedger. All rights reserved. Crafted by Nightshift Labs in South Africa.</p>
                </footer>
            </div>
        </div>
    );
}
