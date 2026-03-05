import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
    checked?: boolean
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, ..._props }, _ref) => {
        void _props; void _ref;
        return (
            <div
                className={cn(
                    "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    checked ? "bg-[var(--primary)]" : "bg-[var(--border)]",
                    className
                )}
                onClick={() => onCheckedChange?.(!checked)}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        checked ? "translate-x-5" : "translate-x-0"
                    )}
                />
            </div>
        );
    }
);
Switch.displayName = "Switch"

export { Switch }
