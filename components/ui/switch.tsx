import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
    onCheckedChange?: (checked: boolean) => void
    checked?: boolean
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ className, checked = false, disabled = false, onCheckedChange, type = "button", ...buttonProps }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={cn(
                    "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    checked ? "bg-[var(--primary)]" : "bg-[var(--border)]",
                    className
                )}
                onClick={() => onCheckedChange?.(!checked)}
                {...buttonProps}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-6 w-6 rounded-full bg-[var(--surface-1)] shadow-lg ring-0 transition-transform",
                        checked ? "translate-x-5" : "translate-x-0"
                    )}
                />
            </button>
        );
    }
);
Switch.displayName = "Switch"

export { Switch }
