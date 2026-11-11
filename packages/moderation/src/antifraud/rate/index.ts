// F12.S03.M03 (PS-099) Rate limiting. In-process RateLimitPort for the kernel command bus (N18), GCRA and token
// bucket per capability class, keyed by salted HMAC hashes (no raw IP or actor key is ever stored or logged).
// Counters live in process memory (vault or relay); relays are never authoritative for the vault (ADR-0016).
import {
  appError, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, defineSubscriber, err, ok, truncateIp, z,
  type AppError, type Clock, type Logger, type MetricsRegistry, type RateDecision, type RateLimitPort, type RateQuery, type Result,
} from '@classrup/kernel';
import { gcraConsume, gcraIsFull, gcraPeek, tokenConsume, tokenPeek, tokensAreFull, type GcraOutcome, type RateParams, type TokenOutcome, type TokenState } from './engine.ts';

export const RATE_MODULE = 'F12.S03.M03';
export const rateErrors = defineErrors({ RATE_POLICY_FAIL_MODE_LOCKED: { status: 422, retryable: false } });

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const CLOSED_WINDOW_MS = 30_000;
const PENALTY_FACTOR = 0.25;
const HEX64 = /^[0-9a-f]{64}$/;
const CLASS_RE = /^[a-z][a-z0-9_]{0,30}(\.[a-z][a-z0-9_]{0,30}){1,3}$/;

export type RateScope = 'actor' | 'ip_prefix' | 'tenant' | 'local';
export type RateAlgorithm = 'gcra' | 'token_bucket';
export type FailMode = 'open' | 'closed';

/** Classes that always fail closed (V03). */
export const LOCKED_CLASSES: ReadonlySet<string> = new Set(['relay.access', 'report.receive', 'key.register']);

export interface RatePolicyView {
  readonly capabilityClass: string;
  readonly algorithm: RateAlgorithm;
  readonly ratePerMinute: number;
  readonly burst: number;
  readonly prefixMultiplier: number;
  readonly failMode: FailMode;
}

const p = (capabilityClass: string, algorithm: RateAlgorithm, ratePerMinute: number, burst: number, prefixMultiplier: number, failMode: FailMode): RatePolicyView =>
  ({ capabilityClass, algorithm, ratePerMinute, burst, prefixMultiplier, failMode });

/** Built-in classes and their default policy (threats T01 and T03 of the spec). */
export const BUILTIN_POLICIES: Readonly<Record<string, RatePolicyView>> = Object.freeze({
  'write.listing': p('write.listing', 'gcra', 6, 10, 5, 'open'),
  'write.offer': p('write.offer', 'gcra', 12, 20, 5, 'open'),
  'write.default': p('write.default', 'gcra', 30, 60, 5, 'open'),
  'read.search': p('read.search', 'token_bucket', 60, 60, 2, 'open'),
  'read.default': p('read.default', 'token_bucket', 120, 120, 5, 'open'),
  'relay.access': p('relay.access', 'gcra', 5, 5, 2, 'closed'),
  'report.receive': p('report.receive', 'gcra', 5, 5, 2, 'closed'),
  'key.register': p('key.register', 'gcra', 5, 5, 2, 'closed'),
});

/** Maps a bus capability to a policy class; unknown commands are write.default, unknown queries read.default. */
export function defaultClassOf(capability: string, kind: 'command' | 'query'): string {
  if (capability.startsWith('platform.access_token.') || capability.startsWith('relay.access.')) return 'relay.access';
  if (capability.startsWith('moderation.report.receive')) return 'report.receive';
  if (capability.startsWith('identity.key.register')) return 'key.register';
  if (kind === 'query') return capability.endsWith('.search') ? 'read.search' : 'read.default';
  if (capability.startsWith('bazaar.listing.')) return 'write.listing';
  if (capability.startsWith('bazaar.offer.')) return 'write.offer';
  return 'write.default';
}

function fallbackPolicy(capabilityClass: string): RatePolicyView {
  const builtin = BUILTIN_POLICIES[capabilityClass];
  if (builtin) return builtin;
  const base = capabilityClass.startsWith('read.') ? BUILTIN_POLICIES['read.default'] : BUILTIN_POLICIES['write.default'];
  return { ...(base as RatePolicyView), capabilityClass };
}

