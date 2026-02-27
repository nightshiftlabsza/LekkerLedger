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
                    backgroundColor: "var(--amber-500)",
                    color: "var(--text-inverse)",
                };
                break;
            case "secondary":
                variantStyle = {
                    backgroundColor: "var(--green-500)",
                    color: "#ffffff",
                };
                break;
            case "outline":
                variantStyle = {
                    border: "1.5px solid var(--border-default)",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                };
                break;
            case "ghost":
                variantStyle = {
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                };
                break;
            case "link":
                variantStyle = {
                    backgroundColor: "transparent",
                    color: "var(--amber-500)",
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                };
                break;
            case "danger":
                variantStyle = {
                    backgroundColor: "var(--red-500)",
                    color: "#ffffff",
                };
                break;
        }

        let sizeClasses = "";
        switch (size) {
            case "default":
                sizeClasses = "h-10 px-5 py-2 text-sm";
                break;
            case "sm":
                sizeClasses = "h-8 px-3 py-1.5 text-xs";
                break;
            case "lg":
                sizeClasses = "h-12 px-7 py-3 text-base";
                break;
            case "icon":
                sizeClasses = "h-10 w-10";
                break;
        }

        const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold ring-offset-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 active-scale select-none";

        const hoverMap: Record<string, string> = {
            default: "hover:opacity-90 hover:shadow-md",
            secondary: "hover:opacity-90 hover:shadow-md",
            outline: "hover:bg-[var(--bg-subtle)]",
            ghost: "hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
            link: "",
            danger: "hover:opacity-90",
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
