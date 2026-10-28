/**
 * F10.S01.M02 retention and legal holds. Defaults per RetentionClass follow ADR-0008 (minimal
 * retention); tenants may tune fixed-duration classes within safe bounds. A legal hold on an
 * account or record blocks erasure and purging until released; the sweep planner reports what is
 * due and what is held back but performs no deletion itself (owners purge their own data).
 */
import type { CommandContext, RetentionClass } from '@classrup/kernel';
import { assertVersion, conflict, DAY, HOUR, notFound, parse, runCommand, schemas, z } from '@classrup/kernel';
import type { PrivacyEnv } from '../env';
import { authorize, checkFlag, EVENTS, event, FLAGS } from '../env';
import type { HoldRecord } from '../records';

export const YEAR_MS = 365 * DAY;

export type RetentionRule =
  | { readonly mode: 'fixed'; readonly ms: number }
  /** Kept until the person deletes it or it is otherwise expired by its owner (user content). */
  | { readonly mode: 'until_deletion' }
  /** Never expires by time; only a released legal hold unfreezes the data. */
  | { readonly mode: 'frozen' };

export type RetentionTable = Readonly<Record<RetentionClass, RetentionRule>>;

export const DEFAULT_RETENTION: RetentionTable = Object.freeze({
  ephemeral: { mode: 'fixed', ms: DAY },
  session: { mode: 'fixed', ms: 30 * DAY },
  content: { mode: 'until_deletion' },
  commerce_evidence: { mode: 'fixed', ms: 7 * YEAR_MS },
  moderation: { mode: 'fixed', ms: 2 * YEAR_MS },
  audit: { mode: 'fixed', ms: YEAR_MS },
  legal_hold: { mode: 'frozen' },
});

/** Floors protect evidence and security logs from being tuned away; the ceiling prevents indefinite hoarding. */
export const RETENTION_BOUNDS: Readonly<Partial<Record<RetentionClass, { min: number; max: number }>>> = Object.freeze({
  ephemeral: { min: HOUR, max: 7 * DAY },
  session: { min: DAY, max: 90 * DAY },
  commerce_evidence: { min: YEAR_MS, max: 20 * YEAR_MS },
  moderation: { min: 30 * DAY, max: 10 * YEAR_MS },
  audit: { min: 30 * DAY, max: 10 * YEAR_MS },
});

const TUNABLE = ['ephemeral', 'session', 'commerce_evidence', 'moderation', 'audit'] as const;

/** Expiry timestamp for a record created at `createdAt`, or undefined when time never expires it. */
export function computeExpiry(rule: RetentionRule, createdAt: number): number | undefined {
  return rule.mode === 'fixed' ? createdAt + rule.ms : undefined;
}

export function describeRule(rule: RetentionRule): string {
  if (rule.mode === 'frozen') return 'frozen until its legal hold is released';
  if (rule.mode === 'until_deletion') return 'kept until the owner deletes it';
  const days = Math.round(rule.ms / DAY);
  return days >= 365 ? `kept ${Math.round((days / 365) * 10) / 10} years` : `kept ${days} days`;
}

export interface SweepItem {
  readonly type: string;
  readonly id: string;
  readonly retentionClass: RetentionClass;
  readonly createdAt: number;
  /** Owning account, so an account-level hold also protects the item. */
  readonly subjectAccountId?: string;
}

export interface SweepPlan {
  readonly due: readonly SweepItem[];
  readonly held: readonly { readonly item: SweepItem; readonly holdId: string }[];
  readonly retained: number;
}

export interface HoldDto {
  readonly id: string;
  readonly subjectType: HoldRecord['subjectType'];
  readonly subjectId: string;
  readonly reason: string;
  readonly status: HoldRecord['status'];
  readonly placedAt: number;
  readonly releasedAt?: number;
  readonly version: number;
}

const toHoldDto = (h: HoldRecord): HoldDto => ({
  id: h.id,
  subjectType: h.subjectType,
  subjectId: h.subjectId,
  reason: h.reason,
  status: h.status,
  placedAt: h.placedAt,
  ...(h.releasedAt !== undefined ? { releasedAt: h.releasedAt } : {}),
  version: h.version,
});

