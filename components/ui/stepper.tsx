import * as React from "react"
import { Check } from "lucide-react"

export interface StepperProps {
    steps: { label: string; description?: string }[];
    currentStep: number;
    className?: string;
    onStepClick?: (index: number) => void;
}

export const Stepper = ({ steps, currentStep, className, onStepClick }: StepperProps) => {
    return (
        <div className={["flex w-full items-start", className].filter(Boolean).join(" ")}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isClickable = isCompleted && onStepClick;

                let circleEl;
                if (isCompleted) {
                    circleEl = (
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 sm:h-9 sm:w-9"
                            style={{ backgroundColor: "var(--primary)" }}
                        >
                            <Check className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" strokeWidth={2.5} />
                        </div>
                    );
                } else if (isCurrent) {
                    circleEl = (
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 sm:h-9 sm:w-9"
                            style={{ backgroundColor: "var(--primary)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--primary) 15%, transparent)" }}
                        >
                            <span className="text-xs font-bold text-white sm:text-sm">{index + 1}</span>
                        </div>
                    );
                } else {
                    circleEl = (
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-9 sm:w-9"
                            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-1)" }}
                        >
                            <span className="text-xs font-bold sm:text-sm" style={{ color: "var(--text-muted)" }}>{index + 1}</span>
                        </div>
                    );
                }

                return (
                    <React.Fragment key={step.label}>
                        <div
                            className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2"
                            style={{ flex: 1 }}
                        >
                            {isClickable ? (
                                <button
                                    type="button"
                                    onClick={() => onStepClick(index)}
                                    className="flex flex-col items-center gap-1.5 group sm:gap-2"
                                    title={`Go to ${step.label}`}
                                >
                                    <div className="group-hover:opacity-80 transition-opacity">
                                        {circleEl}
                                    </div>
                                    <div className="hidden text-center sm:block sm:max-w-[5rem]">
                                        <p className="text-[9px] font-bold uppercase tracking-wide leading-tight sm:text-[10px]" style={{ color: "var(--primary)" }}>
                                            {step.label}
                                        </p>
                                    </div>
                                </button>
                            ) : (
                                <>
                                    {circleEl}
                                    <div className="hidden text-center sm:block sm:max-w-[5rem]">
                                        <p
                                            className="text-[9px] font-bold uppercase tracking-wide leading-tight sm:text-[10px]"
                                            style={{ color: isCurrent ? "var(--text)" : "var(--text-muted)" }}
                                        >
                                            {step.label}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {index < steps.length - 1 && (
                            <div
                                className="mt-3.5 mx-0.5 h-0.5 flex-1 shrink transition-colors duration-300 sm:mt-[18px] sm:mx-1"
                                style={{ backgroundColor: isCompleted ? "var(--primary)" : "var(--border)" }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
