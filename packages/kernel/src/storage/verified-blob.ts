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
  const blob = await storage.read(tx => tx.blobs.get(tenant, ref));
  if (!blob) return undefined;
  if (blob.ref !== ref) throw new Error('Blob content integrity check failed');
  return verifyStoredBlob(blob);
}
