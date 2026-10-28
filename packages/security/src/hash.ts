/** F16.S02 hashing via @noble/hashes (audited). */
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { canonicalize, toJsonSafe } from '@classrup/kernel';
import { randomBytes, timingSafeEqual, toBase64Url, toHex, utf8 } from './encoding';

export const sha256Bytes = (data: Uint8Array | string): Uint8Array => sha256(typeof data === 'string' ? utf8(data) : data);
export const sha256Hex = (data: Uint8Array | string): string => toHex(sha256Bytes(data));
export const sha256B64 = (data: Uint8Array | string): string => toBase64Url(sha256Bytes(data));

/** Content hash of a JSON value (canonical form), e.g. for evidence integrity and dedup. */
export const contentHash = (value: unknown): string => `sha256:${sha256B64(canonicalize(toJsonSafe(value)))}`;

export const hmacSha256 = (key: Uint8Array, data: Uint8Array | string): Uint8Array => hmac(sha256, key, typeof data === 'string' ? utf8(data) : data);

/** 256-bit random bearer token (base64url). Store only `hashToken(token)`. */
export const randomToken = (bytes = 32): string => toBase64Url(randomBytes(bytes));
export const hashToken = (token: string): string => sha256B64(`classrup:token:v1:${token}`);
export const tokenMatches = (token: string, storedHash: string): boolean => timingSafeEqual(utf8(hashToken(token)), utf8(storedHash));