/** Validates the bounded ranges and invariants of a policy (V01 to V03); shared by the command and imports. */
export function validatePolicy(
  input: { capabilityClass: string; algorithm: RateAlgorithm; ratePerMinute: number; burst: number; prefixMultiplier?: number | undefined; failMode?: FailMode | undefined },
  isRegisteredClass: (c: string) => boolean = () => false,
): Result<RatePolicyView, AppError> {
  const { capabilityClass, algorithm, ratePerMinute, burst } = input;
  const prefixMultiplier = input.prefixMultiplier ?? BUILTIN_POLICIES[capabilityClass]?.prefixMultiplier ?? 5;
  const ranges = Number.isInteger(ratePerMinute) && ratePerMinute >= 1 && ratePerMinute <= 6000
    && Number.isInteger(burst) && burst >= 1 && burst <= 1000
    && Number.isInteger(prefixMultiplier) && prefixMultiplier >= 1 && prefixMultiplier <= 20;
  if (!ranges) return err(appError('VALIDATION_FAILED'));
  if (algorithm === 'gcra' && burst > ratePerMinute * 5) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'burst', code: 'EXCEEDS_RATE_TIMES_5' }] }));
  if (!CLASS_RE.test(capabilityClass) || !(capabilityClass in BUILTIN_POLICIES || isRegisteredClass(capabilityClass))) {
    return err(appError('VALIDATION_FAILED', { fields: [{ path: 'capabilityClass', code: 'UNKNOWN_CLASS' }] }));
  }
  const locked = LOCKED_CLASSES.has(capabilityClass);
  if (locked && input.failMode !== undefined && input.failMode !== 'closed') return err(rateErrors.make('RATE_POLICY_FAIL_MODE_LOCKED'));
  const failMode: FailMode = locked ? 'closed' : (input.failMode ?? BUILTIN_POLICIES[capabilityClass]?.failMode ?? 'open');
  return ok({ capabilityClass, algorithm, ratePerMinute, burst, prefixMultiplier, failMode });
}

// ---------------------------------------------------------------------------------------------- records and events

export const ratePolicyDataSchema = z.strictObject({
  capabilityClass: z.string().min(3).max(100),
  algorithm: z.enum(['gcra', 'token_bucket']),
  ratePerMinute: z.int().min(1).max(6000),
  burst: z.int().min(1).max(1000),
  prefixMultiplier: z.int().min(1).max(20),
  failMode: z.enum(['open', 'closed']),
  updatedAt: z.string(),
});
export type RatePolicyData = z.output<typeof ratePolicyDataSchema>;
/** classrup.moderation.ratepolicy/v1: one record per (tenant, capabilityClass). Revision lives on the record. */
export const ratePolicyRepo = defineRepo({ type: 'moderation.ratepolicy', schema: ratePolicyDataSchema, indexes: { class: (d) => d.capabilityClass } });

export const rateExceededPayload = z.strictObject({
  actorKeyHash: z.string().regex(HEX64).optional(),
  capabilityClass: z.string(),
  scope: z.enum(['actor', 'ip_prefix', 'tenant', 'local']),
  deniedCount: z.int().min(1),
  windowMs: z.int().min(1),
  observedAt: z.string(),
});
export type RateExceededPayload = z.output<typeof rateExceededPayload>;
export const rateExceededEvent = defineEvent('moderation.rate.exceeded', 1, 'P2', rateExceededPayload);

// Consumed events (producers: F12.S02.M02 mod_spam and F12.S03.M04). Local views: only the fields this module reads.
const spamDetectedView = defineEvent('moderation.spam.detected', 1, 'P2', z.object({
  subjectKeyHash: z.string(), score: z.number().optional(),
  throttle: z.object({ capability: z.string().optional(), windowMs: z.number().optional(), ttlMs: z.number() }).optional(),
}));
const limitChangedView = defineEvent('moderation.limit.changed', 1, 'P2', z.object({ subjectKey: z.string() }));

// ---------------------------------------------------------------------------------------------- limiter

export interface RateExceededNotice extends RateExceededPayload { readonly tenantId: string }

/** Counter state of one bucket (the RateBucket row without the hash fields), times in monotonic ms. */
export interface BucketState {
  readonly keyHash: string;
  readonly tenantId: string;
  readonly capabilityClass: string;
  readonly scope: RateScope;
  readonly algorithm: RateAlgorithm;
  readonly tat?: number;
  readonly token?: TokenState;
  readonly updatedWall: number;
  readonly day: number;
  readonly params: RateParams;
}

/** The counter store; in-memory by default. A throwing store triggers the documented degraded mode. */
export interface CounterStore {
  get(key: string): BucketState | undefined;
  set(key: string, state: BucketState): void;
  delete(key: string): void;
  entries(): Iterable<readonly [string, BucketState]>;
  readonly size: number;
}

export function createMemoryCounterStore(): CounterStore {
  const m = new Map<string, BucketState>();
  return { get: (k) => m.get(k), set: (k, s) => void m.set(k, s), delete: (k) => void m.delete(k), entries: () => m.entries(), get size() { return m.size; } };
}

