/** Infrastructure ports injected into every module. Implementations live in platform/security/apps. */
import type { Actor, Permission } from './actor';
import { disabled } from './errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFields = Record<string, unknown>;

export interface Logger {
  log(level: LogLevel, msg: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
}

/** Field names whose values are always replaced before logging (privacy/secret hygiene). */
export const REDACTED_KEYS: ReadonlySet<string> = new Set([
  'password',
  'secret',
  'token',
  'privateKey',
  'secretKey',
  'seed',
  'recoveryCode',
  'authorization',
  'cookie',
  'body',
  'plaintext',
  'exactLocation',
  'address',
  'lat',
  'lng',
  'latitude',
  'longitude',
  'email',
  'phone',
]);

export function redact(fields: LogFields | undefined): LogFields {
  if (!fields) return {};
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (REDACTED_KEYS.has(k)) out[k] = '[REDACTED]';
    else if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Error)) out[k] = redact(v as LogFields);
    else if (v instanceof Error) out[k] = { name: v.name, message: v.message };
    else out[k] = typeof v === 'bigint' ? v.toString() : v;
  }
  return out;
}

export interface MemoryLogEntry {
  level: LogLevel;
  msg: string;
  fields: LogFields;
}

export class MemoryLogger implements Logger {
  constructor(
    readonly entries: MemoryLogEntry[] = [],
    private readonly base: LogFields = {},
  ) {}
  log(level: LogLevel, msg: string, fields?: LogFields): void {
    this.entries.push({ level, msg, fields: redact({ ...this.base, ...fields }) });
  }
  child(fields: LogFields): Logger {
    return new MemoryLogger(this.entries, { ...this.base, ...fields });
  }
}

export const nullLogger: Logger = { log: () => undefined, child: () => nullLogger };

/** Port for F15.S04 feature flags. */
export interface FeatureFlags {
  isEnabled(flag: string, tenantId: string): boolean;
}

export const allFlagsEnabled: FeatureFlags = { isEnabled: () => true };

export function staticFlags(disabledFlags: Iterable<string>): FeatureFlags {
  const off = new Set(disabledFlags);
  return { isEnabled: (flag) => !off.has(flag) };
}

export function requireFeature(flags: FeatureFlags, flag: string, tenantId: string): void {
  if (!flags.isEnabled(flag, tenantId)) throw disabled('FEATURE.DISABLED', 'feature disabled', { flag });
}

/** Resource attributes the authorizer may consult. Keep minimal: ids only, never content. */
export interface ResourceRef {
  readonly type: string;
  readonly id?: string;
  readonly ownerId?: string;
  readonly tenantId?: string;
  readonly participantIds?: readonly string[];
}

/** Port for F16.S01.M01 authorization. `authorize` throws AUTHZ.FORBIDDEN / AUTH.UNAUTHENTICATED. */
export interface Authorizer {
  can(actor: Actor, permission: Permission, resource?: ResourceRef): boolean;
  authorize(actor: Actor, permission: Permission, resource?: ResourceRef): void;
}

/** Permissive authorizer for unit tests that do not exercise authorization. */
export const allowAll: Authorizer = { can: () => true, authorize: () => undefined };

/** Port for metrics (F15.S03.M01). */
export interface Metrics {
  increment(name: string, value?: number, tags?: Record<string, string>): void;
  observe(name: string, value: number, tags?: Record<string, string>): void;
}

export const nullMetrics: Metrics = { increment: () => undefined, observe: () => undefined };
