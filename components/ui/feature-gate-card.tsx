import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureGateCardProps {
    readonly title: string;
    readonly description: string;
    readonly ctaLabel?: string;
    readonly href?: string;
    readonly eyebrow?: string;
    readonly benefits?: readonly string[];
}

export function FeatureGateCard({
    title,
    description,
    ctaLabel = "Review plans",
    href = "/upgrade",
    eyebrow = "Standard and Pro",
    benefits = [
        "Secure cloud sync",
        "Documents and exports",
        "Longer record history",
    ],
}: FeatureGateCardProps) {
    return (
        <Card className="border-[var(--primary)] bg-[var(--primary)]/5 shadow-[var(--shadow-sm)]">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-[var(--primary)] p-3 text-white">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                            {eyebrow}
                        </p>
                        <h2 className="text-xl font-black text-[var(--text)]">{title}</h2>
                        <p className="text-sm leading-6 text-[var(--text-muted)]">{description}</p>
                    </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-raised)] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        What you get
                    </p>
                    <ul className="space-y-1.5 text-sm text-[var(--text-muted)]">
                        {benefits.map((benefit) => (
                            <li key={benefit}>- {benefit}</li>
                        ))}
                    </ul>
                </div>

                <Link href={href} className="block">
                    <Button className="w-full justify-center font-bold">
                        {ctaLabel} <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
                <p className="text-center text-xs text-[var(--text-muted)]">
                    14-day refund on paid purchases
                </p>
            </CardContent>
        </Card>
    );
}
