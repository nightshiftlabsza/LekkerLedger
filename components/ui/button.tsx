import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    let variantClasses = "";
    switch (variant) {
      case "default":
        variantClasses = "bg-blue-600 text-white hover:bg-blue-700 shadow-sx";
        break;
      case "outline":
        variantClasses =
          "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900";
        break;
      case "ghost":
        variantClasses =
          "hover:bg-slate-100 hover:text-slate-900 text-slate-600";
        break;
      case "link":
        variantClasses = "text-blue-600 underline-offset-4 hover:underline";
        break;
      case "danger":
        variantClasses = "bg-red-500 text-white hover:bg-red-600";
        break;
    }

    let sizeClasses = "";
    switch (size) {
      case "default":
        sizeClasses = "h-10 px-4 py-2";
        break;
      case "sm":
        sizeClasses = "h-9 rounded-md px-3";
        break;
      case "lg":
        sizeClasses = "h-11 rounded-md px-8 text-md";
        break;
      case "icon":
        sizeClasses = "h-10 w-10";
        break;
    }

    const baseClasses =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 duration-200";

    const finalClassName = [baseClasses, variantClasses, sizeClasses, className]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={finalClassName} {...props} />;
  },
);
Button.displayName = "Button";

export { Button };
