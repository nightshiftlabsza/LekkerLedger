import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("rounded-md bg-[var(--surface-raised)] shimmer opacity-70", className)}
            {...props}
        />
    )
}

export { Skeleton }
