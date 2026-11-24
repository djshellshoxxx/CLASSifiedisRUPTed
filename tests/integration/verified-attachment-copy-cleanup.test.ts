import { describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, type Storage } from '../../packages/kernel/src/storage/storage.ts';
import { blobRefOf } from '../../packages/kernel/src/storage/tx.ts';
import { readVerifiedBlob, readVerifiedBlobBatch, verifyStoredBlob } from '../../packages/kernel/src/storage/verified-blob.ts';

const now = Date.parse('2026-11-23T00:00:00.000Z');
const contentType = 'image/png';
const createdAt = new Date(now).toISOString();

describe('verification scratch-byte cleanup', () => {
  it('wipes a detached verification copy after a content-address mismatch without changing caller bytes', async () => {
    const original = Uint8Array.of(10, 20, 30, 40);
    const wrongRef = await blobRefOf(Uint8Array.of(90, 80, 70, 60));
    const wipe = vi.spyOn(Uint8Array.prototype, 'fill');
    try {
      await expect(verifyStoredBlob({
        ref: wrongRef, size: original.byteLength, bytes: original,
        contentType, privacy: 'P0', encrypted: false, createdAt, holders: 0,
      })).rejects.toThrow(/integrity/);
      const snapshots = wipe.mock.instances.filter(
        (bytes): bytes is Uint8Array => bytes instanceof Uint8Array
          && bytes !== original && bytes.byteLength === original.byteLength,
      );
      expect(snapshots.length).toBeGreaterThan(0);
      for (const bytes of snapshots) expect([...bytes]).toEqual([0, 0, 0, 0]);
      expect([...original]).toEqual([10, 20, 30, 40]);
    } finally { wipe.mockRestore(); }
  });

  it('wipes intermediate single and batch reads without wiping accepted caller-owned bytes', async () => {
    const storage = createMemoryStorage();
    try {
      const firstBytes = Uint8Array.of(11, 12, 13);
      const secondBytes = Uint8Array.of(21, 22, 23, 24);
      const first = await storage.transaction(tx => tx.blobs.put({
        tenant: 'owner', bytes: firstBytes, contentType, privacy: 'P0', encrypted: false, now,
      }));
      const second = await storage.transaction(tx => tx.blobs.put({
        tenant: 'owner', bytes: secondBytes, contentType, privacy: 'P0', encrypted: false, now,
      }));
      expect(first.ok && second.ok).toBe(true);
      if (!first.ok || !second.ok) return;
      const wipe = vi.spyOn(Uint8Array.prototype, 'fill');
      try {
        const one = await readVerifiedBlob(storage, 'owner', first.value.ref);
        const both = await readVerifiedBlobBatch(storage, 'owner', [first.value.ref, second.value.ref]);
        expect(one?.bytes).toEqual(firstBytes);
        expect(both.map(blob => blob.bytes)).toEqual([firstBytes, secondBytes]);
        // One intermediate copy from the single read and two from the batch.
        const cleared = wipe.mock.instances.filter((bytes) =>
          bytes instanceof Uint8Array && bytes.every(value => value === 0));
        expect(cleared.length).toBeGreaterThanOrEqual(3);
        expect(one?.bytes).toEqual(firstBytes);
        expect(both.map(blob => blob.bytes)).toEqual([firstBytes, secondBytes]);
        expect((await storage.read(tx => tx.blobs.get('owner', first.value.ref)))?.bytes)
          .toEqual(firstBytes);
      } finally { wipe.mockRestore(); }
    } finally { await storage.close(); }
  });

  it('wipes already copied members when a later batch reference is missing', async () => {
    const storage = createMemoryStorage();
    try {
      const bytes = Uint8Array.of(31, 32, 33);
      const saved = await storage.transaction(tx => tx.blobs.put({
        tenant: 'owner', bytes, contentType, privacy: 'P0', encrypted: false, now,
      }));
      expect(saved.ok).toBe(true);
      if (!saved.ok) return;
      const missing = await blobRefOf(Uint8Array.of(99, 98, 97));
      const wipe = vi.spyOn(Uint8Array.prototype, 'fill');
      try {
        await expect(readVerifiedBlobBatch(storage, 'owner', [saved.value.ref, missing]))
          .rejects.toThrow(/integrity/);
        const cleared = wipe.mock.instances.filter((view) =>
          view instanceof Uint8Array && view.byteLength === bytes.byteLength
          && view.every(value => value === 0));
        expect(cleared.length).toBeGreaterThan(0);
        expect((await readVerifiedBlobBatch(storage, 'owner', [saved.value.ref]))[0]?.bytes)
          .toEqual(bytes);
      } finally { wipe.mockRestore(); }
    } finally { await storage.close(); }
  });

  it('wipes the single snapshot when storage rejects a completed read', async () => {
    const storage = createMemoryStorage();
    try {
      const bytes = Uint8Array.of(41, 42, 43);
      const saved = await storage.transaction(tx => tx.blobs.put({
        tenant: 'owner', bytes, contentType, privacy: 'P0', encrypted: false, now,
      }));
      if (!saved.ok) throw new Error('Could not save fixture blob');
      const failure = new Error('Read completion failed');
      const interrupted: Storage = { ...storage, async read(fn) {
        await storage.read(fn);
        throw failure;
      } };
      const wipe = vi.spyOn(Uint8Array.prototype, 'fill');
      try {
        await expect(readVerifiedBlob(interrupted, 'owner', saved.value.ref)).rejects.toBe(failure);
        const wiped = wipe.mock.instances.filter(view =>
          view instanceof Uint8Array && view.byteLength === bytes.byteLength);
        expect(wiped).toHaveLength(1);
        expect(wiped[0]).toEqual(Uint8Array.of(0, 0, 0));
        expect((await storage.read(tx => tx.blobs.get('owner', saved.value.ref)))?.bytes)
          .toEqual(Uint8Array.of(41, 42, 43));
      } finally { wipe.mockRestore(); }
    } finally { await storage.close(); }
  });
});
