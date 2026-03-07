(() => {
    try {
        const storedTheme = localStorage.getItem("ll-theme");
        const theme =
            storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
                ? storedTheme
                : "system";
        const resolvedTheme =
            theme === "system"
                ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                : theme;

        document.documentElement.setAttribute("data-theme", resolvedTheme);

        const storedDensity = localStorage.getItem("ll-density");
        if (storedDensity === "compact") {
            document.documentElement.classList.add("density-compact");
        } else {
            document.documentElement.classList.remove("density-compact");
        }
    } catch (error) {
        const fallbackTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", fallbackTheme);
        document.documentElement.classList.remove("density-compact");
    }
})();
