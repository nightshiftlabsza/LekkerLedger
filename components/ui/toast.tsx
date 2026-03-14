/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
    readonly id: string;
    readonly message: string;
    readonly type: ToastType;
}

interface ToastContextType {
    readonly toast: (message: string, type?: ToastType) => void;
    readonly toasts: readonly Toast[];
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);
    const mountedRef = React.useRef(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timerIdsRef = React.useRef<any[]>([]);

    React.useEffect(() => {
        return () => {
            mountedRef.current = false;
            for (const timerId of timerIdsRef.current) {
                globalThis.clearTimeout(timerId);
            }
            timerIdsRef.current = [];
        };
    }, []);

    const removeToast = React.useCallback((id: string) => {
        if (!mountedRef.current) return;
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = React.useCallback((message: string, type: ToastType = "success") => {
        if (!mountedRef.current) return;
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        const timerId = globalThis.setTimeout(() => removeToast(id), 3000);
        timerIdsRef.current.push(timerId);
    }, [removeToast]);

    const contextValue = React.useMemo(() => ({ toast, toasts }), [toast, toasts]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Toaster toasts={toasts} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}

function Toaster({ toasts }: { toasts: Toast[] }) {
    return (
        <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-40 lg:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-[90vw] sm:max-w-md pointer-events-none">
            {toasts.map((t) => {
                const borderColor = {
                    success: "var(--success-border)",
                    error: "var(--danger-border)",
                    info: "var(--info-border)",
                }[t.type];

                const dotColor = {
                    success: "var(--success)",
                    error: "var(--danger)",
                    info: "var(--info)",
                }[t.type];

                return (
                    <div
                        key={t.id}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border glass-panel pointer-events-auto"
                        style={{
                            backgroundColor: "var(--surface-1)",
                            borderColor,
                            color: "var(--text)",
                        }}
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{
                                backgroundColor: dotColor,
                            }}
                        />
                        <p className="text-sm font-bold">{t.message}</p>
                    </div>
                );
            })}
        </div>
    );
}
