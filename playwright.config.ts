import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests-e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: 1,
  fullyParallel: true,
})
