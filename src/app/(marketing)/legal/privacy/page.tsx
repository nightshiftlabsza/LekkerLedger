"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME } from "@/src/config/brand";
import { SupplierDetails } from "@/components/legal/supplier-details";
import { SubprocessorTable } from "@/components/legal/subprocessor-table";

const UPDATED_DATE = "10 March 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-black text-[var(--text)]">{title}</h2>
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
                    <p className="font-medium text-[var(--text-muted)]">Updated {UPDATED_DATE} • Plain-language privacy summary</p>
                </header>

                <div className="space-y-8 text-[var(--text-muted)]">
                    <div className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-6">
                        <h2 className="text-xl font-black text-[var(--text)]">Plain-language summary</h2>
                        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7">
                            <li>Paid accounts store employee payroll records in end-to-end encrypted cloud storage. LekkerLedger does not have access to your unencrypted payroll data.</li>
                            <li>Free users generate a single payslip PDF per month. No payroll records are stored after the session.</li>
                            <li>When a paid user signs out, all user data is cleared from the device.</li>
                            <li>We do collect limited product and website analytics so we can operate and improve the service.</li>
                            <li>We use payment and infrastructure providers for paid plans and service delivery, but we do not store your card details ourselves.</li>
                            <li>You remain responsible for checking figures and submissions against official guidance.</li>
                        </ul>
                    </div>

                    <SupplierDetails />

                    <div className="policy-copy max-w-none space-y-8 font-medium leading-relaxed">
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
                                <li><strong>Account data:</strong> if you choose encrypted sync, your email address and sync permissions state are processed so backup and restore can work.</li>
                                <li><strong>Subscription and transaction data:</strong> plan choice, billing status, renewal timing, payment references, and limited payment-provider authorization metadata needed to manage paid access and prevent abuse.</li>
                                <li><strong>Referral program data:</strong> referral codes, referral links between accounts, reward status, and related anti-fraud checks where the referral program is used.</li>
                                <li><strong>Support communications:</strong> emails or support requests you send to us.</li>
                            </ul>
                        </Section>

                        <Section title="3. Where data is stored">
                            <p>
                                LekkerLedger is designed so that employee payroll records are stored in encrypted form and are not accessible to LekkerLedger in unencrypted form.
                                The main storage locations are:
                            </p>
                            <ul className="list-disc space-y-2 pl-6">
                                <li><strong>Encrypted cloud storage (paid accounts):</strong> payroll records, employee details, payslips, and related records are encrypted on your device before upload and stored in the cloud.</li>
                                <li><strong>Session-only (free users):</strong> the free payslip tool generates a PDF in-browser. No payroll records are stored after the session ends.</li>
                                <li><strong>In our service systems where needed:</strong> analytics, support messages, subscription records, and payment-related references may be processed through service providers used to operate the product.</li>
                            </ul>
                            <p>
                                When a paid user signs out, all user data is cleared from the device. Records remain available in encrypted cloud storage for the next sign-in.
                            </p>
                        </Section>

                        <Section title="4. How we use data">
                            <ul className="list-disc space-y-2 pl-6">
                                <li>To generate payslips, exports, summaries, and supporting paperwork from the information you enter.</li>
                                <li>To enable optional encrypted backup and restore across devices.</li>
                                <li>To provide paid plan access, billing support, referral rewards, refund handling, and abuse prevention.</li>
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
                                We aim to use reasonable technical and organizational safeguards appropriate to the type of data involved. Examples may include access controls, provider-managed transport security, and end-to-end encryption for payroll record storage.
                            </p>
                            <p>
                                No online system can promise absolute security. You are also responsible for keeping your own device, browser profile, account, and passwords secure.
                            </p>
                        </Section>

                        <Section title="7. Retention">
                            <ul className="list-disc space-y-2 pl-6">
                                <li><strong>Cloud-stored payroll records (paid):</strong> remain in encrypted cloud storage until you delete them from your account settings.</li>
                                <li><strong>Free payslip PDFs:</strong> generated and downloaded in a single session. No records are retained by LekkerLedger.</li>
                                <li><strong>Subscription, referral, analytics, and support records:</strong> may be retained for operational, accounting, fraud-prevention, support, or legal reasons for as long as reasonably necessary.</li>
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
                                <li>withdraw optional permissions such as encrypted sync.</li>
                            </ul>
                            <p>
                                In practice, paid users control their payroll records through their account settings. You can delete cloud-stored records or close your account at any time. Free users have no stored records to manage.
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
                    <p className="text-xs text-[var(--text-muted)]">© {currentYear} LekkerLedger. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}
