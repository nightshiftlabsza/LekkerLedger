"use client";

import * as React from "react";
import Image from "next/image";

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
            }, 200); // Faster fade-out
        }, 300); // Faster time to show the logo

        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ease-in-out ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            <div className="relative w-72 h-72 animate-pulse">
                <img
                    src="/brand/splash.png"
                    alt="LekkerLedger"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
}
