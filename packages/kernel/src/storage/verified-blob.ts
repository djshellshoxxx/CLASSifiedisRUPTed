import type { Storage } from './storage.ts';
import { blobRefOf, isBlobRef, MAX_BLOB_BYTES, type MediaBlob } from './tx.ts';

/**
 * Validate a detached stored-blob snapshot before considering its bytes for a
 * future portable attachment manifest. The content address covers stored
 * bytes (ciphertext when encrypted), not MIME metadata or holder authority.
 *
 * Does not authenticate parent-record ownership or verify encryption keys.
 */
export async function verifyStoredBlob(blob: MediaBlob): Promise<MediaBlob> {
  if (!isBlobRef(blob.ref) || !(blob.bytes instanceof Uint8Array)
    || !Number.isSafeInteger(blob.size) || blob.size < 0 || blob.size > MAX_BLOB_BYTES) {
    throw new Error('Blob content integrity check failed');
  }
  // Copy first: callers and adapter buffers may be mutable while hashing.
  const bytes = new Uint8Array(blob.bytes);
  if (bytes.byteLength !== blob.size || await blobRefOf(bytes) !== blob.ref) {
    throw new Error('Blob content integrity check failed');
  }
  return { ...blob, bytes };
}

/**
 * Resolve a tenant-scoped blob in a completed read transaction, then verify
 * its content address outside that transaction. Missing bytes return undefined;
 * noncanonical refs and present-but-corrupt bytes fail closed.
 *
 * Callers using an unlocked vault must still re-check session liveness after
 * this await, and must independently prove canonical parent-record ownership.
 */
export async function readVerifiedBlob(
  storage: Storage, tenant: string, ref: string,
): Promise<MediaBlob | undefined> {
  if (!isBlobRef(ref)) throw new Error('Blob content integrity check failed');
  const blob = await storage.read(tx => tx.blobs.get(tenant, ref));
  if (!blob) return undefined;
  if (blob.ref !== ref) throw new Error('Blob content integrity check failed');
  return verifyStoredBlob(blob);
}
