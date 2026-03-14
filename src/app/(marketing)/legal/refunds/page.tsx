"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierDetails } from "@/components/legal/supplier-details";
import { PLANS, getPlanPricePresentation } from "@/config/plans";

export default function RefundPolicy() {
    const currentYear = new Date().getFullYear();
    const standardMonthlyPrice = `R${PLANS.standard.pricing.monthly}`;
    const standardYearlyPrice = `R${PLANS.standard.pricing.yearly}`;
    const standardYearlyEquivalent = getPlanPricePresentation("standard", "yearly").primaryPrice;
    const proMonthlyPrice = `R${PLANS.pro.pricing.monthly}`;
    const proYearlyPrice = `R${PLANS.pro.pricing.yearly}`;
    const proYearlyEquivalent = getPlanPricePresentation("pro", "yearly").primaryPrice;

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
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Refund & Cancellation</h1>
                    <p className="font-medium text-[var(--text-muted)]">Updated 10 March 2026 • 14-day refund on paid charges</p>
                </header>

                <div className="policy-copy max-w-none space-y-8 leading-relaxed font-medium">
                    <SupplierDetails />

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">1. Plans and billing start dates</h2>
                        <p>
                            LekkerLedger offers two paid plans today:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Standard:</strong> {standardMonthlyPrice}/month or {standardYearlyPrice}/year for one household, up to 3 active employees, and the core paid features. Yearly billing works out to about {standardYearlyEquivalent}/month.</li>
                            <li><strong>Pro:</strong> {proMonthlyPrice}/month or {proYearlyPrice}/year for unlimited employees, multi-household workspaces, and the deepest archive. Yearly billing works out to about {proYearlyEquivalent}/month.</li>
                        </ul>
                        <p>
                            Standard and Pro start immediately once payment succeeds. Charges are processed through Paystack on the monthly or yearly cycle you choose.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">2. Cancellation before or after renewal</h2>
                        <p>
                            Monthly and yearly plans renew at the end of the billing period unless you cancel before renewal. If you cancel renewal, access continues until the end of the period you have already paid for.
                        </p>
                        <p>
                            If you cancel after a paid charge has already happened, access continues until the end of the period you already paid for. There are no cancellation fees.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">3. Refund requests within 14 days</h2>
                        <p>
                            Our 14-day refund policy applies to your paid charge. If LekkerLedger is not the right fit, request a refund within 14 days of that charge date and we will refund you in full once we have verified the payment.
                        </p>
                        <p>
                            Requests received after 14 days are outside the refund window and will not be processed unless required by law.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">4. Referral reward timing</h2>
                        <p>
                            If you refer a new paying customer, the free referral month is held in a pending state until that referred customer has paid for Standard or Pro and passed the same 14-day refund window without a refund or chargeback.
                        </p>
                        <p>
                            Referral rewards are limited to 12 free months per account. Self-referrals, duplicate referee accounts, and other abusive or fraudulent attempts can be rejected or reversed.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">5. How to Request a Refund</h2>
                        <p>
                            To request a refund, email support@lekkerledger.co.za with your transaction details. We review refund requests within 1-4 business days (Monday to Friday, South African Standard Time, excluding public holidays) after we receive the information needed to verify the payment.
                        </p>
                    </section>
                </div>

                <footer className="border-t border-[var(--border)] pt-20">
                    <p className="text-xs text-[var(--text-muted)]">© {currentYear} LekkerLedger. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}


