// Storage adapter that never throws. Falls back to memory when the browser blocks storage.
export function createSafeStorage(backend) {
  const memory = new Map();
  return {
    get(key) {
      try {
        const value = backend?.getItem(key);
        return value ?? memory.get(key) ?? null;
      } catch {
        return memory.get(key) ?? null;
      }
    },
    set(key, value) {
      memory.set(key, value);
      try {
        backend?.setItem(key, value);
      } catch {
        // Quota or privacy mode: the memory copy keeps the session working.
      }
    },
    remove(key) {
      memory.delete(key);
      try {
        backend?.removeItem(key);
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
