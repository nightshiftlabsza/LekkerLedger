"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME, PRIVACY_EMAIL, SUPPORT_EMAIL } from "@/config/brand";
import { SupplierDetails } from "@/components/legal/supplier-details";

const UPDATED_DATE = "21 March 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-black text-[var(--text)]">{title}</h2>
            {children}
        </section>
    );
}

export default function TermsOfService() {
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
                        <Scale className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Terms of Service</h1>
                    <p className="font-medium text-[var(--text-muted)]">Updated {UPDATED_DATE}</p>
                </header>

                <div className="space-y-8 text-[var(--text-muted)]">
                    <div className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-6">
                        <h2 className="text-xl font-black text-[var(--text)]">Plain-language summary</h2>
                        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7">
                            <li>LekkerLedger is a record-keeping and payroll preparation tool, not a managed payroll service and not legal advice.</li>
                            <li>You are responsible for the accuracy of the information you enter and for checking official requirements before submission or payment.</li>
                            <li>Paid plans are billed through our payment provider, and refunds are handled under the published refund policy.</li>
                            <li>We can update, improve, suspend, or stop parts of the service where reasonably necessary.</li>
                            <li>Our liability is limited to the maximum extent allowed by law.</li>
                        </ul>
                    </div>

                    <SupplierDetails />

                    <div className="policy-copy max-w-none space-y-8 font-medium leading-relaxed">
                        <Section title="1. Acceptance of terms">
                            <p>
                                By using LekkerLedger, you agree to these Terms of Service. If you do not agree, do not use the website or app.
                                LekkerLedger is operated by {COMPANY_NAME} in South Africa.
                            </p>
                        </Section>

                        <Section title="2. What the service is">
                            <p>
                                LekkerLedger is a household employment record-keeping and payroll preparation tool. It helps you organise employee details, create payslips, prepare exports, and keep supporting records together.
                            </p>
                            <p>
                                LekkerLedger is not a law firm, not a payroll bureau, not an accounting service, and not a substitute for checking official rules, notices, or guidance that apply to your situation.
                            </p>
                        </Section>

                        <Section title="3. Eligibility and acceptable use">
                            <p>You may use LekkerLedger only in a lawful way and only for its intended purpose. You agree not to:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                <li>use the service to break the law or infringe another person&apos;s rights,</li>
                                <li>attempt to interfere with the security or operation of the service,</li>
                                <li>misrepresent your identity, payment status, or entitlement to use paid features, or</li>
                                <li>use the service in a way that is abusive, fraudulent, or harmful to others.</li>
                            </ul>
                        </Section>

                        <Section title="4. Your responsibilities">
                            <p>As the employer or user, you remain responsible for:</p>
                            <ul className="list-disc space-y-2 pl-6">
                                <li>entering accurate names, hours, rates, leave figures, and reference details,</li>
                                <li>reviewing calculations and documents before relying on them,</li>
                                <li>checking official guidance before making payments, declarations, or submissions,</li>
                                <li>keeping your own access credentials, devices, and accounts secure, and</li>
                                <li>maintaining your own backups where needed.</li>
                            </ul>
                        </Section>

                        <Section title="5. Pricing, billing, and refunds">
                            <p>
                                Free, Standard, and Pro plan details are described on the pricing pages. Paid access is billed through our payment provider. We do not store your full card details ourselves.
                            </p>
                            <p>
                                Standard and Pro are billed through our payment provider when payment succeeds, then renew on the monthly or yearly cycle you selected unless you cancel renewal first.
                            </p>
                            <p>
                                Refunds are handled according to the published refund policy. If there is a conflict between a brief summary on another page and the formal refund policy, the refund policy should control.
                            </p>
                            <p>
                                We may change pricing, features, or plan packaging in the future. Changes should apply prospectively, not retroactively, unless required for legal, technical, or fraud-prevention reasons.
                            </p>
                            <p>
                                Referral rewards may be offered on published terms. A referral reward can be delayed, withheld, reversed, or canceled where there is self-referral, duplicate-account abuse, refunded qualifying payments, chargebacks, or other fraud-prevention concerns.
                            </p>
                        </Section>

                        <Section title="6. Data retention and automatic removal">
                            <p>
                                Different plans retain generated payroll documents (such as payslips and exports) for different periods. On the Standard plan, generated payroll documents and their underlying calculation data are automatically and permanently removed after 12 months from their creation date. On the Pro plan, generated payroll documents are retained for up to 5 years.
                            </p>
                            <p>
                                Employee profiles, contracts, uploaded documents, household settings, and other account data are not affected by this automatic removal and remain available until you delete them yourself.
                            </p>
                            <p>
                                LekkerLedger displays in-app warnings when generated documents approach the retention limit on Standard, so you can save your own copies before removal. You remain responsible for keeping your own offline or printed copies of any records you may need beyond the in-app retention period, including records required under South African employment law.
                            </p>
                            <p>
                                If you change from a higher plan to a lower plan, the retention limit of the new plan applies. Generated payroll documents that exceed the new retention limit may be permanently removed. For more detail, see the privacy policy.
                            </p>
                        </Section>

                        <Section title="7. Availability and changes">
                            <p>
                                We aim to keep LekkerLedger available and useful, but we do not promise uninterrupted availability. Maintenance, upgrades, provider outages, or technical incidents may affect access from time to time.
                            </p>
                            <p>
                                We may update, improve, replace, or remove features where reasonably necessary. We may also suspend or limit access if we believe there is misuse, fraud, security risk, or non-payment.
                            </p>
                        </Section>

                        <Section title="8. Intellectual property">
                            <p>
                                The LekkerLedger product, brand, design, text, and non-open-source materials remain the property of {COMPANY_NAME} or its licensors.
                            </p>
                            <p>
                                Open-source components remain subject to their own licenses. Those licenses do not grant rights to the LekkerLedger name, branding, or product identity.
                            </p>
                        </Section>

                        <Section title="9. Disclaimers">
                            <p>
                                LekkerLedger provides tools, guidance, and calculations intended to help household employers stay organised. It does not guarantee legal outcomes, tribunal outcomes, regulator acceptance, or the correctness of information you enter.
                            </p>
                            <p>
                                Because laws, notices, filing windows, and official guidance can change, you must verify important details against official sources before relying on them.
                            </p>
                        </Section>

                        <Section title="10. Limitation of liability">
                            <p>
                                To the extent permitted by law, LekkerLedger is provided as a tool to assist record-keeping and payroll preparation, not as a guarantee of legal or payroll outcomes.
                            </p>
                            <p>
                                We are not responsible for losses caused by incorrect information entered by users, missed filings or payments, third-party provider outages, or loss of locally stored data caused by device, browser, or account issues outside our reasonable control. Nothing in these terms excludes liability that cannot legally be excluded.
                            </p>
                        </Section>

                        <Section title="11. Termination">
                            <p>
                                You may stop using the service at any time. We may suspend or terminate access where reasonably necessary for abuse, fraud, legal reasons, or security reasons.
                            </p>
                            <p>
                                Termination does not automatically delete data stored on your own device. However, plan-based retention limits described in section 6 continue to apply to cloud-stored records.
                            </p>
                        </Section>

                        <Section title="12. Governing law and contact">
                            <p>These terms are governed by the laws of the Republic of South Africa.</p>
                            <p>
                                For product or legal-policy questions, contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                            </p>
                            <p>
                                For privacy, data-rights, or security matters, contact <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
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
