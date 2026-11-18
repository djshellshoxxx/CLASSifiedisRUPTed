import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'tests/{integration,compat}/**/*.test.ts'],
    environment: 'node',
    pool: 'threads',
    testTimeout: 20000,
  },
});
