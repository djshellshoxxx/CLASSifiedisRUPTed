import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createMemoryStorage, type Storage } from './storage.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { openSqliteStorage } from './sqlite.ts';
import type { PutBlobInput } from './tx.ts';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
const now = Date.parse('2026-01-01T00:00:00.000Z');
const refOf = (bytes: Uint8Array) => `blob:sha256-${createHash('sha256').update(bytes).digest('base64url')}`;
const adapters: Array<[string, () => Promise<Storage>]> = [
  ['memory', async () => createMemoryStorage()],
  ['indexeddb', () => openIndexedDbStorage({ name: 'blob-snapshot', indexedDB: new IDBFactory() })],
  ['sqlite', async () => openSqliteStorage({ path: ':memory:' })],
];

for (const [name, open] of adapters) describe(`${name} blob admission snapshot`, () => {
  it.each(['Uint8Array', 'Buffer'] as const)('retains content-address integrity when the caller changes a %s during hashing', async type => {
    const storage = await open();
    const bytes = type === 'Buffer' ? Buffer.from([1, 2, 3]) : Uint8Array.of(1, 2, 3);
    const expectedRef = refOf(bytes);
    try {
      const saved = await storage.transaction(tx => {
        const pending = tx.blobs.put({ tenant: 'owner', bytes, contentType: 'image/png', privacy: 'P0', now });
        // put has reached its digest await. Reusing the caller's view must not change
        // the stored content or the address that was calculated for that content.
        bytes.fill(9);
        return pending;
      });
      expect(saved.ok).toBe(true);
      if (!saved.ok) throw new Error('blob admission failed');
      expect(saved.value.ref).toBe(expectedRef);
      const stored = await storage.read(tx => tx.blobs.get('owner', expectedRef));
      expect(stored?.bytes).toEqual(Uint8Array.of(1, 2, 3));
      expect(refOf(stored!.bytes)).toBe(expectedRef);
    } finally { await storage.close(); }
  });

  it('keeps the admitted tenant, bytes, privacy, encryption and metadata while hashing', async () => {
    const storage = await open();
    const bytes = Uint8Array.of(4, 5, 6);
    const expectedRef = refOf(bytes);
    const input: Mutable<PutBlobInput> = {
      tenant: 'owner', bytes, contentType: 'application/octet-stream', privacy: 'P2', encrypted: true, now,
    };
    try {
      const saved = await storage.transaction(tx => {
        const pending = tx.blobs.put(input);
        input.tenant = 'other';
        input.bytes = Uint8Array.of(7, 8);
        input.contentType = 'text/plain';
        input.privacy = 'P3';
        input.encrypted = false; // Would bypass the SQLite private-plaintext admission check.
        input.now = now + 1000;
        return pending;
      });
      expect(saved).toEqual({ ok: true, value: {
        ref: expectedRef, size: 3, contentType: 'application/octet-stream', privacy: 'P2',
        encrypted: true, createdAt: new Date(now).toISOString(), holders: 0,
      } });
      const stored = await storage.read(tx => tx.blobs.get('owner', expectedRef));
      expect(stored?.bytes).toEqual(bytes);
      expect(stored?.privacy).toBe('P2');
      expect(stored?.encrypted).toBe(true);
      expect(await storage.read(tx => tx.blobs.get('other', expectedRef))).toBeUndefined();
    } finally { await storage.close(); }
  });

  it('cannot lower an existing blob privacy class by changing the input after admission', async () => {
    const storage = await open();
    const input: Mutable<PutBlobInput> = {
      tenant: 'owner', bytes: Uint8Array.of(1, 3, 5), contentType: 'application/octet-stream', privacy: 'P3', encrypted: true, now,
    };
    const expectedRef = refOf(input.bytes);
    try {
      expect((await storage.transaction(tx => tx.blobs.put(input))).ok).toBe(true);
      const saved = await storage.transaction(tx => {
        const pending = tx.blobs.put(input);
        input.privacy = 'P0';
        input.encrypted = false;
        return pending;
      });
      expect(saved.ok && saved.value.privacy).toBe('P3');
      expect(await storage.read(tx => tx.blobs.info('owner', expectedRef)?.privacy)).toBe('P3');
      expect(await storage.read(tx => tx.blobs.info('owner', expectedRef)?.encrypted)).toBe(true);
    } finally { await storage.close(); }
  });
});

it('requires a literal encryption flag before admitting private SQLite blobs', async () => {
  const storage = openSqliteStorage({ path: ':memory:' });
  try {
    for (const encrypted of ['true', 1, {}, []]) {
      const saved = await storage.transaction(tx => tx.blobs.put({ tenant: 'owner', bytes: Uint8Array.of(2, 4, 6),
        contentType: 'application/octet-stream', privacy: 'P2', encrypted: encrypted as unknown as boolean, now }));
      expect(saved.ok).toBe(false);
      if (saved.ok) throw new Error('private plaintext was admitted');
      expect(saved.error.code).toBe('VALIDATION_FAILED');
      expect(saved.error.fields).toContainEqual({ path: 'privacy', code: 'PLAINTEXT_NOT_PUBLIC' });
    }
    expect(await storage.read(tx => tx.blobs.get('owner', refOf(Uint8Array.of(2, 4, 6))))).toBeUndefined();
  } finally { await storage.close(); }
});
