"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * PwaInstallListener — invisible client component mounted in RootLayout.
 * Listens for the browser "appinstalled" event and fires a GA4 pwa_install event.
 * No PII is ever sent.
 */
export function PwaInstallListener() {
    useEffect(() => {
        function onInstalled() {
            track("pwa_install", { platform: "web" });
        }

        window.addEventListener("appinstalled", onInstalled);
        return () => window.removeEventListener("appinstalled", onInstalled);
    }, []);

    return null;
}
