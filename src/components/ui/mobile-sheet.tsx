"use client";

import * as React from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "object",
    "embed",
    "[contenteditable]",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement | null) {
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
        if (element.hasAttribute("disabled")) return false;
        if (element.getAttribute("aria-hidden") === "true") return false;

        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
    });
}

export interface MobileSheetProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly ariaLabel: string;
    readonly children: React.ReactNode;
    readonly position?: "left" | "bottom";
    readonly panelClassName?: string;
    readonly backdropClassName?: string;
    readonly initialFocusRef?: React.RefObject<HTMLElement | null>;
    readonly returnFocusRef?: React.RefObject<HTMLElement | null>;
    readonly testId?: string;
}

export function MobileSheet({
    open,
    onOpenChange,
    ariaLabel,
    children,
    position = "bottom",
    panelClassName = "",
    backdropClassName = "",
    initialFocusRef,
    returnFocusRef,
    testId,
}: MobileSheetProps) {
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const lastFocusedElementRef = React.useRef<HTMLElement | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const [isMobileViewport, setIsMobileViewport] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(max-width: 1023px)");
        const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
        syncViewport();

        mediaQuery.addEventListener("change", syncViewport);
        return () => mediaQuery.removeEventListener("change", syncViewport);
    }, []);

    React.useEffect(() => {
        if (!open || !isMobileViewport) return;

        const previousOverflow = document.body.style.overflow;
        lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.body.style.overflow = "hidden";

        const focusPanel = () => {
            const panel = panelRef.current;
            if (!panel) return;

            const preferredTarget = initialFocusRef?.current;
            const [firstFocusable] = getFocusableElements(panel);
            const target = preferredTarget ?? firstFocusable ?? panel;
            target.focus();
        };

        const timer = window.setTimeout(focusPanel, 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!panelRef.current) return;

            if (event.key === "Escape") {
                event.preventDefault();
                onOpenChange(false);
                return;
            }

            if (event.key !== "Tab") return;

            const focusableElements = getFocusableElements(panelRef.current);
            if (focusableElements.length === 0) {
                event.preventDefault();
                panelRef.current.focus();
                return;
            }

            const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const currentIndex = activeElement ? focusableElements.indexOf(activeElement) : -1;
            const lastIndex = focusableElements.length - 1;

            if (event.shiftKey) {
                if (currentIndex <= 0) {
                    event.preventDefault();
                    focusableElements[lastIndex]?.focus();
                }
                return;
            }

            if (currentIndex === -1 || currentIndex === lastIndex) {
                event.preventDefault();
                focusableElements[0]?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.clearTimeout(timer);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;

            const returnTarget = returnFocusRef?.current ?? lastFocusedElementRef.current;
            if (returnTarget) {
                window.setTimeout(() => {
                    returnTarget.focus();
                }, 0);
            }
        };
    }, [initialFocusRef, isMobileViewport, onOpenChange, open, returnFocusRef]);

    if (!mounted || !open || !isMobileViewport) return null;

    const panelPositionClassName = position === "left"
        ? "h-full w-[min(calc(100vw-0.75rem),23rem)] max-w-full rounded-r-[2rem] border-r border-[var(--border)] animate-drawer-in"
        : "mt-auto max-h-[min(82dvh,calc(100dvh-0.75rem))] w-full rounded-t-[2rem] border-t border-[var(--border)] animate-slide-up";

    return createPortal(
        <div className="fixed inset-0 z-[90] lg:hidden" data-testid={testId}>
            <button
                type="button"
                aria-label={`Close ${ariaLabel}`}
                className={`absolute inset-0 border-0 bg-black/52 p-0 backdrop-blur-sm animate-fade-in ${backdropClassName}`.trim()}
                onClick={() => onOpenChange(false)}
            />

            <div className={`relative flex h-full w-full ${position === "left" ? "items-stretch justify-start" : "items-end justify-stretch"}`}>
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={ariaLabel}
                    tabIndex={-1}
                    className={`relative z-[91] flex bg-[var(--surface-raised)] shadow-[var(--shadow-xl)] ${panelPositionClassName} ${panelClassName}`.trim()}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body,
    );
}
