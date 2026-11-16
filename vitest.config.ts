import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/relay/src/**/*.test.ts', 'tests/{unit,property,integration,chaos,compat}/**/*.test.ts'],
    environment: 'node',
    pool: 'threads',
    testTimeout: 20000,
  },
});
