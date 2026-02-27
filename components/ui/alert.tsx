import * as React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    let variantClasses = "";
    let Icon = Info;

    switch (variant) {
      case "default":
        variantClasses = "bg-blue-50 border-blue-200 text-blue-800";
        Icon = Info;
        break;
      case "success":
        variantClasses = "bg-green-50 border-green-200 text-green-800";
        Icon = CheckCircle2;
        break;
      case "warning":
        variantClasses = "bg-amber-50 border-amber-200 text-amber-800";
        Icon = AlertCircle;
        break;
      case "error":
        variantClasses = "bg-red-50 border-red-200 text-red-800";
        Icon = XCircle;
        break;
    }

    const baseClasses =
      "relative flex w-full items-start gap-4 rounded-lg border p-4 shadow-sm transition-all";

    return (
      <div
        ref={ref}
        role="alert"
        className={[baseClasses, variantClasses, className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1">{children}</div>
      </div>
    );
  },
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={["mb-1 font-medium leading-none tracking-tight", className]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={["text-sm [&_p]:leading-relaxed opacity-90", className]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
