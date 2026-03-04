import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "link" | "danger" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", style, ...props }, ref) => {

        let variantStyle: React.CSSProperties = {};
        switch (variant) {
            case "default":
                variantStyle = {
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                };
                break;
            case "secondary":
                variantStyle = {
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                };
                break;
            case "outline":
                variantStyle = {
                    border: "1px solid var(--border)",
                    backgroundColor: "transparent",
                    color: "var(--text)",
                };
                break;
            case "ghost":
                variantStyle = {
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                };
                break;
            case "link":
                variantStyle = {
                    backgroundColor: "transparent",
                    color: "var(--primary)",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                };
                break;
            case "danger":
                variantStyle = {
                    backgroundColor: "var(--danger)",
                    color: "#ffffff",
                };
                break;
        }

        let sizeClasses = "";
        switch (size) {
            case "default":
                sizeClasses = "min-h-[44px] px-4 py-3 type-button rounded-[12px]";
                break;
            case "sm":
                sizeClasses = "min-h-[40px] px-3 py-2 text-sm rounded-[10px]";
                break;
            case "lg":
                sizeClasses = "min-h-[48px] px-6 py-3 text-base rounded-[16px]";
                break;
            case "icon":
                sizeClasses = "min-h-[44px] w-[44px] rounded-[12px]";
                break;
        }

        const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-55 active-scale select-none";

        const hoverMap: Record<string, string> = {
            default: "hover:brightness-95 active:brightness-90 hover:shadow-sm",
            secondary: "hover:bg-[var(--bg)] hover:shadow-sm",
            outline: "hover:bg-[var(--bg)]",
            ghost: "hover:bg-[var(--bg)] hover:text-[var(--text)]",
            link: "",
            danger: "hover:brightness-95",
        };

        const finalClassName = [baseClasses, sizeClasses, hoverMap[variant] ?? "", className]
            .filter(Boolean).join(" ");

        return (
            <button
                ref={ref}
                className={finalClassName}
                style={{ ...variantStyle, ...style }}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
