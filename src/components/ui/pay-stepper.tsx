import * as React from "react";
import { Check } from "lucide-react";

export interface Step {
    id: string;
    label: string;
    description?: string;
    isCompleted: boolean;
    isActive: boolean;
}

export interface PayPeriodStepperProps {
    steps: Step[];
    className?: string;
}

export function PayPeriodStepper({ steps, className = "" }: PayPeriodStepperProps) {
    return (
        <div className={`w-full ${className}`}>
            <div className="relative flex justify-between">
                {/* Background Connecting Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-[var(--border-subtle)] -z-10" />

                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10">
                            {/* Active/Completed Connecting Line Overlay */}
                            {!isLast && (
                                <div
                                    className="absolute top-5 left-1/2 w-full h-0.5 transition-colors duration-500 origin-left"
                                    style={{
                                        backgroundColor: step.isCompleted ? "var(--primary)" : "transparent",
                                        transform: "scaleX(1)",
                                    }}
                                />
                            )}

                            {/* Node */}
                            <div
                                className="h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                                style={{
                                    backgroundColor: step.isCompleted || step.isActive ? "var(--primary)" : "var(--bg-surface)",
                                    borderColor: step.isCompleted || step.isActive ? "var(--primary)" : "var(--border-strong)",
                                    color: step.isCompleted || step.isActive ? "white" : "var(--text-muted)",
                                    boxShadow: step.isActive ? "0 0 0 4px rgba(245, 158, 11, 0.2)" : "none",
                                }}
                            >
                                {step.isCompleted ? (
                                    <Check className="h-5 w-5" strokeWidth={3} />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>

                            {/* Label */}
                            <div className="mt-3 text-center w-24 sm:w-32">
                                <p
                                    className="text-xs sm:text-sm font-bold transition-colors"
                                    style={{ color: step.isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
                                >
                                    {step.label}
                                </p>
                                {step.description && (
                                    <p className="text-[10px] sm:text-xs mt-1 hidden sm:block leading-tight text-balance" style={{ color: "var(--text-muted)" }}>
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
