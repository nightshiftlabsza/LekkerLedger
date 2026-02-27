import * as React from "react"
import { Check } from "lucide-react"

export interface StepperProps {
    steps: { label: string; description?: string }[];
    currentStep: number;
    className?: string;
}

export const Stepper = ({ steps, currentStep, className }: StepperProps) => {
    return (
        <div className={["flex w-full items-start", className].filter(Boolean).join(" ")}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <React.Fragment key={step.label}>
                        <div className="flex flex-col items-center gap-3 flex-shrink-0" style={{ flex: 1 }}>
                            {/* Graphic Area (Ring or Number) */}
                            <div className="h-10 sm:h-12 flex items-center justify-center">
                                {isCurrent ? (
                                    /* Active Step: Thick empty ring */
                                    <div
                                        className="rounded-full transition-all duration-300"
                                        style={{
                                            width: "38px",
                                            height: "38px",
                                            border: "4px solid #F1E5D1", // Pale golden/beige thick ring
                                            backgroundColor: "transparent",
                                        }}
                                    />
                                ) : isCompleted ? (
                                    /* Completed Step: Check or number? The mock shows bare numbers.
                                       Let's use a bare checkmark just to show success. */
                                    <Check className="h-5 w-5" style={{ color: "var(--amber-600)" }} strokeWidth={3} />
                                ) : (
                                    /* Inactive Step: Bare number */
                                    <span
                                        className="font-bold text-lg sm:text-xl transition-all duration-300"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {index + 1}
                                    </span>
                                )}
                            </div>

                            {/* Label Area */}
                            <div className="text-center" style={{ maxWidth: 85 }}>
                                <p
                                    className="font-bold text-xs sm:text-sm leading-tight transition-colors"
                                    style={{
                                        color: isCurrent || isCompleted ? "var(--text-primary)" : "var(--text-primary)",
                                    }}
                                >
                                    {step.label}
                                </p>
                                {step.description && (
                                    <p
                                        className="text-[10px] sm:text-xs leading-tight mt-1 opacity-90"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
