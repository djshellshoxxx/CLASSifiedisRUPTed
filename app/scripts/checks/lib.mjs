// Shared harness for browser journey checks. Start the demo first (`npm start`), then run `npm run check:browser`.
import { createRequire } from 'node:module';

export const BASE = process.env.BASE ?? 'http://localhost:4173/';

// Playwright is not a dependency of this zero-dependency app. Resolve it from the environment, or from NODE_PATH.
export function loadPlaywright() {
  try {
    return createRequire(import.meta.url)('playwright');
  } catch (error) {
    throw new Error(`Playwright is not resolvable from app/. Install it or set NODE_PATH to a folder that contains it. (${error.message})`);
  }
}

// Collects PASS/FAIL lines. Exit code is non-zero when any check fails.
export function createChecker() {
  const failures = [];
  const check = (name, ok) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    if (!ok) failures.push(name);
  };
  const finish = () => {
    if (failures.length) {
      console.error(`${failures.length} check(s) failed`);
      process.exitCode = 1;
    } else {
      console.log('All checks in this file passed');
    }
  };
  return { check, finish, failures };
}
