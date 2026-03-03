import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, style, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1 w-full">
                <input
                    type={type}
                    inputMode={type === "number" ? "decimal" : props.inputMode}
                    ref={ref}
                    className={[
                        "w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all duration-200 placeholder:font-normal",
                        "bg-[var(--bg-surface)] text-[var(--text-primary)]",
                        error
                            ? "border-[1.5px] border-[var(--red-500)] focus:ring-[3px] focus:ring-[rgba(192,57,43,0.15)] focus:border-[var(--red-500)] shadow-[0_0_0_3px_rgba(192,57,43,0.12)]"
                            : "border-[1.5px] border-[var(--border-default)] focus:border-[var(--amber-500)] focus:ring-[3px] focus:ring-[rgba(196,122,28,0.15)]",
                        "h-[44px]",
                        className
                    ].filter(Boolean).join(" ")}
                    style={style}
                    {...props}
                />
                {error && (
                    <span
                        className="text-xs font-medium animate-slide-down text-[var(--red-500)]"
                    >
                        {error}
                    </span>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
