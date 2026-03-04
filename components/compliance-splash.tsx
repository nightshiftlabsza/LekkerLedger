"use client";

import * as React from "react";
import { ShieldAlert, ChevronRight, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComplianceSplash({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compliance-title"
        >
            <div className="w-full max-w-lg bg-[var(--surface-1)] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden animate-scale-in">
                {/* Header Image/Background */}
                <div className="h-48 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]" />
                    </div>
                    {/* Explicit X close button for accessibility */}
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors p-2 text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <ShieldAlert className="h-20 w-20 text-[var(--focus)] relative z-10 animate-pulse" />
                </div>

                <div className="p-8 sm:p-10 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 id="compliance-title" className="text-3xl font-black tracking-tight" style={{ color: "var(--text)" }}>
                            The 12-Month Rule.
                        </h2>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            In South Africa, a single procedural error in a payslip or contract can lead to CCMA awards of up to <span className="text-[var(--focus)] font-bold">12 months&apos; salary.</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase text-red-500">Legal Risk #1</p>
                                <p className="text-xs font-medium text-[var(--text)]">Minimum Wage breaches are strictly monitored. Paying even R1 below the rate triggers automatic penalties.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 rounded-2xl bg-[var(--primary)]/5 border border-[var(--focus)]/10">
                            <ShieldCheck className="h-5 w-5 text-[var(--focus)] shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase text-[var(--focus)]">Legal Rule #2</p>
                                <p className="text-xs font-medium text-[var(--text)]">UIF registration is mandatory for anyone working {'>'}24 hours per month. Non-compliance is a criminal offense.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <Button className="w-full h-14 rounded-2xl bg-[var(--primary)] hover:brightness-95 text-white font-black text-lg gap-2 active-scale" onClick={onClose}>
                            Start My Free Audit <ChevronRight className="h-5 w-5" />
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-1"
                        >
                            Dismiss and browse home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
