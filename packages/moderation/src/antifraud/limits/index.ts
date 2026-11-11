// F12.S03.M04 (PS-098) Account limits. Graduated per-key limits that a relay applies to what it hosts; they exist only per
// relay (ADR-0016 item 3 and 8), are friction and never a ban, and are never reported to other parties.
import {
  appError, boundedString, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, defineSubscriber, err, ok, timestamp, z,
  type AppError, type AuditEntry, type Clock, type ConsumerContext, type Emit, type IdGen, type MetricsRegistry, type ReadScope, type Result, type StoredRecord, type WriteScope,
} from '@classrup/kernel';

export const LIMITS_MODULE = 'F12.S03.M04';
export const limitErrors = defineErrors({ ACCOUNT_LIMIT_REACHED: { status: 429, retryable: false } });

export const LIMIT_KEYS = ['listings_per_day', 'open_offers', 'open_cycle_proposals', 'bids_per_day', 'new_conversations_per_day'] as const;
export type LimitKey = (typeof LIMIT_KEYS)[number];
export type Tier = 'new' | 'established' | 'trusted';
const TIERS: readonly Tier[] = ['new', 'established', 'trusted'];
/** Flow limits count events in a rolling 24 h window; stock limits compare a caller-supplied count. */
export const FLOW_LIMIT_KEYS: ReadonlySet<LimitKey> = new Set<LimitKey>(['listings_per_day', 'bids_per_day', 'new_conversations_per_day']);

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MAX_OVERRIDE_MS = 90 * DAY_MS;

/** Base values per tier and limit key (the published tier table). */
export const TIER_TABLE: Readonly<Record<Tier, Readonly<Record<LimitKey, number>>>> = Object.freeze({
  new: { listings_per_day: 5, open_offers: 10, open_cycle_proposals: 3, bids_per_day: 20, new_conversations_per_day: 20 },
  established: { listings_per_day: 20, open_offers: 50, open_cycle_proposals: 10, bids_per_day: 100, new_conversations_per_day: 60 },
  trusted: { listings_per_day: 100, open_offers: 200, open_cycle_proposals: 25, bids_per_day: 500, new_conversations_per_day: 200 },
});

export interface TierRequirement { readonly minAgeDays: number; readonly minDeals: number }
/** Promotion needs both relay age and completed dealings, so farming one is not enough. */
export interface TierThresholds { readonly established: TierRequirement; readonly trusted: TierRequirement }
export const DEFAULT_THRESHOLDS: TierThresholds = Object.freeze({ established: { minAgeDays: 7, minDeals: 3 }, trusted: { minAgeDays: 90, minDeals: 10 } });

export function computeTier(ageMs: number, deals: number, t: TierThresholds = DEFAULT_THRESHOLDS): Tier {
  const days = ageMs / DAY_MS;
  if (days >= t.trusted.minAgeDays && deals >= t.trusted.minDeals) return 'trusted';
  if (days >= t.established.minAgeDays && deals >= t.established.minDeals) return 'established';
  return 'new';
}

// ---------------------------------------------------------------------------------------------- records

const subjectKeySchema = z.string().startsWith('did:key:').max(128);
export const accountLimitSchema = z.strictObject({
  subjectKey: subjectKeySchema,
  limitKey: z.enum(LIMIT_KEYS),
  tier: z.enum(['new', 'established', 'trusted']),
  baseValue: z.int().min(0).max(10_000),
  riskMultiplier: z.union([z.literal(1), z.literal(0.75), z.literal(0.5)]),
  overrideValue: z.int().min(0).max(10_000).optional(),
  overrideReason: boundedString({ min: 10, max: 500 }).optional(),
  overrideBy: subjectKeySchema.optional(),
  overrideExpiresAt: timestamp().optional(),
  restrictedUntil: timestamp().optional(),
  restrictionActionId: z.string().max(100).optional(),
  effectiveValue: z.int().min(0).max(10_000),
  firstSeenAt: timestamp(),
  completedDeals: z.int().min(0).max(1000),
  updatedAt: timestamp(),
});
export type AccountLimit = z.output<typeof accountLimitSchema>;

