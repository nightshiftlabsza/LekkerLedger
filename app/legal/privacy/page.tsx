import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - LekkerLedger',
    description: 'Privacy Policy for LekkerLedger South Africa',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
            <header className="px-4 py-4 glass-panel border-b border-[var(--border-subtle)] sticky top-0 z-30">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="font-bold text-[var(--text-primary)]">Privacy Policy</h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-10">
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[var(--text-secondary)]">
                    <p className="text-sm font-bold text-amber-500 mb-8 uppercase tracking-widest">Last Updated: March 2026</p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--text-primary)]">1. Introduction</h2>
                    <p>
                        LekkerLedger ("we", "our", "us") respects your right to privacy. This Privacy Policy outlines how your personal
                        information and your employees' personal information is handled when using our progressive web application.
                        We prioritize privacy-by-design, meaning your data stays under your control.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--text-primary)]">2. Data Storage and Sync</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Storage:</strong> All payslip data is stored locally on your device using standard web technologies.</li>
                        <li><strong>Sync (Optional):</strong> If enabled, encrypted backups are saved to your personal Google Drive. We do not host your payslip data on our servers.</li>
                    </ul>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--text-primary)]">2b. IP Addresses and External APIs</h2>
                    <p>
                        To ensure compliance with South African labor laws (e.g., verifying pay periods and trial usage independently of device manipulation), the app explicitly makes HTTP requests to third-party secure time endpoints (`worldtimeapi.org`, `timeapi.io`, `1.1.1.1`). Your device&apos;s IP address is briefly processed by these providers solely for the delivery of accurate chronological data.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--text-primary)]">3. Data Security</h2>
                    <p>
                        Since data remains on your device or in your personal cloud storage, you are responsible for maintaining the physical security
                        of your device and the security of your Google account credentials.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--text-primary)]">4. Protection of Personal Information Act (POPIA)</h2>
                    <p>
                        Our architecture is designed to help you remain POPIA compliant as a domestic employer. By not centralizing data
                        on third-party servers, the risk of mass data breaches is entirely mitigated. You act as the Responsible Party
                        for the employee data you capture.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--text-primary)]">5. Changes to This Policy</h2>
                    <p>
                        We may update our Privacy Policy periodically. Since our app operates entirely client-side, any changes will
                        only reflect shifts in offline storage practices, optional integrations, or local legal obligations.
                    </p>
                </div>
            </main>
        </div>
    );
}
