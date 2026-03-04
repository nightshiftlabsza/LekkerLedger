"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/storage";
import Link from "next/link";

export function StickyMobileCta() {
    const router = useRouter();
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        // Show sticky CTA after scrolling past 600px, hide near bottom
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight;
            const winHeight = window.innerHeight;
            const nearBottom = scrollY + winHeight > docHeight - 300;

            setVisible(scrollY > 600 && !nearBottom);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Hide when virtual keyboard opens (mobile)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.visualViewport) return;
        const vv = window.visualViewport;
        const handler = () => {
            // If viewport height is significantly less than window height, keyboard is likely open
            if (vv.height < window.innerHeight * 0.75) {
                setVisible(false);
            }
        };
        vv.addEventListener("resize", handler);
        return () => vv.removeEventListener("resize", handler);
    }, []);

    const handleCta = async () => {
        try {
            const s = await getSettings();
            if (!s.employerName) {
                router.push("/onboarding");
            } else {
                router.push("/dashboard");
            }
        } catch {
            router.push("/onboarding");
        }
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300"
            style={{
                transform: visible ? "translateY(0)" : "translateY(100%)",
                backgroundColor: "var(--glass-bg)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderTop: "1px solid var(--border-subtle)",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
            }}
        >
            <div className="flex items-center gap-3 px-4 py-3 safe-area-pb">
                <Button
                    className="flex-1 font-black h-12 rounded-xl shadow-lg active-scale text-sm"
                    style={{ backgroundColor: "var(--color-brand)", color: "white" }}
                    onClick={handleCta}
                >
                    Create your first payslip <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link
                    href="/pricing"
                    className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors whitespace-nowrap px-2"
                >
                    Pricing
                </Link>
            </div>
        </div>
    );
}
