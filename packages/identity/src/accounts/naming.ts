/** F07.S01.M01 pseudonym rules: normalisation, reserved words, confusable-script guard, tenant-scoped lookup. */
import { validationError } from '@classrup/kernel';
import type { IdentityEnv } from '../env';
import type { AccountRecord } from '../records';

export const PSEUDONYM_MIN = 3;
export const PSEUDONYM_MAX = 32;

const ALLOWED = /^[\p{L}\p{N}_.-]+$/u;
const SEPARATORS = /[_.-]/g;
const RESERVED = new Set([
  'admin', 'administrator', 'moderator', 'mod', 'system', 'support', 'root', 'staff', 'official', 'classrup', 'anonymous', 'null',
  'undefined', 'security', 'help', 'service', 'operator', 'relay', 'platform',
]);
/** Latin mixed with Cyrillic or Greek is the classic homoglyph impersonation vector. */
const LATIN = /\p{Script=Latin}/u;
const LOOKALIKE_SCRIPTS = /[\p{Script=Cyrillic}\p{Script=Greek}]/u;
const ERASED_PREFIX = /^deleted[_.-]/;

export interface NormalizedPseudonym {
  /** NFKC form shown to users. */
  readonly display: string;
  /** Case-folded unique key. */
  readonly key: string;
}

const invalid = (reason: string) => validationError('IDENTITY.PSEUDONYM_INVALID', 'pseudonym not allowed', { reason });

export function normalizePseudonym(raw: string): NormalizedPseudonym {
  const display = raw.normalize('NFKC');
  const length = [...display].length;
  if (length < PSEUDONYM_MIN || length > PSEUDONYM_MAX) throw invalid('length');
  if (!ALLOWED.test(display)) throw invalid('characters');
  if (LATIN.test(display) && LOOKALIKE_SCRIPTS.test(display)) throw invalid('mixed_script');
  const key = display.toLowerCase();
  if (RESERVED.has(key.replace(SEPARATORS, '')) || ERASED_PREFIX.test(key)) {
    throw validationError('IDENTITY.PSEUDONYM_RESERVED', 'pseudonym is reserved');
  }
  return { display, key };
}

export const pseudonymIndexId = (tenantId: string, key: string): string => `${tenantId}/${key}`;

/** Returns undefined for any invalid or unknown pseudonym: lookups never reveal why. */
export function lookupAccountByPseudonym(env: IdentityEnv, tenantId: string, pseudonym: string): AccountRecord | undefined {
  let key: string;
  try {
    key = normalizePseudonym(pseudonym).key;
  } catch {
    return undefined;
  }
  const entry = env.stores.pseudonyms.get(pseudonymIndexId(tenantId, key));
  return entry ? env.stores.accounts.get(entry.accountId) : undefined;
}
