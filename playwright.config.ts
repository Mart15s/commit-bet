import { defineConfig, devices } from "@playwright/test";

const browserExecutable = process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    ...devices["Pixel 5"],
    launchOptions: browserExecutable
      ? { executablePath: browserExecutable }
      : undefined,
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