export interface RateOptions {
  readonly clock: Clock;
  /** HMAC-SHA-256 hex (64 chars) of `message` under `salt`; cryptography is supplied by the composition root. */
  readonly keyedHash: (salt: string, message: string) => string;
  /** Salt of a UTC epoch day; the root generates it randomly and must destroy it 24 h after its day ends. */
  readonly salt: (epochDay: number) => string;
  readonly destroySalt?: (epochDay: number) => void;
  /** `relay` (default): actor, IP prefix and tenant scopes. `vault`: a single local scope for UX throttles. */
  readonly mode?: 'relay' | 'vault';
  readonly classOf?: (capability: string, kind: 'command' | 'query') => string;
  /** Tenant-wide cap per class and minute (default 2000). */
  readonly tenantCapPerMinute?: number;
  /** Effective-rate multiplier of an account (for example from F12.S03.M04 tiers), 0.25..4, cached per key. */
  readonly accountMultiplier?: (tenantId: string, actorKey: string) => number;
  /** Receives rate.exceeded notices, at most one per key and class per minute. */
  readonly onExceeded?: (notice: RateExceededNotice) => void;
  readonly store?: CounterStore;
  readonly logger?: Logger;
  readonly metrics?: MetricsRegistry;
  /** Monotonic millisecond source; default derives one from the injected clock, ignoring backward steps. */
  readonly monotonic?: () => number;
}

export interface ConsumeKey {
  readonly tenantId: string;
  readonly capabilityClass: string;
  readonly actorKey?: string;
  /** Raw IP literal or CIDR prefix; it is reduced to /24 (IPv4) or /48 (IPv6) and hashed, never stored. */
  readonly network?: string;
}

export interface ConsumeResult {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfterMs: number;
  readonly resetAt: string;
  readonly scope?: RateScope;
}

export interface BucketStatus { readonly limit: number; readonly remaining: number; readonly resetAt: string; readonly penaltyUntil?: string }

/** RateBucket rows (classrup.moderation.ratebucket/v1) for operational snapshots; never exported. */
export interface RateBucketRow {
  readonly keyHash: string;
  readonly tenantId: string;
  readonly scope: RateScope;
  readonly capabilityClass: string;
  readonly algorithm: RateAlgorithm;
  readonly tat?: number;
  readonly tokens?: number;
  readonly penaltyFactor: number;
  readonly penaltyUntil?: string;
  readonly updatedAt: string;
}

export interface RateLimiter extends RateLimitPort {
  check(q: RateQuery): RateDecision;
  consume(key: ConsumeKey, cost?: number): ConsumeResult;
  status(key: ConsumeKey): BucketStatus;
  loadPolicies(tenantId: string, policies: readonly RatePolicyView[]): void;
  applyPolicy(tenantId: string, policy: RatePolicyView): void;
  policyFor(tenantId: string, capabilityClass: string): RatePolicyView;
  applyPenalty(input: { tenantId: string; actorKey: string; ttlMs: number }): string | undefined;
  invalidateAccount(tenantId: string, actorKey?: string): void;
  resetBucket(tenantId: string, capabilityClass: string, keyHash: string): boolean;
  evictIdle(): number;
  flushExceeded(): number;
  snapshot(): RateBucketRow[];
  restore(rows: readonly RateBucketRow[]): number;
  bucketCount(): number;
}

/** Reduces an IP literal or CIDR to its /24 or /48 prefix; undefined when it is not an IP. */
export function normalizePrefix(network: string | undefined): string | undefined {
  if (!network) return undefined;
  const base = network.includes('/') ? network.slice(0, network.indexOf('/')) : network;
  return truncateIp(base);
}

interface Plan {
  readonly key: string;
  readonly scope: RateScope;
  readonly policy: RatePolicyView;
  readonly params: RateParams;
  readonly keyHash: string;
  readonly prior: BucketState | undefined;
  readonly next: BucketState;
  readonly allowed: boolean;
  readonly retryAfterMs: number;
  readonly remaining: number;
  readonly fullAt: number;
}

interface ExceedWindow { start: number; count: number; tenantId: string; capabilityClass: string; scope: RateScope; actorKeyHash?: string; prefix?: string }

