import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    workers: 1,
    reporter: "html",
    use: {
        baseURL: "http://localhost:3002",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: "cmd /c \"(if exist .next-playwright rmdir /s /q .next-playwright) && set PLAYWRIGHT_BUILD=1 && set E2E_BYPASS_AUTH=1 && npx next build --webpack && npx next start -p 3002 -H 0.0.0.0\"",
        url: "http://localhost:3002",
        reuseExistingServer: false,
        timeout: 240000,
        env: {
            ...process.env,
            PLAYWRIGHT_BUILD: "1",
            E2E_BYPASS_AUTH: "1",
        },
    },
});
