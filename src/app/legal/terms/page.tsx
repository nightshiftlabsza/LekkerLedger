"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20">
                        <Scale className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Terms of Service</h1>
                    <p className="text-zinc-500 font-medium">Last Updated: March 2, 2026</p>
                </header>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-400 leading-relaxed font-medium">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">1. Acceptance of Terms</h2>
                        <p>
                            By using LekkerLedger, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application. This service is provided by Nightshift Labs ZA, operating in South Africa.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">2. Nature of Service</h2>
                        <p>
                            LekkerLedger is a payroll calculation and compliance tool. While we strive for absolute accuracy based on current South African labor laws (BCEA, Sectoral Determination 7), calculations should be verified. We are not a law firm or a substitute for legal advice.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">3. User Responsibilities</h2>
                        <p>As the employer, you are responsible for:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Ensuring the data entered (hours, rates, names) is accurate.</li>
                            <li>Paying your employees the correct amount.</li>
                            <li>Maintaining your own backups (using our built-in export features).</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">4. Intellectual Property</h2>
                        <p>
                            The code and design of LekkerLedger are the property of Nightshift Labs ZA. The open-source portions are governed by the MIT License, which handles code reuse but does not grant rights to the LekkerLedger brand or trademarks.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">5. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by South African law, Nightshift Labs ZA shall not be liable for any CCMA awards, legal fees, or financial losses resulting from the use of this tool. Your use of LekkerLedger is at your own risk.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">6. Governing Law</h2>
                        <p>These terms are governed by the laws of the Republic of South Africa.</p>
                    </section>
                </div>

                <footer className="pt-20 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-600">© 2026 LekkerLedger. All rights reserved. Crafted by Nightshift Labs ZA in South Africa.</p>
                </footer>
            </div>
        </div>
    );
}
