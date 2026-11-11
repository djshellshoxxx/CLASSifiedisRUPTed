import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readResults, trace } from '../../tools/trace/trace.mjs';

const id = (n) => 'TEST-' + `PS-001-09.T0${n}`;

function fixture(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'classrup trace '));
  try { callback(join(dir, 'results.json')); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('source references and comments never establish passing execution', () => {
  const result = trace({ resultPath: null });
  assert.ok(result.found.size > 0, 'repository contains source test IDs');
  assert.equal(result.rows.reduce((n, row) => n + row.passing.length, 0), 0);
});
test('missing or malformed results fail closed', () => fixture((file) => {
  assert.throws(() => readResults(file), /does not exist/);
  writeFileSync(file, '{}');
  assert.throws(() => readResults(file), /testResults/);
  writeFileSync(file, '{');
  assert.throws(() => readResults(file), SyntaxError);
}));
test('only passed assertions count and skipped/failed duplicates win', () => fixture((file) => {
  writeFileSync(file, JSON.stringify({ testResults: [{ assertionResults: [
    { fullName: id(1) + ' passes', status: 'passed' },
    { fullName: id(2) + ' passes once', status: 'passed' },
    { fullName: id(2) + ' skipped repeat', status: 'pending' },
    { fullName: id(3) + ' fails', status: 'failed' },
    { fullName: id(3) + ' passes later', status: 'passed' },
  ] }] }));
  const results = readResults(file);
  assert.equal(results.get(id(1)), 'passed');
  assert.equal(results.get(id(2)), 'failed');
  assert.equal(results.get(id(3)), 'failed');
}));
test('CLI rejects missing --results argument rather than using source inventory', () => {
  const result = spawnSync(process.execPath, ['tools/trace/trace.mjs', '--results', '--strict'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires a JSON file path/);
});
