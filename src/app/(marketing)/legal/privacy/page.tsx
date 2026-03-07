"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME } from "@/src/config/brand";
import { SupplierDetails } from "@/components/legal/supplier-details";
import { SubprocessorTable } from "@/components/legal/subprocessor-table";

const UPDATED_DATE = "7 March 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-black text-white">{title}</h2>
            {children}
        </section>
    );
}

export default function PrivacyPolicy() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="mx-auto max-w-4xl space-y-12 px-6 py-12 sm:py-20">
                <Link href="/">
                    <Button variant="ghost" className="mb-8 -ml-4 gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Privacy Policy</h1>
                    <p className="font-medium text-zinc-500">Updated {UPDATED_DATE} • Plain-language privacy summary</p>
                </header>

                <div className="space-y-8 text-zinc-400">
                    <div className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-6">
                        <h2 className="text-xl font-black text-white">Plain-language summary</h2>
                        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7">
                            <li>Employee payroll records are stored on your device by default, not in a central LekkerLedger employee database.</li>
                            <li>If you enable Google backup, the backup is stored in the Google Drive app data area in your own Google account.</li>
                            <li>We do collect limited product and website analytics so we can operate and improve the service.</li>
                            <li>We use payment and infrastructure providers for paid plans and service delivery, but we do not store your card details ourselves.</li>
                            <li>You remain responsible for checking figures and submissions against official guidance.</li>
                        </ul>
                    </div>

                    <SupplierDetails />

                    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 font-medium leading-relaxed text-zinc-400">
                        <Section title="1. Introduction">
                            <p>
                                LekkerLedger (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a household employment record-keeping and payroll preparation tool operated by {COMPANY_NAME} in South Africa.
                                This policy explains what information is processed through the product, where it is stored, which third parties are involved, and what choices you have.
                            </p>
                            <p>
                                This policy is written to be practical and plain-language. It explains how LekkerLedger currently handles payroll records, backup, billing, and analytics without claiming legal certification.
                            </p>
                        </Section>

                        <Section title="2. What data we process">
                            <p>Depending on how you use the product, LekkerLedger may process the following categories of information:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                <li><strong>Employer and household details:</strong> name, contact details, address, UIF reference, Compensation Fund details, and related payroll setup data.</li>
                                <li><strong>Employee record data:</strong> names, ID or passport details, role details, pay rates, leave records, payslip figures, and uploaded employment documents.</li>
                                <li><strong>Export preparation data:</strong> UIF export files and related records you generate for your own records or for uFiling preparation. LekkerLedger does not submit to UIF on your behalf.</li>
                                <li><strong>Product usage data:</strong> limited app and website analytics, such as page views or interaction events used to understand product usage and improve the service.</li>
                                <li><strong>Google connection data:</strong> if you choose Google-connected backup, your Google account email, Google identifier, and Google permissions state are processed so backup and restore can work.</li>
                                <li><strong>Subscription and transaction data:</strong> plan choice, billing status, renewal timing, and payment references needed to manage paid access.</li>
                                <li><strong>Support communications:</strong> emails or support requests you send to us.</li>
                            </ul>
                        </Section>

                        <Section title="3. Where data is stored">
                            <p>
                                LekkerLedger is designed so that employee payroll records do not go into a central LekkerLedger employee database.
                                The main storage locations are:
                            </p>
                            <ul className="list-disc space-y-2 pl-6">
                                <li><strong>On your device by default:</strong> payroll records, employee details, payslips, and related records are stored locally in your browser storage.</li>
                                <li><strong>In your Google account if you enable backup:</strong> backups are stored in the Google Drive app data area in your own Google account.</li>
                                <li><strong>In our service systems where needed:</strong> analytics, support messages, subscription records, and payment-related references may be processed through service providers used to operate the product.</li>
                            </ul>
                            <p>
                                This means the statement &ldquo;local-first&rdquo; refers to payroll record storage, not to a promise that no network request or telemetry ever occurs.
                            </p>
                        </Section>

                        <Section title="4. How we use data">
                            <ul className="list-disc space-y-2 pl-6">
                                <li>To generate payslips, exports, summaries, and supporting paperwork from the information you enter.</li>
                                <li>To enable optional backup and restore through your Google account.</li>
                                <li>To provide paid plan access, billing support, and refund handling.</li>
                                <li>To operate, maintain, secure, and improve the website and app.</li>
                                <li>To answer support requests and communicate about your account or service issues.</li>
                            </ul>
                            <p>We do not sell employee payroll records to third parties.</p>
                        </Section>

                        <Section title="5. Third parties we use">
                            <p>We use third-party services where needed to run LekkerLedger. These may include:</p>
                            <SubprocessorTable />
                            <p>
                                Those providers process data under their own terms and privacy documents. Where they are involved, only the information needed for that function should be shared.
                            </p>
                        </Section>

                        <Section title="6. Security and safeguards">
                            <p>
                                We aim to use reasonable technical and organizational safeguards appropriate to the type of data involved. Examples may include access controls, provider-managed transport security, and local-first product architecture for payroll record storage.
                            </p>
                            <p>
                                No online system can promise absolute security. You are also responsible for keeping your own device, browser profile, Google account, and passwords secure.
                            </p>
                        </Section>

                        <Section title="7. Retention">
                            <ul className="list-disc space-y-2 pl-6">
                                <li><strong>Local payroll records:</strong> remain on your device until you delete them, clear browser data, or replace them with your own actions.</li>
                                <li><strong>Google backup data:</strong> remains in the Google Drive app data area in your own Google account until you delete it or revoke access.</li>
                                <li><strong>Subscription, analytics, and support records:</strong> may be retained for operational, accounting, fraud-prevention, support, or legal reasons for as long as reasonably necessary.</li>
                            </ul>
                            <p>
                                Retention periods can vary depending on the category of data and the reason it was processed.
                            </p>
                        </Section>

                        <Section title="8. Your choices and rights">
                            <p>Depending on your situation and applicable law, you may have rights to:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                <li>access information held about you,</li>
                                <li>request correction of inaccurate information,</li>
                                <li>object to certain processing,</li>
                                <li>request deletion where appropriate, and</li>
                                <li>withdraw optional permissions such as Google-connected backup.</li>
                            </ul>
                            <p>
                                In practice, many payroll records are under your direct control because they are stored locally on your device or in your own Google account. You can also remove local data in-app or revoke Google access through your Google account settings.
                            </p>
                        </Section>

                        <Section title="9. Contact and complaints">
                            <p>
                                For privacy-related questions, contact <a href="mailto:privacy@lekkerledger.co.za">privacy@lekkerledger.co.za</a>.
                            </p>
                            <p>
                                If you believe your information has been mishandled, contact us first so we can investigate. You may also have the right to complain to the relevant South African regulator or authority where applicable.
                            </p>
                        </Section>
                    </div>
                </div>

                <footer className="border-t border-zinc-800/50 pt-20">
                    <p className="text-xs text-zinc-600">© {currentYear} LekkerLedger. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}
