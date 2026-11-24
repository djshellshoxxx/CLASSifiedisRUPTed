import { describe, expect, it } from 'vitest';
import { blobRefOf, type MediaBlob } from '../../packages/kernel/src/storage/tx.ts';
import { verifyStoredBlob } from '../../packages/kernel/src/storage/verified-blob.ts';

describe('verified attachment metadata snapshot', () => {
  it('returns the original verified metadata and bytes when its source changes during hashing', async () => {
    const original = Uint8Array.of(14, 37, 91, 203);
    const ref = await blobRefOf(original);
    const createdAt = '2026-11-23T00:00:00.000Z';
    const source: MediaBlob = {
      ref,
      size: original.byteLength,
      contentType: 'image/png',
      privacy: 'P0',
      encrypted: false,
      createdAt,
      holders: 1,
      bytes: new Uint8Array(original),
    };

    // verifyStoredBlob waits for WebCrypto. An adapter/client can retain and
    // mutate its returned object in the interval before hashing completes.
    const pending = verifyStoredBlob(source);
    Object.assign(source, {
      ref: 'not-a-content-address',
      size: 0,
      contentType: 'text/plain',
      privacy: 'P3',
      encrypted: true,
      createdAt: '1999-01-01T00:00:00.000Z',
      holders: 999,
    });
    source.bytes.fill(0);

    const verified = await pending;
    expect(verified).toMatchObject({
      ref,
      size: original.byteLength,
      contentType: 'image/png',
      privacy: 'P0',
      encrypted: false,
      createdAt,
      holders: 1,
    });
    expect(verified.bytes).toEqual(original);
    expect(verified.bytes).not.toBe(source.bytes);
  });

  it('does not preserve unexpected caller-supplied fields in the verified result', async () => {
    const bytes = Uint8Array.of(1, 2, 3);
    const input = {
      ref: await blobRefOf(bytes),
      size: bytes.length,
      contentType: 'application/octet-stream',
      privacy: 'P0' as const,
      encrypted: false,
      createdAt: '2026-11-23T00:00:00.000Z',
      holders: 0,
      bytes,
      extraCallerProperty: 'unverified',
    };
    const result = await verifyStoredBlob(input);
    expect(Object.hasOwn(result, 'extraCallerProperty')).toBe(false);
    expect(result.bytes).toEqual(bytes);
  });
});