const rowKey = (subjectKey: string, limitKey: string): string => `${subjectKey}\u0001${limitKey}`;
const earliest = (d: AccountLimit): string | null => {
  const c = [d.overrideExpiresAt, d.restrictedUntil].filter((x): x is string => x !== undefined).sort();
  return c[0] ?? null;
};
/** classrup.moderation.accountlimit/v1; at most one row per (tenant, subjectKey, limitKey) through the `key` index. */
export const accountLimitRepo = defineRepo({
  type: 'moderation.account_limit', schema: accountLimitSchema,
  indexes: { key: (d) => rowKey(d.subjectKey, d.limitKey), subject: (d) => d.subjectKey, expiry: (d) => earliest(d) },
});

export type LimitCause = 'tier' | 'risk' | 'override' | 'override_expired' | 'policy';
export const limitChangedEvent = defineEvent('moderation.limit.changed', 1, 'P2', z.strictObject({
  accountLimitId: z.string(), subjectKey: subjectKeySchema, limitKey: z.enum(LIMIT_KEYS),
  previousValue: z.int().min(0), effectiveValue: z.int().min(0), cause: z.enum(['tier', 'risk', 'override', 'override_expired', 'policy']),
}));

// Consumed events: local views of the fields this module reads (producers: F12.S03.M01, F09 commerce, F07 identity, F12.S02.M01).
const riskElevatedView = defineEvent('moderation.risk.elevated', 1, 'P3', z.object({ subjectType: z.string(), subjectRef: z.string(), level: z.enum(['low', 'medium', 'high']) }));
const dealCompletedView = defineEvent('commerce.deal.completed', 1, 'P2', z.object({ parties: z.array(z.object({ did: z.string() })).max(50).optional() }));
const accountCreatedView = defineEvent('identity.account.created', 1, 'P0', z.object({ did: z.string() }));
const actionAppliedView = defineEvent('moderation.action.applied', 1, 'P2', z.object({
  actionId: z.string().optional(), kind: z.string(), subjectKey: z.string(), expiresAt: z.string().optional(),
  limitKey: z.string().optional(), limitKeys: z.array(z.string()).max(5).optional(),
}));

// ---------------------------------------------------------------------------------------------- pure math

/** Effective value: restriction 0 while active, the override while active, else max(1, floor(base x multiplier)) unless base is 0. */
export function computeEffective(d: Pick<AccountLimit, 'baseValue' | 'riskMultiplier' | 'overrideValue' | 'overrideExpiresAt' | 'restrictedUntil'>, nowMs: number): number {
  if (d.restrictedUntil !== undefined && Date.parse(d.restrictedUntil) > nowMs) return 0;
  if (d.overrideValue !== undefined && d.overrideExpiresAt !== undefined && Date.parse(d.overrideExpiresAt) > nowMs) return d.overrideValue;
  return d.baseValue === 0 ? 0 : Math.max(1, Math.floor(d.baseValue * d.riskMultiplier));
}

const unitOf = (k: LimitKey): string => (FLOW_LIMIT_KEYS.has(k) ? 'per day' : 'open at once');

function nextTierOf(tier: Tier): Tier | undefined { return TIERS[TIERS.indexOf(tier) + 1]; }

function describe(d: AccountLimit, nowMs: number, thresholds: TierThresholds): { adjustments: Adjustment[]; reasons: string[] } {
  const adjustments: Adjustment[] = [{ kind: 'tier', reason: `tier ${d.tier}: ${d.baseValue} ${unitOf(d.limitKey)}` }];
  if (d.riskMultiplier < 1) adjustments.push({ kind: 'risk', reason: `risk level ${d.riskMultiplier === 0.75 ? 'medium' : 'high'}: base value x ${d.riskMultiplier}, recovers when the risk level falls` });
  if (d.restrictedUntil !== undefined && Date.parse(d.restrictedUntil) > nowMs) adjustments.push({ kind: 'restriction', reason: 'restricted by a moderation action', until: d.restrictedUntil });
  if (d.overrideValue !== undefined && d.overrideExpiresAt !== undefined && Date.parse(d.overrideExpiresAt) > nowMs) {
    adjustments.push({ kind: 'override', reason: d.overrideReason ?? '', value: d.overrideValue, until: d.overrideExpiresAt });
  }
  const next = nextTierOf(d.tier);
  const reasons = adjustments.map((a) => (a.kind === 'tier' && next ? `${a.reason}; becomes ${TIER_TABLE[next][d.limitKey]} after ${thresholds[next === 'trusted' ? 'trusted' : 'established'].minAgeDays} days and ${thresholds[next === 'trusted' ? 'trusted' : 'established'].minDeals} completed deals` : a.reason));
  return { adjustments, reasons };
}

