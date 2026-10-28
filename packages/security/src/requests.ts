/**
 * Signed HTTP request scheme used by PWA clients and relays (device-key authentication).
 * The signature covers method, path+query, body hash, timestamp, nonce and session id.
 */
import { sha256B64 } from './hash';
import type { SigningKeyPair } from './signatures';
import { keyIdOf, publicKeyFromKeyId, signDetached, verifyDetached } from './signatures';
import { randomToken } from './hash';

export interface RequestSignatureInput {
  readonly method: string;
  readonly path: string;
  readonly body: string;
  readonly timestamp: number;
  readonly nonce: string;
  readonly sessionId: string;
}

export interface RequestSignatureHeaders {
  'x-classrup-key': string;
  'x-classrup-ts': string;
  'x-classrup-nonce': string;
  'x-classrup-session': string;
  'x-classrup-sig': string;
}

const CTX = 'http-request';

const payloadOf = (r: RequestSignatureInput) => ({
  m: r.method.toUpperCase(),
  p: r.path,
  b: sha256B64(r.body),
  t: r.timestamp,
  n: r.nonce,
  s: r.sessionId,
});

export function signRequest(keys: SigningKeyPair, r: Omit<RequestSignatureInput, 'nonce'> & { nonce?: string }): RequestSignatureHeaders {
  const full: RequestSignatureInput = { ...r, nonce: r.nonce ?? randomToken(18) };
  return {
    'x-classrup-key': keyIdOf(keys.publicKey),
    'x-classrup-ts': String(full.timestamp),
    'x-classrup-nonce': full.nonce,
    'x-classrup-session': full.sessionId,
    'x-classrup-sig': signDetached(keys.secretKey, CTX, payloadOf(full)),
  };
}

export function verifyRequestSignature(keyId: string, signature: string, r: RequestSignatureInput): boolean {
  try {
    return verifyDetached(publicKeyFromKeyId(keyId), CTX, payloadOf(r), signature);
  } catch {
    return false;
  }
}
