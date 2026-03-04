"use client";

/**
 * AnalyticsPageView — fires a GA4 page_view on every SPA route change.
 *
 * Next.js App Router does NOT re-trigger the <head> gtag('config', ...) call on
 * client-side navigation, so page views after the first render are missed.
 * This component listens to pathname + searchParams changes and fires explicitly.
 *
 * No PII is ever sent (only pathname + search string, no user data).
 */

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const firstRender = useRef(true);

    useEffect(() => {
        // Skip the very first render — the gtag('config', ...) in <head>
        // already fired a page_view for the initial load.
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        try {
            const w = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (typeof w.gtag !== "function") return;

            const search = searchParams?.toString();
            const pagePath = pathname + (search ? `?${search}` : "");

            w.gtag("event", "page_view", {
                page_location: window.location.href,
                page_path: pagePath,
            });
        } catch {
            // Fail silently if GA is blocked
        }
    }, [pathname, searchParams]);

    return null;
}
