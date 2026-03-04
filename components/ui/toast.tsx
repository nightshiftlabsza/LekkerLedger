"use client";

import * as React from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    toasts: Toast[];
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const toast = React.useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ toast, toasts }}>
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
        <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-[90vw] sm:max-w-md pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border glass-panel pointer-events-auto"
                    style={{
                        backgroundColor: "var(--surface-1)",
                        borderColor: t.type === "success" ? "var(--primary)" : "var(--border)",
                        color: "var(--text)",
                    }}
                >
                    <div
                        className="h-2 w-2 rounded-full"
                        style={{
                            backgroundColor: t.type === "success" ? "var(--primary)" :
                                t.type === "error" ? "var(--red-500)" : "var(--blue-500)"
                        }}
                    />
                    <p className="text-sm font-bold">{t.message}</p>
                </div>
            ))}
        </div>
    );
}
