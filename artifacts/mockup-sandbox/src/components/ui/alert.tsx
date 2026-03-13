import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  children: React.ReactNode
}

function hasReadableChildren(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (child == null) return false
    if (typeof child === "boolean") return child
    if (typeof child === "string") return child.trim().length > 0
    if (typeof child === "number" || typeof child === "bigint") return true
    return true
  })
}

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  AlertTitleProps
>(({ className, children, ...props }, ref) => {
  const sharedProps = {
    className: cn("mb-1 font-medium leading-none tracking-tight", className),
    ...props,
  }

  if (!hasReadableChildren(children)) {
    return <div {...sharedProps}>{children}</div>
  }

  return (
    <h5 ref={ref} {...sharedProps}>
      {children}
    </h5>
  )
})
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
