import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "bg-amber-500 text-white hover:bg-amber-600 border-transparent",
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-transparent",
        destructive: "bg-red-500 text-white hover:bg-red-600 border-transparent",
        outline: "text-zinc-950 border-zinc-200"
    }

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
