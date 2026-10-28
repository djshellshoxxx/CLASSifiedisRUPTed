import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSavedRepository, createDraftStore, createListingRepository } from '../src/data/repositories.js';
import { createSafeStorage } from '../src/data/storage.js';

const validDraft = {
  title: 'Mock item',
  description: '',
  kind: 'sell',
  category: 'home',
  condition: 'new',
  region: 'Old Town',
  price: '5',
};

test('saved listings toggle and persist through the storage adapter', () => {
  const storage = createSafeStorage(null);
  const saved = createSavedRepository(storage);
  assert.equal(saved.has('demo-001'), false);
  assert.equal(saved.toggle('demo-001'), true);
  assert.equal(saved.has('demo-001'), true);
  assert.equal(saved.toggle('demo-001'), false);
  assert.deepEqual(saved.list(), []);
});

test('saving the same id twice keeps one entry', () => {
  const saved = createSavedRepository(createSafeStorage(null));
  saved.save('demo-002');
  saved.save('demo-002');
  assert.deepEqual(saved.list(), ['demo-002']);
});

test('corrupt saved data is ignored instead of crashing', () => {
  const storage = createSafeStorage(null);
  storage.set('classrup.saved', '{not json');
  assert.deepEqual(createSavedRepository(storage).list(), []);
});

test('blocked storage backend falls back to in-memory state', () => {
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  const saved = createSavedRepository(createSafeStorage(broken));
  saved.save('demo-003');
  assert.deepEqual(saved.list(), ['demo-003']);
});

test('draft store round-trips and clears', () => {
  const drafts = createDraftStore(createSafeStorage(null));
  assert.equal(drafts.load(), null);
  drafts.save({ title: 'Half written' });
  assert.deepEqual(drafts.load(), { title: 'Half written' });
  drafts.clear();
  assert.equal(drafts.load(), null);
});

test('listing submit rejects invalid drafts without storing them', async () => {
  const repo = createListingRepository([]);
  const result = await repo.submit({ ...validDraft, title: '' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.title);
  assert.equal(repo.list().length, 0);
});

test('listing submit stores valid drafts in memory with integer price', async () => {
  const repo = createListingRepository([]);
  const result = await repo.submit(validDraft, { now: 1 });
  assert.equal(result.ok, true);
  const record = repo.get(result.id);
  assert.equal(record.priceMinor, 500);
  assert.equal(record.title, 'Mock item');
});
