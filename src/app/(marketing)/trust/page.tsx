import * as React from "react";
import Link from "next/link";
import { Shield, Lock, HardDrive, Scale, ArrowRight, WalletCards, FolderSync, KeyRound, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { COMPLIANCE } from "@/lib/compliance-constants";
import { getNMWRecordForDate } from "@/lib/legal/registry";
import { PLANS, REFUND_POLICY_SENTENCE, REFUND_POLICY_SHORT_LABEL, getPlanPricePresentation } from "@/config/plans";
import { PRIVACY_EMAIL } from "@/config/brand";

export default function TrustCenterPage() {
    const nmwRecord = getNMWRecordForDate(new Date());
    const standardMonthlyPrice = `R${PLANS.standard.pricing.monthly}`;
    const standardYearlyPrice = `R${PLANS.standard.pricing.yearly}`;
    const standardYearlyEquivalent = getPlanPricePresentation("standard", "yearly").primaryPrice;
    const proMonthlyPrice = `R${PLANS.pro.pricing.monthly}`;
    const proYearlyPrice = `R${PLANS.pro.pricing.yearly}`;
    const proYearlyEquivalent = getPlanPricePresentation("pro", "yearly").primaryPrice;
    const effectiveDateLabel = new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(nmwRecord.effectiveDate));

    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--bg)]">
            <MarketingHeader />
            {/* Header section */}
            <header className="relative py-20 md:py-32 border-b border-[var(--border)] overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="content-container-wide px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--primary)]/10 mb-4 border border-[var(--primary)]/20 shadow-inner">
                        <Shield className="h-8 w-8 text-[var(--primary)]" />
                    </div>
                    <h1 className="type-h1" style={{ color: "var(--text)" }}>Trust Center</h1>
                    <p className="type-body-large" style={{ color: "var(--text-muted)" }}>
                        How we process your data, compute your payroll, and protect your privacy. Everything laid out clearly, so your payroll records can feel calm rather than intimidating.
                    </p>
                </div>
            </header>

            <main id="main-content" className="content-container-ultrawide px-4 py-16 sm:px-6 lg:px-8 lg:py-20 space-y-20 lg:space-y-24">
                {/* 1. Privacy & Architecture */}
                <section className="scroll-mt-32" id="privacy">
                    <div className="flex items-center gap-3 mb-8">
                        <Lock className="h-6 w-6 text-[var(--primary)]" />
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>Privacy Architecture</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                We take a local-first approach to payroll records. Employee names, wages, and ID details stay on your device by default instead of being uploaded into a central LekkerLedger payroll database.
                            </p>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                This architecture reduces how much employee payroll data LekkerLedger needs to handle directly. On paid plans, your backup is stored in encrypted form and you choose between Recoverable Encryption and Maximum Privacy during secure setup.
                            </p>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Free does not require an account. A sign-in is only needed if you choose paid encrypted sync to back up and restore across devices.
                            </p>
                            <Link href="/storage" className="inline-flex items-center text-sm font-bold text-[var(--primary)] hover:underline mt-2">
                                Read the storage guide <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                                <HardDrive className="mb-3 h-5 w-5 text-[var(--text-muted)]" />
                                <h4 className="font-bold mb-1" style={{ color: "var(--text)" }}>Local Storage</h4>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Your payroll records are stored in your browser&apos;s IndexedDB by default and are not uploaded to a LekkerLedger central employee database.</p>
                            </div>
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                                <FolderSync className="mb-3 h-5 w-5 text-[var(--success)]" />
                                <h4 className="font-bold mb-1" style={{ color: "var(--text)" }}>Encrypted Sync</h4>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Paid plans include encrypted sync to back up and restore records across browsers and devices.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-[var(--border)]" />

                {/* 2. Security Basics */}
                <section className="scroll-mt-32" id="security">
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="h-6 w-6 text-[var(--primary)]" />
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>Security at a glance</h2>
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <HardDrive className="mb-3 h-5 w-5 text-[var(--text-muted)]" />
                            <h4 className="font-bold mb-2" style={{ color: "var(--text)" }}>Local by default</h4>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Payroll records stay in your browser storage by default. They are not uploaded to a LekkerLedger employee database unless you choose encrypted sync on a paid plan.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <KeyRound className="h-5 w-5 text-[var(--primary)] mb-3" />
                            <h4 className="font-bold mb-2" style={{ color: "var(--text)" }}>Limited data access</h4>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Authentication uses email and password via Supabase. Encrypted sync is available on paid plans and keeps payroll records encrypted before upload, with recovery rules based on the mode you choose.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <WalletCards className="h-5 w-5 text-[var(--focus)] mb-3" />
                            <h4 className="font-bold mb-2" style={{ color: "var(--text)" }}>Payments handled by Paystack</h4>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Card checkout is handled by Paystack. LekkerLedger does not collect or store your card number in this app.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <Bug className="mb-3 h-5 w-5 text-[var(--danger)]" />
                            <h4 className="font-bold mb-2" style={{ color: "var(--text)" }}>Report problems quickly</h4>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                If you spot a privacy or security issue, email <a href={`mailto:${PRIVACY_EMAIL}`} className="font-semibold text-[var(--primary)] hover:underline">{PRIVACY_EMAIL}</a> with what happened, what device or browser you used, and how to reproduce it.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        Account email and sync-permission state may be stored locally on your device so reconnect and restore flows can work. This page is meant to describe the current setup plainly, not to claim enterprise-grade controls that are not in place.
                    </div>
                </section>

                <hr className="border-[var(--border)]" />

                {/* 3. Constants & Compliance */}
                <section className="scroll-mt-32" id="compliance">
                    <div className="flex items-center gap-3 mb-8">
                        <Scale className="h-6 w-6 text-[var(--primary)]" />
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>Payroll & Admin Constants</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Minimum Wage</h4>
                            <div className="text-3xl font-black mb-1" style={{ color: "var(--text)" }}>R{nmwRecord.rate.toFixed(2)}</div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Per hour. Effective from {effectiveDateLabel}.</p>
                            <a href={nmwRecord.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs font-bold text-[var(--primary)] hover:underline">
                                Source: National Minimum Wage notice
                            </a>
                        </div>
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>UIF Deduction</h4>
                            <div className="text-3xl font-black mb-1" style={{ color: "var(--text)" }}>1% + 1%</div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>1% deducted from employee, 1% contributed by employer.</p>
                            <a href={COMPLIANCE.UIF.SOURCE_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs font-bold text-[var(--primary)] hover:underline">
                                Source: UIF guidance
                            </a>
                        </div>
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Compensation for Occupational Injuries and Diseases Act (COIDA)</h4>
                            <div className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Many domestic employers need to register</div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>Many domestic employers need to register with the Compensation Fund for injury-on-duty cover. This is general information only, so check the official guidance for your own situation before relying on it.</p>
                            <p className="mt-2 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Not legal advice.</p>
                            <a href="https://www.labour.gov.za/compensation-fund-obligations-of-the-employer" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs font-bold text-[var(--primary)] hover:underline">Source: Compensation Fund guidance</a>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link href="/rules" className="inline-flex items-center text-sm font-bold text-[var(--primary)] hover:underline">
                            View the household checklist <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                </section>

                <hr className="border-[var(--border)]" />

                {/* 4. Pricing, Payments & Refunds */}
                <section className="scroll-mt-32" id="billing">
                    <div className="flex items-center gap-3 mb-8">
                        <WalletCards className="h-6 w-6 text-[var(--primary)]" />
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>Billing & Refunds</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Payment Processing via Paystack</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    All payments are securely processed by Paystack. We do not collect, process, or store your credit card information on our servers.
                                </p>
                                <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--text-muted)" }}>
                                    Payments are processed by Paystack, which holds PCI DSS Level 1 certification.{" "}
                                    <a
                                        href="https://paystack.com/compliance"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-[var(--primary)] hover:underline"
                                    >
                                        Learn about Paystack security
                                    </a>
                                </p>
                                <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--text-muted)" }}>
                                    All prices are in ZAR. No VAT will be added at checkout because LekkerLedger is not currently VAT-registered.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>No Hidden Fees</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Free covers the essentials. Standard is {standardMonthlyPrice}/month or {standardYearlyPrice}/year, which works out to about {standardYearlyEquivalent}/month on yearly billing, for most households that want organised records, backup, contracts, and annual paperwork. Pro is {proMonthlyPrice}/month or {proYearlyPrice}/year, which works out to about {proYearlyEquivalent}/month on yearly billing, for full document storage, longer archive history, and richer admin tracking, with unlimited employees and multi-household workspaces when you need them. Both paid tiers are still priced for households rather than the higher monthly fees common in managed payroll services.
                                </p>
                            </div>
                        </div>
                        <div className="p-8 rounded-2xl border border-[var(--primary)] bg-[var(--primary)]/5">
                            <h3 className="text-xl font-black mb-3" style={{ color: "var(--text)" }}>{REFUND_POLICY_SHORT_LABEL}</h3>
                            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                                {REFUND_POLICY_SENTENCE}
                            </p>
                            <Link href="/legal/refunds">
                                <Button className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">Full Refund Policy</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}



