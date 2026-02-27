import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const baseClasses =
      "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

    const errorClasses = error
      ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
      : "";

    const finalClassName = [baseClasses, errorClasses, className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <input type={type} className={finalClassName} ref={ref} {...props} />
        {error && (
          <span className="text-xs font-medium text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
