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
  // Snapshot scalar metadata before WebCrypto yields: later writes to the
  // source object must not change what is paired with the verified bytes.
  const { ref, size, contentType, privacy, encrypted, createdAt, holders } = blob;
  const sourceBytes = blob.bytes;
  if (!isBlobRef(ref) || !(sourceBytes instanceof Uint8Array)
    || !Number.isSafeInteger(size) || size < 0 || size > MAX_BLOB_BYTES
    || sourceBytes.byteLength !== size) {
    throw new Error('Blob content integrity check failed');
  }
  // Snapshot the bytes before the first await, not merely before returning.
  // Construct only declared fields; unknown source properties are not verified.
  const bytes = new Uint8Array(sourceBytes);
  if (await blobRefOf(bytes) !== ref) {
    throw new Error('Blob content integrity check failed');
  }
  return { ref, size, contentType, privacy, encrypted, createdAt, holders, bytes };
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
  // Detach the adapter-owned bytes before settling the read transaction.
  // A returned memory/driver view must not be hashed after a subsequent write
  // can alter or invalidate it. The digest is computed outside the read lock.
  const blob = await storage.read(tx => {
    const found = tx.blobs.get(tenant, ref);
    if (!found) return undefined;
    const { ref: storedRef, size, contentType, privacy, encrypted, createdAt, holders } = found;
    const sourceBytes = found.bytes;
    if (storedRef !== ref || !(sourceBytes instanceof Uint8Array)
      || !Number.isSafeInteger(size) || size < 0 || size > MAX_BLOB_BYTES
      || sourceBytes.byteLength !== size) {
      throw new Error('Blob content integrity check failed');
    }
    return { ref: storedRef, size, contentType, privacy, encrypted, createdAt,
      holders, bytes: new Uint8Array(sourceBytes) };
  });
  if (!blob) return undefined;
  return verifyStoredBlob(blob);
}


/** Conservative limits for a future separately authenticated attachment transport. */
export const MAX_VERIFIED_BLOB_BATCH_ITEMS = 32;
export const MAX_VERIFIED_BLOB_BATCH_BYTES = 20 * 1024 * 1024;

/**
 * Read a small canonical, duplicate-free tenant blob set from ONE consistent
 * storage snapshot. Apply an aggregate byte cap before copying, and verify
 * every detached copy outside the transaction. Fail the whole read on missing
 * or corrupt members; never return a verified prefix.
 *
 * Read-only prerequisite, NOT an authorized attachment export. Caller must
 * establish parent-record ownership, live vault session, and re-encryption.
 * Ciphertext hashes do not authenticate blob metadata or holder labels.
 */
export async function readVerifiedBlobBatch(
  storage: Storage,
  tenant: string,
  refs: readonly string[],
  maxTotalBytes: number = MAX_VERIFIED_BLOB_BATCH_BYTES,
): Promise<readonly MediaBlob[]> {
  if (!Array.isArray(refs) || refs.length > MAX_VERIFIED_BLOB_BATCH_ITEMS
    || !Number.isSafeInteger(maxTotalBytes)
    || maxTotalBytes < 0 || maxTotalBytes > MAX_VERIFIED_BLOB_BATCH_BYTES) {
    throw new Error('Attachment batch integrity check failed');
  }
  // Snapshot mutable input before the first await.
  const requested = [...refs];
  const seen = new Set<string>();
  for (const ref of requested) {
    if (!isBlobRef(ref) || seen.has(ref)) {
      throw new Error('Attachment batch integrity check failed');
    }
    seen.add(ref);
  }

  const snapshots = await storage.read(tx => {
    let total = 0;
    return requested.map(ref => {
      const blob = tx.blobs.get(tenant, ref);
      if (!blob || blob.ref !== ref || !(blob.bytes instanceof Uint8Array)
        || !Number.isSafeInteger(blob.size) || blob.size < 0
        || blob.size > MAX_BLOB_BYTES || blob.bytes.byteLength !== blob.size
        || blob.size > maxTotalBytes - total) {
        throw new Error('Attachment batch integrity check failed');
      }
      total += blob.size;
      // Do not retain an adapter byte view after transaction settlement.
      const { size, contentType, privacy, encrypted, createdAt, holders } = blob;
      return {
        ref, size, contentType, privacy, encrypted, createdAt, holders,
        bytes: new Uint8Array(blob.bytes),
      };
    });
  });

  const verified: MediaBlob[] = [];
  for (const snapshot of snapshots) verified.push(await verifyStoredBlob(snapshot));
  return verified;
}
