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
                <span
                    className={cn(
                        "relative flex shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[linear-gradient(145deg,var(--surface-raised),#fff7ea)] shadow-[0_12px_30px_rgba(16,24,40,0.12)] ring-1 ring-white/70",
                        showText ? "rounded-[1.15rem] p-2.5" : "rounded-[0.95rem] p-2",
                        frameClassName,
                    )}
                >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,150,42,0.24),transparent_58%)] opacity-80" />
                    <span className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.72))]" />
                    <Image
                        src="/brand/logo-2.svg"
                        alt="LekkerLedger logo mark"
                        width={72}
                        height={72}
                        className={cn(
                            "relative z-10 min-w-0 object-contain drop-shadow-[0_6px_16px_rgba(16,24,40,0.16)]",
                            showText ? "h-10 w-auto sm:h-11" : "h-8 w-auto",
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
                    <span className="mt-2 h-[3px] w-14 rounded-full bg-[linear-gradient(90deg,var(--focus),rgba(26,107,60,0.88))]" />
                </span>
            )}
        </div>
    )
}
