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
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ease-in-out ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #fdfcfb 100%)" }}
        >
            <div className={`relative w-48 h-48 transition-all duration-700 ${fadeOut ? 'scale-110 blur-sm' : 'scale-100'}`}>
                <img
                    src="/brand/icon-512.png"
                    alt="LekkerLedger"
                    className="w-full h-full object-contain animate-in fade-in zoom-in duration-1000"
                />
            </div>
        </div>
    );
}
