import * as React from "react"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, style, ...props }, ref) => (
        <div
            ref={ref}
            className={["rounded-2xl transition-all duration-200 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-md)]", className].filter(Boolean).join(" ")}
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
            className={["flex flex-col space-y-1 p-6", className].filter(Boolean).join(" ")}
            {...props}
        />
    )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, style, ...props }, ref) => (
        <h3
            ref={ref}
            className={["text-xl font-bold tracking-tight leading-snug", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text-primary)", ...style }}
            {...props}
        />
    )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, style, ...props }, ref) => (
        <p
            ref={ref}
            className={["text-sm leading-relaxed", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text-secondary)", ...style }}
            {...props}
        />
    )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={["p-6 pt-0", className].filter(Boolean).join(" ")} {...props} />
    )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, style, ...props }, ref) => (
        <div
            ref={ref}
            className={["flex items-center p-4 rounded-b-2xl", className].filter(Boolean).join(" ")}
            style={{
                borderTop: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-subtle)",
                ...style,
            }}
            {...props}
        />
    )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
