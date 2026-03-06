"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Privacy Policy</h1>
                    <p className="text-zinc-500 font-medium">Updated periodically • Designed with POPIA principles</p>
                </header>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-400 leading-relaxed font-medium">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">1. Introduction</h2>
                        <p>
                            LekkerLedger (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your privacy in accordance with the Protection of Personal Information Act (POPIA) of South Africa. This policy explains how we handle your information.
                        </p>
                    </section>

                    <section className="space-y-4 text-[var(--primary)]/90 italic p-6 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                        <p>
                            If you ever need a record trail, LekkerLedger&apos;s built-in vault keeps a chronological history of payslips, contracts, and Unemployment Insurance Fund (UIF) declarations. Standard keeps 12 months accessible, and Pro extends that to 5 years.
                        </p>
                        <p>
                            <strong>Important:</strong> LekkerLedger is a &ldquo;privacy-first&rdquo; tool. We have no central database for your employee data. If Drive sync is <strong>OFF</strong>: your data is stored on this device only. If Drive sync is <strong>ON</strong>: your data is stored in your personal private Google Drive folder — not our servers.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">2. Information We Collect</h2>
                        <p>We only collect the minimum amount of data necessary to provide our service:</p>
                        <p>
                            We take a strict &quot;local-first&quot; approach to your data. There is no central LekkerLedger database containing your employee&apos;s personal details, ID numbers, or salaries.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Local Data:</strong> Names, ID numbers, and salaries of employees you input are stored on your device. If Google Drive sync is enabled, this data is also stored in your own private Google Drive folder — never on LekkerLedger&apos;s servers.</li>
                            <li><strong>Sync Data:</strong> With Google Drive Sync ON, LekkerLedger requests minimal access strictly to create and read files within its own designated folder in your Google Drive.</li>
                            <li><strong>Usage Data:</strong> We may collect anonymous telemetry (e.g., button clicks) to improve the app, which cannot be traced back to your employees.</li>
                            <li><strong>Subscription Data:</strong> If you upgrade, payment processing is handled by third-party providers (e.g., PayStack); we do not store your credit card details.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">3. How We Use Data</h2>
                        <p>Your data is used solely to generate payslips, UIF declarations, and record summaries for your records. We do not sell or trade your personal information.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">4. POPIA Compliance & Your Rights</h2>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your data is securely stored in your browser&apos;s IndexedDB by default.</p>
                        <p>As per POPIA, you have the following rights regarding the data you process using LekkerLedger:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Right to access and correct information.</li>
                            <li>Right to object to processing.</li>
                            <li>Right to request deletion: Local data can be deleted in-app (&quot;Delete all local data&quot;) or by clearing browser storage. For synced data, you must manually delete the LekkerLedger backup folder from your Google Drive.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">5. Contact Us</h2>
                        <p>For any privacy-related queries, please contact privacy@lekkerledger.co.za.</p>
                    </section>
                </div>

                <footer className="pt-20 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-600">© {currentYear} LekkerLedger. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}


