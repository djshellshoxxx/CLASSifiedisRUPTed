#!/usr/bin/env node
// F15.S04.M01 registry generator: writes packages/platform/src/configuration/feature/registry.generated.ts from
// planning/modules.yaml and every module.spec.yaml (depends_on, scope). Usage:
//   node packages/platform/scripts/gen-registry.mjs [--check] [--strict]
//   --check   compare the checked-in file with a fresh generation (CI); exit 1 with PLATFORM_FEATURE_REGISTRY_STALE
//   --strict  fail with PLATFORM_FEATURE_SPEC_MISSING when a catalog module has no module.spec.yaml
// The pipeline itself lives in src/configuration/feature/generate.ts (isomorphic, file access injected).
import { closeSync, lstatSync, openSync, readFileSync, realpathSync, renameSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import YAML from 'yaml';
import { runGeneration, summaryLine } from '../src/configuration/feature/generate.ts';
import { isRepositoryPath } from '../src/configuration/feature/rules.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Repository-local I/O. Specs and output may not traverse symbolic links. */
export function createRepositoryIo(root = ROOT) {
  const base = realpathSync(root);
  const localPath = (path) => {
    if (!isRepositoryPath(path)) throw new Error('Invalid repository path');
    let current = base;
    for (const part of path.split('/')) {
      current = join(current, part);
      try {
        if (lstatSync(current).isSymbolicLink()) throw new Error('Symbolic links are not registry inputs or outputs');
      } catch (error) {
        if (error.code === 'ENOENT') break;
        throw error;
      }
    }
    return join(base, path);
  };
  return {
    readText(path) {
      const target = localPath(path);
      try { return readFileSync(target, 'utf8'); }
      catch (error) {
        if (error.code === 'ENOENT') return undefined;
        throw error;
      }
    },
    parseYaml: (text) => YAML.parse(text),
    writeAtomic(path, text) {
      const target = localPath(path);
      const temp = `${target}.${process.pid}.tmp`;
      let created = false;
      let descriptor;
      try {
        descriptor = openSync(temp, 'wx');
        created = true;
        writeFileSync(descriptor, text, 'utf8');
        closeSync(descriptor);
        descriptor = undefined;
        renameSync(temp, target);
      } finally {
        try { if (descriptor !== undefined) closeSync(descriptor); }
        finally { if (created) rmSync(temp, { force: true }); }
      }
    },
  };
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.some((arg) => arg !== '--check' && arg !== '--strict')) {
    console.error('Usage: gen-registry.mjs [--check] [--strict]');
    return 2;
  }
  const started = performance.now();
  const result = await runGeneration(createRepositoryIo(), { check: argv.includes('--check'), strict: argv.includes('--strict') });
  const generationMs = Math.round(performance.now() - started);
  if (!result.ok) {
    const { code, params, fields } = result.error;
    console.error(`ERROR ${code} ${JSON.stringify({ params, ...(fields ? { fields } : {}) })}`);
    return 1;
  }
  const { summary, written } = result.value;
  console.log(`${summaryLine(summary)}, generation_ms ${generationMs}${written ? ', written' : ', up to date'}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await main();
