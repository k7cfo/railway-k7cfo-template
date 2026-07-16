import { defineConfig, devices } from "@playwright/test";

const deployedBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL: deployedBaseUrl ?? "http://localhost:5173", trace: "retain-on-failure" },
  webServer: deployedBaseUrl
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:5173/health",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
