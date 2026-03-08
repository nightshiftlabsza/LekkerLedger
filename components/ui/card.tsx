import * as React from "react"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, style, ...props }, ref) => (
        <div
            ref={ref}
            className={["rounded-[16px] transition-all duration-300 bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover-lift hover:shadow-[var(--shadow-md)]", className].filter(Boolean).join(" ")}
            style={style}
            {...props}
        />
    )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={["flex flex-col gap-2 p-6", className].filter(Boolean).join(" ")}
            {...props}
        />
    )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, style, ...props }, ref) => (
        <h3
            ref={ref}
            className={["type-h3 tracking-tight", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text)", ...style }}
            {...props}
        />
    )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, style, ...props }, ref) => (
        <p
            ref={ref}
            className={["type-body", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text-muted)", ...style }}
            {...props}
        />
    )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={["p-6", className].filter(Boolean).join(" ")} {...props} />
    )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, style, ...props }, ref) => (
        <div
            ref={ref}
            className={["flex items-center p-4 rounded-b-2xl", className].filter(Boolean).join(" ")}
            style={{
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--surface-raised)",
                ...style,
            }}
            {...props}
        />
    )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
