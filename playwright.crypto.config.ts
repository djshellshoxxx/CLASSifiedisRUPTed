import { defineConfig } from '@playwright/test';
import base from './playwright.config.ts';

// Explicit diagnostic suite. These backend probes never replace the product journeys.
export default defineConfig(base, {
  testDir: './tests/compat/browser-crypto',
  retries: 0,
});