export interface Adjustment { readonly kind: 'tier' | 'risk' | 'override' | 'restriction'; readonly reason: string; readonly value?: number; readonly until?: string }

// ---------------------------------------------------------------------------------------------- flow counter port

export interface FlowConsumeInput { readonly tenantId: string; readonly counter: string; readonly subject: string; readonly limit: number; readonly windowMs: number }
export interface FlowConsumeResult { readonly allowed: boolean; readonly used: number; readonly resetsAt?: string }

/**
 * Atomic window counter for flow limits (and the per-moderator override cap). The root may back it with the F12.S03.M03
 * limiter or a persisted counter; it may throw when its store is down (the fail mode then applies).
 */
export interface FlowCounterPort {
  consume(input: FlowConsumeInput, cost: number): FlowConsumeResult;
  peek?(input: FlowConsumeInput): { readonly used: number; readonly resetsAt?: string };
}

/** Deterministic in-memory rolling-window counter (timestamps of accepted units inside the window). */
export function createRollingWindowCounter(clock: Clock): FlowCounterPort {
  const windows = new Map<string, number[]>();
  const live = (i: FlowConsumeInput): number[] => {
    const k = `${i.tenantId}\u0001${i.counter}\u0001${i.subject}`;
    const cutoff = clock.now() - i.windowMs;
    const kept = (windows.get(k) ?? []).filter((t) => t > cutoff);
    windows.set(k, kept);
    return kept;
  };
  const resetFor = (kept: number[], i: FlowConsumeInput, needFree: number): string | undefined => {
    const at = kept[Math.max(0, needFree - 1)];
    return at === undefined || i.limit === 0 ? undefined : new Date(at + i.windowMs).toISOString();
  };
  return {
    consume(i, cost) {
      const kept = live(i);
      if (kept.length + cost > i.limit) return { allowed: false, used: kept.length, ...optional('resetsAt', resetFor(kept, i, kept.length + cost - i.limit)) };
      const now = clock.now();
      for (let n = 0; n < cost; n++) kept.push(now);
      return { allowed: true, used: kept.length, ...optional('resetsAt', resetFor(kept, i, 1)) };
    },
    peek(i) {
      const kept = live(i);
      return { used: kept.length, ...optional('resetsAt', resetFor(kept, i, 1)) };
    },
  };
}
function optional<K extends string>(k: K, v: string | undefined): Partial<Record<K, string>> { return v === undefined ? {} : ({ [k]: v } as Record<K, string>); }

// ---------------------------------------------------------------------------------------------- shared row operations

export interface LimitsMaintenanceContext { readonly tx: WriteScope; readonly emit: Emit; readonly clock: Clock; readonly ids: IdGen }
type RowContext = LimitsMaintenanceContext;

function withoutUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

function readRow(tx: ReadScope, subjectKey: string, limitKey: LimitKey): StoredRecord<AccountLimit> | undefined {
  const page = tx.repo(accountLimitRepo).query({ where: { key: rowKey(subjectKey, limitKey) }, limit: 1 });
  return page.ok ? page.value.items[0] : undefined;
}
const getRow = (ctx: Pick<RowContext, 'tx'>, subjectKey: string, limitKey: LimitKey) => readRow(ctx.tx, subjectKey, limitKey);

function newRow(subjectKey: string, limitKey: LimitKey, firstSeenAt: string, nowIso: string): AccountLimit {
  const base = TIER_TABLE.new[limitKey];
  return { subjectKey, limitKey, tier: 'new', baseValue: base, riskMultiplier: 1, effectiveValue: base, firstSeenAt, completedDeals: 0, updatedAt: nowIso };
}

