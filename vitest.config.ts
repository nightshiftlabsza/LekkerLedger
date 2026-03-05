import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        include: ["**/*.test.{ts,tsx}"],
    },
    resolve: {
        alias: {
            "@/app": path.resolve(__dirname, "src/app"),
            "@/lib": path.resolve(__dirname, "src/lib"),
            "@/components": path.resolve(__dirname, "src/components"),
            "@": path.resolve(__dirname, "."),
        },
    },
});
