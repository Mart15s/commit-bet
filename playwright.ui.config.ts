import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["landing.spec.ts", "ui-remediation.spec.ts", "premium-ui.spec.ts"],
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH }
      : undefined,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: process.env.PLAYWRIGHT_USE_PRODUCTION_BUILD === "1" ? "npm run start" : "npm run dev",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
    },
    {
      command:
        "node node_modules/vite/bin/vite.js --config tests/visual/vite.config.ts",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: true,
    },
  ],
});
