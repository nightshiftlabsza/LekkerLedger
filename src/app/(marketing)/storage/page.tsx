"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Database, Cloud, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoragePage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="content-container-wide px-4 py-12 sm:px-6 sm:py-20 lg:px-8 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="max-w-3xl space-y-4">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Database className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Security & Storage</h1>
                    <p className="font-medium text-[var(--text-muted)]">How paid accounts keep records cloud-secured, and how the free payslip flow works.</p>
                </header>

                <div className="grid gap-12 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] xl:items-start">
                    <div className="policy-copy max-w-none space-y-10 leading-relaxed font-medium">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-[var(--text)]">How cloud storage and encryption work</h2>
                        <p>
                            Paid accounts store all payroll records in end-to-end encrypted cloud storage. Your data is encrypted before it leaves your device and can only be decrypted with your credentials.
                        </p>
                        <p>
                            Free users do not have persistent storage. The free payslip tool generates a single PDF per month that you download directly — no records are retained in the browser or on our servers after the session.
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-6 not-prose">
                        {/* Paid Cloud Storage Card */}
                        <div className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--surface-1)] p-6 relative overflow-hidden group shadow-[var(--shadow-sm)]">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Cloud className="h-24 w-24 text-[var(--primary)]" />
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 border border-[var(--primary)]/20">
                                <Cloud className="h-5 w-5 text-[var(--primary)]" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Cloud-Secured (Paid)</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                                Paid accounts encrypt records on-device and store them in the cloud. Sign in from any device to access your data.
                            </p>
                            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> End-to-end encrypted before upload</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Access records across any device</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Choose Recoverable Encryption or Maximum Privacy during setup</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Signing out clears all data from the device</li>
                            </ul>
                        </div>

                        {/* Free Payslip Card */}
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 relative overflow-hidden group shadow-[var(--shadow-sm)]">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Database className="h-24 w-24 text-[var(--text)]" />
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-4 border border-[var(--border)]">
                                <Database className="h-5 w-5 text-[var(--text)]" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Free Payslip Tool</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                                One free payslip per month. Enter details, generate the PDF, download it. Nothing is stored in the browser or on our servers.
                            </p>
                            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--success)] shrink-0" /> No account required</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--success)] shrink-0" /> PDF generated in-browser and downloaded</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--success)] shrink-0" /> No records persist after the session</li>
                            </ul>
                        </div>
                    </div>

                    <section className="space-y-4 pt-8">
                        <h2 className="text-2xl font-black text-[var(--text)]">How Encrypted Cloud Storage Works</h2>
                        <p>
                            When you create a paid account, LekkerLedger encrypts your data on-device before uploading. This means:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>We do not</strong> have access to your unencrypted payroll records on our servers.</li>
                            <li><strong>We only</strong> store encrypted data plus the minimum account metadata needed for the recovery mode you choose.</li>
                            <li>You can choose between Recoverable Encryption (password-based recovery) or Maximum Privacy (recovery-key-only access).</li>
                            <li>When you sign out, all data is cleared from the device. Your records remain safe in encrypted cloud storage.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">In-app retention by plan</h2>
                        <p>
                            Different plans keep generated payroll documents (payslips and exports) in-app for different periods:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Standard:</strong> generated payslips and exports are kept for up to 12 months. After 12 months, they are permanently removed from the app and cloud storage. You are warned as documents approach this limit.</li>
                            <li><strong>Pro:</strong> generated payslips, exports, and uploaded documents are kept for up to 5 years.</li>
                        </ul>
                        <p>
                            Employee profiles, contracts, uploaded documents, and account settings are not affected by these limits and remain available until you delete them yourself.
                        </p>
                        <p>
                            South African employment law may require employers to keep certain records for 3 to 5 years. LekkerLedger reminds Standard users to save their own copies as generated documents approach the 12-month limit.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">How to delete your data</h2>
                        <p>
                            Paid accounts can delete their cloud-stored records from the <strong>Settings</strong> page. This permanently erases all employees, payslips, and settings from cloud storage.
                        </p>
                        <p>
                            Free users have nothing to delete — the PDF is generated and downloaded in a single session with no persistent storage.
                        </p>
                    </section>
                    </div>

                    <aside className="space-y-6 xl:sticky xl:top-6">
                        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                            <h2 className="text-2xl font-black text-[var(--text)]">Which option fits?</h2>
                            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                                Choose based on what you need from LekkerLedger.
                            </p>
                            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
                                <li><strong className="text-[var(--text)]">Free:</strong> One payslip per month as a downloadable PDF. No account, no stored data.</li>
                                <li><strong className="text-[var(--text)]">Paid:</strong> Cloud-secured records, encrypted sync across devices, dashboard, contracts, leave tracking, and exports.</li>
                            </ul>
                        </div>

                        <div className="rounded-[2rem] border border-[var(--primary)]/15 bg-[var(--primary)]/5 p-6 shadow-[var(--shadow-sm)] sm:p-7">
                            <div className="flex items-center gap-3 mb-3">
                                <KeyRound className="h-5 w-5 text-[var(--primary)]" />
                                <p className="text-sm font-bold text-[var(--text)]">Encryption modes</p>
                            </div>
                            <ul className="space-y-2 text-sm leading-7 text-[var(--text-muted)]">
                                <li><strong className="text-[var(--text)]">Recoverable:</strong> Password-wrapped key. If you forget your password, account recovery restores access.</li>
                                <li><strong className="text-[var(--text)]">Maximum Privacy:</strong> Recovery key only. If you lose the key, data cannot be recovered — not even by us.</li>
                            </ul>
                        </div>

                        <div className="border-t border-[var(--border)] pt-8 text-center">
                            <p className="mb-6 text-lg font-bold text-[var(--text)]">Ready to start keeping household payroll records?</p>
                            <Link href="/pricing">
                                <Button className="h-14 rounded-xl bg-[var(--primary)] px-8 text-base font-bold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:-translate-y-1 hover:bg-[var(--primary-hover)]">
                                    View Plans
                                </Button>
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
