"use client";

import * as React from "react";
import { Check, AlertCircle } from "lucide-react";

export type StepStatus = "complete" | "active" | "upcoming" | "error";

export interface Step {
    label: string;
    status: StepStatus;
}

interface WizardStepperProps {
    steps: Step[];
    className?: string;
}

const STATUS_STYLES: Record<StepStatus, { bg: string; text: string; border: string }> = {
    complete: { bg: "var(--success)", text: "#ffffff", border: "var(--success)" },
    active: { bg: "var(--primary)", text: "#ffffff", border: "var(--primary)" },
    upcoming: { bg: "var(--surface-2)", text: "var(--text-muted)", border: "var(--border)" },
    error: { bg: "var(--red-500)", text: "#ffffff", border: "var(--red-500)" },
};

export function WizardStepper({ steps, className = "" }: WizardStepperProps) {
    return (
        <div className={`flex items-center gap-1 overflow-x-auto no-scrollbar py-2 ${className}`}>
            {steps.map((step, i) => {
                const s = STATUS_STYLES[step.status];
                return (
                    <React.Fragment key={i}>
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Circle indicator */}
                            <div
                                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                                style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                            >
                                {step.status === "complete" ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : step.status === "error" ? (
                                    <AlertCircle className="h-3.5 w-3.5" />
                                ) : (
                                    i + 1
                                )}
                            </div>
                            {/* Label */}
                            <span
                                className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                                style={{
                                    color: step.status === "active" ? "var(--primary)"
                                        : step.status === "error" ? "var(--red-500)"
                                            : step.status === "complete" ? "var(--success)"
                                                : "var(--text-muted)",
                                }}
                            >
                                {step.label}
                            </span>
                        </div>
                        {/* Connector line */}
                        {i < steps.length - 1 && (
                            <div
                                className="flex-1 h-0.5 min-w-[16px] rounded-full transition-colors"
                                style={{
                                    backgroundColor: step.status === "complete"
                                        ? "var(--success)"
                                        : "var(--border)",
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
