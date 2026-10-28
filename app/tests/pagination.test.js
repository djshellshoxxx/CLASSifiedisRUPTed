import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate, PAGE_SIZE } from '../src/domain/listings.js';

const items = Array.from({ length: 13 }, (_, i) => ({ id: i }));

test('page 0 and negative pages clamp to the first page', () => {
  for (const page of [0, -4]) {
    const result = paginate(items, page);
    assert.equal(result.page, 1);
    assert.equal(result.items[0].id, 0);
  }
});

test('NaN page is treated as page 1', () => {
  const result = paginate(items, NaN);
  assert.equal(result.page, 1);
  assert.equal(result.items.length, PAGE_SIZE);
  assert.equal(result.items[0].id, 0);
});

test('fractional page is floored before clamping', () => {
  const result = paginate(items, 2.7);
  assert.equal(result.page, 2);
  assert.equal(result.items[0].id, PAGE_SIZE);
});

test('empty list gives page 1 of 1 with no items', () => {
  const result = paginate([], 5);
  assert.equal(result.page, 1);
  assert.equal(result.pageCount, 1);
  assert.equal(result.total, 0);
  assert.deepEqual(result.items, []);
});

test('a last-page request beyond the end is clamped to the last page', () => {
  const result = paginate(items, 999);
  assert.equal(result.page, 3);
  assert.equal(result.pageCount, 3);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 12);
});
