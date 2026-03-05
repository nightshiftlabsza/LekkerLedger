"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, ArrowRight, Printer, Download, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { COMPLIANCE } from "@/lib/compliance-constants";
import { generatePayslipPdfBytes } from "@/lib/pdf";
import { Employee, PayslipInput, EmployerSettings } from "@/lib/schema";

export default function ExamplesPage() {
    const handleDownload = async () => {
        const sampleEmployee: Employee = {
            id: "sample-id",
            name: "Nomsa Dlamini",
            idNumber: "800101 0234 081",
            role: "Domestic Helper",
            hourlyRate: 30.23,
            phone: "012 345 6789",
            ordinarilyWorksSundays: false,
            ordinaryHoursPerDay: 8,
            frequency: "Monthly",
            startDate: "2024-01-01"
        };

        const samplePayslip: PayslipInput = {
            id: "ps-sample",
            employeeId: "sample-id",
            payPeriodStart: new Date("2026-03-01"),
            payPeriodEnd: new Date("2026-03-31"),
            ordinaryHours: 160,
            overtimeHours: 8,
            sundayHours: 0,
            publicHolidayHours: 0,
            daysWorked: 22,
            shortFallHours: 0,
            hourlyRate: 30.23,
            includeAccommodation: false,
            otherDeductions: 0,
            createdAt: new Date(),
            ordinarilyWorksSundays: false,
            ordinaryHoursPerDay: 8,
            annualLeaveTaken: 0,
            sickLeaveTaken: 0,
            familyLeaveTaken: 0
        };

        const sampleSettings: EmployerSettings = {
            employerName: "Lerato Mokoena",
            employerAddress: "12 Protea Avenue, Cape Town",
            employerIdNumber: "700101 0000 000",
            uifRefNumber: "1234567/8",
            cfNumber: "990001234",
            sdlNumber: "L123456789",
            phone: "021 555 1234",
            installationId: "sample",
            usageHistory: [],
            proStatus: "free",
            defaultLanguage: "en",
            density: "comfortable",
            googleSyncEnabled: false,
            piiObfuscationEnabled: true,
            advancedMode: false,
            simpleMode: false
        };

        try {
            const pdfBytes = await generatePayslipPdfBytes(sampleEmployee, samplePayslip, sampleSettings);
            const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "LekkerLedger_Sample_Payslip_March_2026.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF Generation failed:", error);
        }
    };

    const nmw = COMPLIANCE.NMW.RATE_PER_HOUR;
    const date = "March 2026";
    const periodStart = "01 Mar 2026";
    const periodEnd = "31 Mar 2026";

    const ordinaryHours = 160;
    const ordinaryRate = nmw;
    const ordinaryTotal = ordinaryHours * ordinaryRate;

    const overtimeHours = 8;
    const overtimeRate = ordinaryRate * 1.5;
    const overtimeTotal = overtimeHours * overtimeRate;

    const grossPay = ordinaryTotal + overtimeTotal;
    const uifDeduction = grossPay * 0.01;
    const netPay = grossPay - uifDeduction;

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-amber-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 -ml-4 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back to Home
                        </Button>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2 rounded-xl border-[var(--border)] font-bold text-sm h-11 px-5 hover:bg-[var(--surface-2)] shadow-sm">
                            <Printer className="h-4 w-4" /> Print
                        </Button>
                        <Button
                            onClick={handleDownload}
                            className="gap-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold text-sm h-11 px-6 shadow-lg shadow-[var(--primary)]/20 shadow-xl"
                        >
                            <Download className="h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </div>

                <header className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--primary)] text-xs font-black uppercase tracking-widest border border-[var(--primary)]/10">
                        <ShieldCheck className="h-4 w-4 shrink-0" /> Civic Ledger Design
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-serif leading-tight">
                        Your employee documentation, <span className="text-[var(--primary)]">elevated.</span>
                    </h1>
                    <p className="text-[var(--text-muted)] font-medium text-lg leading-relaxed">
                        LekkerLedger generates professional, A4-ready PDFs that comply with BCEA Section 33 and the 2026 Sectoral Determination for Domestic Workers.
                    </p>
                </header>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* The Classy Payslip Paper */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-sm shadow-2xl border border-[var(--border)] aspect-[1/1.414] w-full p-8 sm:p-12 relative overflow-hidden transition-all duration-300 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)]">
                            {/* Paper Grain Effect (Subtle - using a locally available pattern or just a subtle color) */}
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[var(--bg)]" />

                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-12 border-b-2 border-[var(--primary)] pb-6 relative z-10">
                                <div>
                                    <Logo showText={true} className="mb-2" textClassName="text-2xl" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">
                                        South African Domestic Standard
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h2 className="font-serif text-3xl font-black text-[var(--primary)] tracking-tight">PAYSLIP</h2>
                                    <p className="text-lg font-bold text-[var(--text)] mt-1">{date.toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Parties Card */}
                            <div className="grid grid-cols-3 gap-6 mb-12 relative z-10">
                                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Employer</p>
                                    <p className="font-bold text-sm text-[var(--text)]">Lerato Mokoena</p>
                                    <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-1">12 Protea Avenue, Cape Town, 8001</p>
                                </div>
                                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Employee</p>
                                    <p className="font-bold text-sm text-[var(--text)]">Nomsa Dlamini</p>
                                    <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-1">ID: 800101 0234 081 • Helper</p>
                                </div>
                                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 text-right">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Pay Period</p>
                                    <p className="font-bold text-sm text-[var(--text)]">{periodStart} — {periodEnd}</p>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1">Days Worked: 22</p>
                                </div>
                            </div>

                            {/* Earnings Table */}
                            <table className="w-full text-sm mb-12 relative z-10">
                                <thead>
                                    <tr className="border-b-2 border-[var(--border)] pb-2 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest text-left">
                                        <th className="pb-3 px-1">Description</th>
                                        <th className="pb-3 text-right">Hours</th>
                                        <th className="pb-3 text-right">Rate</th>
                                        <th className="pb-3 text-right px-1">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[var(--text)]">
                                    <tr>
                                        <td className="py-4 px-1 font-medium border-b border-[var(--border)]/50">Ordinary Hours worked</td>
                                        <td className="py-4 text-right border-b border-[var(--border)]/50 font-mono text-xs">{ordinaryHours}h</td>
                                        <td className="py-4 text-right border-b border-[var(--border)]/50 font-mono text-xs">R {ordinaryRate.toFixed(2)}</td>
                                        <td className="py-4 text-right px-1 font-bold border-b border-[var(--border)]/50">R {ordinaryTotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-1 font-medium border-b border-[var(--border)]/50">Overtime hours (1.5x)</td>
                                        <td className="py-4 text-right border-b border-[var(--border)]/50 font-mono text-xs">{overtimeHours}h</td>
                                        <td className="py-4 text-right border-b border-[var(--border)]/50 font-mono text-xs">R {overtimeRate.toFixed(2)}</td>
                                        <td className="py-4 text-right px-1 font-bold border-b border-[var(--border)]/50">R {overtimeTotal.toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-[var(--bg)]/10">
                                        <td className="py-4 px-1 font-black text-[var(--text-muted)] uppercase text-[10px] tracking-widest">Gross Earnings</td>
                                        <td colSpan={2}></td>
                                        <td className="py-4 text-right px-1 font-black text-lg border-t-2 border-[var(--text)]">R {grossPay.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Deductions */}
                            <div className="space-y-3 mb-12 relative z-10 w-full max-w-sm ml-auto">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em] text-right mb-4">Deductions</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-muted)] font-medium">UIF Contribution (1% Individual)</span>
                                    <span className="font-bold text-[var(--danger)]">- R {uifDeduction.toFixed(2)}</span>
                                </div>
                                <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center">
                                    <span className="text-xs font-black text-[var(--text-muted)] uppercase italic">Total Deductions</span>
                                    <span className="font-bold">R {uifDeduction.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Net Payable Block */}
                            <div className="bg-[var(--primary)] p-6 rounded-xl flex justify-between items-center text-white shadow-md relative z-10 opacity-90">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Net Payable</p>
                                    <p className="font-serif text-xl font-bold">Transfer Amount</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-serif text-3xl sm:text-4xl font-black tracking-tighter">R {netPay.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Footer / Meta */}
                            <div className="mt-16 pt-8 border-t border-[var(--border)] grid grid-cols-2 items-end relative z-10">
                                <div className="space-y-3">
                                    <p className="text-[9px] text-[var(--text-muted)] leading-relaxed max-w-[240px]">
                                        Generated via LekkerLedger. This document fulfills the requirements of Section 33 of the Basic Conditions of Employment Act.
                                        <br /><span className="font-bold">Compliance Ref: 2026 Mar / NMW R30.23</span>
                                    </p>
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 text-[var(--success)] opacity-30">
                                            <ShieldCheck className="h-full w-full" />
                                        </div>
                                        <p className="text-[8px] uppercase tracking-widest text-[var(--text-muted)] mt-2">
                                            Tamper-evident hash: 0x8a2...f3b
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="inline-block border-2 border-[var(--focus)] p-2 px-3 rounded-full mb-2">
                                        <span className="text-[10px] font-black text-[var(--focus)] uppercase tracking-widest">LEGAL • COMPLIANT</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--text-muted)] font-medium italic">Proudly South African Domestic Standard</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="glass-panel p-8 rounded-2xl border-2 border-[var(--border)] space-y-6">
                            <h3 className="text-xl font-bold font-serif">Key Compliance Fields</h3>
                            <ul className="space-y-4">
                                {[
                                    { title: "ID & Roles", desc: "Identity numbers and job descriptions are mandatory parts of every payslip." },
                                    { title: "Hourly Breakdown", desc: "Clearly distinguishing between ordinary time, overtime, and public holidays." },
                                    { title: "Statutory Deductions", desc: "UIF calculations updated automatically with the 2026 caps and rates." },
                                    { title: "Leave Summary", desc: "Built-in tracking for annual, sick, and family responsibility leave." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="h-6 w-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{item.title}</p>
                                            <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="p-8 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-6">
                            <div>
                                <h3 className="text-xl font-bold font-serif">Need high-volume?</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                                    Our Pro plan supports up to 5 employees with automated bulk generation and Google Drive archiving.
                                </p>
                            </div>
                            <Link href="/onboarding" className="block">
                                <Button className="w-full gap-2 bg-[var(--text)] text-white hover:opacity-90 font-bold h-12 rounded-xl">
                                    Start Free Today <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </section>

                        <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--primary)]/10 bg-[var(--primary)]/5">
                            <Mail className="h-5 w-5 text-[var(--primary)]" />
                            <p className="text-[11px] text-[var(--text-muted)]">
                                Send payslips directly to your employee via <span className="font-bold text-[var(--text)]">WhatsApp</span> or Email.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-[var(--border)] text-center pb-8 space-y-6">

                    <div className="flex justify-center gap-4">
                        <Link href="/">
                            <Button variant="outline" className="font-bold rounded-xl border-[var(--border)] h-11 px-8 text-sm">
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

