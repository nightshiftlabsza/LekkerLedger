"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Database, HardDrive, Cloud, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoragePage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20 space-y-12">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 mb-8 -ml-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>

                <header className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                        <Database className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Security & Storage</h1>
                    <p className="text-zinc-500 font-medium">How household payroll records stay private from LekkerLedger while still being portable when you choose Google backup.</p>
                </header>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-10 text-zinc-400 leading-relaxed font-medium">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-[var(--text)]">The &quot;No Central Database&quot; Promise</h2>
                        <p>
                            Unlike traditional HR software, LekkerLedger is designed for households. We do not host a massive, centralized database of your employees&apos; personal information, wages, or ID numbers on our servers.
                        </p>
                        <p>
                            Instead, your data belongs to you, and it stays with you. You have two options for how your data is stored: <strong>Local Only</strong> or <strong>Google-connected backup in your own Google Drive app data area</strong>.
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-6 not-prose">
                        {/* Local Storage Card */}
                        <div className="glass-panel border-2 border-[var(--border)] p-6 rounded-2xl relative overflow-hidden group">
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
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Never leaves your device unless you choose backup</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Works completely offline</li>
                                <li className="flex gap-2 items-start"><AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> <span className="text-amber-500/90 font-medium">Risk: If you clear your browser data or lose your device, your data is gone indefinitely unless exported.</span></li>
                            </ul>
                        </div>

                        {/* Google Drive Card */}
                        <div className="glass-panel border-2 border-[var(--primary)]/30 p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Cloud className="h-24 w-24 text-[var(--primary)]" />
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 border border-[var(--primary)]/20">
                                <Cloud className="h-5 w-5 text-[var(--primary)]" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Google-connected Backup</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                                You can authorize LekkerLedger to store a backup file in Google Drive&apos;s private app data area inside your own Google account so you can restore records on another browser or device.
                            </p>
                            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Access data across multiple devices</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Protected by your Google security</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Private from LekkerLedger and outside our central systems</li>
                                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" /> Safe from browser cache clears</li>
                            </ul>
                        </div>
                    </div>

                    <section className="space-y-4 pt-8">
                        <h2 className="text-2xl font-black text-[var(--text)]">Google Drive Permissions Explained</h2>
                        <p>
                            If you elect to use Google-connected backup, LekkerLedger will request Google account access and Drive app-data access. What does this mean?
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>We DO NOT</strong> have access to your normal Google Drive files, photos, or emails.</li>
                            <li><strong>We ONLY</strong> use the private app data area needed to store and restore your LekkerLedger backup.</li>
                            <li>Your payroll records are not copied into a LekkerLedger central employee database.</li>
                            <li>You can revoke this permission at any time from your Google Account security settings.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[var(--text)]">How to permanently delete your data</h2>
                        <p>
                            We make it easy to forget you ever used us. Because your data is local, all you need to do is go to the <strong>Settings</strong> page inside the app and click <strong>&quot;Wipe All Local Data&quot;</strong>. This will permanently erase all employees, payslips, and settings from your browser.
                        </p>
                        <p>
                            If you use Google Drive Sync, disabling the sync will stop updates, but you may want to delete the hidden app data folder via your Google Drive settings.
                        </p>
                    </section>
                </div>

                <div className="pt-12 text-center pb-8 border-t border-[var(--border)] mt-12">
                    <p className="text-lg font-bold text-[var(--text)] mb-6">Ready to create a payslip safely?</p>
                    <Link href="/onboarding">
                        <Button className="h-14 px-8 text-base bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-lg shadow-[var(--primary)]/20 font-bold rounded-xl transition-all hover:-translate-y-1">
                            Start for Free
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
