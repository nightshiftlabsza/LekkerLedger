"use client";

import * as React from "react";
import { ShieldAlert, X, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ComplianceSplash({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg bg-[var(--bg-surface)] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden animate-scale-in">
                {/* Header Image/Background */}
                <div className="h-48 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--amber-500)_0%,_transparent_70%)]" />
                    </div>
                    <ShieldAlert className="h-20 w-20 text-amber-500 relative z-10 animate-pulse" />
                </div>

                <div className="p-8 sm:p-10 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            The 12-Month Rule.
                        </h2>
                        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                            In South Africa, a single procedural error in a payslip or contract can lead to CCMA awards of up to <span className="text-amber-500 font-bold">12 months' salary.</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase text-red-500">Legal Risk #1</p>
                                <p className="text-xs font-medium text-[var(--text-primary)]">Minimum Wage breaches are strictly monitored. Paying even R1 below the rate triggers automatic penalties.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase text-amber-500">Legal Rule #2</p>
                                <p className="text-xs font-medium text-[var(--text-primary)]">UIF registration is mandatory for anyone working {'>'}24 hours per month. Non-compliance is a criminal offense.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <Button className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg gap-2 active-scale" onClick={onClose}>
                            Start My Free Audit <ChevronRight className="h-5 w-5" />
                        </Button>
                        <button onClick={onClose} className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                            Dismiss and browse home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