/** Creates the five rows of a key when absent (tier new, first seen now, which is also the restore-time default). */
function ensureRows(ctx: RowContext, subjectKey: string): Result<StoredRecord<AccountLimit>[], AppError> {
  const out: StoredRecord<AccountLimit>[] = [];
  const iso = ctx.clock.iso();
  for (const limitKey of LIMIT_KEYS) {
    const found = getRow(ctx, subjectKey, limitKey);
    if (found) { out.push(found); continue; }
    const saved = ctx.tx.repo(accountLimitRepo).put(ctx.ids.next(), newRow(subjectKey, limitKey, iso, iso), { expectedRevision: 0 });
    if (!saved.ok) return saved;
    out.push(saved.value);
  }
  return ok(out);
}

/** Writes a row with the patch applied and the effective value recomputed; emits moderation.limit.changed when it changed. */
function commitRow(ctx: RowContext, rec: StoredRecord<AccountLimit>, patch: Partial<AccountLimit>, cause: LimitCause): Result<StoredRecord<AccountLimit>, AppError> {
  const merged = withoutUndefined({ ...rec.data, ...patch }) as AccountLimit;
  const next: AccountLimit = { ...merged, effectiveValue: computeEffective(merged, ctx.clock.now()), updatedAt: ctx.clock.iso() };
  const saved = ctx.tx.repo(accountLimitRepo).put(rec.id, next, { expectedRevision: rec.revision });
  if (!saved.ok) return saved;
  if (next.effectiveValue !== rec.data.effectiveValue) {
    ctx.emit(limitChangedEvent, {
      aggregate: { type: 'account_limit', id: rec.id }, revision: saved.value.revision,
      payload: { accountLimitId: rec.id, subjectKey: next.subjectKey, limitKey: next.limitKey, previousValue: rec.data.effectiveValue, effectiveValue: next.effectiveValue, cause },
    });
  }
  return saved;
}

function allRows(ctx: Pick<RowContext, 'tx'>, q: { where?: { expiry: { lte: string } } } = {}): StoredRecord<AccountLimit>[] {
  const rows: StoredRecord<AccountLimit>[] = [];
  let cursor: string | undefined;
  do {
    const page = ctx.tx.repo(accountLimitRepo).query({ limit: 500, ...(q.where ? { where: q.where } : {}), ...(cursor ? { cursor } : {}) });
    if (!page.ok) throw new Error('invalid account limit query');
    rows.push(...page.value.items);
    cursor = page.value.nextCursor;
  } while (cursor);
  return rows;
}

/**
 * Override and restriction expiry (run every 60 s by the root inside a command transaction): clears expired adjustments,
 * recomputes the effective value and emits moderation.limit.changed (cause override_expired, or policy for a restriction).
 */
export function expireOverrides(ctx: LimitsMaintenanceContext): Result<{ changed: number }, AppError> {
  const nowIso = ctx.clock.iso();
  const nowMs = ctx.clock.now();
  let changed = 0;
  for (const rec of allRows(ctx, { where: { expiry: { lte: nowIso } } })) {
    const d = rec.data;
    const overrideExpired = d.overrideExpiresAt !== undefined && Date.parse(d.overrideExpiresAt) <= nowMs;
    const restrictionExpired = d.restrictedUntil !== undefined && Date.parse(d.restrictedUntil) <= nowMs;
    if (!overrideExpired && !restrictionExpired) continue;
    const patch: Partial<AccountLimit> = {
      ...(overrideExpired ? { overrideValue: undefined, overrideReason: undefined, overrideBy: undefined, overrideExpiresAt: undefined } : {}),
      ...(restrictionExpired ? { restrictedUntil: undefined, restrictionActionId: undefined } : {}),
    };
    const saved = commitRow(ctx, rec, patch, overrideExpired ? 'override_expired' : 'policy');
    if (!saved.ok) return saved;
    changed += 1;
  }
  return ok({ changed });
}

