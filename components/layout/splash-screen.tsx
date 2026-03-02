"use client";

import * as React from "react";
import Image from "next/image";

export function SplashScreen() {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2200); // Show for 2.2s

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 animate-fade-out" style={{ animationDelay: '1.8s' }}>
            <div className="relative animate-scale-in">
                <Image
                    src="/brand/logo-dark.png"
                    alt="LekkerLedger"
                    width={240}
                    height={60}
                    className="h-16 w-auto"
                    priority
                />
            </div>
            <div className="mt-8 flex flex-col items-center space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="h-1 w-48 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full animate-progress" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 pt-2">
                    South Africa's Domestic Standard
                </p>
            </div>
        </div>
    );
}
