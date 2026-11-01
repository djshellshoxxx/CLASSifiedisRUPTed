import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSafeStorage } from '../src/data/storage.js';
import { createSavedRepository, createDraftStore } from '../src/data/repositories.js';

function backendFixture() {
  const values = new Map();
  return {
    values,
    blocked: false,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) {
      if (this.blocked) throw new Error('quota');
      values.set(key, value);
    },
    removeItem(key) {
      if (this.blocked) throw new Error('blocked');
      values.delete(key);
    },
  };
}

test('saved toggles use session state when writes fail but old data stays readable', () => {
  const backend = backendFixture();
  const saved = createSavedRepository(createSafeStorage(backend));
  saved.save('demo-001');
  backend.blocked = true;
  assert.equal(saved.toggle('demo-002'), true);
  assert.deepEqual(saved.list(), ['demo-001', 'demo-002']);
  assert.equal(saved.toggle('demo-001'), false);
  assert.deepEqual(saved.list(), ['demo-002']);
  assert.equal(backend.values.get('classrup.saved'), '["demo-001"]');
});

test('draft edits and discard survive failed writes and removals for this session', () => {
  const backend = backendFixture();
  const drafts = createDraftStore(createSafeStorage(backend));
  drafts.save({ title: 'Old draft' });
  backend.blocked = true;
  drafts.save({ title: 'Edited draft' });
  assert.deepEqual(drafts.load(), { title: 'Edited draft' });
  drafts.clear();
  assert.equal(drafts.load(), null);
  assert.equal(backend.values.get('classrup.draft'), '{"title":"Old draft"}');
  backend.blocked = false;
  drafts.save({ title: 'New draft' });
  assert.deepEqual(drafts.load(), { title: 'New draft' });
  drafts.clear();
  assert.equal(drafts.load(), null);
  assert.equal(backend.values.has('classrup.draft'), false);
});

test('healthy backend changes and removals stay visible after a local write', () => {
  const backend = backendFixture();
  const storage = createSafeStorage(backend);
  storage.set('key', 'local');
  backend.values.set('key', 'other tab');
  assert.equal(storage.get('key'), 'other tab');
  backend.values.delete('key');
  assert.equal(storage.get('key'), null);
  backend.getItem = () => { throw new Error('blocked'); };
  assert.equal(storage.get('key'), null);
});

test('fallback applies only to a key with an unpersisted change', () => {
  const backend = backendFixture();
  const storage = createSafeStorage(backend);
  backend.blocked = true;
  storage.set('local', 'session');
  backend.values.set('remote', 'fresh');
  assert.equal(storage.get('remote'), 'fresh');
  assert.equal(storage.get('local'), 'session');
  backend.blocked = false;
  storage.set('local', 'persisted');
  backend.values.set('local', 'external update');
  assert.equal(storage.get('local'), 'external update');
});
