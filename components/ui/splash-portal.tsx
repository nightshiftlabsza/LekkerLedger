"use client";

import * as React from "react";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";


export function SplashPortal() {
    const [visible, setVisible] = React.useState(true);
    const [fadeOut, setFadeOut] = React.useState(false);

    React.useEffect(() => {
        // Skip splash if we've shown it recently to avoid annoyance during navigation
        const lastShown = sessionStorage.getItem("ll-splash-shown");
        if (lastShown) {
            setVisible(false);
            return;
        }

        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
                setVisible(false);
                sessionStorage.setItem("ll-splash-shown", "true");
            }, 600); // Smooth fade-out
        }, 2200); // Professional duration

        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-700 ease-in-out bg-zinc-950 ${fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}
        >
            <div className="relative animate-scale-in">
                <Logo textClassName="text-white text-3xl" iconClassName="h-16 w-16" />

            </div>
            <div className="mt-8 flex flex-col items-center space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="h-1.5 w-48 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--primary)] rounded-full animate-progress" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 pt-3">
                    South Africa&apos;s Domestic Standard
                </p>
            </div>
        </div>
    );
}
