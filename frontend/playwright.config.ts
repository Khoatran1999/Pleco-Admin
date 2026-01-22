import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  reporter: 'list',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  // Ensure Playwright ignores unit test files in `src`
  testIgnore: ['**/src/**/*.test.*', '**/src/**/*.spec.*'],
});
