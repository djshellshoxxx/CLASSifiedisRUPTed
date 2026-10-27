import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMinor } from '../src/lib/money.js';

test('parses whole and two-decimal amounts into integer minor units', () => {
  assert.equal(parseMinor('12'), 1200);
  assert.equal(parseMinor('12.5'), 1250);
  assert.equal(parseMinor('12.50'), 1250);
  assert.equal(parseMinor('0.07'), 7);
  assert.equal(parseMinor(' 3 '), 300);
});

test('rejects malformed or over-precise amounts', () => {
  for (const bad of ['', '-1', '1.234', '1,50', 'abc', '1e3', '.5']) {
    assert.equal(parseMinor(bad), null, `expected null for "${bad}"`);
  }
});
