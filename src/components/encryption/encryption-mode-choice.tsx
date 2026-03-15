"use client";

import * as React from "react";
import { ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ENCRYPTION_MODE_OPTIONS, type EncryptionMode } from "@/lib/encryption-mode";

interface EncryptionModeChoiceProps {
    onSelect: (mode: EncryptionMode) => void;
    selectedMode?: EncryptionMode | null;
}

export function EncryptionModeChoice({
    onSelect,
    selectedMode = null,
}: Readonly<EncryptionModeChoiceProps>) {
    return (
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-lg)] sm:p-7">
            <div className="max-w-[50ch]">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Secure backup setup
                </p>
                <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[var(--text)] sm:text-[2rem]">
                    Choose how you want account recovery to work.
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)] sm:text-[0.97rem]">
                    Both options encrypt your payroll records before upload. The difference is how recovery works if you lose access later.
                </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {ENCRYPTION_MODE_OPTIONS.map((option) => {
                    const isSelected = selectedMode === option.mode;
                    const Icon = option.mode === "recoverable" ? ShieldCheck : KeyRound;

                    return (
                        <section
                            key={option.mode}
                            className={`flex h-full flex-col rounded-[1.5rem] border p-5 shadow-[var(--shadow-sm)] transition-colors sm:p-6 ${
                                option.mode === "recoverable"
                                    ? "border-[var(--primary)]/25 bg-[var(--surface-1)]"
                                    : "border-[var(--border)] bg-[var(--surface-1)]"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--primary)]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                        option.mode === "recoverable"
                                            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                            : "bg-[var(--surface-raised)] text-[var(--text-muted)]"
                                    }`}
                                >
                                    {option.badge}
                                </span>
                            </div>

                            <div className="mt-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                    {option.eyebrow}
                                </p>
                                <h2 className="mt-2 text-xl font-bold text-[var(--text)]">{option.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                                    {option.summary}
                                </p>
                            </div>

                            <ul className="mt-5 space-y-2 text-sm leading-6 text-[var(--text-muted)]">
                                {option.bullets.map((bullet) => (
                                    <li key={bullet} className="flex gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6">
                                <Button
                                    type="button"
                                    onClick={() => onSelect(option.mode)}
                                    className={`min-h-[48px] w-full rounded-2xl font-bold ${
                                        option.mode === "recoverable"
                                            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                            : "border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--surface-raised)]"
                                    }`}
                                    variant={option.mode === "recoverable" ? "default" : "outline"}
                                    aria-pressed={isSelected}
                                >
                                    {option.cta}
                                </Button>
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
