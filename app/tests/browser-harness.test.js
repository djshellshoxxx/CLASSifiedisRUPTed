import test from 'node:test';
import assert from 'node:assert/strict';
import * as harness from '../scripts/checks/lib.mjs';

test('browser selection defaults to Chromium and supports all three engines', () => {
  assert.equal(typeof harness.browserName, 'function');
  assert.equal(harness.browserName(undefined), 'chromium');
  for (const name of ['chromium', 'firefox', 'webkit']) assert.equal(harness.browserName(name), name);
});

test('unsupported browser selections fail instead of silently testing Chromium', () => {
  assert.equal(typeof harness.browserName, 'function');
  for (const name of ['', 'chrome', 'FIREFOX', '__proto__']) {
    assert.throws(() => harness.browserName(name), /Unsupported BROWSER/);
  }
});
