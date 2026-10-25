import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
  webServer: {
    command: "npm run build && npm run dev -- --host 127.0.0.1 --port 4173",
    env: {
      VITE_E2E_LIGHTWEIGHT_RENDER: process.env.CI ? "true" : "false",
    },
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
