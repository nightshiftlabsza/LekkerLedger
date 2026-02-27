import * as React from "react"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "success" | "warning" | "error";
}

const VARIANTS = {
    default: {
        bg: "rgba(196,122,28,0.08)",
        border: "rgba(196,122,28,0.25)",
        color: "var(--amber-500)",
        Icon: Info,
    },
    success: {
        bg: "rgba(26,107,58,0.08)",
        border: "rgba(26,107,58,0.25)",
        color: "var(--green-500)",
        Icon: CheckCircle2,
    },
    warning: {
        bg: "rgba(196,122,28,0.08)",
        border: "rgba(196,122,28,0.30)",
        color: "var(--amber-warn-500)",
        Icon: AlertCircle,
    },
    error: {
        bg: "rgba(192,57,43,0.08)",
        border: "rgba(192,57,43,0.25)",
        color: "var(--red-500)",
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
            style={{ color: "var(--text-primary)", ...style }}
            {...props}
        />
    )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, style, ...props }, ref) => (
        <p
            ref={ref}
            className={["text-sm leading-relaxed", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text-secondary)", ...style }}
            {...props}
        />
    )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
