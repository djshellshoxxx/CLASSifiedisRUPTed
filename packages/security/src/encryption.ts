/**
 * F16.S02 encryption for private messages and sealed data (F08 relies on this).
 * Construction: X25519 ECDH with an ephemeral key -> HKDF-SHA256 -> XChaCha20-Poly1305,
 * all from audited @noble libraries. Relays only ever see ciphertext and routing metadata.
 * Multi-recipient: content is encrypted once under a random key that is sealed per recipient.
 */
import { x25519 } from '@noble/curves/ed25519.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { unauthenticated, validationError } from '@classrup/kernel';
import { concatBytes, fromBase64Url, randomBytes, toBase64Url, utf8 } from './encoding';

export interface BoxKeyPair {
  readonly publicKey: Uint8Array;
  readonly secretKey: Uint8Array;
}

export function generateBoxKeyPair(): BoxKeyPair {
  const secretKey = x25519.utils.randomSecretKey();
  return { secretKey, publicKey: x25519.getPublicKey(secretKey) };
}

export interface Sealed {
  readonly v: 1;
  /** Ephemeral X25519 public key. */
  readonly epk: string;
  readonly nonce: string;
  readonly ct: string;
}

const SEAL_INFO = utf8('classrup:seal:v1');

function deriveKey(shared: Uint8Array, epk: Uint8Array, rpk: Uint8Array): Uint8Array {
  return hkdf(sha256, shared, concatBytes(epk, rpk), SEAL_INFO, 32);
}

export function seal(recipientPublicKey: Uint8Array, plaintext: Uint8Array, aad: Uint8Array = new Uint8Array()): Sealed {
  if (recipientPublicKey.length !== 32) throw validationError('CRYPTO.KEY_INVALID', 'invalid recipient key');
  const eph = generateBoxKeyPair();
  const key = deriveKey(x25519.getSharedSecret(eph.secretKey, recipientPublicKey), eph.publicKey, recipientPublicKey);
  const nonce = randomBytes(24);
  const ct = xchacha20poly1305(key, nonce, aad).encrypt(plaintext);
  return { v: 1, epk: toBase64Url(eph.publicKey), nonce: toBase64Url(nonce), ct: toBase64Url(ct) };
}

export function open(recipient: BoxKeyPair, sealed: Sealed, aad: Uint8Array = new Uint8Array()): Uint8Array {
  try {
    if (sealed.v !== 1) throw new Error('version');
    const epk = fromBase64Url(sealed.epk);
    const key = deriveKey(x25519.getSharedSecret(recipient.secretKey, epk), epk, recipient.publicKey);
    return xchacha20poly1305(key, fromBase64Url(sealed.nonce), aad).decrypt(fromBase64Url(sealed.ct));
  } catch {
    throw unauthenticated('CRYPTO.DECRYPT_FAILED', 'ciphertext could not be authenticated');
  }
}

export interface MultiRecipientCiphertext {
  readonly v: 1;
  readonly nonce: string;
  readonly ct: string;
  /** recipient key id -> sealed content key. */
  readonly keys: Readonly<Record<string, Sealed>>;
}

export function encryptForRecipients(
  recipients: Readonly<Record<string, Uint8Array>>,
  plaintext: Uint8Array,
  aad: Uint8Array = new Uint8Array(),
): MultiRecipientCiphertext {
  const ids = Object.keys(recipients);
  if (ids.length === 0) throw validationError('CRYPTO.NO_RECIPIENTS', 'at least one recipient required');
  const contentKey = randomBytes(32);
  const nonce = randomBytes(24);
  const ct = xchacha20poly1305(contentKey, nonce, aad).encrypt(plaintext);
  const keys: Record<string, Sealed> = {};
  for (const id of ids) keys[id] = seal(recipients[id] as Uint8Array, contentKey, aad);
  return { v: 1, nonce: toBase64Url(nonce), ct: toBase64Url(ct), keys };
}

export function decryptForRecipient(recipientId: string, recipient: BoxKeyPair, msg: MultiRecipientCiphertext, aad: Uint8Array = new Uint8Array()): Uint8Array {
  const sealedKey = msg.keys[recipientId];
  if (!sealedKey) throw unauthenticated('CRYPTO.NOT_A_RECIPIENT', 'no key for recipient');
  const contentKey = open(recipient, sealedKey, aad);
  try {
    return xchacha20poly1305(contentKey, fromBase64Url(msg.nonce), aad).decrypt(fromBase64Url(msg.ct));
  } catch {
    throw unauthenticated('CRYPTO.DECRYPT_FAILED', 'ciphertext could not be authenticated');
  }
}

export const boxKeyId = (publicKey: Uint8Array): string => `x25519:${toBase64Url(publicKey)}`;

export function boxPublicKeyFromId(id: string): Uint8Array {
  if (!id.startsWith('x25519:')) throw validationError('CRYPTO.KEY_INVALID', 'unsupported box key id');
  const k = fromBase64Url(id.slice(7));
  if (k.length !== 32) throw validationError('CRYPTO.KEY_INVALID', 'invalid key length');
  return k;
}
