"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export function PaidPlanCheckoutDialog({
    open,
    title,
    description,
    onOpenChange,
    children,
}: {
    open: boolean;
    title: string;
    description: string;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = React.useState(false);
    const dialogRef = React.useRef<HTMLDialogElement | null>(null);
    const titleId = React.useId();
    const descriptionId = React.useId();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (!open || typeof document === "undefined") {
            return;
        }

        const { body, documentElement } = document;
        const previousBodyOverflow = body.style.overflow;
        const previousBodyPaddingRight = body.style.paddingRight;
        const previousDocumentOverflow = documentElement.style.overflow;
        const scrollbarCompensation = window.innerWidth - documentElement.clientWidth;

        body.style.overflow = "hidden";
        documentElement.style.overflow = "hidden";
        if (scrollbarCompensation > 0) {
            body.style.paddingRight = `${scrollbarCompensation}px`;
        }

        return () => {
            body.style.overflow = previousBodyOverflow;
            body.style.paddingRight = previousBodyPaddingRight;
            documentElement.style.overflow = previousDocumentOverflow;
        };
    }, [open]);

    React.useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }

        if (open) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (dialog.open) {
            dialog.close();
        }
    }, [open]);

    if (!mounted || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <dialog
            ref={dialogRef}
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            className="fixed inset-0 z-[70] m-auto w-full max-w-lg min-w-0 overflow-visible border-0 bg-transparent p-4 text-inherit text-left backdrop:bg-black/45 sm:p-6"
            data-testid="paid-plan-checkout-modal"
            onCancel={(event) => {
                event.preventDefault();
                onOpenChange(false);
            }}
            onClose={() => {
                if (open) {
                    onOpenChange(false);
                }
            }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onOpenChange(false);
                }
            }}
        >
            <div className="w-full min-w-0 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
                <div className="flex max-h-[min(42rem,calc(100dvh-2rem))] min-w-0 flex-col sm:max-h-[min(42rem,calc(100dvh-3rem))]">
                    <div className="sr-only">
                        <span id={titleId}>{title}</span>
                        <p id={descriptionId}>{description}</p>
                    </div>
                    <div className="min-w-0 overflow-y-auto overflow-x-hidden p-6 sm:p-7">
                        {children}
                    </div>
                </div>
            </div>
        </dialog>,
        document.body,
    );
}
