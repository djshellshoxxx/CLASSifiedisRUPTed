import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { render, scanDefinitions, status } from '../../tools/status/status.mjs';

test('status without execution results reports zero requirement coverage', () => {
  const report = status({ resultPath: null });
  assert.equal(report.executed, false);
  assert.equal(report.totals.covered, 0);
  assert.equal(report.totals.modules, report.modules.length);
  assert.ok(report.totals.requirements > 0);
  assert.match(render(report), /No execution results were supplied/);
});

test('interface counts come from non-test source definitions and never exceed the specification', () => {
  const definitions = scanDefinitions();
  assert.ok(definitions.some((d) => d.name === 'bazaar.listing.create' && d.module === 'F01.S01.M01'));
  assert.ok(definitions.every((d) => !/\.(test|spec)\.ts$/.test(d.file)));
  for (const module of status({ resultPath: null }).modules) {
    assert.ok(module.implemented <= module.declared, `${module.id} implemented exceeds declared`);
    assert.equal(module.missing.length, module.declared - module.implemented);
    assert.ok(module.covered <= module.requirements);
  }
});

test('only passing mapped tests raise requirement coverage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'classrup status '));
  try {
    const file = join(dir, 'results.json');
    const id = 'TEST-' + 'PS-011-09.T01';
    writeFileSync(file, JSON.stringify({ testResults: [{ assertionResults: [{ fullName: `${id} fails`, status: 'failed' }] }] }));
    assert.equal(status({ resultPath: file }).totals.covered, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('CLI rejects a missing --results argument', () => {
  const result = spawnSync(process.execPath, ['tools/status/status.mjs', '--results'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires a JSON file path/);
});
