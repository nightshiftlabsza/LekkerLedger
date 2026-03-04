"use client";

/**
 * PwaInstallTracking — tracks both PWA install prompt availability and actual install.
 * No PII is ever sent.
 */

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function PwaInstallTracking() {
    useEffect(() => {
        function onPrompt() {
            // beforeinstallprompt fires when the browser is ready to show the install banner
            track("pwa_install_prompt", { platform: "web" });
        }

        function onInstalled() {
            // appinstalled fires after the user accepts and the PWA is installed
            track("pwa_install", { platform: "web" });
        }

        window.addEventListener("beforeinstallprompt", onPrompt);
        window.addEventListener("appinstalled", onInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", onPrompt);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    return null;
}
