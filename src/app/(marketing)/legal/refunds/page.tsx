"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierDetails } from "@/components/legal/supplier-details";

export default function RefundPolicy() {
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
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Refund & Cancellation</h1>
                    <p className="text-zinc-500 font-medium">Updated 10 March 2026 • 14-day refund on the first real subscription charge</p>
                </header>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-zinc-400 leading-relaxed font-medium">
                    <SupplierDetails />

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">1. Trials, plans, and the R1 card check</h2>
                        <p>
                            LekkerLedger offers two paid plans today:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Standard:</strong> R29/month or R249/year for one household, up to 3 active employees, and the core paid features.</li>
                            <li><strong>Pro:</strong> R49/month or R399/year for unlimited employees, multi-household workspaces, and the deepest archive.</li>
                        </ul>
                        <p>
                            Standard and Pro currently begin with a 14-day trial. Starting a trial requires Google sign-in and a small R1 Paystack card-verification charge so a reusable payment method can be saved for automatic renewal later.
                        </p>
                        <p>
                            The R1 card-verification charge is not the main subscription charge and does not start the 14-day refund window for the plan itself.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">2. Cancellation before or after the trial</h2>
                        <p>
                            Monthly and yearly plans renew at the end of the billing period unless you cancel before renewal. If you cancel during the trial, the first real subscription charge will not be taken and access continues until the trial end date already shown in the app.
                        </p>
                        <p>
                            If you cancel after a paid charge has already happened, access continues until the end of the period you already paid for. There are no cancellation fees.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">3. Refund requests within 14 days</h2>
                        <p>
                            Our 14-day refund policy applies to the first real subscription charge taken after the trial. If LekkerLedger is not the right fit, request a refund within 14 days of that charge date and we will refund you in full once we have verified the payment.
                        </p>
                        <p>
                            Requests received after 14 days are outside the refund window and will not be processed unless required by law.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">4. Referral reward timing</h2>
                        <p>
                            If you refer a new paying customer, the free referral month is held in a pending state until that referred customer has completed the trial, paid for one real month on Standard or Pro, and passed the same 14-day refund window without a refund or chargeback.
                        </p>
                        <p>
                            Referral rewards are limited to 12 free months per account. Self-referrals, duplicate referee accounts, and other abusive or fraudulent attempts can be rejected or reversed.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white">5. How to Request a Refund</h2>
                        <p>
                            To request a refund, email support@lekkerledger.co.za with your transaction details. We review refund requests within 1-4 business days (Monday to Friday, South African Standard Time, excluding public holidays) after we receive the information needed to verify the payment.
                        </p>
                    </section>
                </div>

                <footer className="pt-20 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-600">© {currentYear} LekkerLedger. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}