export function createRateLimiter(opts: RateOptions): RateLimiter {
  const store = opts.store ?? createMemoryCounterStore();
  const mode = opts.mode ?? 'relay';
  const classOf = opts.classOf ?? defaultClassOf;
  const tenantCap = opts.tenantCapPerMinute ?? 2000;
  const policies = new Map<string, RatePolicyView>();
  const penalties = new Map<string, number>();
  const multipliers = new Map<string, number>();
  const fallback = new Map<string, BucketState>();
  const closedUntil = new Map<string, number>();
  const exceeded = new Map<string, ExceedWindow>();
  const decisions = opts.metrics?.counter({ name: 'classrup_moderation_rate_decisions_total', help: 'Rate decisions by outcome.', labels: ['outcome'] });
  let lastWall = opts.clock.now();
  let mono = lastWall;
  let saltDay: number | undefined;
  let saltValue = '';

  const monoNow = (): number => {
    if (opts.monotonic) return opts.monotonic();
    const w = opts.clock.now();
    if (w > lastWall) mono += w - lastWall;
    lastWall = w;
    return mono;
  };
  const wallOf = (monoMs: number, monoNowMs: number): string => new Date(opts.clock.now() + Math.max(0, monoMs - monoNowMs)).toISOString();

  function currentSalt(): { day: number; salt: string } {
    const day = Math.floor(opts.clock.now() / DAY_MS);
    if (saltDay === undefined || day > saltDay) {
      if (saltDay !== undefined) {
        // Rotation: hashes of the previous day can never match again, so state keyed by them is dropped and the salt destroyed.
        opts.destroySalt?.(saltDay);
        for (const [k] of store.entries()) store.delete(k);
        penalties.clear();
        multipliers.clear();
        fallback.clear();
      }
      saltValue = opts.salt(day);
      saltDay = day;
    }
    return { day: saltDay, salt: saltValue };
  }
  function hash(scope: RateScope, key: string): string {
    const h = opts.keyedHash(currentSalt().salt, `${scope}\u0001${key}`);
    if (!HEX64.test(h)) throw new Error('keyedHash must return 64 lowercase hex characters');
    return h;
  }

  const policyFor = (tenantId: string, capabilityClass: string): RatePolicyView => policies.get(`${tenantId}\u0001${capabilityClass}`) ?? fallbackPolicy(capabilityClass);

  function multiplierOf(tenantId: string, actorKey: string, actorHash: string): number {
    if (!opts.accountMultiplier) return 1;
    const cacheKey = `${tenantId}\u0001${actorHash}`;
    const cached = multipliers.get(cacheKey);
    if (cached !== undefined) return cached;
    const raw = opts.accountMultiplier(tenantId, actorKey);
    const v = Number.isFinite(raw) ? Math.min(4, Math.max(0.25, raw)) : 1;
    multipliers.set(cacheKey, v);
    return v;
  }

  function penaltyOf(tenantId: string, actorHash: string | undefined, capabilityClass: string, wall: number): { factor: number; until?: number } {
    if (actorHash === undefined || !capabilityClass.startsWith('write.')) return { factor: 1 };
    const until = penalties.get(`${tenantId}\u0001${actorHash}`);
    return until !== undefined && until > wall ? { factor: PENALTY_FACTOR, until } : { factor: 1 };
  }

  function scaled(base: RatePolicyView, rateMul: number, burstMul: number): RateParams {
    return { ratePerMinute: base.ratePerMinute * rateMul, burst: Math.max(1, Math.floor(base.burst * burstMul)) };
  }

  interface Target { readonly scope: RateScope; readonly keyHash: string; readonly params: RateParams; readonly algorithm: RateAlgorithm }

  function targets(k: ConsumeKey, policy: RatePolicyView, wall: number): Target[] {
    const out: Target[] = [];
    const prefix = normalizePrefix(k.network);
    if (mode === 'vault') {
      const h = hash('local', k.actorKey ?? 'local');
      const pen = penaltyOf(k.tenantId, h, k.capabilityClass, wall);
      out.push({ scope: 'local', keyHash: h, params: scaled(policy, pen.factor, pen.factor), algorithm: policy.algorithm });
      return out;
    }
    if (k.actorKey !== undefined) {
      const h = hash('actor', k.actorKey);
      const pen = penaltyOf(k.tenantId, h, k.capabilityClass, wall);
      const m = multiplierOf(k.tenantId, k.actorKey, h);
      out.push({ scope: 'actor', keyHash: h, params: scaled(policy, m * pen.factor, m * pen.factor), algorithm: policy.algorithm });
    }
    // Anonymous callers are keyed by network prefix only; without a known network they share one bucket.
    if (prefix !== undefined || k.actorKey === undefined) {
      const mul = policy.prefixMultiplier;
      out.push({ scope: 'ip_prefix', keyHash: hash('ip_prefix', prefix ?? 'unknown'), params: scaled(policy, mul, mul), algorithm: policy.algorithm });
    }
    out.push({ scope: 'tenant', keyHash: hash('tenant', 'all'), params: { ratePerMinute: tenantCap, burst: tenantCap }, algorithm: 'token_bucket' });
    return out;
  }

  function evaluate(t: Target, k: ConsumeKey, now: number, wall: number, cost: number, day: number): Plan {
    const key = `${k.tenantId}\u0001${k.capabilityClass}\u0001${t.keyHash}`;
    const found = store.get(key);
    const prior = found && found.algorithm === t.algorithm && found.scope === t.scope ? found : undefined;
    const policy = policyFor(k.tenantId, k.capabilityClass);
    const base = { keyHash: t.keyHash, tenantId: k.tenantId, capabilityClass: k.capabilityClass, scope: t.scope, algorithm: t.algorithm, updatedWall: wall, day, params: t.params };
    if (t.algorithm === 'gcra') {
      const r: GcraOutcome = gcraConsume(prior?.tat, now, t.params, cost);
      const next: BucketState = { ...base, tat: r.tat };
      return { key, scope: t.scope, policy, params: t.params, keyHash: t.keyHash, prior, next, allowed: r.allowed, retryAfterMs: r.allowed ? 0 : r.retryAfterMs, remaining: r.remaining, fullAt: r.fullAt };
    }
    const r: TokenOutcome = tokenConsume(prior?.token, now, t.params, cost);
    const next: BucketState = { ...base, token: r.state };
    return { key, scope: t.scope, policy, params: t.params, keyHash: t.keyHash, prior, next, allowed: r.allowed, retryAfterMs: r.allowed ? 0 : r.retryAfterMs, remaining: r.remaining, fullAt: r.fullAt };
  }

  function noteExceeded(k: ConsumeKey, plan: Plan, wall: number): void {
    const scope = plan.scope;
    const mapKey = `${k.tenantId}\u0001${k.capabilityClass}\u0001${plan.keyHash}`;
    const w = exceeded.get(mapKey);
    if (w && wall - w.start >= MINUTE_MS) { emitWindow(w); exceeded.delete(mapKey); }
    const cur = exceeded.get(mapKey);
    if (cur) { cur.count += 1; return; }
    const prefix = normalizePrefix(k.network);
    exceeded.set(mapKey, { start: wall, count: 1, tenantId: k.tenantId, capabilityClass: k.capabilityClass, scope, ...(scope === 'actor' ? { actorKeyHash: plan.keyHash } : {}), ...(prefix ? { prefix } : {}) });
  }

  function emitWindow(w: ExceedWindow): void {
    const payload: RateExceededPayload = { ...(w.actorKeyHash ? { actorKeyHash: w.actorKeyHash } : {}), capabilityClass: w.capabilityClass, scope: w.scope, deniedCount: w.count, windowMs: MINUTE_MS, observedAt: new Date(w.start + MINUTE_MS).toISOString() };
    opts.logger?.warn('rate.exceeded', { capabilityClass: w.capabilityClass, scope: w.scope, count: w.count, ...(w.prefix ? { prefix: w.prefix } : {}) });
    opts.onExceeded?.({ tenantId: w.tenantId, ...rateExceededPayload.parse(payload) });
  }

  const resultOf = (allowed: boolean, limit: number, remaining: number, retryAfterMs: number, resetAt: string, scope?: RateScope): ConsumeResult =>
    ({ allowed, limit, remaining, retryAfterMs, resetAt, ...(scope ? { scope } : {}) });

  function degraded(k: ConsumeKey, policy: RatePolicyView, cost: number, now: number, wall: number): ConsumeResult {
    const classKey = `${k.tenantId}\u0001${k.capabilityClass}`;
    const resetAt = new Date(wall + CLOSED_WINDOW_MS).toISOString();
    if (policy.failMode === 'closed') {
      const until = closedUntil.get(classKey);
      const deadline = until !== undefined && until > wall ? until : wall + CLOSED_WINDOW_MS;
      closedUntil.set(classKey, deadline);
      return resultOf(false, 0, 0, deadline - wall, resetAt);
    }
    // Fail open: a local in-memory limit of half the normal rate.
    const half: RateParams = { ratePerMinute: policy.ratePerMinute / 2, burst: Math.max(1, Math.floor(policy.burst / 2)) };
    let who = 'all';
    try { who = hash(k.actorKey !== undefined ? 'actor' : 'ip_prefix', k.actorKey ?? normalizePrefix(k.network) ?? 'unknown'); } catch { /* shared bucket */ }
    const fk = `${classKey}\u0001${who}`;
    const prior = fallback.get(fk);
    const base = { keyHash: who, tenantId: k.tenantId, capabilityClass: k.capabilityClass, scope: 'local' as RateScope, algorithm: policy.algorithm, updatedWall: wall, day: saltDay ?? 0, params: half };
    if (policy.algorithm === 'gcra') {
      const r = gcraConsume(prior?.tat, now, half, cost);
      fallback.set(fk, { ...base, tat: r.tat });
      return resultOf(r.allowed, half.burst, r.remaining, r.allowed ? 0 : r.retryAfterMs, wallOf(r.fullAt, now), 'local');
    }
    const r = tokenConsume(prior?.token, now, half, cost);
    fallback.set(fk, { ...base, token: r.state });
    return resultOf(r.allowed, half.burst, r.remaining, r.allowed ? 0 : r.retryAfterMs, wallOf(r.fullAt, now), 'local');
  }

  function consume(k: ConsumeKey, cost = 1): ConsumeResult {
    const wall = opts.clock.now();
    const invalid = typeof k.tenantId !== 'string' || k.tenantId === '' || typeof k.capabilityClass !== 'string' || !CLASS_RE.test(k.capabilityClass)
      || !Number.isInteger(cost) || cost < 1 || cost > 1000 || (k.actorKey !== undefined && (typeof k.actorKey !== 'string' || k.actorKey === ''));
    if (invalid) { decisions?.inc({ outcome: 'denied' }); return resultOf(false, 0, 0, 1000, new Date(wall + 1000).toISOString()); }
    const policy = policyFor(k.tenantId, k.capabilityClass);
    const now = monoNow();
    const closed = closedUntil.get(`${k.tenantId}\u0001${k.capabilityClass}`);
    if (policy.failMode === 'closed' && closed !== undefined && closed > wall) {
      decisions?.inc({ outcome: 'denied' });
      return resultOf(false, 0, 0, closed - wall, new Date(closed).toISOString());
    }
    let result: ConsumeResult;
    try {
      const day = currentSalt().day;
      const plans = targets(k, policy, wall).map((t) => evaluate(t, k, now, wall, cost, day));
      const denied = plans.filter((x) => !x.allowed);
      if (denied.length > 0) {
        const worst = denied.reduce((a, b) => (b.retryAfterMs > a.retryAfterMs ? b : a));
        // A denied request spends nothing in any scope; the throttle record is keyed by the denying scope.
        noteExceeded(k, worst, wall);
        result = resultOf(false, worst.params.burst, 0, worst.retryAfterMs, wallOf(worst.fullAt, now), worst.scope);
      } else {
        for (const x of plans) store.set(x.key, x.next);
        const tight = plans.reduce((a, b) => (b.remaining < a.remaining ? b : a));
        result = resultOf(true, tight.params.burst, tight.remaining, 0, wallOf(tight.fullAt, now), tight.scope);
      }
      closedUntil.delete(`${k.tenantId}\u0001${k.capabilityClass}`);
    } catch (e) {
      opts.logger?.warn('rate.store_unavailable', { capabilityClass: k.capabilityClass, error: e });
      result = degraded(k, policy, cost, now, wall);
    }
    decisions?.inc({ outcome: result.allowed ? 'allowed' : 'denied' });
    return result;
  }

  function keyOf(q: RateQuery): ConsumeKey {
    const capabilityClass = classOf(q.capability, q.kind);
    return { tenantId: q.tenantId, capabilityClass, ...(q.actor.kind === 'anonymous' ? {} : { actorKey: q.actor.id }), ...(q.network === undefined ? {} : { network: q.network }) };
  }

  function check(q: RateQuery): RateDecision {
    try {
      const r = consume(keyOf(q), 1);
      return r.allowed ? { allowed: true } : { allowed: false, retryAfterMs: Math.max(1, r.retryAfterMs) };
    } catch {
      return { allowed: false, retryAfterMs: 1000 };
    }
  }

  function status(k: ConsumeKey): BucketStatus {
    const wall = opts.clock.now();
    const now = monoNow();
    const policy = policyFor(k.tenantId, k.capabilityClass);
    const lim = (limit: number, remaining: number, fullAt: number, penaltyUntil?: number): BucketStatus =>
      ({ limit, remaining, resetAt: wallOf(fullAt, now), ...(penaltyUntil !== undefined ? { penaltyUntil: new Date(penaltyUntil).toISOString() } : {}) });
    try {
      const t = targets(k, policy, wall).find((x) => x.scope === 'actor' || x.scope === 'local') ?? targets(k, policy, wall).find((x) => x.scope === 'ip_prefix');
      if (!t) return lim(policy.burst, policy.burst, now);
      const prior = store.get(`${k.tenantId}\u0001${k.capabilityClass}\u0001${t.keyHash}`);
      const pen = k.actorKey !== undefined ? penaltyOf(k.tenantId, hash(mode === 'vault' ? 'local' : 'actor', k.actorKey), k.capabilityClass, wall) : { factor: 1 };
      const peek = t.algorithm === 'gcra' ? gcraPeek(prior?.tat, now, t.params) : tokenPeek(prior?.token, now, t.params);
      return lim(t.params.burst, peek.remaining, peek.fullAt, pen.until);
    } catch {
      return lim(policy.burst, 0, now);
    }
  }

  const restoredParams = (r: RateBucketRow): RateParams => {
    const pol = policyFor(r.tenantId, r.capabilityClass);
    if (r.scope === 'tenant') return { ratePerMinute: tenantCap, burst: tenantCap };
    const mul = r.scope === 'ip_prefix' ? pol.prefixMultiplier : 1;
    return { ratePerMinute: pol.ratePerMinute * mul, burst: pol.burst * mul };
  };

  return {
    check,
    consume,
    status,
    loadPolicies(tenantId, list) {
      for (const k of [...policies.keys()]) if (k.startsWith(`${tenantId}\u0001`)) policies.delete(k);
      for (const pol of list) policies.set(`${tenantId}\u0001${pol.capabilityClass}`, pol);
    },
    applyPolicy: (tenantId, pol) => void policies.set(`${tenantId}\u0001${pol.capabilityClass}`, pol),
    policyFor,
    applyPenalty({ tenantId, actorKey, ttlMs }) {
      if (!Number.isFinite(ttlMs) || ttlMs <= 0) return undefined;
      const wall = opts.clock.now();
      // Never accumulates: the factor is fixed at 0.25 and the end is capped at one hour from now.
      const until = wall + Math.min(ttlMs, HOUR_MS);
      penalties.set(`${tenantId}\u0001${hash(mode === 'vault' ? 'local' : 'actor', actorKey)}`, until);
      return new Date(until).toISOString();
    },
    invalidateAccount(tenantId, actorKey) {
      if (actorKey === undefined) { multipliers.clear(); return; }
      multipliers.delete(`${tenantId}\u0001${hash('actor', actorKey)}`);
    },
    resetBucket(tenantId, capabilityClass, keyHash) {
      const key = `${tenantId}\u0001${capabilityClass}\u0001${keyHash}`;
      if (!store.get(key)) return false;
      store.delete(key);
      return true;
    },
    evictIdle() {
      const wall = opts.clock.now();
      const now = monoNow();
      let n = 0;
      for (const [k, b] of [...store.entries()]) {
        const full = b.tat !== undefined ? gcraIsFull(b.tat, now) : b.token !== undefined && tokensAreFull(b.token, now, b.params);
        if (full || wall - b.updatedWall >= DAY_MS) { store.delete(k); n += 1; }
      }
      for (const [k, until] of [...penalties.entries()]) if (until <= wall) penalties.delete(k);
      for (const [k, until] of [...closedUntil.entries()]) if (until <= wall) closedUntil.delete(k);
      for (const [k, b] of [...fallback.entries()]) if (wall - b.updatedWall >= MINUTE_MS) fallback.delete(k);
      return n;
    },
    flushExceeded() {
      const wall = opts.clock.now();
      let n = 0;
      for (const [k, w] of [...exceeded.entries()]) {
        if (wall - w.start >= MINUTE_MS) { exceeded.delete(k); emitWindow(w); n += 1; }
      }
      return n;
    },
    snapshot() {
      const wall = opts.clock.now();
      const rows: RateBucketRow[] = [];
      for (const [, b] of store.entries()) {
        const pen = b.scope === 'actor' || b.scope === 'local' ? penaltyOf(b.tenantId, b.keyHash, b.capabilityClass, wall) : { factor: 1 };
        rows.push({
          keyHash: b.keyHash, tenantId: b.tenantId, scope: b.scope, capabilityClass: b.capabilityClass, algorithm: b.algorithm,
          ...(b.tat !== undefined ? { tat: Math.ceil(b.tat) } : {}), ...(b.token ? { tokens: b.token.tokens } : {}),
          penaltyFactor: pen.factor, ...(pen.until !== undefined ? { penaltyUntil: new Date(pen.until).toISOString() } : {}), updatedAt: new Date(b.updatedWall).toISOString(),
        });
      }
      return rows;
    },
    restore(rows) {
      const wall = opts.clock.now();
      const now = monoNow();
      const day = currentSalt().day;
      let n = 0;
      for (const r of rows) {
        if (!HEX64.test(r.keyHash) || (r.tat === undefined) === (r.tokens === undefined) || !CLASS_RE.test(r.capabilityClass)) continue;
        if (wall - Date.parse(r.updatedAt) >= DAY_MS) continue;
        const state: BucketState = { keyHash: r.keyHash, tenantId: r.tenantId, capabilityClass: r.capabilityClass, scope: r.scope, algorithm: r.algorithm, updatedWall: Date.parse(r.updatedAt), day, params: restoredParams(r), ...(r.tat !== undefined ? { tat: r.tat } : {}), ...(r.tokens !== undefined ? { token: { tokens: r.tokens, at: now } } : {}) };
        store.set(`${r.tenantId}\u0001${r.capabilityClass}\u0001${r.keyHash}`, state);
        if (r.penaltyFactor < 1 && r.penaltyUntil !== undefined && r.scope !== 'ip_prefix') {
          const until = Math.min(Date.parse(r.penaltyUntil), wall + HOUR_MS);
          if (until > wall) penalties.set(`${r.tenantId}\u0001${r.keyHash}`, until);
        }
        n += 1;
      }
      return n;
    },
    bucketCount: () => store.size,
  };
}

