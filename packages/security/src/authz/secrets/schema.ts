// Secret manifest, names and error codes of F16.S01.M02 (secrets handling for relay processes and CI).
import { defineErrors, z } from '@classrup/kernel';

export const MODULE_ID = 'F16.S01.M02';

/** Every relay secret variable is RELAY_SECRET_<NAME>; files use RELAY_SECRET_<NAME>_FILE. */
export const SECRET_PREFIX = 'RELAY_SECRET_';
export const SECRET_NAME_RE = /^RELAY_SECRET_[A-Z0-9_]+$/;
/** Manifest entry names are the part after the prefix. */
export const MANIFEST_NAME_RE = /^[A-Z][A-Z0-9_]*[A-Z0-9]$/;
export const REDACTED = '[REDACTED]';

export const MAX_SECRET_FILE_BYTES = 4096;
export const ALLOWED_FILE_MODES: readonly number[] = [0o400, 0o600];
export const OVERLAP_DEFAULT_MS = 120_000;
export const OVERLAP_MAX_MS = 300_000;
export const REWRAP_BATCH_SIZE = 1000;
export const REWRAP_TARGET_MS = 30 * 24 * 60 * 60 * 1000;
export const FILE_READ_ATTEMPTS = 3;
export const FILE_READ_SPACING_MS = 100;

export const secretErrors = defineErrors({
  SECURITY_SECRET_MISSING: { status: 500, retryable: false },
  SECURITY_SECRET_AMBIGUOUS: { status: 500, retryable: false },
  SECURITY_SECRET_PERMISSIONS: { status: 500, retryable: false },
  SECURITY_SECRET_WEAK: { status: 500, retryable: false },
  SECURITY_SECRET_LEAK_DETECTED: { status: 500, retryable: false },
});
export type SecretErrorCode = keyof typeof secretErrors.codes;

/** comparison: verified by equality (pepper, passwords); signing: private signing keys; data_wrapping: wraps stored per-object keys. */
export const SECRET_KINDS = ['comparison', 'signing', 'data_wrapping'] as const;
export type SecretKind = (typeof SECRET_KINDS)[number];

/** base64url: binary key material encoded as unpadded base64url; text: a password-like string. */
export const SECRET_ENCODINGS = ['base64url', 'text'] as const;
export type SecretEncoding = (typeof SECRET_ENCODINGS)[number];

export const manifestEntrySchema = z.strictObject({
  name: z.string().regex(MANIFEST_NAME_RE),
  purpose: z.string().min(1).max(200),
  kind: z.enum(SECRET_KINDS),
  encoding: z.enum(SECRET_ENCODINGS),
  /** Bytes after decoding for base64url secrets; Unicode code points for text secrets. */
  minLength: z.int().min(1).max(4096),
  rotationDays: z.int().min(1).max(3650),
  /** Versioned secrets are loaded as RELAY_SECRET_<NAME>_V<n> (data-key versions). */
  versioned: z.boolean(),
  required: z.boolean(),
});
export type ManifestEntry = z.output<typeof manifestEntrySchema>;

export const manifestSchema = z.array(manifestEntrySchema).min(1).max(64);
export type SecretManifest = readonly ManifestEntry[];

/**
 * The relay secret manifest. The relay signing key is absent on purpose: F15.S02.M01 owns its key file and only
 * applies checkSecretFile and the Secret wrapper from this module.
 */
export const RELAY_SECRET_MANIFEST: SecretManifest = Object.freeze([
  { name: 'DATA_KEY', purpose: 'wraps per-object data keys of stored relay objects', kind: 'data_wrapping', encoding: 'base64url', minLength: 32, rotationDays: 365, versioned: true, required: true },
  { name: 'AUDIT_PEPPER', purpose: 'HMAC pepper pseudonymizing audit actors (F16.S01.M01)', kind: 'comparison', encoding: 'base64url', minLength: 32, rotationDays: 365, versioned: false, required: true },
  { name: 'VAPID_PRIVATE_KEY', purpose: 'Web Push VAPID signing key', kind: 'signing', encoding: 'base64url', minLength: 32, rotationDays: 365, versioned: false, required: true },
  { name: 'SMTP_PASSWORD', purpose: 'SMTP relay credential for operator mail', kind: 'comparison', encoding: 'text', minLength: 16, rotationDays: 90, versioned: false, required: true },
] satisfies ManifestEntry[]);

export type SecretSource = 'env' | 'file';
export type SecretStatus = 'loaded' | 'missing' | 'permission-error' | 'ambiguous' | 'weak';

/** Full variable name of a manifest entry, with the version suffix for versioned secrets. */
export function variableName(entry: Pick<ManifestEntry, 'name'>, version?: number): string {
  return version === undefined ? `${SECRET_PREFIX}${entry.name}` : `${SECRET_PREFIX}${entry.name}_V${version}`;
}

/** Display name used in logs and reports, e.g. data_key v2 (never a value). */
export function displayName(entry: Pick<ManifestEntry, 'name'>, version?: number): string {
  const base = entry.name.toLowerCase();
  return version === undefined ? base : `${base} v${version}`;
}
