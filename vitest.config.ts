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
            "@/components/ui/alert": path.resolve(__dirname, "components/ui/alert.tsx"),
            "@/components/ui/card": path.resolve(__dirname, "components/ui/card.tsx"),
            "@/components/ui/input": path.resolve(__dirname, "components/ui/input.tsx"),
            "@/components/ui/label": path.resolve(__dirname, "components/ui/label.tsx"),
            "@/components/ui/loading-skeleton": path.resolve(__dirname, "components/ui/loading-skeleton.tsx"),
            "@/components/ui/page-header": path.resolve(__dirname, "components/ui/page-header.tsx"),
            "@/components/ui/switch": path.resolve(__dirname, "components/ui/switch.tsx"),
            "@/components/ui/toast": path.resolve(__dirname, "components/ui/toast.tsx"),
            "@/components/theme-provider": path.resolve(__dirname, "components/theme-provider.tsx"),
            "@/components": path.resolve(__dirname, "src/components"),
            "@": path.resolve(__dirname, "."),
        },
    },
});
