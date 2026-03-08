"use client";

import { useEffect } from "react";

/**
 * Hook to prevent accidental navigation when a form is dirty.
 * @param isDirty Whether the form has unsaved changes.
 * @param message The message to show in the browser's native confirmation dialog.
 */
export function useUnsavedChanges(isDirty: boolean, message = "You have unsaved changes. Are you sure you want to leave?") {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty, message]);

    // Note: Next.js app router navigation (Link, router.push) is harder to intercept 
    // without a custom router or global state. For now, we handle browser-level 
    // events (refresh, back button, external links).
}
