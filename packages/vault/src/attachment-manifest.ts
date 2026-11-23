import { blobRefOf, isBlobRef, MAX_BLOB_BYTES, MAX_VERIFIED_BLOB_BATCH_BYTES, MAX_VERIFIED_BLOB_BATCH_ITEMS } from '@classrup/kernel';
import { unseal } from '@classrup/identity';
import { MAX_ENVELOPE_BYTES, verifyEnvelope } from '@classrup/federation';

const decoder = new TextDecoder('utf-8', { fatal: true });
const DATA_CID = /^sha256-[0-9a-f]{64}$/;
const MIME = /^[a-z]+\/[a-z0-9.+-]{1,90}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MANIFEST_TYPE = 'classrup.vault.attachment_manifest/v1';

export interface AttachmentManifestParent {
  readonly type: string;
  readonly id: string;
  readonly revision: number;
  readonly dataCid: string;
  readonly refs: readonly string[];
}
export interface AttachmentManifestBlob {
  readonly ref: string;
  readonly size: number;
  readonly contentType: string;
  readonly privacy: 'P0' | 'P1' | 'P2' | 'P3';
  readonly encrypted: boolean;
  readonly createdAt: string;
}
export interface VerifiedAttachmentManifestMetadata {
  readonly principal: string;
  readonly parents: readonly AttachmentManifestParent[];
  readonly blobs: readonly AttachmentManifestBlob[];
  readonly links: number;
  readonly totalBytes: number;
}

function exactObject(value: unknown, keys: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== keys) {
    throw new Error('Invalid attachment manifest structure');
  }
  return value as Record<string, unknown>;
}
function canonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !TIMESTAMP.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

/**
 * Structural validation ONLY, not a cryptographic verifier or authorization API.
 * This internal parser may be called directly by tests, but production callers
 * must use verifySealedAttachmentManifest to authenticate the signed envelope.
 */
export function validateAttachmentManifestPayload(
  payload: unknown, expectedPrincipal: string,
): VerifiedAttachmentManifestMetadata {
  const source = exactObject(payload, 'blobs,parents,principal');
  if (typeof expectedPrincipal !== 'string' || !expectedPrincipal
    || source.principal !== expectedPrincipal || !Array.isArray(source.parents)
    || !Array.isArray(source.blobs)
    || source.parents.length < 1 || source.parents.length > MAX_VERIFIED_BLOB_BATCH_ITEMS
    || source.blobs.length < 1 || source.blobs.length > MAX_VERIFIED_BLOB_BATCH_ITEMS) {
    throw new Error('Invalid attachment manifest scope');
  }

  const parents: AttachmentManifestParent[] = [];
  const referenced = new Set<string>();
  let links = 0;
  let previousParent = '';
  for (const item of source.parents) {
    const row = exactObject(item, 'dataCid,id,refs,revision,type');
    const { type, id, revision, dataCid, refs } = row;
    if (typeof type !== 'string' || !type || type.length > 256 || /[\u0000-\u001f\u007f]/u.test(type)
      || typeof id !== 'string' || id.length < 1 || id.length > 256 || /[\u0000-\u001f\u007f]/u.test(id)
      || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1
      || typeof dataCid !== 'string' || !DATA_CID.test(dataCid)
      || !Array.isArray(refs) || refs.length < 1
      || refs.length > MAX_VERIFIED_BLOB_BATCH_ITEMS - links) {
      throw new Error('Invalid attachment manifest parent');
    }
    const parentKey = type + '\u0000' + id;
    if (previousParent && parentKey <= previousParent) throw new Error('Duplicate or unsorted attachment parent');
    previousParent = parentKey;
    const ownRefs = new Set<string>();
    const captured: string[] = [];
    for (const ref of refs) {
      if (!isBlobRef(ref) || ownRefs.has(ref)) throw new Error('Invalid attachment parent reference');
      ownRefs.add(ref);
      referenced.add(ref);
      captured.push(ref);
    }
    links += captured.length;
    parents.push(Object.freeze({ type, id, revision, dataCid, refs: Object.freeze(captured) }));
  }

  const blobs: AttachmentManifestBlob[] = [];
  let previousBlob = '';
  let totalBytes = 0;
  for (const item of source.blobs) {
    const blob = exactObject(item, 'contentType,createdAt,encrypted,privacy,ref,size');
    const { ref, size, contentType, privacy, encrypted, createdAt } = blob;
    if (!isBlobRef(ref) || (previousBlob && ref <= previousBlob)
      || typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0 || size > MAX_BLOB_BYTES
      || size > MAX_VERIFIED_BLOB_BATCH_BYTES - totalBytes
      || typeof contentType !== 'string' || !MIME.test(contentType)
      || (privacy !== 'P0' && privacy !== 'P1' && privacy !== 'P2' && privacy !== 'P3')
      || typeof encrypted !== 'boolean' || !canonicalTimestamp(createdAt)) {
      throw new Error('Invalid attachment manifest blob');
    }
    previousBlob = ref;
    totalBytes += size;
    blobs.push(Object.freeze({ ref, size, contentType, privacy, encrypted, createdAt }));
  }
  if (referenced.size !== blobs.length || blobs.some(blob => !referenced.has(blob.ref))) {
    throw new Error('Attachment manifest has missing or unreferenced blobs');
  }
  return Object.freeze({
    principal: expectedPrincipal, parents: Object.freeze(parents), blobs: Object.freeze(blobs),
    links, totalBytes,
  });
}