const retentionClassSchema = z.enum(['ephemeral', 'session', 'content', 'commerce_evidence', 'moderation', 'audit', 'legal_hold']);
const setPolicySchema = z
  .object({ retentionClass: z.enum(TUNABLE), ms: z.number().int().positive(), expectedVersion: z.number().int().nonnegative().optional() })
  .strict();
const sweepItemSchema = z
  .object({
    type: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
    id: z.string().min(1).max(80),
    retentionClass: retentionClassSchema,
    createdAt: schemas.timestamp(),
    subjectAccountId: z.string().max(80).optional(),
  })
  .strict();
const planSchema = z.object({ items: z.array(sweepItemSchema).max(1000) }).strict();
const placeSchema = z
  .object({ subjectType: z.enum(['account', 'record']), subjectId: z.string().min(1).max(80), reason: schemas.text(3, 200) })
  .strict();
const releaseSchema = z.object({ holdId: schemas.id('hold') }).strict();

export interface RetentionPolicyDto {
  readonly version: number;
  readonly rules: Readonly<Record<RetentionClass, { readonly mode: RetentionRule['mode']; readonly ms: number | null; readonly summary: string }>>;
}

export interface RetentionService {
  policy(ctx: CommandContext): RetentionPolicyDto;
  setPolicy(ctx: CommandContext, input: z.input<typeof setPolicySchema>): RetentionPolicyDto;
  planSweep(ctx: CommandContext, input: z.input<typeof planSchema>): SweepPlan;
  placeHold(ctx: CommandContext, input: z.input<typeof placeSchema>): HoldDto;
  releaseHold(ctx: CommandContext, input: z.input<typeof releaseSchema>): HoldDto;
  listHolds(ctx: CommandContext): HoldDto[];
  /** Effective rule table for a tenant (defaults plus overrides). */
  table(tenantId: string): RetentionTable;
  expiryFor(tenantId: string, retentionClass: RetentionClass, createdAt: number): number | undefined;
  /** Ids of active holds covering the subject. Empty means the subject may be purged or erased. */
  activeHolds(tenantId: string, subjectType: HoldRecord['subjectType'], subjectId: string): string[];
  /** Guard for purge code in any feature: throws PRIVACY.LEGAL_HOLD when held. */
  assertNotHeld(tenantId: string, subjectType: HoldRecord['subjectType'], subjectId: string): void;
}

