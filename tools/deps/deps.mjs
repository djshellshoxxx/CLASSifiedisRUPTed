#!/usr/bin/env node
// Dependency-direction check (ADR-0002, ADR-0016): packages import only lower layers;
// cross-module imports inside a package go through the target module's index.ts.
import { readFileSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { ROOT } from '../specgen/model.mjs';
import { walk } from '../lib/walk.mjs';

export const LAYERS = {
  kernel: 0,
  security: 1, privacy: 1, platform: 1, i18n: 1, governance: 1,
  identity: 2, commerce: 2, discovery: 2, comms: 2, notify: 2, moderation: 2, federation: 2,
  bazaar: 3, mutiny: 3, services: 3, auctions: 3, rentals: 3,
};
const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Returns the module directory (packages/<pkg>/src/<sub>/<mod>) containing file, or null. */
function moduleDir(file) {
  const m = /^packages\/[^/]+\/src\/[^/]+\/[^/]+/.exec(relative(ROOT, file));
  return m ? m[0] : null;
}

export function check() {
  const errors = [];
  const files = walk(join(ROOT, 'packages'), (p) => /\.(ts|tsx|mts)$/.test(p));
  for (const f of files) {
    const rel = relative(ROOT, f); const pkg = rel.split('/')[1];
    const layer = LAYERS[pkg];
    if (layer === undefined) { errors.push(`${rel}: package ${pkg} has no layer in tools/deps/deps.mjs`); continue; }
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(IMPORT)) {
      const spec = m[1] || m[2];
      if (spec.startsWith('@classrup/')) {
        const target = spec.slice('@classrup/'.length).split('/')[0];
        const tl = LAYERS[target];
        if (tl === undefined) errors.push(`${rel}: imports unknown package ${spec}`);
        else if (target !== pkg && tl >= layer) errors.push(`${rel}: ${pkg} (layer ${layer}) must not import ${target} (layer ${tl})`);
        if (target === pkg) errors.push(`${rel}: import own package by relative path, not ${spec}`);
      } else if (spec.startsWith('.')) {
        const abs = resolve(dirname(f), spec); const from = moduleDir(f); const to = moduleDir(abs);
        if (from && to && from !== to && !/\/index\.ts$/.test(spec)) errors.push(`${rel}: cross-module import ${spec} must target ${to}/index.ts`);
        if (relative(ROOT, abs).split('/')[1] !== pkg) errors.push(`${rel}: relative import escapes package: ${spec}`);
      } else if (spec.startsWith('node:') && pkg !== 'kernel' && !/\.test\.ts$/.test(f)) {
        errors.push(`${rel}: node: imports are allowed only in kernel Node adapters and tests (ADR-0016 isomorphic core)`);
      }
    }
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = check();
  for (const e of errors) console.log(`ERROR ${e}`);
  console.log(`dependency check: ${errors.length} errors`);
  process.exit(errors.length ? 1 : 0);
}
