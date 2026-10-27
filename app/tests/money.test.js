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

test('returns null when the minor-unit value is not a safe integer', () => {
  assert.equal(parseMinor('99999999999999999999'), null);
  assert.equal(parseMinor('90071992547409.93'), null);
  assert.equal(parseMinor('9007199254740.99'), 900719925474099);
});
