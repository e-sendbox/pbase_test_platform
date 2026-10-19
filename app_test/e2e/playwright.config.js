const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./smoke",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: 'echo "Using existing server"',
    url: process.env.BASE_URL || "http://localhost:3000",
    reuseExistingServer: true,
  },
});
