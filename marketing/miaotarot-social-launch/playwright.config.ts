import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8018',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'modern-phone',
      use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'narrow-phone',
      use: { ...devices['iPhone SE'], browserName: 'chromium', viewport: { width: 320, height: 568 } },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 8018 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8018/proposal.html',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
