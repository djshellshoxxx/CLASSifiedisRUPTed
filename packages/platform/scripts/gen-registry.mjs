#!/usr/bin/env node
// F15.S04.M01 registry generator: writes packages/platform/src/configuration/feature/registry.generated.ts from
// planning/modules.yaml and every module.spec.yaml (depends_on, scope). Usage:
//   node packages/platform/scripts/gen-registry.mjs [--check] [--strict]
//   --check   compare the checked-in file with a fresh generation (CI); exit 1 with PLATFORM_FEATURE_REGISTRY_STALE
//   --strict  fail with PLATFORM_FEATURE_SPEC_MISSING when a catalog module has no module.spec.yaml
// The pipeline itself lives in src/configuration/feature/generate.ts (isomorphic, file access injected).
import { readFileSync, renameSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { runGeneration, summaryLine } from '../src/configuration/feature/generate.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const io = {
  readText(path) {
    try {
      return readFileSync(join(ROOT, path), 'utf8');
    } catch {
      return undefined;
    }
  },
  parseYaml: (text) => YAML.parse(text),
  writeAtomic(path, text) {
    const target = join(ROOT, path);
    const temp = `${target}.${process.pid}.tmp`;
    try {
      writeFileSync(temp, text, 'utf8');
      renameSync(temp, target);
    } finally {
      rmSync(temp, { force: true });
    }
  },
};

const args = new Set(process.argv.slice(2));
const started = performance.now();
const result = await runGeneration(io, { check: args.has('--check'), strict: args.has('--strict') });
const generationMs = Math.round(performance.now() - started);
if (!result.ok) {
  const { code, params, fields } = result.error;
  console.error(`ERROR ${code} ${JSON.stringify({ params, ...(fields ? { fields } : {}) })}`);
  process.exit(1);
}
const { summary, written } = result.value;
console.log(`${summaryLine(summary)}, generation_ms ${generationMs}${written ? ', written' : ', up to date'}`);
