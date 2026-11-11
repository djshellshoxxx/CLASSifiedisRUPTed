// Validation rules V01–V06 of F16.S01.M02 as pure functions. Errors carry names, paths and counts only, never values.
import { codePointLength, err, ok, type AppError, type Result } from '@classrup/kernel';
import { ALLOWED_FILE_MODES, MAX_SECRET_FILE_BYTES, secretErrors, type ManifestEntry } from './schema.ts';
import type { SecretFileStat } from './ports.ts';
import { decodeToken } from './compare.ts';
import { base64urlToBytes } from './encoding.ts';

/** V01: a required secret is present and non-empty. */
export function checkPresent(name: string, value: string | undefined): Result<string, AppError> {
  if (value === undefined || value.length === 0) return err(secretErrors.make('SECURITY_SECRET_MISSING', { params: { name } }));
  return ok(value);
}

/**
 * V01: every data-key version that still wraps at least one object is loaded. The error names the first missing
 * version and how many objects depend on it.
 */
export function checkDataKeyVersions(loaded: ReadonlySet<number>, objectsByVersion: ReadonlyMap<number, number>, name = 'DATA_KEY'): Result<void, AppError> {
  const missing = [...objectsByVersion.entries()].filter(([v, n]) => n > 0 && !loaded.has(v)).sort((a, b) => a[0] - b[0]);
  const first = missing[0];
  if (first) return err(secretErrors.make('SECURITY_SECRET_MISSING', { params: { name, version: first[0], objects: first[1] } }));
  if (loaded.size === 0) return err(secretErrors.make('SECURITY_SECRET_MISSING', { params: { name } }));
  return ok(undefined);
}

/** V02: not both RELAY_SECRET_X and RELAY_SECRET_X_FILE. */
export function checkNotAmbiguous(name: string, envSet: boolean, fileSet: boolean): Result<void, AppError> {
  return envSet && fileSet ? err(secretErrors.make('SECURITY_SECRET_AMBIGUOUS', { params: { name } })) : ok(undefined);
}

/** V03: mode 0400 or 0600, owned by the process user, a regular file and not a symlink, at most 4096 bytes. */
export function checkFileStat(path: string, stat: SecretFileStat, processUid: number): Result<void, AppError> {
  const fail = (problem: string) => err(secretErrors.make('SECURITY_SECRET_PERMISSIONS', { params: { path, problem } }));
  if (stat.isSymbolicLink) return fail('symlink');
  if (!stat.isFile) return fail('not_a_file');
  if (!ALLOWED_FILE_MODES.includes(stat.mode & 0o7777)) return fail('mode');
  if (stat.uid !== processUid) return fail('owner');
  if (stat.size > MAX_SECRET_FILE_BYTES) return fail('size');
  return ok(undefined);
}

/** Decoded secret bytes per the manifest encoding; undefined when malformed. */
export function decodeSecretValue(entry: Pick<ManifestEntry, 'encoding'>, text: string): Uint8Array | undefined {
  if (entry.encoding === 'text') return new TextEncoder().encode(text);
  return base64urlToBytes(text);
}

/** V04: decoded length meets the manifest minimum (32 bytes for keys and the pepper, 16 code points for passwords). */
export function checkStrength(entry: Pick<ManifestEntry, 'encoding' | 'minLength'>, name: string, text: string): Result<Uint8Array, AppError> {
  const weak = () => err(secretErrors.make('SECURITY_SECRET_WEAK', { params: { name, minLength: entry.minLength } }));
  const bytes = decodeSecretValue(entry, text);
  if (!bytes) return weak();
  const length = entry.encoding === 'text' ? codePointLength(text) : bytes.length;
  return length >= entry.minLength ? ok(bytes) : weak();
}

/** V05: a relay access token is exactly 43 base64url characters (256 bits) before hashing; UNAUTHENTICATED otherwise. */
export const checkTokenFormat = decodeToken;

/** V06: the CI scanner found no unallowed secret pattern. */
export function checkNoLeaks(findings: readonly { readonly ruleId: string; readonly path: string; readonly line: number }[]): Result<void, AppError> {
  const first = findings[0];
  if (!first) return ok(undefined);
  return err(secretErrors.make('SECURITY_SECRET_LEAK_DETECTED', { params: { count: findings.length, rule: first.ruleId, path: first.path, line: first.line } }));
}
