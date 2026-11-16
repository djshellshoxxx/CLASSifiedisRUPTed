import { defineConfig, devices } from '@playwright/test';
const executablePath = process.env.CLASSRUP_CHROMIUM_EXECUTABLE;
export default defineConfig({
  testDir: './tests/browser',
  timeout: 120000,
  expect: { timeout: 20000 },
  workers: 1,
  retries: 0,
  use: { actionTimeout: 20000, navigationTimeout: 20000, baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `node --input-type=module -e "import {setup,build,main} from './tools/cli/classrup.mjs'; await setup(); await build(); await main(['preview']);"`,
    url: 'http://127.0.0.1:4173',
    timeout: 30000,
    reuseExistingServer: false,
  },
});
