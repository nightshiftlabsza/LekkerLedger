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

                const circleEl = isCompleted ? (
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
                        style={{ backgroundColor: "var(--primary)" }}
                    >
                        <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </div>
                ) : isCurrent ? (
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
                        style={{ backgroundColor: "var(--primary)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--primary) 15%, transparent)" }}
                    >
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                    </div>
                ) : (
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200"
                        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-1)" }}
                    >
                        <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>{index + 1}</span>
                    </div>
                );

                return (
                    <React.Fragment key={step.label}>
                        <div
                            className="flex flex-col items-center gap-2 flex-shrink-0"
                            style={{ flex: 1 }}
                        >
                            {isClickable ? (
                                <button
                                    type="button"
                                    onClick={() => onStepClick(index)}
                                    className="flex flex-col items-center gap-2 group"
                                    title={`Go to ${step.label}`}
                                >
                                    <div className="group-hover:opacity-80 transition-opacity">
                                        {circleEl}
                                    </div>
                                    <div className="text-center" style={{ maxWidth: 80 }}>
                                        <p className="text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: "var(--primary)" }}>
                                            {step.label}
                                        </p>
                                    </div>
                                </button>
                            ) : (
                                <>
                                    {circleEl}
                                    <div className="text-center" style={{ maxWidth: 80 }}>
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wide leading-tight"
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
                                className="flex-1 mt-[18px] h-0.5 mx-1 transition-colors duration-300 shrink"
                                style={{ backgroundColor: isCompleted ? "var(--primary)" : "var(--border)" }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
