import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "link" | "danger" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", style, loading = false, disabled, children, ...props }, ref) => {
        const isDisabled = disabled || loading;

        let variantStyle: React.CSSProperties = {};
        switch (variant) {
            case "default":
                variantStyle = {
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                    border: "1px solid transparent",
                };
                break;
            case "secondary":
                variantStyle = {
                    backgroundColor: "var(--surface-raised)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                };
                break;
            case "outline":
                variantStyle = {
                    border: "1px solid var(--border-strong)",
                    backgroundColor: "transparent",
                    color: "var(--text)",
                };
                break;
            case "ghost":
                variantStyle = {
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                    border: "1px solid transparent",
                };
                break;
            case "link":
                variantStyle = {
                    backgroundColor: "transparent",
                    color: "var(--primary)",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                    border: "1px solid transparent",
                };
                break;
            case "danger":
                variantStyle = {
                    backgroundColor: "var(--danger)",
                    color: "#ffffff",
                    border: "1px solid transparent",
                };
                break;
        }

        let sizeClasses = "";
        switch (size) {
            case "default":
                sizeClasses = "min-h-[44px] px-4 py-2.5 type-label rounded-[12px]";
                break;
            case "sm":
                sizeClasses = "min-h-[44px] px-3.5 py-2.5 text-sm rounded-[10px]";
                break;
            case "lg":
                sizeClasses = "min-h-[48px] px-6 py-3 text-base rounded-[14px]";
                break;
            case "icon":
                sizeClasses = "min-h-[44px] w-[44px] rounded-[12px]";
                break;
        }

        const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-55 active-scale select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2";

        const hoverMap: Record<string, string> = {
            default: "hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] hover:shadow-[var(--shadow-md)]",
            secondary: "hover:bg-[var(--surface-1)] hover:shadow-[var(--shadow-sm)]",
            outline: "hover:bg-[var(--surface-raised)] hover:border-[var(--border)]",
            ghost: "hover:bg-[var(--surface-raised)] hover:text-[var(--text)]",
            link: "hover:opacity-85",
            danger: "hover:brightness-95 hover:shadow-[var(--shadow-md)]",
        };

        const finalClassName = [baseClasses, sizeClasses, hoverMap[variant] ?? "", className]
            .filter(Boolean).join(" ");

        return (
            <button
                ref={ref}
                className={finalClassName}
                style={{ ...variantStyle, ...style }}
                disabled={isDisabled}
                aria-busy={loading}
                {...props}
            >
                {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
