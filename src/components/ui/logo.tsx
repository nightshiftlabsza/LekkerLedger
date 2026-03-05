import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    showIcon?: boolean;
    showText?: boolean;
    textClassName?: string;
    iconClassName?: string;
}

export function Logo({
    showIcon = true,
    showText = true,
    textClassName,
    iconClassName,
    className,
    ...props
}: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2 shrink-0 select-none", className)} {...props}>
            {showIcon && (
                <Image
                    src="/logo-mark.svg"
                    alt="LekkerLedger Icon"
                    width={40}
                    height={40}
                    className={cn("h-8 w-8 object-contain", iconClassName)}
                    priority
                />
            )}
            {showText && (
                <span className={cn("font-serif text-xl font-bold tracking-tight", textClassName)}>
                    LekkerLedger
                </span>
            )}
        </div>
    )
}
