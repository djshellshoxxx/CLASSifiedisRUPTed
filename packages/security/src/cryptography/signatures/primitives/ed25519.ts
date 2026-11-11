// Strict Ed25519 (RFC 8032), SHA-2 digests and content identifiers over @noble/curves and @noble/hashes 2.4.0.
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 as nobleSha256, sha512 as nobleSha512 } from '@noble/hashes/sha2.js';
import { toBase64url } from './encoding.ts';

export const ED25519_PUBLIC_KEY_BYTES = 32;
export const ED25519_SEED_BYTES = 32;
export const ED25519_SIGNATURE_BYTES = 64;

export function sha256(bytes: Uint8Array): Uint8Array {
  return nobleSha256(bytes);
}

export function sha512(bytes: Uint8Array): Uint8Array {
  return nobleSha512(bytes);
}

/** CTR-ID-001 ID-3 / CTR-FED-001 FED-7 content id form: "sha256-" + unpadded base64url of SHA-256. */
export function sha256Cid(bytes: Uint8Array): string {
  return `sha256-${toBase64url(sha256(bytes))}`;
}

export const CID_RE = /^sha256-[A-Za-z0-9_-]{43}$/;

/** Key ID: SHA-256 thumbprint of the raw public key, unpadded base64url (43 characters). */
export function keyIdOf(publicKey: Uint8Array): string {
  return toBase64url(sha256(publicKey));
}

export const KEY_ID_RE = /^[A-Za-z0-9_-]{43}$/;

export function ed25519PublicKeyOf(seed: Uint8Array): Uint8Array {
  return ed25519.getPublicKey(seed);
}

/** Deterministic Ed25519 signature (RFC 8032 §5.1.6) by the 32-byte seed. */
export function ed25519Sign(message: Uint8Array, seed: Uint8Array): Uint8Array {
  return ed25519.sign(message, seed);
}

/**
 * True when the key decodes canonically (y < p, RFC 8032 §5.1.3) to a point that is not of small order.
 * Small-order keys are refused so a signature can never verify for several messages at once.
 */
export function isValidEd25519PublicKey(publicKey: Uint8Array): boolean {
  if (!(publicKey instanceof Uint8Array) || publicKey.length !== ED25519_PUBLIC_KEY_BYTES) return false;
  try {
    return !ed25519.Point.fromBytes(publicKey, false).isSmallOrder();
  } catch {
    return false;
  }
}

/**
 * Strict verification: canonical point encodings for A and R, S < L (no malleability), small-order public
 * keys refused, and the cofactored equation (noble zip215: false). Never throws.
 */
export function ed25519VerifyStrict(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  if (!(signature instanceof Uint8Array) || signature.length !== ED25519_SIGNATURE_BYTES) return false;
  if (!(message instanceof Uint8Array) || !isValidEd25519PublicKey(publicKey)) return false;
  try {
    return ed25519.verify(signature, message, publicKey, { zip215: false });
  } catch {
    return false;
  }
}
