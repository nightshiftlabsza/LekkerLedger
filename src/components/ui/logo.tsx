import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    showIcon?: boolean;
    showText?: boolean;
    textClassName?: string;
    iconClassName?: string;
    frameClassName?: string;
}

export function Logo({
    showIcon = true,
    showText = true,
    textClassName,
    iconClassName,
    frameClassName,
    className,
    ...props
}: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3 shrink-0 select-none", className)} {...props}>
            {showIcon && (
                <span className={cn("relative flex shrink-0 items-center justify-center", frameClassName)}>
                    <Image
                        src="/brand/logo-mark-vector.svg"
                        alt="LekkerLedger ledger-file logo"
                        width={88}
                        height={88}
                        className={cn(
                            "object-contain",
                            showText ? "h-12 w-12 sm:h-[3.25rem] sm:w-[3.25rem]" : "h-8 w-8",
                            iconClassName,
                        )}
                        priority
                    />
                </span>
            )}
            {showText && (
                <span className="flex min-w-0 flex-col">
                    <span className={cn("font-serif text-[1.35rem] font-semibold leading-none tracking-[-0.03em] text-[var(--text)] sm:text-[1.5rem]", textClassName)}>
                        LekkerLedger
                    </span>
                    <span className="mt-2 h-[2px] w-16 rounded-full bg-[linear-gradient(90deg,#C47A1C,#007A4D)]" />
                </span>
            )}
        </div>
    )
}
