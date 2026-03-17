"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type Density = "comfortable" | "compact";

interface UIContextValue {
    readonly theme: Theme;
    readonly resolvedTheme: "light" | "dark";
    readonly setTheme: (t: Theme) => void;
    readonly density: Density;
    readonly setDensity: (d: Density) => void;
}

const UIContext = React.createContext<UIContextValue>({
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => { },
    density: "comfortable",
    setDensity: () => { },
});

export function useUI() {
    return React.useContext(UIContext);
}

/** Legacy hook for backward compatibility */
export function useTheme() {
    const { theme, resolvedTheme, setTheme } = useUI();
    return { theme, resolvedTheme, setTheme };
}

/** Resolve "system" to the actual OS preference */
function resolveTheme(t: Theme): "light" | "dark" {
    if (t === "system") {
        if (globalThis.window === undefined) return "light";
        return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
}

/** Apply data-theme attribute to the <html> element */
function applyTheme(resolved: "light" | "dark") {
    if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = resolved;
    }
}

/** Apply density class to the <html> element */
function applyDensity(d: Density) {
    if (typeof document !== "undefined") {
        if (d === "compact") {
            document.documentElement.classList.add("density-compact");
        } else {
            document.documentElement.classList.remove("density-compact");
        }
    }
}

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
    // Initialise from localStorage — same key as the inline script in layout.tsx
    const [theme, setThemeState] = React.useState<Theme>(() => {
        if (typeof globalThis.window === "undefined") return "system";
        const stored = localStorage.getItem("ll-theme") as Theme | null;
        return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    });

    const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() => {
        if (typeof globalThis.window === "undefined") return "light";
        return resolveTheme(
            (localStorage.getItem("ll-theme") as Theme | null) ?? "system"
        );
    });

    const [density, setDensityState] = React.useState<Density>(() => {
        if (typeof globalThis.window === "undefined") return "comfortable";
        const stored = localStorage.getItem("ll-density") as Density | null;
        return stored === "comfortable" || stored === "compact" ? stored : "comfortable";
    });

    // On mount and whenever the theme/density changes, apply to DOM and persist
    React.useEffect(() => {
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
        localStorage.setItem("ll-theme", theme);
    }, [theme]);

    React.useEffect(() => {
        applyDensity(density);
        localStorage.setItem("ll-density", density);
    }, [density]);

    // Watch OS preference changes when theme === "system"
    React.useEffect(() => {
        if (theme !== "system") return;
        const mq = globalThis.window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? "dark" : "light";
            setResolvedTheme(resolved);
            applyTheme(resolved);
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = (t: Theme) => setThemeState(t);
    const setDensity = (d: Density) => setDensityState(d);

    const contextValue = React.useMemo(() => ({ theme, resolvedTheme, setTheme, density, setDensity }), [theme, resolvedTheme, density]);

    return (
        <UIContext.Provider value={contextValue}>
            {children}
        </UIContext.Provider>
    );
}