/**
 * Daily re-tiering (03:15 UTC, run by the root inside a command transaction): promotion follows relay age and completed
 * dealings; a key never loses more than one tier per sweep. Also expires overrides.
 */
export function tierSweep(ctx: LimitsMaintenanceContext, thresholds: TierThresholds = DEFAULT_THRESHOLDS): Result<{ retiered: number }, AppError> {
  const expired = expireOverrides(ctx);
  if (!expired.ok) return expired;
  const nowMs = ctx.clock.now();
  let retiered = 0;
  for (const rec of allRows(ctx)) {
    const target = computeTier(nowMs - Date.parse(rec.data.firstSeenAt), rec.data.completedDeals, thresholds);
    const from = TIERS.indexOf(rec.data.tier);
    const to = TIERS.indexOf(target);
    const tier = to >= from ? target : (TIERS[from - 1] as Tier);
    if (tier === rec.data.tier) continue;
    const saved = commitRow(ctx, rec, { tier, baseValue: TIER_TABLE[tier][rec.data.limitKey] }, 'tier');
    if (!saved.ok) return saved;
    retiered += 1;
  }
  return ok({ retiered });
}

/** Deletes every row of a subject (membership deletion, N6 DeletionPort); returns the number of removed rows. */
export function purgeSubjectLimits(tx: WriteScope, subjectKey: string): number {
  const repo = tx.repo(accountLimitRepo);
  const page = repo.query({ where: { subject: subjectKey }, limit: 10 });
  if (!page.ok) return 0;
  let n = 0;
  for (const rec of page.value.items) if (repo.remove(rec.id, { expectedRevision: rec.revision }).ok) n += 1;
  return n;
}

export interface OverrideReportLine { readonly moderator: string; readonly attempts: number; readonly applied: number; readonly refused: number }
/** Weekly override report for operators, built from the bus audit log (every attempt, including refused ones). */
export function weeklyOverrideReport(entries: readonly AuditEntry[], nowMs: number): OverrideReportLine[] {
  const since = nowMs - 7 * DAY_MS;
  const by = new Map<string, { attempts: number; applied: number; refused: number }>();
  for (const e of entries) {
    if (e.operation !== 'moderation.accountlimit.override' || Date.parse(e.at) < since) continue;
    const line = by.get(e.actor.id) ?? { attempts: 0, applied: 0, refused: 0 };
    line.attempts += 1;
    if (e.outcome === 'ok' || e.outcome === 'replayed') line.applied += 1; else line.refused += 1;
    by.set(e.actor.id, line);
  }
  return [...by.entries()].map(([moderator, l]) => ({ moderator, ...l })).sort((a, b) => b.attempts - a.attempts || a.moderator.localeCompare(b.moderator));
}

// ---------------------------------------------------------------------------------------------- definitions

export interface LimitsOptions {
  /** Atomic counter for flow limits and the moderator override cap; default is an in-memory rolling window. */
  readonly flow?: FlowCounterPort;
  /** Fail mode of a flow limit when the counter throws; default open for flow limits (the write class default of F12.S03.M03). */
  readonly flowFailMode?: (limitKey: LimitKey) => 'open' | 'closed';
  readonly thresholds?: TierThresholds;
  /** Override commands one moderator may issue per day (default 30). */
  readonly overridesPerDay?: number;
  readonly metrics?: MetricsRegistry;
}

/** Capability to role mapping for createRoleTableAuthz. `check` is reachable only in process (surface vault). */
export const LIMITS_ROLES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'moderation.accountlimit.override': ['moderator', 'operator'],
  'moderation.accountlimit.clear_override': ['moderator', 'operator'],
  'moderation.accountlimit.check': ['operator'],
  'moderation.accountlimit.read_own': ['member'],
});

const levelMultiplier = { low: 1, medium: 0.75, high: 0.5 } as const;
const idOf = (ctx: { actor: { kind: string } }): string | undefined => ('id' in ctx.actor ? (ctx.actor as { id: string }).id : undefined);

