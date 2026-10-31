import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts/browser-tests',
  timeout: 180_000,
  globalTimeout: 15 * 60_000,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: ['chromium', 'firefox', 'webkit'].map(name => ({ name })),
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 15_000,
    env: { PORT: '4173' },
  },
});
