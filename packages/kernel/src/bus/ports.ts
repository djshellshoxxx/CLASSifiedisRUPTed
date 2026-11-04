// Ports the command bus depends on (ADR-0002, ADR-0016 two-layer authorization, CTR-CAP-001, CTR-FLG-001).
import type { Clock } from '../clock/clock.ts';
import { COMMON_ERRORS, type CommonCode } from '../errors/codes.ts';
import { appError, messageKeyFor, type AppError } from '../errors/app-error.ts';
import type { Result } from '../errors/result.ts';
import type { EnvelopeActorKind } from '../events/envelope.ts';

export type ActorKind = EnvelopeActorKind;
export type Actor = { readonly kind: 'anonymous' } | { readonly kind: ActorKind; readonly id: string; readonly roles: readonly string[] };
export const ANONYMOUS: Actor = Object.freeze({ kind: 'anonymous' });

export function actorKey(actor: Actor): string {
  return actor.kind === 'anonymous' ? 'anonymous' : actor.id;
}

export function envelopeActor(actor: Actor): { readonly kind: ActorKind; readonly id: string } {
  return actor.kind === 'anonymous' ? { kind: 'system', id: 'anonymous' } : { kind: actor.kind, id: actor.id };
}

export interface ResourceRef {
  readonly type: string;
  readonly id: string;
}

export type Origin = 'local' | 'remote';

export interface AuthzContext {
  readonly tenantId: string;
  readonly operation: string;
  readonly kind: 'command' | 'query' | 'endpoint';
  readonly origin: Origin;
  readonly now: number;
}

export type AuthzDecision = { readonly allow: true } | { readonly allow: false; readonly code: string; readonly params?: Readonly<Record<string, unknown>> };

/** authorize(actor, capability, resource?, context) → allow | deny(code); pure, default deny (CAP-2). */
export interface AuthzPort {
  authorize(actor: Actor, capability: string, resource: ResourceRef | undefined, context: AuthzContext): AuthzDecision | Promise<AuthzDecision>;
}

export interface FlagQuery {
  readonly tenantId: string;
  readonly module: string;
  readonly actor: Actor;
  readonly operation: string;
}

/** Module flag evaluation (F15.S04.M02, CTR-FLG-001); false ⇒ FEATURE_DISABLED. */
export interface FlagPort {
  isEnabled(q: FlagQuery): boolean | Promise<boolean>;
}

export interface RateQuery {
  readonly tenantId: string;
  readonly actor: Actor;
  readonly operation: string;
  readonly capability: string;
  readonly kind: 'command' | 'query';
  readonly now: number;
  /** Caller network prefix (`192.0.2.0/24`, `2001:db8:1::/48`) from the relay HTTP adapter; absent in the vault. */
  readonly network?: string;
}

export type RateDecision = { readonly allowed: true } | { readonly allowed: false; readonly retryAfterMs: number };

/** Per-relay hosting policy or local limits (ADR-0016 §8). */
export interface RateLimitPort {
  check(q: RateQuery): RateDecision | Promise<RateDecision>;
}

export interface AuditEntry {
  readonly at: string;
  readonly tenantId: string;
  readonly actor: { readonly kind: string; readonly id: string };
  readonly capability: string;
  readonly operation: string;
  readonly resource?: ResourceRef;
  readonly decision: 'allow' | 'deny';
  readonly outcome: 'ok' | 'replayed' | 'error' | 'denied';
  readonly code?: string;
  readonly correlationId: string;
}

/** Authorization audit (CAP-7): actor, capability, resource ID and decision, never payload content. */
export interface AuditPort {
  record(entry: AuditEntry): void | Promise<void>;
}

export interface Session {
  readonly actor: Actor;
  readonly tenantId: string;
}

/** Resolves a relay access token (CAP-10); undefined token ⇒ anonymous session for the relay tenant. */
export interface SessionPort {
  resolve(token: string | undefined): Promise<Result<Session, AppError>>;
}

