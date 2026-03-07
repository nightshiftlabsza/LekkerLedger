import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface PlanLimitGateProps {
    title: string;
    description: string;
    limitReached: boolean;
    currentCount: number;
    maxLimit: number;
    proFeature?: boolean;
    compact?: boolean;
}

export function PlanLimitGate({
    title,
    description,
    limitReached,
    currentCount,
    maxLimit,
    proFeature = false,
    compact = false,
}: PlanLimitGateProps) {
    const upgradeBenefits = [
        "Optional Google Drive backup",
        "Documents and exports",
        "Longer record history",
    ];

    if (!limitReached && !proFeature) {
        return null;
    }

    if (compact) {
        return (
            <div className="bg-[var(--primary)]/10 border border-[var(--focus)]/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-[var(--focus)]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--text)] dark:text-amber-400">
                            {proFeature ? "Pro Feature" : "Limit Reached"}
                        </p>
                        <p className="text-[11px] text-[var(--focus)]/80 dark:text-[var(--focus)]/80 leading-tight pr-2">
                            {proFeature
                                ? description
                                : `You've used ${currentCount} of ${maxLimit} available on the Free Plan.`}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)] dark:text-[var(--focus)]/70">
                            Upgrade for backup + documents + longer history.
                        </p>
                    </div>
                </div>
                <div className="shrink-0 space-y-1">
                    <Link href="/pricing" className="block">
                        <Button size="sm" className="h-8 text-xs font-bold bg-[var(--primary)] hover:brightness-95 text-white w-full sm:w-auto">
                            Upgrade
                        </Button>
                    </Link>
                    <p className="text-[10px] text-center text-[var(--text-muted)] dark:text-[var(--focus)]/60">
                        14-day refund on paid upgrades
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Card className="border-[var(--focus)]/30 glass-panel bg-[var(--primary)]/5 relative overflow-hidden group">
            {/* Soft decorative glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 bg-[var(--primary)]/10 rounded-full blur-3xl group-hover:bg-[var(--primary)]/20 transition-colors duration-500" />

            <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--focus)]/20 text-[var(--focus)] text-[10px] uppercase font-bold tracking-widest mb-4">
                        <Sparkles className="h-3 w-3" />
                        {proFeature ? "Pro Plan" : "Free Tier Limit"}
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-[var(--text)] dark:text-amber-400">
                        {title}
                    </h3>

                    <p className="text-sm leading-relaxed text-[var(--text-muted)] dark:text-[var(--focus)]/80">
                        {description} {!proFeature && `You are currently using ${currentCount} out of ${maxLimit} allowed items.`}
                    </p>

                    <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                            What you get
                        </p>
                        <ul className="space-y-1.5 text-sm text-[var(--text-muted)] dark:text-[var(--focus)]/80">
                            {upgradeBenefits.map((benefit) => (
                                <li key={benefit}>- {benefit}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                    <Link href="/pricing" className="w-full">
                        <Button className="w-full md:w-auto h-12 px-6 text-sm font-bold bg-[var(--primary)] hover:brightness-95 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                            View Plans <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                    <p className="text-[10px] text-center font-medium text-[var(--focus)]/60 dark:text-[var(--focus)]/50 uppercase tracking-wider">
                        14-day refund on paid upgrades
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