export function limitsDefinitions(options: LimitsOptions = {}) {
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  const overridesPerDay = options.overridesPerDay ?? 30;
  const failMode = options.flowFailMode ?? (() => 'open' as const);
  let flow = options.flow;
  const counterOf = (clock: Clock): FlowCounterPort => (flow ??= createRollingWindowCounter(clock));
  const checks = options.metrics?.counter({ name: 'classrup_moderation_limit_checks_total', help: 'Account limit checks by outcome.', labels: ['outcome'] });
  const overrides = options.metrics?.counter({ name: 'classrup_moderation_limit_overrides_total', help: 'Moderator overrides applied.', labels: ['outcome'] });

  const viewOf = readRow;

  const check = defineQuery({
    name: 'moderation.accountlimit.check', module: LIMITS_MODULE, capability: 'moderation.accountlimit.check',
    input: z.strictObject({ subjectKey: subjectKeySchema, limitKey: z.enum(LIMIT_KEYS), currentCount: z.int().min(0).max(1_000_000).optional(), cost: z.int().min(1).max(1000).default(1) }),
    handler(ctx, input) {
      const now = ctx.clock.now();
      const row = viewOf(ctx.tx, input.subjectKey, input.limitKey);
      // A key without a record is tier new with first-seen now (restored relay or key not yet seen).
      const data = row?.data ?? newRow(input.subjectKey, input.limitKey, ctx.clock.iso(), ctx.clock.iso());
      const effectiveValue = computeEffective(data, now);
      const { reasons } = describe(data, now, thresholds);
      const deny = (used: number, resetsAt?: string): Result<never, AppError> => {
        checks?.inc({ outcome: 'denied' });
        return err(limitErrors.make('ACCOUNT_LIMIT_REACHED', { params: { limitKey: input.limitKey, effectiveValue, used, ...(resetsAt ? { resetsAt } : {}), reasons } }));
      };
      const restrictedUntil = data.restrictedUntil !== undefined && Date.parse(data.restrictedUntil) > now ? data.restrictedUntil : undefined;
      if (!FLOW_LIMIT_KEYS.has(input.limitKey)) {
        if (input.currentCount === undefined) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'currentCount', code: 'REQUIRED' }] }));
        if (input.currentCount + input.cost > effectiveValue) return deny(input.currentCount, restrictedUntil);
        checks?.inc({ outcome: 'allowed' });
        return ok({ allowed: true, effectiveValue, used: input.currentCount + input.cost, reasons });
      }
      if (effectiveValue === 0 || input.cost > effectiveValue) return deny(0, restrictedUntil);
      const request: FlowConsumeInput = { tenantId: ctx.tenantId, counter: input.limitKey, subject: input.subjectKey, limit: effectiveValue, windowMs: DAY_MS };
      let r: FlowConsumeResult;
      try {
        r = counterOf(ctx.clock).consume(request, input.cost);
      } catch {
        // Counter unavailable: the class fail mode decides; closed never lets sensitive work through.
        if (failMode(input.limitKey) === 'closed') return err(appError('DEPENDENCY_UNAVAILABLE'));
        checks?.inc({ outcome: 'allowed' });
        return ok({ allowed: true, effectiveValue, reasons: [...reasons, 'flow counter unavailable; limit not enforced for this request'] });
      }
      if (!r.allowed) return deny(r.used, r.resetsAt);
      checks?.inc({ outcome: 'allowed' });
      return ok({ allowed: true, effectiveValue, used: r.used, ...(r.resetsAt ? { resetsAt: r.resetsAt } : {}), reasons });
    },
  });

  const override = defineCommand({
    name: 'moderation.accountlimit.override', module: LIMITS_MODULE, capability: 'moderation.accountlimit.override', idempotent: true, surface: 'relay',
    input: z.strictObject({
      subjectKey: subjectKeySchema, limitKey: z.enum(LIMIT_KEYS), overrideValue: z.int().min(0).max(10_000), reason: boundedString({ min: 10, max: 500 }),
      expiresInMs: z.int().min(HOUR_MS).max(MAX_OVERRIDE_MS), expectedRevision: z.int().min(1).optional(),
    }),
    output: z.strictObject({ accountLimitId: z.string(), effectiveValue: z.int(), revision: z.int() }),
    handler(ctx, input) {
      const moderator = idOf(ctx);
      if (moderator === undefined || moderator === input.subjectKey) return err(appError('FORBIDDEN'));
      const expected = input.expectedRevision ?? ctx.expectedRevision;
      const ensured = ensureRows(ctx, input.subjectKey);
      if (!ensured.ok) return ensured;
      const rec = ensured.value.find((r) => r.data.limitKey === input.limitKey) as StoredRecord<AccountLimit>;
      if (expected !== undefined && expected !== rec.revision) return err(appError('CONFLICT_REVISION'));
      let cap: FlowConsumeResult;
      try {
        cap = counterOf(ctx.clock).consume({ tenantId: ctx.tenantId, counter: 'accountlimit.override', subject: moderator, limit: overridesPerDay, windowMs: DAY_MS }, 1);
      } catch {
        return err(appError('DEPENDENCY_UNAVAILABLE'));
      }
      if (!cap.allowed) {
        overrides?.inc({ outcome: 'denied' });
        const retryAfterMs = cap.resetsAt ? Math.max(1, Date.parse(cap.resetsAt) - ctx.clock.now()) : DAY_MS;
        return err(appError('RATE_LIMITED', { retryAfterMs, params: { retryAfterMs } }));
      }
      const saved = commitRow(ctx, rec, {
        overrideValue: input.overrideValue, overrideReason: input.reason, overrideBy: moderator as string,
        overrideExpiresAt: new Date(ctx.clock.now() + input.expiresInMs).toISOString(),
      }, 'override');
      if (!saved.ok) return saved;
      overrides?.inc({ outcome: 'applied' });
      return ok({ accountLimitId: saved.value.id, effectiveValue: saved.value.data.effectiveValue, revision: saved.value.revision });
    },
  });

  const clearOverride = defineCommand({
    name: 'moderation.accountlimit.clear_override', module: LIMITS_MODULE, capability: 'moderation.accountlimit.clear_override', idempotent: true, surface: 'relay',
    input: z.strictObject({ accountLimitId: z.string().min(1).max(64), expectedRevision: z.int().min(1) }),
    output: z.strictObject({ accountLimitId: z.string(), effectiveValue: z.int(), revision: z.int() }),
    handler(ctx, input) {
      const rec = ctx.tx.repo(accountLimitRepo).get(input.accountLimitId);
      const d = rec?.data;
      if (!rec || !d || d.overrideValue === undefined || d.overrideExpiresAt === undefined || Date.parse(d.overrideExpiresAt) <= ctx.clock.now()) return err(appError('NOT_FOUND'));
      if (idOf(ctx) === d.subjectKey) return err(appError('FORBIDDEN'));
      if (rec.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      const saved = commitRow(ctx, rec, { overrideValue: undefined, overrideReason: undefined, overrideBy: undefined, overrideExpiresAt: undefined }, 'override');
      if (!saved.ok) return saved;
      return ok({ accountLimitId: saved.value.id, effectiveValue: saved.value.data.effectiveValue, revision: saved.value.revision });
    },
  });

  const listMine = defineQuery({
    name: 'moderation.accountlimit.list_mine', module: LIMITS_MODULE, capability: 'moderation.accountlimit.read_own', surface: 'both',
    input: z.strictObject({ includeAdjustments: z.boolean().default(false) }),
    handler(ctx, input) {
      const subject = idOf(ctx);
      if (subject === undefined) return err(appError('FORBIDDEN'));
      const now = ctx.clock.now();
      const items = LIMIT_KEYS.map((limitKey) => {
        const row = viewOf(ctx.tx, subject, limitKey);
        const data = row?.data ?? newRow(subject, limitKey, ctx.clock.iso(), ctx.clock.iso());
        const next = nextTierOf(data.tier);
        const req = next === undefined ? undefined : thresholds[next === 'trusted' ? 'trusted' : 'established'];
        const used = counterOf(ctx.clock).peek?.({ tenantId: ctx.tenantId, counter: limitKey, subject, limit: computeEffective(data, now), windowMs: DAY_MS });
        return {
          limitKey, tier: data.tier, effectiveValue: computeEffective(data, now), ...(FLOW_LIMIT_KEYS.has(limitKey) && used ? { used: used.used } : {}),
          adjustments: input.includeAdjustments ? describe(data, now, thresholds).adjustments : [],
          ...(next && req ? { nextTier: { tier: next, value: TIER_TABLE[next][limitKey], minAgeDays: req.minAgeDays, minDeals: req.minDeals } } : {}),
        };
      });
      return ok({ items });
    },
  });

  const onRisk = defineSubscriber({
    name: 'moderation.limits_risk', module: LIMITS_MODULE, events: [riskElevatedView],
    handler(ctx: ConsumerContext, env) {
      if (env.payload.subjectType !== 'key' || !env.payload.subjectRef.startsWith('did:key:')) return ok(undefined);
      const rows = ensureRows(ctx, env.payload.subjectRef);
      if (!rows.ok) return rows;
      for (const rec of rows.value) {
        const saved = commitRow(ctx, rec, { riskMultiplier: levelMultiplier[env.payload.level] }, 'risk');
        if (!saved.ok) return saved;
      }
      return ok(undefined);
    },
  });

  const onDeal = defineSubscriber({
    name: 'moderation.limits_deal', module: LIMITS_MODULE, events: [dealCompletedView],
    handler(ctx: ConsumerContext, env) {
      const dids = [...new Set((env.payload.parties ?? []).map((p) => p.did).filter((d) => d.startsWith('did:key:')))];
      for (const did of dids) {
        const rows = ensureRows(ctx, did);
        if (!rows.ok) return rows;
        for (const rec of rows.value) {
          const deals = Math.min(1000, rec.data.completedDeals + 1);
          const computed = computeTier(ctx.clock.now() - Date.parse(rec.data.firstSeenAt), deals, thresholds);
          // Completion events only promote; demotion is the sweep's job.
          const tier = TIERS.indexOf(computed) > TIERS.indexOf(rec.data.tier) ? computed : rec.data.tier;
          const saved = commitRow(ctx, rec, { completedDeals: deals, tier, baseValue: TIER_TABLE[tier][rec.data.limitKey] }, 'tier');
          if (!saved.ok) return saved;
        }
      }
      return ok(undefined);
    },
  });

  const onAccount = defineSubscriber({
    name: 'moderation.limits_account', module: LIMITS_MODULE, events: [accountCreatedView],
    handler(ctx: ConsumerContext, env) {
      if (!env.payload.did.startsWith('did:key:')) return ok(undefined);
      const rows = ensureRows(ctx, env.payload.did);
      return rows.ok ? ok(undefined) : rows;
    },
  });

  const onAction = defineSubscriber({
    name: 'moderation.limits_action', module: LIMITS_MODULE, events: [actionAppliedView],
    handler(ctx: ConsumerContext, env) {
      const p = env.payload;
      const named = [...(p.limitKeys ?? []), ...(p.limitKey ? [p.limitKey] : [])].filter((k): k is LimitKey => (LIMIT_KEYS as readonly string[]).includes(k));
      if (p.kind !== 'restrict_feature' || named.length === 0 || !p.subjectKey.startsWith('did:key:')) return ok(undefined);
      const until = p.expiresAt !== undefined && Number.isFinite(Date.parse(p.expiresAt)) ? new Date(Date.parse(p.expiresAt)).toISOString() : undefined;
      if (until === undefined || Date.parse(until) <= ctx.clock.now()) return ok(undefined);
      const rows = ensureRows(ctx, p.subjectKey);
      if (!rows.ok) return rows;
      for (const rec of rows.value.filter((r) => named.includes(r.data.limitKey))) {
        const saved = commitRow(ctx, rec, { restrictedUntil: until, ...(p.actionId ? { restrictionActionId: p.actionId.slice(0, 100) } : {}) }, 'policy');
        if (!saved.ok) return saved;
      }
      return ok(undefined);
    },
  });

  return { check, override, clearOverride, listMine, onRisk, onDeal, onAccount, onAction, all: [check, override, clearOverride, listMine, onRisk, onDeal, onAccount, onAction] as const };
}