/**
 * Decrypt a separately versioned signed attachment manifest and validate its
 * canonical bounded metadata. expectedPrincipal MUST come from a trusted
 * unlocked or recovered identity, never from the candidate manifest.
 *
 * This is READ-ONLY. It does not prove the destination's actual parent records
 * or attachment bytes match, perform transport, import, re-encrypt or recover.
 */
export async function verifySealedAttachmentManifest(
  sealed: unknown, passphrase: string, expectedPrincipal: string,
): Promise<VerifiedAttachmentManifestMetadata> {
  const plaintext = await unseal(sealed, passphrase);
  try {
    if (plaintext.byteLength > MAX_ENVELOPE_BYTES) throw new Error('Attachment manifest too large');
    const parsed: unknown = JSON.parse(decoder.decode(plaintext));
    const envelope = await verifyEnvelope(parsed, {
      expectedType: MANIFEST_TYPE, expectedAuthor: expectedPrincipal,
    });
    return validateAttachmentManifestPayload(envelope.payload, expectedPrincipal);
  } finally {
    plaintext.fill(0);
  }
}

// Read the intrinsic view size rather than an own or subclass byteLength getter.
const typedArrayByteLength = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype), 'byteLength',
)!.get!;

/** Internal bounded copy shared by admission and the destination write preparation. */
export function copyAttachmentBatchMember(source: unknown, size: number, error: string): Uint8Array {
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_BLOB_BYTES
    || !(source instanceof Uint8Array) || typedArrayByteLength.call(source) !== size) {
    throw new Error(error);
  }
  const copy = new Uint8Array(size);
  try {
    copy.set(source);
    return copy;
  } catch (cause) {
    copy.fill(0);
    throw cause;
  }
}

/**
 * Authenticate a signed, encrypted manifest and verify a *complete* received
 * byte batch against its canonical, sorted content-addressed blob entries.
 *
 * Input bytes correspond to manifest.blobs order. They are copied before the
 * first digest await, bounded by the existing per-blob/aggregate limits, and
 * zeroed on every exit. No input byte view is returned or persisted.
 *
 * This is a read-only transport-admission prerequisite, NOT attachment restore:
 * callers must also reconcile actual destination canonical owners, authenticate
 * their permissions and recheck those links within the eventual atomic write.
 * The manifest signature protects metadata; this function does not encrypt an
 * external transport channel or prove a destination storage encryption key.
 */
export async function verifySealedAttachmentBlobBatch(
  sealed: unknown,
  passphrase: string,
  expectedPrincipal: string,
  byteSet: readonly Uint8Array[],
): Promise<VerifiedAttachmentManifestMetadata> {
  const manifest = await verifySealedAttachmentManifest(sealed, passphrase, expectedPrincipal);
  if (!Array.isArray(byteSet)) throw new Error('Attachment transport batch invalid');
  const count = byteSet.length;
  if (!Number.isSafeInteger(count) || count !== manifest.blobs.length
    || count > MAX_VERIFIED_BLOB_BATCH_ITEMS) {
    throw new Error('Attachment transport batch invalid');
  }

  // Do not use a caller-controlled array iterator or retain original byte views
  // beyond this synchronous snapshot. Limit the allocation BEFORE copying.
  const detached: Uint8Array[] = [];
  try {
    let total = 0;
    for (let i = 0; i < count; i += 1) {
      const source = byteSet[i];
      const expected = manifest.blobs[i]!;
      if (expected.size > MAX_VERIFIED_BLOB_BATCH_BYTES - total) {
        throw new Error('Attachment transport byte size mismatch');
      }
      detached.push(copyAttachmentBatchMember(source, expected.size, 'Attachment transport byte size mismatch'));
      total += expected.size;
    }
    if (total !== manifest.totalBytes) {
      throw new Error('Attachment transport aggregate size mismatch');
    }
    for (let i = 0; i < count; i += 1) {
      if (await blobRefOf(detached[i]!) !== manifest.blobs[i]!.ref) {
        throw new Error('Attachment transport content-address mismatch');
      }
    }
    return manifest;
  } finally {
    for (const bytes of detached) bytes.fill(0);
  }
}
