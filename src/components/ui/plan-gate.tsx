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
    if (!limitReached && !proFeature) {
        return null;
    }

    if (compact) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-400">
                            {proFeature ? "Pro Feature" : "Limit Reached"}
                        </p>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-500/80 leading-tight pr-2">
                            {proFeature
                                ? description
                                : `You've used ${currentCount} of ${maxLimit} available on the Free Plan.`}
                        </p>
                    </div>
                </div>
                <Link href="/pricing" className="shrink-0">
                    <Button size="sm" className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto">
                        Upgrade
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <Card className="border-amber-500/30 glass-panel bg-amber-500/5 relative overflow-hidden group">
            {/* Soft decorative glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-500" />

            <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] uppercase font-bold tracking-widest mb-4">
                        <Sparkles className="h-3 w-3" />
                        {proFeature ? "Lekker Pro" : "Free Tier Limit"}
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">
                        {title}
                    </h3>

                    <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-500/80">
                        {description} {!proFeature && `You are currently using ${currentCount} out of ${maxLimit} allowed items.`}
                    </p>
                </div>

                <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                    <Link href="/pricing" className="w-full">
                        <Button className="w-full md:w-auto h-12 px-6 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                            View Plans <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                    <p className="text-[10px] text-center font-medium text-amber-700/60 dark:text-amber-500/50 uppercase tracking-wider">
                        No hidden fees
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
