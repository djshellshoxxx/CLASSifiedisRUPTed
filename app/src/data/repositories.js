// Replaceable repository interfaces. Each factory returns the same shape a real service adapter would expose.
import { LISTINGS } from './fixtures.js';
import { toListingRecord, validateListing } from '../domain/listings.js';

export function createListingRepository(seed = LISTINGS) {
  const records = [...seed];
  let counter = records.length;
  return {
    list() {
      return [...records];
    },
    get(id) {
      return records.find((item) => item.id === id) ?? null;
    },
    // Mock submission: validates, stores in memory only, and never reaches a server.
    async submit(draft, { now = Date.now(), delayMs = 0 } = {}) {
      const errors = validateListing(draft);
      if (Object.keys(errors).length) return { ok: false, errors };
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      counter += 1;
      const record = toListingRecord(draft, { id: `local-${counter}`, now });
      records.unshift(record);
      return { ok: true, id: record.id };
    },
  };
}

export function createSavedRepository(storage, key = 'classrup.saved') {
  const read = () => {
    try {
      const parsed = JSON.parse(storage.get(key) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  };
  const write = (ids) => storage.set(key, JSON.stringify([...new Set(ids)]));

  return {
    list() {
      return read();
    },
    has(id) {
      return read().includes(id);
    },
    save(id) {
      write([...read(), id]);
    },
    unsave(id) {
      write(read().filter((saved) => saved !== id));
    },
    toggle(id) {
      const ids = read();
      const next = ids.includes(id) ? ids.filter((saved) => saved !== id) : [...ids, id];
      write(next);
      return next.includes(id);
    },
  };
}

export function createDraftStore(storage, key = 'classrup.draft') {
  return {
    load() {
      try {
        const parsed = JSON.parse(storage.get(key) ?? 'null');
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    },
    save(draft) {
      storage.set(key, JSON.stringify(draft));
    },
    clear() {
      storage.remove(key);
    },
  };
}
