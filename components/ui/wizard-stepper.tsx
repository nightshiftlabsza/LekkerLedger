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
        <div className={`grid grid-cols-2 gap-2 py-2 sm:flex sm:items-center sm:gap-1 ${className}`}>
            {steps.map((step, i) => {
                const s = STATUS_STYLES[step.status];
                return (
                    <React.Fragment key={step.label}>
                        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 sm:shrink-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                            {/* Circle indicator */}
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all"
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
                                className="min-w-0 text-[11px] font-bold uppercase tracking-wide leading-tight whitespace-normal sm:whitespace-nowrap"
                                style={{ color: s.label }}
                            >
                                {step.label}
                            </span>
                        </div>
                        {/* Connector line */}
                        {i < steps.length - 1 && (
                            <div
                                className="hidden h-0.5 min-w-[16px] flex-1 rounded-full transition-colors sm:block"
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
