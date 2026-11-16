// Shared file walker for repository tooling (skips VCS, dependencies and build output).
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vite', 'playwright-report', 'test-results']);

/** Recursively lists files under dir whose path matches the predicate. */
export function walk(dir, predicate, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, predicate, out);
    else if (predicate(p)) out.push(p);
  }
  return out;
}
