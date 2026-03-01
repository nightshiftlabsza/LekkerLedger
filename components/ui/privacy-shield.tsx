"use client";

import * as React from "react";
import { Shield, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivacyShieldProps {
    className?: string;
    isSensitiveFocused?: boolean;
}

export function PrivacyShield({ className, isSensitiveFocused }: PrivacyShieldProps) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[11px] font-bold transition-all duration-700",
                "backdrop-blur-md border shadow-sm",
                isSensitiveFocused
                    ? "bg-amber-500/10 text-amber-600 border-amber-200/50 ring-4 ring-amber-500/5"
                    : "bg-emerald-500/5 text-emerald-600 border-emerald-100/50",
                className
            )}
        >
            {/* Animated Shine Effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center transition-all duration-500",
                isSensitiveFocused ? "bg-amber-500 text-white scale-110" : "bg-emerald-500 text-white shadow-emerald-200/20"
            )}>
                {isSensitiveFocused ? (
                    <Lock className="h-3 w-3 animate-pulse" />
                ) : (
                    <CheckCircle2 className="h-3 w-3" />
                )}
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="leading-none tracking-tight">
                    {isSensitiveFocused
                        ? "ENCRYPTING LOCALLY"
                        : "LEKKER SECURE"}
                </span>
                <span className="text-[9px] font-medium opacity-70 leading-none">
                    {isSensitiveFocused
                        ? "Protecting sensitive data"
                        : "On-device storage only · POPIA Compliant"}
                </span>
            </div>
        </div>
    );
}
