import * as React from "react"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "success" | "warning" | "error";
}

const VARIANTS = {
    default: {
        bg: "var(--info-soft)",
        border: "var(--info-border)",
        color: "var(--info)",
        Icon: Info,
    },
    success: {
        bg: "var(--success-soft)",
        border: "var(--success-border)",
        color: "var(--success)",
        Icon: CheckCircle2,
    },
    warning: {
        bg: "var(--warning-soft)",
        border: "var(--warning-border)",
        color: "var(--warning)",
        Icon: AlertCircle,
    },
    error: {
        bg: "var(--danger-soft)",
        border: "var(--danger-border)",
        color: "var(--danger)",
        Icon: XCircle,
    },
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = "default", children, style, ...props }, ref) => {
        const v = VARIANTS[variant];
        return (
            <div
                ref={ref}
                role="alert"
                className={["relative flex w-full items-start gap-3 rounded-xl p-4 transition-all", className].filter(Boolean).join(" ")}
                style={{
                    backgroundColor: v.bg,
                    border: `1px solid ${v.border}`,
                    ...style,
                }}
                {...props}
            >
                <v.Icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: v.color }} />
                <div className="flex-1 space-y-0.5 min-w-0">{children}</div>
            </div>
        );
    }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, style, ...props }, ref) => (
        <h5
            ref={ref}
            className={["text-sm font-semibold leading-tight", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text)", ...style }}
            {...props}
        />
    )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, style, ...props }, ref) => (
        <div
            ref={ref}
            className={["text-sm leading-relaxed", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text-muted)", ...style }}
            {...props}
        />
    )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
