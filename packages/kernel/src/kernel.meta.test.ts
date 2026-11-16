// Spec-consistency checks for the kernel: traceability (TST-1/TST-4), isomorphic core, machine tables.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { inboxMachine, syncMachine } from './storage/machines.ts';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..', '..', '..');
const SPECS = {
  'PS-117': '15_Platform/02_backend/mod_api/module.spec.yaml',
  'PS-119': '15_Platform/02_backend/mod_storage/module.spec.yaml',
  'PS-121': '15_Platform/03_operations/mod_observability/module.spec.yaml',
} as const;
const NODE_ONLY = new Set(['node.ts', 'storage/sqlite.ts', 'http/server.ts']);

interface SpecDoc {
  processes: {
    contract_and_acceptance_tests: { tests: string[] };
    workflow_state_machine: { machines: { entity: string; initial: string; terminal: string[]; transitions: string[] }[] };
  };
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

function spec(ps: keyof typeof SPECS): SpecDoc {
  return YAML.parse(readFileSync(join(ROOT, SPECS[ps]), 'utf8')) as SpecDoc;
}

function missingTests(ps: keyof typeof SPECS): string[] {
  const corpus = files(SRC)
    .filter((f) => f.endsWith('.test.ts') || f.endsWith('contract-suite.ts'))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const ids = spec(ps).processes.contract_and_acceptance_tests.tests.map((row) => `TEST-${ps}-09.${row.split('|')[0]?.trim()}`);
  expect(ids.length).toBeGreaterThanOrEqual(6);
  return ids.filter((id) => !new RegExp(`['\`]${id.replace(/\./g, '\\.')}[ :]`).test(corpus));
}

describe('kernel spec consistency', () => {
  it('TEST-PS-117-09.T23 every PS-117 test ID appears in a kernel test title', () => {
    expect(missingTests('PS-117')).toEqual([]);
  });

  it('TEST-PS-119-09.T15 every PS-119 test ID appears in a kernel test title', () => {
    expect(missingTests('PS-119')).toEqual([]);
  });

  it('TEST-PS-121-09.T13 every PS-121 test ID appears in a kernel test title', () => {
    expect(missingTests('PS-121')).toEqual([]);
  });

  it('TEST-PS-117-09.T24 the core is isomorphic: only Node adapter files import node: modules', () => {
    const offenders = files(SRC)
      .filter((f) => !f.endsWith('.test.ts'))
      .map((f) => relative(SRC, f).split('\\').join('/'))
      .filter((rel) => !NODE_ONLY.has(rel))
      .filter((rel) => /from ['"]node:|import\(['"]node:/.test(readFileSync(join(SRC, rel), 'utf8')));
    expect(offenders).toEqual([]);
    const pkg = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8')) as { exports: Record<string, string> };
    expect(pkg.exports).toEqual({ '.': './src/index.ts', './node': './src/node.ts', './browser': './src/browser.ts', './testing': './src/testing/index.ts' });
  });

  it('TEST-PS-119-09.T16 inbox and sync-outbox machines equal the PS-119-03 transition tables', () => {
    const machines = spec('PS-119').processes.workflow_state_machine.machines;
    const table = (entity: string) => {
      const m = machines.find((x) => x.entity === entity);
      if (!m) throw new Error(`machine ${entity} missing from spec`);
      return { initial: m.initial, terminal: [...m.terminal].sort(), edges: [...new Set(m.transitions.map((t) => (t.split('|')[0] ?? '').trim().replace(/\s+/g, ' ')))].sort() };
    };
    const code = (m: typeof inboxMachine | typeof syncMachine) => ({ initial: m.initial, terminal: [...m.terminal].sort(), edges: [...new Set(m.edges())].sort() });
    expect(code(inboxMachine)).toEqual(table('InboxEntry'));
    expect(code(syncMachine)).toEqual(table('SyncOutboxEntry'));
  });
});
