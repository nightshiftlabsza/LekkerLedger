"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CalculatorHero } from "@/components/calculator-hero";
import { useRouter } from "next/navigation";
import { getSettings } from "@/lib/storage";

export default function CalculatorPage() {
    const router = useRouter();

    const handleStart = async () => {
        try {
            const s = await getSettings();
            if (!s.employerName) {
                router.push("/settings");
            } else {
                router.push("/payroll/new");
            }
        } catch {
            router.push("/payroll/new");
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />

            <main className="flex-1 px-4 py-10 sm:py-16 content-container">
                <div className="space-y-8 max-w-xl mx-auto">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to home
                    </Link>

                    <div className="space-y-3">
                        <h1 className="type-h1" style={{ color: "var(--text)" }}>
                            Wage & UIF Estimator
                        </h1>
                        <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                            Get a quick estimate of gross pay, UIF deductions, and net pay based on hours worked and hourly rate.
                            This uses the current National Minimum Wage for domestic workers.
                        </p>
                    </div>

                    <CalculatorHero onStart={handleStart} />

                    <p className="text-xs font-medium text-center" style={{ color: "var(--text-muted)" }}>
                        This is an estimate only. For a full payslip with all deductions and allowances,{" "}
                        <Link href="/payroll/new" className="underline hover:text-[var(--primary)] transition-colors">
                            create your first payslip
                        </Link>.
                    </p>
                </div>
            </main>
        </div>
    );
}