/** Turns a deny code into an AppError; unknown module codes default to 403. */
export function errorFromCode(code: string, params?: Readonly<Record<string, unknown>>): AppError {
  if (code in COMMON_ERRORS) return appError(code as CommonCode, params ? { params } : undefined);
  return { code, status: 403, retryable: false, messageKey: messageKeyFor(code), params: params ?? {} };
}

export const allowAllAuthz: AuthzPort = { authorize: () => ({ allow: true }) };
export const denyAllAuthz: AuthzPort = { authorize: () => ({ allow: false, code: 'FORBIDDEN' }) };

/** Capability → roles table; `*` grants any authenticated actor, `anonymous` grants everyone. */
export type RoleTable = Readonly<Record<string, readonly string[]>>;

export function createRoleTableAuthz(table: RoleTable): AuthzPort {
  return {
    authorize: (actor, capability) => {
      const roles = table[capability];
      if (!roles) return { allow: false, code: 'FORBIDDEN' };
      if (roles.includes('anonymous')) return { allow: true };
      if (actor.kind === 'anonymous') return { allow: false, code: 'UNAUTHENTICATED' };
      if (roles.includes('*') || actor.roles.some((r) => roles.includes(r))) return { allow: true };
      return { allow: false, code: 'FORBIDDEN' };
    },
  };
}

export const allFlagsOn: FlagPort = { isEnabled: () => true };

export function createStaticFlags(disabled: Iterable<string>): FlagPort & { set(module: string, enabled: boolean): void } {
  const off = new Set(disabled);
  return {
    isEnabled: (q) => !off.has(q.module) && !off.has(q.module.slice(0, 3)),
    set: (module, enabled) => void (enabled ? off.delete(module) : off.add(module)),
  };
}

export const unlimitedRate: RateLimitPort = { check: () => ({ allowed: true }) };

/** Bucket of a rate query: the actor, or the caller's network prefix for anonymous callers when known. */
export function rateKey(q: RateQuery): string {
  const who = q.actor.kind === 'anonymous' && q.network !== undefined ? `net:${q.network}` : actorKey(q.actor);
  return `${q.tenantId}\u0001${who}\u0001${q.operation}`;
}

/**
 * Fixed-window limiter per (tenant, actor or anonymous network prefix, operation); in-process state only.
 * Windows that have ended are dropped once more than maxKeys buckets exist.
 */
export function createFixedWindowRateLimiter(opts: { readonly limit: number; readonly windowMs: number; readonly clock: Clock; readonly maxKeys?: number }): RateLimitPort {
  const windows = new Map<string, { start: number; count: number }>();
  const maxKeys = opts.maxKeys ?? 10_000;
  const sweep = (now: number): void => {
    for (const [key, w] of windows) if (now - w.start >= opts.windowMs) windows.delete(key);
  };
  return {
    check: (q) => {
      const key = rateKey(q);
      const now = opts.clock.now();
      if (windows.size >= maxKeys) sweep(now);
      const w = windows.get(key);
      if (!w || now - w.start >= opts.windowMs) {
        windows.set(key, { start: now, count: 1 });
        return { allowed: true };
      }
      if (w.count < opts.limit) {
        w.count += 1;
        return { allowed: true };
      }
      return { allowed: false, retryAfterMs: w.start + opts.windowMs - now };
    },
  };
}

export const noopAudit: AuditPort = { record: () => undefined };

export function createMemoryAudit(): AuditPort & { readonly entries: AuditEntry[] } {
  const entries: AuditEntry[] = [];
  return { entries, record: (e) => void entries.push(e) };
}

export type Ports = Readonly<Record<string, unknown>>;

/** Typed access to an injected adapter port; a missing port is a composition error. */
export function requirePort<T>(ports: Ports, name: string): T {
  const p = ports[name];
  if (p === undefined) throw new Error(`port ${name} is not wired`);
  return p as T;
}
