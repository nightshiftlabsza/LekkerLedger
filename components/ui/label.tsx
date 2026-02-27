import * as React from "react"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, style, ...props }, ref) => (
        <label
            ref={ref}
            className={["block text-sm font-semibold leading-none", className].filter(Boolean).join(" ")}
            style={{ color: "var(--text-primary)", ...style }}
            {...props}
        />
    )
);
Label.displayName = "Label";

export { Label };
