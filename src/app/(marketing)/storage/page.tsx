"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Database, HardDrive, Cloud, AlertCircle, ShieldCheck } from "lucide-react";
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
                    <p className="font-medium text-[var(--text-muted)]">How payroll records stay on your device by default, and how optional encrypted sync works when you choose it.</p>
                </header>

                <div className="grid gap-12 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] xl:items-start">
                    <div className="policy-copy max-w-none space-y-10 leading-relaxed font-medium">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-[var(--text)]">How local storage and optional backup work</h2>
                        <p>
                            Unlike traditional HR software, LekkerLedger is designed so employee payroll records stay on your device by default instead of being uploaded into a large company-run payroll database.
                        </p>
                        <p>
                            You have two main storage paths: <strong>Local only</strong> or <strong>Encrypted sync across devices</strong> (available on paid plans).
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-6 not-prose">
                        {/* Local Storage Card */}
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 relative overflow-hidden group shadow-[var(--shadow-sm)]">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <HardDrive className="h-24 w-24 text-[var(--text)]" />
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-4 border border-[var(--border)]">
                                <HardDrive className="h-5 w-5 text-[var(--text)]" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Local Storage (Default)</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                                By default, everything you enter is saved in your browser&apos;s local storage database (IndexedDB).
                            </p>
                            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--success)] shrink-0" /> Payroll records are not uploaded to a LekkerLedger employee database by default. Optional encrypted sync stores an encrypted backup for restore across devices.</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--success)] shrink-0" /> Works completely offline</li>
                                <li className="flex gap-2 items-start"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" /> <span style={{ color: "var(--warning)" }}>If you clear your browser data without backup enabled, the records on this device cannot be recovered. That is why paid plans with sync are better for households that want backup before changing browsers or devices.</span></li>
                            </ul>
                        </div>

                        {/* Encrypted Sync Card */}
                        <div className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--surface-1)] p-6 relative overflow-hidden group shadow-[var(--shadow-sm)]">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Cloud className="h-24 w-24 text-[var(--primary)]" />
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 border border-[var(--primary)]/20">
                                <Cloud className="h-5 w-5 text-[var(--primary)]" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Encrypted Sync</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                                You can enable encrypted sync to store a backup that can be restored on another browser or device. Your data is encrypted before it leaves your device.
                            </p>
                            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Access data across multiple devices</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Records are encrypted before upload</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Choose Recoverable Encryption or Maximum Privacy during secure setup</li>
                                <li className="flex gap-2 items-start"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" /> <span style={{ color: "var(--warning)" }}>Paid plans with sync are the better fit if you want your records to move with you. Always confirm backup before changing browsers or devices.</span></li>
                            </ul>
                        </div>
                    </div>

                    <section className="space-y-4 pt-8">
                        <h2 className="text-2xl font-black text-[var(--text)]">How Encrypted Sync Works</h2>
                        <p>
                            If you elect to use encrypted sync, LekkerLedger will encrypt your data on-device before uploading. What does this mean?
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>We DO NOT</strong> have access to your unencrypted data on our servers.</li>
                            <li><strong>We ONLY</strong> store encrypted backup data plus the minimum account metadata needed for the recovery mode you choose.</li>
                            <li>Your payroll records are not uploaded into a central LekkerLedger employee payroll database as part of this backup flow.</li>
                            <li>You can disable sync at any time from your account settings.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">How to permanently delete your data</h2>
                        <p>
                            We make it easy to forget you ever used us. Because your data is local, all you need to do is go to the <strong>Settings</strong> page inside the app and click <strong>&quot;Wipe All Local Data&quot;</strong>. This will permanently erase all employees, payslips, and settings from your browser.
                        </p>
                        <p>
                            If you use encrypted sync, disabling the sync will stop updates. You can request deletion of your encrypted backup from your account settings.
                        </p>
                    </section>
                    </div>

                    <aside className="space-y-6 xl:sticky xl:top-6">
                        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                            <h2 className="text-2xl font-black text-[var(--text)]">Practical rule of thumb</h2>
                            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                                Local-first storage keeps everyday payroll simple. If these records matter beyond one browser profile or one device, paid encrypted sync is the safer fit.
                            </p>
                            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
                                <li>Use local-only if one device is enough and you manage your own browser backups.</li>
                                <li>Use encrypted sync if you need restore, device changes, or calmer long-term record keeping.</li>
                                <li>Always confirm your backup setup before replacing a device or clearing browser data.</li>
                            </ul>
                        </div>

                        <div className="border-t border-[var(--border)] pt-8 text-center">
                            <p className="mb-6 text-lg font-bold text-[var(--text)]">Ready to start keeping household payroll records?</p>
                            <Link href="/dashboard">
                                <Button className="h-14 rounded-xl bg-[var(--primary)] px-8 text-base font-bold text-white shadow-lg shadow-[var(--primary)]/20 transition-all hover:-translate-y-1 hover:bg-[var(--primary-hover)]">
                                    Start for Free
                                </Button>
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