export function createRetentionService(env: PrivacyEnv): RetentionService {
  const { deps, stores } = env;

  function table(tenantId: string): RetentionTable {
    const overrides = stores.retention.get(tenantId)?.overrides ?? {};
    const merged: Record<string, RetentionRule> = { ...DEFAULT_RETENTION };
    for (const [klass, ms] of Object.entries(overrides)) merged[klass] = { mode: 'fixed', ms };
    return merged as RetentionTable;
  }

  const policyDto = (tenantId: string): RetentionPolicyDto => {
    const rules = Object.fromEntries(
      Object.entries(table(tenantId)).map(([klass, r]) => [klass, { mode: r.mode, ms: r.mode === 'fixed' ? r.ms : null, summary: describeRule(r) }]),
    );
    return { version: stores.retention.get(tenantId)?.version ?? 0, rules: rules as RetentionPolicyDto['rules'] };
  };

  function activeHolds(tenantId: string, subjectType: HoldRecord['subjectType'], subjectId: string): string[] {
    return stores.holds.list((h) => h.tenantId === tenantId && h.status === 'active' && h.subjectType === subjectType && h.subjectId === subjectId).map((h) => h.id);
  }

  return {
    table,
    activeHolds,
    expiryFor: (tenantId, klass, createdAt) => computeExpiry(table(tenantId)[klass], createdAt),

    assertNotHeld(tenantId, subjectType, subjectId) {
      const holds = activeHolds(tenantId, subjectType, subjectId);
      if (holds.length > 0) throw conflict('PRIVACY.LEGAL_HOLD', 'subject is under legal hold and cannot be purged', { holds });
    },

    policy(ctx) {
      authorize(env, ctx, 'privacy.retention:read', { type: 'retention', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.retention);
      return policyDto(ctx.actor.tenantId);
    },

    setPolicy(ctx, input) {
      const i = parse(setPolicySchema, input);
      authorize(env, ctx, 'privacy.retention:configure', { type: 'retention', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'privacy.retention.set_policy', flag: FLAGS.retention, request: i }, () => {
        const bounds = RETENTION_BOUNDS[i.retentionClass];
        if (bounds && (i.ms < bounds.min || i.ms > bounds.max)) {
          throw conflict('PRIVACY.RETENTION_OUT_OF_BOUNDS', 'duration outside the allowed range for this class', { min: bounds.min, max: bounds.max });
        }
        const tenantId = ctx.actor.tenantId;
        const current = stores.retention.get(tenantId);
        assertVersion('retention policy', current?.version ?? 0, i.expectedVersion);
        const stored = stores.retention.put(
          { id: tenantId, overrides: { ...current?.overrides, [i.retentionClass]: i.ms }, updatedAt: deps.clock.now(), updatedBy: ctx.actor.id },
          current?.version ?? 0,
        );
        return {
          result: policyDto(tenantId),
          events: [event(EVENTS.retentionPolicyChanged, 'retention_policy', tenantId, stored.version, { tenantId, retentionClass: i.retentionClass, ms: i.ms })],
        };
      });
    },

    planSweep(ctx, input) {
      const i = parse(planSchema, input);
      authorize(env, ctx, 'privacy.retention:plan', { type: 'retention', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.retention);
      const tenantId = ctx.actor.tenantId;
      const now = deps.clock.now();
      const rules = table(tenantId);
      const holds = new Map(
        stores.holds.list((h) => h.tenantId === tenantId && h.status === 'active').map((h) => [`${h.subjectType}|${h.subjectId}`, h.id] as const),
      );
      const due: SweepItem[] = [];
      const held: { item: SweepItem; holdId: string }[] = [];
      for (const item of i.items) {
        const expiry = computeExpiry(rules[item.retentionClass], item.createdAt);
        if (expiry === undefined || expiry > now) continue;
        const holdId = holds.get(`record|${item.id}`) ?? (item.subjectAccountId ? holds.get(`account|${item.subjectAccountId}`) : undefined);
        if (holdId) held.push({ item, holdId });
        else due.push(item);
      }
      return { due, held, retained: i.items.length - due.length - held.length };
    },

    placeHold(ctx, input) {
      const i = parse(placeSchema, input);
      authorize(env, ctx, 'privacy.hold:manage', { type: 'hold', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'privacy.hold.place', flag: FLAGS.retention, request: i }, () => {
        const tenantId = ctx.actor.tenantId;
        if (activeHolds(tenantId, i.subjectType, i.subjectId).length > 0) throw conflict('PRIVACY.HOLD_EXISTS', 'subject is already under legal hold');
        const id = deps.ids.next('hold');
        const stored = stores.holds.put(
          { id, tenantId, subjectType: i.subjectType, subjectId: i.subjectId, reason: i.reason, status: 'active', placedBy: ctx.actor.id, placedAt: deps.clock.now() },
          0,
        );
        return {
          result: toHoldDto(stored),
          events: [event(EVENTS.holdPlaced, 'hold', id, stored.version, { holdId: id, subjectType: i.subjectType, subjectId: i.subjectId })],
        };
      });
    },

    releaseHold(ctx, input) {
      const i = parse(releaseSchema, input);
      authorize(env, ctx, 'privacy.hold:manage', { type: 'hold', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'privacy.hold.release', flag: FLAGS.retention, request: i }, () => {
        const hold = stores.holds.get(i.holdId);
        if (!hold || hold.tenantId !== ctx.actor.tenantId) throw notFound('PRIVACY.HOLD_NOT_FOUND', 'hold not found');
        if (hold.status === 'released') return { result: toHoldDto(hold) };
        const stored = stores.holds.put({ ...hold, status: 'released', releasedBy: ctx.actor.id, releasedAt: deps.clock.now() }, hold.version);
        return {
          result: toHoldDto(stored),
          events: [event(EVENTS.holdReleased, 'hold', hold.id, stored.version, { holdId: hold.id, subjectType: hold.subjectType, subjectId: hold.subjectId })],
        };
      });
    },

    listHolds(ctx) {
      authorize(env, ctx, 'privacy.hold:manage', { type: 'hold', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.retention);
      return stores.holds.list((h) => h.tenantId === ctx.actor.tenantId).sort((a, b) => b.placedAt - a.placedAt).map(toHoldDto);
    },
  };
}