// ---------------------------------------------------------------------------------------------- definitions

export interface RateDefinitionsOptions {
  readonly limiter: RateLimiter;
  /** Capability-registry lookup for non built-in classes (V02). */
  readonly isRegisteredClass?: (capabilityClass: string) => boolean;
  /** Maps the pseudonymous subjectKeyHash of moderation.spam.detected to the actor key it hashes (relay-side lookup). */
  readonly resolveSubjectKey?: (subjectKeyHash: string) => string | undefined;
}

/** Capability to role mapping for createRoleTableAuthz (relay policy and vault policy of the spec). */
export const RATE_ROLES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'moderation.ratepolicy.set': ['operator', 'principal'],
  'moderation.ratebucket.reset': ['operator'],
  'moderation.ratepolicy.read': ['operator', 'principal'],
  'moderation.ratebucket.read_own': ['anonymous'],
});

const policyItem = (id: string, tenantId: string, revision: number, d: RatePolicyData) => ({ id, tenantId, capabilityClass: d.capabilityClass, algorithm: d.algorithm, ratePerMinute: d.ratePerMinute, burst: d.burst, prefixMultiplier: d.prefixMultiplier, failMode: d.failMode, revision, updatedAt: d.updatedAt });
const viewOf = (d: RatePolicyData): RatePolicyView => ({ capabilityClass: d.capabilityClass, algorithm: d.algorithm, ratePerMinute: d.ratePerMinute, burst: d.burst, prefixMultiplier: d.prefixMultiplier, failMode: d.failMode });

