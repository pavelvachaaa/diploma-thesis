import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run start -- -p 3002',
    url: 'http://localhost:3002/kariera',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_BASE_PATH: '/kariera',
      NEXT_PUBLIC_BASE_API_URL_PROD: 'http://localhost:3323/api/v1',
      NEXT_PUBLIC_UMAMI_ENABLED: 'false',
    },
  },
});
