/**
 * F16.S02.M03 signatures: Ed25519 (@noble/curves, audited) over domain-separated canonical JSON.
 * Message bytes = utf8("classrup:v1:" + context + "\n" + JCS(payload)).
 * The context string binds a signature to one purpose so it cannot be replayed elsewhere.
 * A valid signature evidences an assertion by the key holder, not that the asserted fact is true.
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { canonicalize, toJsonSafe, unauthenticated, validationError } from '@classrup/kernel';
import { fromBase64Url, toBase64Url, utf8 } from './encoding';

export interface SigningKeyPair {
  readonly publicKey: Uint8Array;
  readonly secretKey: Uint8Array;
}

const KEY_ID_PREFIX = 'ed25519:';
const CONTEXT_RE = /^[a-z][a-z0-9_.-]{1,63}$/;

export function generateSigningKeyPair(): SigningKeyPair {
  const secretKey = ed25519.utils.randomSecretKey();
  return { secretKey, publicKey: ed25519.getPublicKey(secretKey) };
}

export function signingKeyPairFromSecret(secretKey: Uint8Array): SigningKeyPair {
  return { secretKey, publicKey: ed25519.getPublicKey(secretKey) };
}

/** Public key id, `ed25519:<base64url(pub)>`. Self-certifying; usable as a portable identity key. */
export const keyIdOf = (publicKey: Uint8Array): string => KEY_ID_PREFIX + toBase64Url(publicKey);

export function publicKeyFromKeyId(keyId: string): Uint8Array {
  if (!keyId.startsWith(KEY_ID_PREFIX)) throw validationError('SIGNATURE.KEY_ID_INVALID', 'unsupported key id');
  const pub = fromBase64Url(keyId.slice(KEY_ID_PREFIX.length));
  if (pub.length !== 32) throw validationError('SIGNATURE.KEY_ID_INVALID', 'invalid key length');
  return pub;
}

export function signingMessage(context: string, payload: unknown): Uint8Array {
  if (!CONTEXT_RE.test(context)) throw new TypeError(`invalid signature context: ${context}`);
  return utf8(`classrup:v1:${context}\n${canonicalize(toJsonSafe(payload))}`);
}

export function signDetached(secretKey: Uint8Array, context: string, payload: unknown): string {
  return toBase64Url(ed25519.sign(signingMessage(context, payload), secretKey));
}

export function verifyDetached(publicKey: Uint8Array, context: string, payload: unknown, signature: string): boolean {
  try {
    const sig = fromBase64Url(signature);
    if (sig.length !== 64) return false;
    return ed25519.verify(sig, signingMessage(context, payload), publicKey);
  } catch {
    return false;
  }
}

export interface SignedEnvelope<T> {
  readonly v: 1;
  readonly ctx: string;
  readonly signer: string;
  readonly payload: T;
  readonly sig: string;
}

export function signEnvelope<T>(keys: SigningKeyPair, context: string, payload: T): SignedEnvelope<T> {
  return { v: 1, ctx: context, signer: keyIdOf(keys.publicKey), payload, sig: signDetached(keys.secretKey, context, payload) };
}

export function verifyEnvelope(env: SignedEnvelope<unknown>, expectedContext: string, expectedSigner?: string): boolean {
  if (env?.v !== 1 || env.ctx !== expectedContext) return false;
  if (expectedSigner !== undefined && env.signer !== expectedSigner) return false;
  let pub: Uint8Array;
  try {
    pub = publicKeyFromKeyId(env.signer);
  } catch {
    return false;
  }
  return verifyDetached(pub, env.ctx, env.payload, env.sig);
}

export function assertEnvelope<T>(env: SignedEnvelope<T>, expectedContext: string, expectedSigner?: string): T {
  if (!verifyEnvelope(env, expectedContext, expectedSigner)) {
    throw unauthenticated('SIGNATURE.INVALID', 'signature verification failed', { context: expectedContext });
  }
  return env.payload;
}
