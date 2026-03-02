"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (t: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => { },
});

export function useTheme() {
    return React.useContext(ThemeContext);
}

/** Resolve "system" to the actual OS preference */
function resolveTheme(t: Theme): "light" | "dark" {
    if (t === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
}

/** Apply data-theme attribute to the <html> element */
function applyTheme(resolved: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Initialise from localStorage — same key as the inline script in layout.tsx
    const [theme, setThemeState] = React.useState<Theme>(() => {
        if (typeof window === "undefined") return "system";
        const stored = localStorage.getItem("ll-theme") as Theme | null;
        return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    });

    const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";
        return resolveTheme(
            (localStorage.getItem("ll-theme") as Theme | null) ?? "system"
        );
    });

    // On mount and whenever the theme changes, apply to DOM and persist
    React.useEffect(() => {
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
        localStorage.setItem("ll-theme", theme);
    }, [theme]);

    // Watch OS preference changes when theme === "system"
    React.useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? "dark" : "light";
            setResolvedTheme(resolved);
            applyTheme(resolved);
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = (t: Theme) => {
        setThemeState(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
