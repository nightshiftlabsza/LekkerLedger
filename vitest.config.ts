import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

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
            "@/components/marketing": path.resolve(__dirname, "components/marketing"),
            "@/components/billing": path.resolve(__dirname, "components/billing"),
            "@/components/layout": path.resolve(__dirname, "components/layout"),
            "@/components/ui/input": path.resolve(__dirname, "components/ui/input.tsx"),
            "@/components/ui/label": path.resolve(__dirname, "components/ui/label.tsx"),
            "@/components": path.resolve(__dirname, "src/components"),
            "@": path.resolve(__dirname, "."),
        },
    },
});
