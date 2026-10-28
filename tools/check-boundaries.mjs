#!/usr/bin/env node
// F17.S03 release gate: enforce package dependency direction.
// kernel <- security <- feature packages <- apps. Feature packages never import each other;
// cross-feature calls go through @classrup/kernel ports wired by apps/relay.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const ALLOWED = { kernel: [], security: ['kernel'] };
const FEATURE_ALLOWED = ['kernel', 'security'];
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mts)$/.test(e)) out.push(p);
  }
  return out;
}

const errors = [];
for (const pkg of readdirSync(join(root, 'packages'))) {
  const src = join(root, 'packages', pkg, 'src');
  let files = [];
  try { files = walk(src); } catch { continue; }
  const allowed = ALLOWED[pkg] ?? FEATURE_ALLOWED;
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2];
      const rel = relative(root, f);
      if (spec.startsWith('@classrup/')) {
        const dep = spec.slice('@classrup/'.length).split('/')[0];
        if (dep !== pkg && !allowed.includes(dep)) errors.push(`${rel}: imports ${spec} (allowed: ${allowed.join(', ') || 'none'})`);
        if (spec.split('/').length > 2) errors.push(`${rel}: deep import ${spec}; use the package entry point`);
      } else if (spec.startsWith('.')) {
        const target = join(f, '..', spec);
        if (!target.startsWith(join(root, 'packages', pkg))) errors.push(`${rel}: relative import escapes package: ${spec}`);
      } else if (spec.startsWith('node:')) {
        errors.push(`${rel}: node builtin ${spec} not allowed in browser-safe package`);
      }
    }
  }
}
if (errors.length) {
  console.error(`boundary check failed (${errors.length}):\n` + errors.join('\n'));
  process.exit(1);
}
console.log('boundary check ok');
