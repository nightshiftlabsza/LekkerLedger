"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { EmptyState } from "@/components/ui/empty-state";
import { checkFeatureAccess, type FeatureKey } from "@/lib/entitlements";
import { type PlanId } from "@/config/plans";

interface FeatureGuardProps {
    planId: PlanId;
    featureKey: FeatureKey;
    children: React.ReactNode;
    fallbackType?: "card" | "empty-state" | "inline";
    sourceParam?: string;
}

export function FeatureGuard({ 
    planId, 
    featureKey, 
    children, 
    fallbackType = "empty-state",
    sourceParam 
}: FeatureGuardProps) {
    const { hasAccess, isLive, entitlement } = checkFeatureAccess(planId, featureKey);

    if (hasAccess && isLive) {
        return <>{children}</>;
    }

    if (!isLive) {
        // "Planned" feature state
        if (fallbackType === "inline") {
            return (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4 opacity-75">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-[var(--primary)]" />
                        <div>
                            <p className="text-sm font-bold text-[var(--text)]">{entitlement.upsellHeadline}</p>
                            <p className="text-sm text-[var(--text-muted)]">{entitlement.upsellBody}</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <EmptyState
                title={entitlement.upsellHeadline}
                description={entitlement.upsellBody}
                icon={Clock}
            />
        );
    }

    // "Live" but locked by user's plan state
    const upgradeHref = `/upgrade?plan=${entitlement.minPlan}${sourceParam ? `&source=${sourceParam}` : ""}`;
    const eyebrowLabel = `Requires ${entitlement.minPlan.charAt(0).toUpperCase() + entitlement.minPlan.slice(1)}`;

    if (fallbackType === "card") {
        return (
            <FeatureGateCard
                title={entitlement.upsellHeadline}
                description={entitlement.upsellBody}
                eyebrow={eyebrowLabel}
                href={upgradeHref}
                ctaLabel={`Upgrade to ${entitlement.minPlan.charAt(0).toUpperCase() + entitlement.minPlan.slice(1)}`}
            />
        );
    }

    if (fallbackType === "inline") {
        return (
            <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-bold text-[var(--text)]">{entitlement.upsellHeadline}</p>
                        <p className="text-sm text-[var(--text-muted)]">{entitlement.upsellBody}</p>
                    </div>
                    <Link href={upgradeHref}>
                        <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shrink-0 gap-2">
                            <Lock className="h-4 w-4" /> Upgrade
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Default "empty-state" full-page fallback
    return (
        <EmptyState
            title={entitlement.upsellHeadline}
            description={entitlement.upsellBody}
            icon={Lock}
            actionLabel={`Upgrade to ${entitlement.minPlan.charAt(0).toUpperCase() + entitlement.minPlan.slice(1)}`}
            actionHref={upgradeHref}
        />
    );
}
