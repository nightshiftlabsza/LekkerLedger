import * as React from "react";
import { Check } from "lucide-react";

export interface StepperProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
  className?: string;
}

export const Stepper = ({ steps, currentStep, className }: StepperProps) => {
  return (
    <div
      className={["flex w-full items-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={step.label}>
            {/* Step Element */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 relative">
              <div
                className={[
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold border-2 transition-colors duration-300",
                  isCompleted
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isCurrent
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-slate-300 text-slate-400 bg-white",
                ].join(" ")}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="text-center absolute top-12 whitespace-nowrap">
                <p
                  className={[
                    "text-sm font-medium",
                    isCurrent || isCompleted
                      ? "text-slate-900"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-500 hidden md:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connecting Line (Don't render after the last step) */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-4 self-start mt-[19px] relative bg-slate-200">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-500"
                  style={{ width: isCompleted ? "100%" : "0%" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
