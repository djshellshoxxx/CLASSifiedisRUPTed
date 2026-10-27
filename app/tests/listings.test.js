import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateListing,
  filterListings,
  sortListings,
  paginate,
  PAGE_SIZE,
} from '../src/domain/listings.js';
import { LISTINGS } from '../src/data/fixtures.js';

const valid = {
  title: 'Garden bench',
  description: 'Solid wood.',
  kind: 'sell',
  category: 'garden',
  condition: 'good',
  region: 'Harbour',
  price: '45.00',
};

test('valid draft produces no errors', () => {
  assert.deepEqual(validateListing(valid), {});
});

test('title length bounds are enforced after trimming', () => {
  assert.ok(validateListing({ ...valid, title: '  ab ' }).title);
  assert.ok(validateListing({ ...valid, title: 'x'.repeat(81) }).title);
  assert.equal(validateListing({ ...valid, title: 'abc' }).title, undefined);
});

test('price is required for sell and buy but not for giveaway or trade', () => {
  assert.ok(validateListing({ ...valid, price: 'free' }).price);
  assert.equal(validateListing({ ...valid, kind: 'giveaway', price: '' }).price, undefined);
  assert.equal(validateListing({ ...valid, kind: 'trade', price: '' }).price, undefined);
});

test('enumerated fields reject unknown values', () => {
  const errors = validateListing({ ...valid, kind: 'auction', category: 'cars', condition: 'mint', region: '12 Exact Street' });
  assert.deepEqual(Object.keys(errors).sort(), ['category', 'condition', 'kind', 'region']);
});

test('filters combine text, category, kind and max price', () => {
  const results = filterListings(LISTINGS, { query: 'bicycle', category: 'tools', kind: 'sell', maxPriceMinor: 10000 });
  assert.ok(results.length >= 1);
  for (const item of results) {
    assert.equal(item.category, 'tools');
    assert.equal(item.kind, 'sell');
    assert.ok(item.priceMinor <= 10000);
    assert.match(`${item.title} ${item.description}`.toLowerCase(), /bicycle/);
  }
});

test('text search is case-insensitive and empty filters keep everything', () => {
  assert.equal(filterListings(LISTINGS).length, LISTINGS.length);
  assert.ok(filterListings(LISTINGS, { query: 'TENT' }).some((item) => item.title === 'Tent for two'));
});

test('price sorting is ascending or descending with a stable tie-break', () => {
  const asc = sortListings(LISTINGS, 'price-asc').map((item) => item.priceMinor);
  const desc = sortListings(LISTINGS, 'price-desc').map((item) => item.priceMinor);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
});

test('sorting does not mutate the input array', () => {
  const copy = [...LISTINGS];
  sortListings(LISTINGS, 'price-desc');
  assert.deepEqual(LISTINGS, copy);
});

test('pagination clamps page numbers and reports totals', () => {
  const page = paginate(LISTINGS, 99);
  assert.equal(page.page, page.pageCount);
  assert.equal(page.total, LISTINGS.length);
  assert.ok(page.items.length <= PAGE_SIZE);
  assert.equal(paginate([], 1).pageCount, 1);
});
