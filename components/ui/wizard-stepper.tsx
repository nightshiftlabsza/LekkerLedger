"use client";

import * as React from "react";
import { Check, AlertCircle } from "lucide-react";

export type StepStatus = "complete" | "active" | "upcoming" | "error";

export interface Step {
    readonly label: string;
    readonly status: StepStatus;
}

interface WizardStepperProps {
    readonly steps: readonly Step[];
    readonly className?: string;
}

const STATUS_STYLES: Record<StepStatus, { bg: string; text: string; border: string; label: string }> = {
    complete: { bg: "var(--success)", text: "#ffffff", border: "var(--success)", label: "var(--success)" },
    active: { bg: "var(--primary)", text: "#ffffff", border: "var(--primary)", label: "var(--primary)" },
    upcoming: { bg: "var(--surface-2)", text: "var(--text-muted)", border: "var(--border)", label: "var(--text-muted)" },
    error: { bg: "var(--danger)", text: "#ffffff", border: "var(--danger)", label: "var(--danger)" },
};

export function WizardStepper({ steps, className = "" }: WizardStepperProps) {
    return (
        <div className={`flex items-center gap-1 overflow-x-auto no-scrollbar py-2 ${className}`}>
            {steps.map((step, i) => {
                const s = STATUS_STYLES[step.status];
                return (
                    <React.Fragment key={step.label}>
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Circle indicator */}
                            <div
                                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                                style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                            >
                                {(() => {
                                    if (step.status === "complete") return <Check className="h-3.5 w-3.5" />;
                                    if (step.status === "error") return <AlertCircle className="h-3.5 w-3.5" />;
                                    return i + 1;
                                })()}
                            </div>
                            {/* Label */}
                            <span
                                className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                                style={{ color: s.label }}
                            >
                                {step.label}
                            </span>
                        </div>
                        {/* Connector line */}
                        {i < steps.length - 1 && (
                            <div
                                className="flex-1 h-0.5 min-w-[16px] rounded-full transition-colors"
                                style={{
                                    backgroundColor: step.status === "complete" ? "var(--success)" : "var(--border)",
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
