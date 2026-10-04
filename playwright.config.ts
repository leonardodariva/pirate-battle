import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices['iPhone 13 landscape'],
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command:
      'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort --mode test',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
