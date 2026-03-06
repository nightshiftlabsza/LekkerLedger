"use client";

import * as React from "react";
import { Home, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddHouseholdDialogProps {
    open: boolean;
    name: string;
    error: string;
    saving: boolean;
    onNameChange: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}

export function AddHouseholdDialog({
    open,
    name,
    error,
    saving,
    onNameChange,
    onClose,
    onSubmit,
}: AddHouseholdDialogProps) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        if (!open) return;

        const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose, open, saving]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6 sm:px-6">
            <button
                type="button"
                aria-label="Close add household dialog"
                className="absolute inset-0 bg-[rgba(16,24,40,0.34)] backdrop-blur-[2px]"
                onClick={() => {
                    if (!saving) onClose();
                }}
            />

            <div className="relative z-[1] w-full max-w-lg overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_28px_80px_rgba(16,24,40,0.18)]">
                <div className="border-b border-[var(--border)] bg-[var(--surface-raised)]/92 px-6 py-5 sm:px-7">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Home className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--primary)]">New workspace</p>
                            <div>
                                <h2 className="font-[family:var(--font-serif)] text-[2rem] leading-none text-[var(--text)]">Add household</h2>
                                <p className="mt-2 max-w-[34rem] text-sm leading-relaxed text-[var(--text-muted)]">
                                    Create a separate household workspace with its own employer details, payroll records, and documents.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 px-6 py-6 sm:px-7">
                    <div className="rounded-[1.5rem] border border-[var(--focus)]/18 bg-[var(--accent-subtle)]/40 px-4 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
                        <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--focus)]" />
                            <p>Keep the name practical and easy to recognise later, like the suburb, family name, or property.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="household-name">Household name</Label>
                        <Input
                            ref={inputRef}
                            id="household-name"
                            value={name}
                            onChange={(event) => onNameChange(event.target.value)}
                            placeholder="e.g. Dlamini household"
                            disabled={saving}
                            maxLength={60}
                            className="h-12 rounded-2xl border-[var(--border)] bg-[var(--surface-1)]"
                        />
                        <p className="text-xs text-[var(--text-muted)]">This name appears in the household switcher and helps keep each workspace separate.</p>
                    </div>

                    {error ? (
                        <div className="rounded-[1.25rem] border border-[rgba(180,35,24,0.2)] bg-[rgba(180,35,24,0.05)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                            {error}
                        </div>
                    ) : null}

                    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={saving}
                            className="h-11 rounded-2xl border-[var(--border)] px-5 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={onSubmit}
                            disabled={saving || !name.trim()}
                            className="h-11 rounded-2xl bg-[var(--primary)] px-5 font-bold text-white hover:bg-[var(--primary-hover)]"
                        >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Home className="mr-2 h-4 w-4" />}
                            {saving ? "Opening workspace..." : "Add household"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
