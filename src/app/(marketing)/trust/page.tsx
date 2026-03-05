import * as React from "react";
import Link from "next/link";
import { Shield, Lock, HardDrive, DollarSign, Scale, ArrowRight, WalletCards, FolderSync } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNMWForDate } from "@/lib/legal/registry";
import { PLANS } from "@/src/config/plans";

export default function TrustCenterPage() {
    const nmw = getNMWForDate(new Date());

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            {/* Header section */}
            <header className="relative py-20 md:py-32 border-b border-[var(--border)] overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                </div>
                <div className="content-container-wide px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--primary)]/10 mb-4 border border-[var(--primary)]/20 shadow-inner">
                        <Shield className="h-8 w-8 text-[var(--primary)]" />
                    </div>
                    <h1 className="type-h1" style={{ color: "var(--text)" }}>Trust Center</h1>
                    <p className="type-body-large" style={{ color: "var(--text-muted)" }}>
                        How we process your data, compute your payroll, and protect your privacy. Everything laid out clearly.
                    </p>
                </div>
            </header>

            <main className="content-container-wide px-6 lg:px-8 py-20 space-y-24">
                {/* 1. Privacy & Architecture */}
                <section className="scroll-mt-32" id="privacy">
                    <div className="flex items-center gap-3 mb-8">
                        <Lock className="h-6 w-6 text-[var(--primary)]" />
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>Privacy Architecture</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                We take a strict &quot;local-first&quot; approach to your data. There is no central LekkerLedger database containing your employee&apos;s personal details, ID numbers, or salaries.
                            </p>
                            <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                This model inherently minimizes risk and aligns closely with POPIA data minimization principles.
                            </p>
                            <Link href="/legal/privacy" className="inline-flex items-center text-sm font-bold text-[var(--primary)] hover:underline mt-2">
                                Read full Privacy Policy <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                                <HardDrive className="h-5 w-5 text-zinc-500 mb-3" />
                                <h4 className="font-bold mb-1" style={{ color: "var(--text)" }}>Local Storage</h4>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your data is securely stored in your browser&apos;s IndexedDB by default.</p>
                            </div>
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                                <FolderSync className="h-5 w-5 text-green-500 mb-3" />
                                <h4 className="font-bold mb-1" style={{ color: "var(--text)" }}>Google Drive Sync</h4>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pro users can sync an encrypted copy to their private Google Drive.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-[var(--border)]" />

                {/* 2. Constants & Compliance */}
                <section className="scroll-mt-32" id="compliance">
                    <div className="flex items-center gap-3 mb-8">
                        <Scale className="h-6 w-6 text-[var(--primary)]" />
                        <h2 className="type-h2" style={{ color: "var(--text)" }}>Compliance Constants</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Minimum Wage</h4>
                            <div className="text-3xl font-black mb-1" style={{ color: "var(--text)" }}>R{nmw.toFixed(2)}</div>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Per hour. Always sourced from the latest Dept. of Labour gazette.</p>
                        </div>
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>UIF Deduction</h4>
                            <div className="text-3xl font-black mb-1" style={{ color: "var(--text)" }}>1% + 1%</div>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>1% deducted from employee, 1% contributed by employer.</p>
                        </div>
                        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)]">
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>COIDA</h4>
                            <div className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Mandatory</div>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Since 2021, all domestic employers must register with the Compensation Fund.</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link href="/rules" className="inline-flex items-center text-sm font-bold text-[var(--primary)] hover:underline">
                            View the Compliance Guide <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                </section>

                <hr className="border-[var(--border)]" />

                {/* 3. Pricing, Payments & Refunds */}
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
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>No Hidden Fees</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Our Standard plan is free forever. The Lekker Pro plan is a once-off payment, while Annual Support is a yearly subscription that you can cancel anytime.
                                </p>
                            </div>
                        </div>
                        <div className="p-8 rounded-2xl border border-[var(--primary)] bg-[var(--primary)]/5">
                            <h3 className="text-xl font-black mb-3" style={{ color: "var(--text)" }}>14-Day Refund Guarantee</h3>
                            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                                If you are unsatisfied with your upgrade for any reason within 14 days, email us and we will issue a full refund — no questions asked.
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