export function rateDefinitions(options: RateDefinitionsOptions) {
  const { limiter } = options;
  const setPolicy = defineCommand({
    name: 'moderation.ratepolicy.set', module: RATE_MODULE, capability: 'moderation.ratepolicy.set', idempotent: true, surface: 'both',
    input: z.strictObject({
      capabilityClass: z.string().min(3).max(100), algorithm: z.enum(['gcra', 'token_bucket']),
      ratePerMinute: z.int().min(1).max(6000), burst: z.int().min(1).max(1000), prefixMultiplier: z.int().min(1).max(20).optional(),
      failMode: z.enum(['open', 'closed']).optional(), expectedRevision: z.int().min(1).optional(),
    }),
    output: z.strictObject({ policyId: z.string(), revision: z.int() }),
    handler(ctx, input) {
      const valid = validatePolicy(input, options.isRegisteredClass);
      if (!valid.ok) return valid;
      const repo = ctx.tx.repo(ratePolicyRepo);
      const page = repo.query({ where: { class: input.capabilityClass }, limit: 1 });
      if (!page.ok) return page;
      const existing = page.value.items[0];
      const expected = input.expectedRevision ?? ctx.expectedRevision;
      const data: RatePolicyData = { ...valid.value, updatedAt: ctx.clock.iso() };
      let saved;
      if (existing) {
        saved = repo.put(existing.id, data, { expectedRevision: expected ?? existing.revision });
      } else {
        if (expected !== undefined) return err(appError('CONFLICT_REVISION'));
        saved = repo.put(ctx.ids.next(), data, { expectedRevision: 0 });
      }
      if (!saved.ok) return saved;
      limiter.applyPolicy(ctx.tenantId, valid.value);
      return ok({ policyId: saved.value.id, revision: saved.value.revision });
    },
  });
  const resetBucket = defineCommand({
    name: 'moderation.ratebucket.reset', module: RATE_MODULE, capability: 'moderation.ratebucket.reset', idempotent: true, surface: 'relay',
    input: z.strictObject({ capabilityClass: z.string().min(3).max(100), keyHash: z.string().regex(HEX64) }),
    output: z.strictObject({ reset: z.literal(true) }),
    handler(ctx, input) {
      return limiter.resetBucket(ctx.tenantId, input.capabilityClass, input.keyHash) ? ok({ reset: true as const }) : err(appError('NOT_FOUND'));
    },
  });
  const listPolicies = defineQuery({
    name: 'moderation.ratepolicy.list', module: RATE_MODULE, capability: 'moderation.ratepolicy.read', surface: 'both',
    input: z.strictObject({ cursor: z.string().max(500).optional(), limit: z.int().min(1).max(100).default(50) }),
    handler(ctx, input) {
      const page = ctx.tx.repo(ratePolicyRepo).query({ limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
      if (!page.ok) return page;
      return ok({ items: page.value.items.map((r) => policyItem(r.id, ctx.tenantId, r.revision, r.data)), ...(page.value.nextCursor ? { nextCursor: page.value.nextCursor } : {}) });
    },
  });
  const ownStatus = defineQuery({
    name: 'moderation.ratebucket.get_status_own', module: RATE_MODULE, capability: 'moderation.ratebucket.read_own', surface: 'both', auth: 'public',
    input: z.strictObject({ capabilityClass: z.string().min(3).max(100) }),
    handler(ctx, input) {
      if (!CLASS_RE.test(input.capabilityClass)) return err(appError('VALIDATION_FAILED'));
      // Only the caller's own key; an anonymous caller's prefix is not visible to the handler, so it sees the class limit.
      const s = limiter.status({ tenantId: ctx.tenantId, capabilityClass: input.capabilityClass, ...(ctx.actor.kind === 'anonymous' ? {} : { actorKey: ctx.actor.id }) });
      return ok(s);
    },
  });
  const spamPenalty = defineSubscriber({
    name: 'moderation.rate_spam_penalty', module: RATE_MODULE, events: [spamDetectedView],
    handler(ctx, env) {
      const throttle = env.payload.throttle;
      if (!throttle) return ok(undefined);
      const actorKey = options.resolveSubjectKey?.(env.payload.subjectKeyHash);
      if (!actorKey) return ok(undefined);
      limiter.applyPenalty({ tenantId: ctx.tenantId, actorKey, ttlMs: throttle.ttlMs });
      return ok(undefined);
    },
  });
  const limitRefresh = defineSubscriber({
    name: 'moderation.rate_limit_refresh', module: RATE_MODULE, events: [limitChangedView],
    handler(ctx, env) {
      limiter.invalidateAccount(ctx.tenantId, env.payload.subjectKey);
      return ok(undefined);
    },
  });
  return { setPolicy, resetBucket, listPolicies, ownStatus, spamPenalty, limitRefresh, all: [setPolicy, resetBucket, listPolicies, ownStatus, spamPenalty, limitRefresh] as const };
}

