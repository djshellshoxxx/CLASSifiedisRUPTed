// Storage adapter that never throws. Falls back to memory when the browser blocks storage.
export function createSafeStorage(backend) {
  const memory = new Map();
  // Failed mutations override stale backend data for this adapter's session.
  // A null entry is a removal tombstone, not a request to read the backend.
  const pending = new Set();
  return {
    get(key) {
      if (!backend || pending.has(key)) return memory.get(key) ?? null;
      try {
        const value = backend.getItem(key) ?? null;
        memory.set(key, value);
        return value;
      } catch {
        return memory.get(key) ?? null;
      }
    },
    set(key, value) {
      memory.set(key, value);
      pending.add(key);
      try {
        if (backend) {
          backend.setItem(key, value);
          pending.delete(key);
        }
      } catch {
        // Quota or privacy mode: the memory copy keeps the session working.
      }
    },
    remove(key) {
      memory.set(key, null);
      pending.add(key);
      try {
        if (backend) {
          backend.removeItem(key);
          pending.delete(key);
        }
      } catch {
        // Ignored, see set().
      }
    },
  };
}

export function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
