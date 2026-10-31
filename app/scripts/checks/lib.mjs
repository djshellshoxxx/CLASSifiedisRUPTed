// Shared harness for browser journey checks. Start the demo first (`npm start`), then run `npm run check:browser`.
import { createRequire } from 'node:module';

export const BASE = process.env.BASE ?? 'http://localhost:4173/';

// Development tooling only; the static application has no runtime dependencies.
export function loadPlaywright() {
  try {
    return createRequire(import.meta.url)('playwright');
  } catch (error) {
    throw new Error(`Playwright is not resolvable from app/. Run npm ci in app/. (${error.message})`);
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

// Fail closed: a misspelled engine must never silently run a different browser.
export function browserName(value = 'chromium') {
  if (!['chromium', 'firefox', 'webkit'].includes(value)) {
    throw new Error('Unsupported BROWSER: ' + value + '. Use chromium, firefox, or webkit.');
  }
  return value;
}

export async function launchBrowser() {
  const name = browserName(process.env.BROWSER);
  console.log('Browser engine: ' + name);
  return loadPlaywright()[name].launch();
}
