"use client";

import * as React from "react";
import { MessageCircle, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlatformFlavor = "android" | "ios" | "default";

type WhatsappShareDialogProps = {
    open: boolean;
    hasPhone: boolean;
    submitting: boolean;
    recoveryMessage?: string;
    onClose: () => void;
    onConfirm: () => void;
};

function detectPlatformFlavor(): PlatformFlavor {
    if (typeof navigator === "undefined") {
        return "default";
    }

    const navigatorWithUserAgentData = navigator as Navigator & {
        userAgentData?: {
            platform?: string;
        };
    };

    const platformSource = `${navigatorWithUserAgentData.userAgentData?.platform ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`.toLowerCase();

    if (platformSource.includes("android")) {
        return "android";
    }

    if (platformSource.includes("iphone") || platformSource.includes("ipad") || platformSource.includes("ios")) {
        return "ios";
    }

    return "default";
}

function getStepCopy(hasPhone: boolean, platformFlavor: PlatformFlavor) {
    const downloadTarget = platformFlavor === "ios"
        ? "on this device"
        : "to your Downloads folder";
    const finalStep = platformFlavor === "ios"
        ? "Find the downloaded payslip in Files or Downloads and send it."
        : "Find the downloaded payslip and send it.";

    if (!hasPhone) {
        return [
            `We'll first save the payslip ${downloadTarget}.`,
            "Open WhatsApp yourself.",
            "Open the right employee chat.",
            "Choose Documents.",
            finalStep,
        ];
    }

    return [
        `We'll first save the payslip ${downloadTarget}.`,
        "WhatsApp will then open to this employee's chat.",
        "In WhatsApp, tap the attach or share icon.",
        "Choose Documents.",
        finalStep,
    ];
}

export function WhatsAppShareDialog({
    open,
    hasPhone,
    submitting,
    recoveryMessage,
    onClose,
    onConfirm,
}: WhatsappShareDialogProps) {
    const [isMobileViewport, setIsMobileViewport] = React.useState(false);
    const [platformFlavor, setPlatformFlavor] = React.useState<PlatformFlavor>("default");

    React.useEffect(() => {
        if (!open || typeof window === "undefined") {
            return;
        }

        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const updateViewport = () => {
            setIsMobileViewport(mediaQuery.matches);
            setPlatformFlavor(detectPlatformFlavor());
        };

        updateViewport();
        document.body.style.overflow = "hidden";

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) {
                onClose();
            }
        };

        mediaQuery.addEventListener("change", updateViewport);
        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = "";
            mediaQuery.removeEventListener("change", updateViewport);
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose, open, submitting]);

    if (!open) {
        return null;
    }

    const steps = getStepCopy(hasPhone, platformFlavor);
    const title = "Send payslip on WhatsApp";
    const confirmLabel = hasPhone ? "Continue to WhatsApp" : "Save payslip";
    const inAppMessage = hasPhone
        ? null
        : "This employee does not have a phone number saved, so we cannot open the chat for you.";

    return (
        <div
            className={`fixed inset-0 z-[90] flex px-4 ${isMobileViewport ? "items-end pb-0" : "items-center justify-center py-6 sm:px-6"}`}
            data-testid="whatsapp-share-dialog"
        >
            <button
                type="button"
                aria-label="Close WhatsApp instructions"
                className="absolute inset-0 bg-[rgba(16,24,40,0.34)]"
                data-testid="whatsapp-share-overlay"
                onClick={() => {
                    if (!submitting) {
                        onClose();
                    }
                }}
            />

            <dialog
                open
                aria-modal="true"
                aria-labelledby="whatsapp-share-title"
                className={`relative z-[1] m-0 w-full overflow-hidden border border-[var(--border)] bg-[var(--surface-1)] p-0 text-inherit shadow-[0_24px_64px_rgba(16,24,40,0.16)] ${isMobileViewport
                    ? "max-h-[88vh] rounded-t-[2rem] rounded-b-none pb-[max(1rem,env(safe-area-inset-bottom))]"
                    : "max-w-[42rem] rounded-[2rem]"}`}
                data-testid={isMobileViewport ? "whatsapp-share-sheet" : "whatsapp-share-modal"}
            >
                <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--surface-1)] text-[var(--primary)]">
                                <MessageCircle className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--primary)]">Share</p>
                                <h2
                                    id="whatsapp-share-title"
                                    className="mt-1 font-[family:var(--font-serif)] text-[1.75rem] leading-tight text-[var(--text)] sm:text-[2rem]"
                                >
                                    {title}
                                </h2>
                                <p className="mt-2 max-w-[34rem] text-sm leading-7 text-[var(--text-muted)]">
                                    Save the PDF first, then attach it in WhatsApp.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            disabled={submitting}
                            className="shrink-0 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)]"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
                    {inAppMessage ? (
                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm leading-6 text-[var(--text-muted)]">
                            {inAppMessage}
                        </div>
                    ) : null}

                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-1)]">
                        <ol className="space-y-0">
                            {steps.map((step, index) => (
                                <li
                                    key={step}
                                    className="flex gap-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 sm:px-5"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-black text-[var(--text)]">
                                        {index + 1}
                                    </span>
                                    <span className="max-w-[34rem] text-sm leading-7 text-[var(--text)]">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {recoveryMessage ? (
                        <div className="rounded-[1.5rem] border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm leading-6 text-[var(--text)]">
                            {recoveryMessage}
                        </div>
                    ) : null}

                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm leading-6 text-[var(--text-muted)]">
                        <div className="flex items-start gap-3">
                            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--focus)]" />
                            <p className="max-w-[34rem]">
                                The payslip stays on this device first. You attach it yourself in WhatsApp so you can check the file before sending.
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`border-t border-[var(--border)] bg-[var(--surface-raised)] px-5 py-4 sm:px-7 ${isMobileViewport ? "space-y-3" : "flex items-center justify-end gap-3"}`}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                        className={`rounded-[1rem] border-[var(--border)] ${isMobileViewport ? "h-12 w-full" : "h-11 px-5"}`}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting}
                        className={`rounded-[1rem] bg-[var(--primary)] font-bold text-white hover:bg-[var(--primary-hover)] ${isMobileViewport ? "h-12 w-full" : "h-11 px-5"}`}
                        data-testid="whatsapp-share-confirm"
                    >
                        {submitting ? "Preparing WhatsApp..." : confirmLabel}
                    </Button>
                </div>
            </dialog>
        </div>
    );
}
