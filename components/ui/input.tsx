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
                    ref={ref}
                    className={["w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all duration-200 placeholder:font-normal", className].filter(Boolean).join(" ")}
                    style={{
                        height: "44px",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        border: `1.5px solid ${error ? "var(--red-500)" : "var(--border-default)"}`,
                        boxShadow: error ? "0 0 0 3px rgba(192,57,43,0.12)" : "none",
                        ...style,
                    }}
                    onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = error ? "var(--red-500)" : "var(--amber-500)";
                        (e.target as HTMLInputElement).style.boxShadow = error
                            ? "0 0 0 3px rgba(192,57,43,0.15)"
                            : "0 0 0 3px rgba(196,122,28,0.15)";
                    }}
                    onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = error ? "var(--red-500)" : "var(--border-default)";
                        (e.target as HTMLInputElement).style.boxShadow = error ? "0 0 0 3px rgba(192,57,43,0.12)" : "none";
                    }}
                    {...props}
                />
                {error && (
                    <span
                        className="text-xs font-medium animate-slide-down"
                        style={{ color: "var(--red-500)" }}
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
