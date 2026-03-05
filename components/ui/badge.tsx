import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "bg-[var(--accent-subtle)] text-[var(--primary)] border-transparent type-overline",
        secondary: "bg-[var(--surface-raised)] text-[var(--text-muted)] border-transparent type-overline",
        destructive: "bg-[var(--danger)]/12 text-[var(--danger)] border-transparent type-overline",
        outline: "text-[var(--text)] border-[var(--border)] type-overline bg-[var(--surface-1)]"
    }

    return (
        <div
            className={cn(
                "inline-flex min-h-[24px] items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
