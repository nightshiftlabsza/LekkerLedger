import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, style, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                <input
                    type={type}
                    inputMode={type === "number" ? "decimal" : props.inputMode}
                    ref={ref}
                    className={[
                        "w-full rounded-[10px] px-4 py-[10px] type-body outline-none transition-all duration-200 placeholder:font-normal",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2",
                        "bg-[var(--surface-1)] text-[var(--text)] placeholder-[var(--text-muted)]",
                        error ? "border border-[var(--danger)]" : "border border-[var(--border)]",
                        "min-h-[44px]",
                        className
                    ].filter(Boolean).join(" ")}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    style={style}
                    {...props}
                />
                {error && (
                    <span className="text-[13px] font-medium animate-slide-down text-[var(--danger)] mt-0.5">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
