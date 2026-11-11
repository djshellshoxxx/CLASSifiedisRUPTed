// Constant-time comparison (T02) and relay access token hashing (T05): only SHA-256 hashes of 256-bit tokens are stored.
import { appError, err, ok, type AppError, type RandomFill, type Result } from '@classrup/kernel';
import { sha256 } from '@noble/hashes/sha2.js';
import { base64urlToBytes, bytesToBase64url, toHex } from './encoding.ts';

export const TOKEN_BYTES = 32;
export const TOKEN_LENGTH = 43;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/**
 * Compares two byte arrays in time independent of their content. Only a length mismatch returns early,
 * because lengths of tokens and MACs are public.
 */
export function equalConstantTime(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Equality of two hex digests in constant time (stored token hash against a computed one). */
export function equalHexConstantTime(a: string, b: string): boolean {
  const enc = new TextEncoder();
  return equalConstantTime(enc.encode(a), enc.encode(b));
}

/** Decodes a relay access token: exactly 43 canonical base64url characters (256 bits), V05. */
export function decodeToken(token: unknown): Result<Uint8Array, AppError> {
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) return err(appError('UNAUTHENTICATED'));
  const bytes = base64urlToBytes(token);
  if (!bytes || bytes.length !== TOKEN_BYTES) return err(appError('UNAUTHENTICATED'));
  return ok(bytes);
}

/**
 * Hex SHA-256 of the decoded token bytes. Malformed tokens fail with a generic UNAUTHENTICATED that never says
 * which character was wrong. SHA-256 suffices because the input has full 256-bit entropy.
 */
export function hashToken(token: unknown): Result<string, AppError> {
  const bytes = decodeToken(token);
  return bytes.ok ? ok(toHex(sha256(bytes.value))) : bytes;
}

/** Checks a presented token against the stored hash in constant time. */
export function verifyToken(token: unknown, storedHash: string): boolean {
  const h = hashToken(token);
  return h.ok && equalHexConstantTime(h.value, storedHash);
}

/** A fresh 256-bit token from the injected random source (kernel webCryptoRandom in production). */
export function generateToken(random: RandomFill): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  random(bytes);
  return bytesToBase64url(bytes);
}
