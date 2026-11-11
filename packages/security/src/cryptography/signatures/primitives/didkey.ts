// did:key for Ed25519 public keys: "did:key:z" + base58btc(multicodec ed25519-pub 0xed 0x01 || key).
import { err, ok, type AppError, type Result } from '@classrup/kernel';
import { envelopePrimitiveErrors } from '../errors.ts';
import { concatBytes, fromBase58btc, toBase58btc } from './encoding.ts';
import { ED25519_PUBLIC_KEY_BYTES, isValidEd25519PublicKey } from './ed25519.ts';

const PREFIX = 'did:key:z';
const ED25519_MULTICODEC = Uint8Array.of(0xed, 0x01);
const MAX_DID_LENGTH = 64;

export function didKeyFromPublicKey(publicKey: Uint8Array): string {
  if (!(publicKey instanceof Uint8Array) || publicKey.length !== ED25519_PUBLIC_KEY_BYTES) throw new RangeError('didKeyFromPublicKey: Ed25519 public key must be 32 bytes');
  return PREFIX + toBase58btc(concatBytes(ED25519_MULTICODEC, publicKey));
}

function unsupported(reason: string): AppError {
  return envelopePrimitiveErrors.make('FEDERATION_DID_UNSUPPORTED', { params: { reason } });
}

/** Decodes a did:key; only multibase z, multicodec 0xed 0x01 and a valid 32-byte Ed25519 key are accepted. */
export function publicKeyFromDidKey(did: unknown): Result<Uint8Array, AppError> {
  if (typeof did !== 'string' || did.length > MAX_DID_LENGTH || !did.startsWith(PREFIX)) return err(unsupported('not_did_key'));
  const bytes = fromBase58btc(did.slice(PREFIX.length));
  if (!bytes) return err(unsupported('multibase'));
  if (bytes.length < 2 || bytes[0] !== 0xed || bytes[1] !== 0x01) return err(unsupported('multicodec'));
  const key = bytes.slice(2);
  if (key.length !== ED25519_PUBLIC_KEY_BYTES) return err(unsupported('length'));
  if (!isValidEd25519PublicKey(key)) return err(unsupported('point'));
  // Canonical form only: re-encoding must give the same text (no leading-zero or alternate encodings).
  if (didKeyFromPublicKey(key) !== did) return err(unsupported('not_canonical'));
  return ok(key);
}
