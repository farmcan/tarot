import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.TAROT_PRODUCTION_ORIGIN;

if (!baseURL) {
  throw new Error('Set TAROT_PRODUCTION_ORIGIN before running the production E2E smoke.');
}

export default defineConfig({
  testDir: './tests/e2e-production',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
