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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = React.useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

    React.useEffect(() => {
        const stored = (localStorage.getItem("ll-theme") as Theme) ?? "system";
        setThemeState(stored);
    }, []);

    React.useEffect(() => {
        const apply = (t: Theme) => {
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            const resolved = t === "system" ? (mq.matches ? "dark" : "light") : t;
            document.documentElement.setAttribute("data-theme", resolved);
            setResolvedTheme(resolved);
        };

        apply(theme);

        if (theme === "system") {
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => apply("system");
            mq.addEventListener("change", handler);
            return () => mq.removeEventListener("change", handler);
        }
    }, [theme]);

    const setTheme = (t: Theme) => {
        localStorage.setItem("ll-theme", t);
        setThemeState(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
