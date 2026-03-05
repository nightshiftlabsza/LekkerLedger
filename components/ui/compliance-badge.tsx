import * as React from "react";
import { Info } from "lucide-react";
import { COMPLIANCE } from "@/lib/compliance-constants";

interface ComplianceInlineBadgeProps {
    type?: "nmw" | "uif";
    label?: string;
    className?: string;
}

export function ComplianceInlineBadge({ type = "nmw", label, className = "" }: ComplianceInlineBadgeProps) {
    if (type === "nmw") {
        return (
            <span
                title={`National Minimum Wage. Effective from ${COMPLIANCE.NMW.EFFECTIVE_DATE}`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--primary)] border border-[var(--primary)]/20 cursor-help ${className}`}
            >
                {label || `R${COMPLIANCE.NMW.RATE_PER_HOUR.toFixed(2)}/hr`} <Info className="h-3 w-3" />
            </span>
        );
    }

    if (type === "uif") {
        return (
            <span
                title={`Unemployment Insurance Fund. ${COMPLIANCE.UIF.DEDUCTION_PERCENTAGE * 100}% deduction if working > ${COMPLIANCE.UIF.THRESHOLD_HOURS_PER_MONTH} hrs/mo.`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20 cursor-help ${className}`}
            >
                {label || `UIF (${COMPLIANCE.UIF.DEDUCTION_PERCENTAGE * 100}%)`} <Info className="h-3 w-3" />
            </span>
        );
    }

    return null;
}
