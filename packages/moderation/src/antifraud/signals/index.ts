// F12.S03.M02 (PS-101) Fraud signals. Append-only observations about a counterparty key, with weights and exponential
// decay. Each store (vault or relay) keeps its own view; nothing is federated or shared as a global reputation (ADR-0016).
// Signals carry ids and categories only: never message text, exact locations or amounts.
import {
  appError, boundedString, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, defineSubscriber, err, ok, timestamp, z,
  type AppError, type Clock, type ConsumerContext, type Emit, type EventEnvelope, type IdGen, type MetricsRegistry, type ReadScope, type Result, type StoredRecord, type WriteScope,
} from '@classrup/kernel';

export const SIGNALS_MODULE = 'F12.S03.M02';
export const RULES_VERSION = 1;
export const signalErrors = defineErrors({
  SIGNALS_DUPLICATE_SOURCE: { status: 409, retryable: false },
  SIGNALS_MANUAL_CAP: { status: 422, retryable: false },
});

const DAY_MS = 86_400_000;
const MAX_LIFETIME_DAYS = 365;
const MANUAL_CAP = 20;
const MANUAL_WINDOW_MS = 30 * DAY_MS;
const SOURCE_CAP = 3;
const AUTHOR_PER_DAY = 10;
const IMPORT_WEIGHT_CAP = 20;
const MAX_SIGNALS_PER_SUBJECT = 20_000;

export const SIGNAL_KINDS = [
  'shill_suspected', 'spam_detected', 'dispute_opened', 'dispute_lost', 'no_show', 'payment_claim_expired', 'payment_claim_disputed', 'cycle_dropout',
  'auction_voided', 'damage_claimed', 'report_actioned', 'report_dismissed_bad_faith', 'deal_completed', 'manual_concern', 'manual_positive', 'compensation',
] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
export const MANUAL_KINDS = ['manual_concern', 'manual_positive', 'compensation'] as const;
type ManualKind = (typeof MANUAL_KINDS)[number];
const isManualKind = (k: string): k is ManualKind => (MANUAL_KINDS as readonly string[]).includes(k);

/** Default weight and half-life per kind (the fixed, versioned mapping table, rulesVersion 1). */
export const KIND_DEFAULTS: Readonly<Record<SignalKind, { readonly weight: number; readonly halfLifeDays: number }>> = Object.freeze({
  shill_suspected: { weight: 40, halfLifeDays: 90 }, spam_detected: { weight: 5, halfLifeDays: 14 }, dispute_opened: { weight: 10, halfLifeDays: 60 },
  dispute_lost: { weight: 20, halfLifeDays: 90 }, no_show: { weight: 10, halfLifeDays: 60 }, payment_claim_expired: { weight: 6, halfLifeDays: 30 },
  payment_claim_disputed: { weight: 15, halfLifeDays: 60 }, cycle_dropout: { weight: 12, halfLifeDays: 60 }, auction_voided: { weight: 25, halfLifeDays: 90 },
  damage_claimed: { weight: 8, halfLifeDays: 90 }, report_actioned: { weight: 10, halfLifeDays: 180 }, report_dismissed_bad_faith: { weight: 15, halfLifeDays: 60 },
  deal_completed: { weight: -4, halfLifeDays: 120 }, manual_concern: { weight: 8, halfLifeDays: 60 }, manual_positive: { weight: -8, halfLifeDays: 60 }, compensation: { weight: 0, halfLifeDays: 60 },
});

// ---------------------------------------------------------------------------------------------- records

const subjectKeySchema = z.string().startsWith('did:key:').max(128);
export const signalSchema = z.strictObject({
  subjectKey: subjectKeySchema,
  kind: z.enum(SIGNAL_KINDS),
  weight: z.int().min(-100).max(100),
  halfLifeDays: z.int().min(7).max(180),
  sourceModule: z.string().min(1).max(80),
  sourceEventId: z.string().min(1).max(200).optional(),
  sourceKey: z.string().min(1).max(128).optional(),
  evidenceRef: z.string().min(1).max(200).optional(),
  supersedesSignalId: z.string().max(64).optional(),
  /** Decay anchor: a compensation decays from the observation time of the signal it cancels, so the pair nets to zero at every instant. */
  anchorAt: timestamp().optional(),
  observedAt: timestamp(),
  claimedAt: timestamp().optional(),
  expiresAt: timestamp(),
  authorKey: subjectKeySchema.optional(),
  reason: boundedString({ min: 10, max: 500 }).optional(),
  /** True when the per-source cap (3 per 30 days) was already reached: kept for audit, ignored for scoring. */
  capped: z.boolean().optional(),
});
export type Signal = z.output<typeof signalSchema>;
const sep = '\u0001';
/**
 * classrup.moderation.signal/v1. Indexes: `source` (kind + sourceEventId; manual authors for the daily author cap),
 * `subjectObs` (subject + observedAt), `expiry`, `ref` (evidenceRef). Records are only ever inserted; the sole removal is the
 * expiry purge or subject deletion.
 */
export const signalRepo = defineRepo({
  type: 'moderation.signal', schema: signalSchema,
  indexes: {
    source: (d) => (isManualKind(d.kind) && d.sourceModule === 'manual' ? (d.authorKey ? `m${sep}${d.authorKey}${sep}${d.observedAt}` : null) : d.sourceEventId ? `${d.kind}${sep}${d.sourceEventId}` : null),
    subjectObs: (d) => `${d.subjectKey}${sep}${d.observedAt}`,
    expiry: (d) => d.expiresAt,
    ref: (d) => d.evidenceRef ?? null,
  },
});
const rollupSchema = z.strictObject({ subjectKey: subjectKeySchema, kind: z.enum(SIGNAL_KINDS), count: z.int().min(1), updatedAt: timestamp(), expiresAt: timestamp() });
/** Counts per kind kept for 365 days after the signals themselves expire (no sources, no weights). */
export const signalRollupRepo = defineRepo({ type: 'moderation.signal_rollup', schema: rollupSchema, indexes: { expiry: (d) => d.expiresAt, subject: (d) => d.subjectKey } });

export const signalRecordedEvent = defineEvent('moderation.signal.recorded', 1, 'P3', z.strictObject({
  signalId: z.string(), subjectKey: subjectKeySchema, kind: z.enum(SIGNAL_KINDS), weight: z.int().min(-100).max(100), halfLifeDays: z.int().min(7).max(180),
  sourceModule: z.string(), sourceEventId: z.string().optional(), observedAt: z.string(),
}));

// ---------------------------------------------------------------------------------------------- decay math

export function decayedWeight(s: Pick<Signal, 'weight' | 'halfLifeDays' | 'observedAt' | 'anchorAt'>, asOfMs: number): number {
  const anchor = Date.parse(s.anchorAt ?? s.observedAt);
  const age = Math.max(0, asOfMs - anchor);
  return s.weight * 0.5 ** (age / (s.halfLifeDays * DAY_MS));
}
export function expiryOf(observedAt: number, halfLifeDays: number): string {
  return new Date(observedAt + Math.min(5 * halfLifeDays, MAX_LIFETIME_DAYS) * DAY_MS).toISOString();
}

export interface SignalSummary { readonly totalDecayedWeight: number; readonly byKind: Readonly<Record<string, { count: number; decayedWeight: number }>>; readonly computedAt: string }
/** Pure aggregate: capped and expired signals, and signals observed after asOf, do not count. Independent of input order. */
export function summarizeSignals(signals: readonly Signal[], asOfMs: number): SignalSummary {
  const byKind: Record<string, { count: number; decayedWeight: number }> = {};
  let total = 0;
  for (const s of signals) {
    if (s.capped || Date.parse(s.expiresAt) <= asOfMs || Date.parse(s.observedAt) > asOfMs) continue;
    const w = decayedWeight(s, asOfMs);
    const slot = (byKind[s.kind] ??= { count: 0, decayedWeight: 0 });
    slot.count += 1;
    slot.decayedWeight += w;
    total += w;
  }
  return { totalDecayedWeight: total, byKind, computedAt: new Date(asOfMs).toISOString() };
}

// ---------------------------------------------------------------------------------------------- store operations

export interface SignalsMaintenanceContext { readonly tx: WriteScope; readonly emit: Emit; readonly clock: Clock; readonly ids: IdGen }

function subjectRows(tx: ReadScope, subjectKey: string, opts: { sinceIso?: string } = {}): StoredRecord<Signal>[] {
  const out: StoredRecord<Signal>[] = [];
  let cursor: string | undefined;
  do {
    const page = tx.repo(signalRepo).query({
      where: { subjectObs: { gte: `${subjectKey}${sep}${opts.sinceIso ?? ''}`, lt: `${subjectKey}${sep}\u{10FFFF}` } }, orderBy: 'subjectObs', limit: 500, ...(cursor ? { cursor } : {}),
    });
    if (!page.ok) throw new Error('invalid signal query');
    out.push(...page.value.items);
    cursor = page.value.nextCursor;
  } while (cursor && out.length < MAX_SIGNALS_PER_SUBJECT);
  return out;
}

function bySource(tx: ReadScope, kind: string, sourceEventId: string): StoredRecord<Signal> | undefined {
  const page = tx.repo(signalRepo).query({ where: { source: `${kind}${sep}${sourceEventId}` }, limit: 1 });
  return page.ok ? page.value.items[0] : undefined;
}

/** A signal can be cancelled once, whoever cancels it: compensations carry evidenceRef compensates:<id>. */
function compensationExists(tx: ReadScope, signalId: string): boolean {
  const page = tx.repo(signalRepo).query({ where: { ref: `compensates:${signalId}` }, limit: 1 });
  return page.ok && page.value.items.length > 0;
}

export interface NewSignal {
  readonly subjectKey: string;
  readonly kind: SignalKind;
  readonly weight: number;
  readonly halfLifeDays: number;
  readonly sourceModule: string;
  readonly sourceEventId?: string | undefined;
  readonly sourceKey?: string | undefined;
  readonly evidenceRef?: string | undefined;
  readonly supersedesSignalId?: string | undefined;
  readonly anchorAt?: string | undefined;
  readonly claimedAt?: string | undefined;
  readonly authorKey?: string | undefined;
  readonly reason?: string | undefined;
  readonly expiresAt?: string | undefined;
  readonly observedAt?: string | undefined;
}

export type InsertOutcome = { readonly outcome: 'recorded' | 'capped'; readonly record: StoredRecord<Signal> } | { readonly outcome: 'duplicate' };

function clean<T extends object>(o: T): T { return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T; }

/** Inserts one signal with its event in the same transaction; duplicates by (kind, sourceEventId) are a no-op. */
function insertSignal(ctx: SignalsMaintenanceContext, input: NewSignal): Result<InsertOutcome, AppError> {
  if (input.sourceEventId !== undefined && bySource(ctx.tx, input.kind, input.sourceEventId)) return ok({ outcome: 'duplicate' });
  if (input.kind === 'compensation' && input.supersedesSignalId !== undefined && compensationExists(ctx.tx, input.supersedesSignalId)) return ok({ outcome: 'duplicate' });
  const nowMs = ctx.clock.now();
  const observedAt = input.observedAt ?? ctx.clock.iso();
  let capped = false;
  if (input.sourceKey !== undefined) {
    const since = new Date(nowMs - MANUAL_WINDOW_MS).toISOString();
    const same = subjectRows(ctx.tx, input.subjectKey, { sinceIso: since }).filter((r) => r.data.sourceKey === input.sourceKey && !r.data.capped);
    capped = same.length >= SOURCE_CAP;
  }
  const data = signalSchema.parse(clean({
    subjectKey: input.subjectKey, kind: input.kind, weight: input.weight, halfLifeDays: input.halfLifeDays, sourceModule: input.sourceModule,
    sourceEventId: input.sourceEventId, sourceKey: input.sourceKey, evidenceRef: input.evidenceRef, supersedesSignalId: input.supersedesSignalId, anchorAt: input.anchorAt,
    observedAt, claimedAt: input.claimedAt, expiresAt: input.expiresAt ?? expiryOf(Date.parse(observedAt), input.halfLifeDays), authorKey: input.authorKey, reason: input.reason,
    capped: capped ? true : undefined,
  }));
  const saved = ctx.tx.repo(signalRepo).put(ctx.ids.next(), data, { expectedRevision: 0 });
  if (!saved.ok) return saved;
  ctx.emit(signalRecordedEvent, {
    aggregate: { type: 'signal', id: saved.value.id }, revision: saved.value.revision,
    payload: clean({ signalId: saved.value.id, subjectKey: data.subjectKey, kind: data.kind, weight: data.weight, halfLifeDays: data.halfLifeDays, sourceModule: data.sourceModule, sourceEventId: data.sourceEventId, observedAt: data.observedAt }),
  });
  return ok({ outcome: capped ? 'capped' : 'recorded', record: saved.value });
}

/**
 * Daily purge (04:00 UTC relay, app idle once per 24 h in the vault; run by the root in a command transaction): removes
 * rows past expiresAt, adds one count per kind to the rollup (kept 365 days) and drops rollups that reached their end.
 */
export function purgeExpiredSignals(ctx: SignalsMaintenanceContext): Result<{ purged: number; rollupsDropped: number }, AppError> {
  const nowIso = ctx.clock.iso();
  const repo = ctx.tx.repo(signalRepo);
  const rollups = ctx.tx.repo(signalRollupRepo);
  let purged = 0;
  for (;;) {
    const page = repo.query({ where: { expiry: { lte: nowIso } }, orderBy: 'expiry', limit: 500 });
    if (!page.ok) return page;
    if (page.value.items.length === 0) break;
    for (const rec of page.value.items) {
      const id = `${rec.data.subjectKey}${sep}${rec.data.kind}`;
      const prior = rollups.get(id);
      const row = { subjectKey: rec.data.subjectKey, kind: rec.data.kind, count: (prior?.data.count ?? 0) + 1, updatedAt: nowIso, expiresAt: new Date(ctx.clock.now() + MAX_LIFETIME_DAYS * DAY_MS).toISOString() };
      const put = rollups.put(id, row, { expectedRevision: prior?.revision ?? 0 });
      if (!put.ok) return put;
      const removed = repo.remove(rec.id, { expectedRevision: rec.revision });
      if (!removed.ok) return removed;
      purged += 1;
    }
  }
  let rollupsDropped = 0;
  for (;;) {
    const page = rollups.query({ where: { expiry: { lte: nowIso } }, orderBy: 'expiry', limit: 500 });
    if (!page.ok) return page;
    if (page.value.items.length === 0) break;
    for (const r of page.value.items) { const removed = rollups.remove(r.id, { expectedRevision: r.revision }); if (!removed.ok) return removed; rollupsDropped += 1; }
  }
  return ok({ purged, rollupsDropped });
}

/** Subject deletion in a vault: removes every signal and rollup row about the subject immediately. */
export function deleteSubjectSignals(tx: WriteScope, subjectKey: string): number {
  const repo = tx.repo(signalRepo);
  let n = 0;
  for (const rec of subjectRows(tx, subjectKey)) if (repo.remove(rec.id, { expectedRevision: rec.revision }).ok) n += 1;
  const rollups = tx.repo(signalRollupRepo);
  const page = rollups.query({ where: { subject: subjectKey }, limit: 100 });
  if (page.ok) for (const r of page.value.items) rollups.remove(r.id, { expectedRevision: r.revision });
  return n;
}

export function readRollup(tx: ReadScope, subjectKey: string): Record<string, number> {
  const page = tx.repo(signalRollupRepo).query({ where: { subject: subjectKey }, limit: 100 });
  return page.ok ? Object.fromEntries(page.value.items.map((r) => [r.data.kind, r.data.count])) : {};
}

export interface ExportedSignal extends Signal { readonly signalId: string }
/** Vault export section moderation.signals: one line per unexpired signal, manual reason included. */
export function exportSignals(tx: ReadScope, subjectKeys: readonly string[], nowMs: number): ExportedSignal[] {
  return subjectKeys.flatMap((k) => subjectRows(tx, k)).filter((r) => Date.parse(r.data.expiresAt) > nowMs).map((r) => ({ signalId: r.id, ...r.data }));
}

/**
 * Vault import: marks every row with sourceModule import and clamps the weight to +-20; duplicates by (kind, sourceEventId) are
 * skipped, expired rows dropped, unknown kinds count as manual_concern with weight 0. Original observedAt and expiry are kept,
 * so an import never inflates decay.
 */
export function importSignals(ctx: SignalsMaintenanceContext, rows: readonly unknown[]): Result<{ imported: number; skipped: number }, AppError> {
  let imported = 0;
  let skipped = 0;
  const nowMs = ctx.clock.now();
  for (const raw of rows) {
    const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
    const known = typeof r['kind'] === 'string' && (SIGNAL_KINDS as readonly string[]).includes(r['kind']);
    const kind = (known ? r['kind'] : 'manual_concern') as SignalKind;
    const weight = known && typeof r['weight'] === 'number' && Number.isFinite(r['weight']) ? Math.max(-IMPORT_WEIGHT_CAP, Math.min(IMPORT_WEIGHT_CAP, Math.trunc(r['weight']))) : 0;
    const subjectKey = r['subjectKey'];
    const observedAt = r['observedAt'];
    const expiresAt = r['expiresAt'];
    const halfLifeDays = r['halfLifeDays'];
    if (typeof subjectKey !== 'string' || typeof observedAt !== 'string' || typeof expiresAt !== 'string' || typeof halfLifeDays !== 'number') { skipped += 1; continue; }
    if (!subjectKeySchema.safeParse(subjectKey).success || !timestamp().safeParse(observedAt).success || !timestamp().safeParse(expiresAt).success || !Number.isInteger(halfLifeDays) || halfLifeDays < 7 || halfLifeDays > 180) { skipped += 1; continue; }
    if (Date.parse(expiresAt) <= nowMs) { skipped += 1; continue; }
    const sourceEventId = typeof r['sourceEventId'] === 'string' ? r['sourceEventId'] : typeof r['signalId'] === 'string' ? `import:${r['signalId']}` : undefined;
    const reason = typeof r['reason'] === 'string' && boundedString({ min: 10, max: 500 }).safeParse(r['reason']).success ? r['reason'] : undefined;
    const manualKind = isManualKind(kind);
    const result = insertSignal(ctx, {
      subjectKey, kind, weight, halfLifeDays, sourceModule: 'import', observedAt, expiresAt,
      sourceEventId: manualKind ? (sourceEventId ?? `import:${subjectKey}:${observedAt}`) : sourceEventId, reason,
      ...(typeof r['evidenceRef'] === 'string' ? { evidenceRef: r['evidenceRef'] } : {}),
    });
    if (!result.ok) return result;
    if (result.value.outcome === 'duplicate') skipped += 1; else imported += 1;
  }
  return ok({ imported, skipped });
}

// ---------------------------------------------------------------------------------------------- consumed events

const didOrUndefined = (v: unknown): string | undefined => (typeof v === 'string' && subjectKeySchema.safeParse(v).success ? v : undefined);
const text = (max = 200) => z.string().min(1).max(max);

interface Derived {
  readonly subjectKey: string;
  readonly kind: SignalKind;
  readonly weight: number;
  readonly halfLifeDays: number;
  readonly sourceEventId: string;
  readonly sourceKey?: string | undefined;
  readonly evidenceRef?: string | undefined;
  readonly sourceModule: string;
}
interface MapperContext { readonly resolveSubjectKey?: ((subjectKeyHash: string) => string | undefined) | undefined }
interface Mapping<S extends z.ZodType> {
  readonly slug: string;
  readonly type: string;
  readonly module: string;
  readonly privacy: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  readonly relayOnly?: boolean;
  readonly payload: S;
  derive(p: z.output<S>, env: EventEnvelope, ctx: MapperContext): readonly Derived[];
}
function mapping<S extends z.ZodType>(m: Mapping<S>): Mapping<S> { return m; }
const d = (kind: SignalKind, over: Partial<{ weight: number; halfLifeDays: number }> = {}) => ({ kind, weight: over.weight ?? KIND_DEFAULTS[kind].weight, halfLifeDays: over.halfLifeDays ?? KIND_DEFAULTS[kind].halfLifeDays });

const MAPPINGS = [
  mapping({
    slug: 'spam_detected', type: 'moderation.spam.detected', module: 'F12.S02.M02', privacy: 'P2', payload: z.object({ subjectKeyHash: text(), score: z.number().min(0).max(100), targetCid: z.string().max(200).optional() }),
    derive(p, env, ctx) {
      const subject = didOrUndefined(ctx.resolveSubjectKey?.(p.subjectKeyHash));
      if (!subject || p.score < 50) return [];
      // weight 5 per 10 score points above 50 (at least 1 for an emitted detection)
      const weight = Math.max(1, Math.min(100, Math.round((5 * (p.score - 50)) / 10)));
      return [{ ...d('spam_detected', { weight }), subjectKey: subject, sourceEventId: env.eventId, evidenceRef: p.targetCid, sourceModule: 'F12.S02.M02' }];
    },
  }),
  mapping({
    slug: 'shill_suspected', type: 'auctions.shill.suspected', module: 'F04', privacy: 'P3', payload: z.object({ checkId: text(), subjectId: text(128) }),
    derive: (p, env) => { const s = didOrUndefined(p.subjectId); return s ? [{ ...d('shill_suspected'), subjectKey: s, sourceEventId: env.eventId, evidenceRef: p.checkId, sourceModule: 'F04' }] : []; },
  }),
  mapping({
    slug: 'auction_voided', type: 'auctions.result.voided', module: 'F04', privacy: 'P2', payload: z.object({ resultId: text(), partyId: text(128).optional() }),
    derive: (p, env) => { const s = didOrUndefined(p.partyId); return s ? [{ ...d('auction_voided'), subjectKey: s, sourceEventId: env.eventId, evidenceRef: p.resultId, sourceModule: 'F04' }] : []; },
  }),
  mapping({
    slug: 'dispute_opened', type: 'commerce.dispute.opened', module: 'F09', privacy: 'P2', payload: z.object({ caseId: text(), openerId: text(128).optional(), respondentIds: z.array(text(128)).max(20) }),
    // Source id is case + respondent so a re-delivered or re-published event cannot double count, and resolution can find it.
    derive: (p) => p.respondentIds.flatMap((r) => { const s = didOrUndefined(r); return s ? [{ ...d('dispute_opened'), subjectKey: s, sourceEventId: `${p.caseId}#${s}`, sourceKey: didOrUndefined(p.openerId), evidenceRef: p.caseId, sourceModule: 'F09' }] : []; }),
  }),
  mapping({
    slug: 'payment_disputed', type: 'commerce.payment.disputed', module: 'F09', privacy: 'P2', payload: z.object({ claimId: text(), payeeId: text(128) }),
    derive: (p, env) => { const s = didOrUndefined(p.payeeId); return s ? [{ ...d('payment_claim_disputed'), subjectKey: s, sourceEventId: env.eventId, evidenceRef: p.claimId, sourceModule: 'F09' }] : []; },
  }),
  mapping({
    slug: 'payment_expired', type: 'commerce.payment.expired', module: 'F09', privacy: 'P2', payload: z.object({ claimId: text(), payeeId: text(128).optional() }),
    derive: (p, env) => { const s = didOrUndefined(p.payeeId); return s ? [{ ...d('payment_claim_expired'), subjectKey: s, sourceEventId: env.eventId, evidenceRef: p.claimId, sourceModule: 'F09' }] : []; },
  }),
  mapping({
    slug: 'deal_completed', type: 'commerce.deal.completed', module: 'F09', privacy: 'P2', payload: z.object({ dealId: text().optional(), parties: z.array(z.object({ did: text(128) })).max(50).optional() }),
    derive: (p, env) => [...new Set((p.parties ?? []).map((x) => didOrUndefined(x.did)).filter((x): x is string => x !== undefined))]
      .map((s) => ({ ...d('deal_completed'), subjectKey: s, sourceEventId: `${env.eventId}#${s}`, evidenceRef: p.dealId, sourceModule: 'F09' })),
  }),
  mapping({
    slug: 'meetup_no_show', type: 'comms.meetup.no_show', module: 'F08', privacy: 'P2', payload: z.object({ meetupId: text(), targetDid: text(128), reportedByDid: text(128).optional() }),
    derive: (p, env) => { const s = didOrUndefined(p.targetDid); return s ? [{ ...d('no_show'), subjectKey: s, sourceEventId: env.eventId, sourceKey: didOrUndefined(p.reportedByDid), evidenceRef: p.meetupId, sourceModule: 'F08' }] : []; },
  }),
  mapping({
    slug: 'cycle_dropout', type: 'mutiny.cycle.participant_dropped', module: 'F02', privacy: 'P2', payload: z.object({ cycleId: text(), participantId: text(128), phase: z.string().max(40) }),
    // Only a drop after the participant consented counts: before_commit drops are free.
    derive: (p, env) => { const s = didOrUndefined(p.participantId); return s && p.phase !== 'before_commit' ? [{ ...d('cycle_dropout'), subjectKey: s, sourceEventId: env.eventId, evidenceRef: p.cycleId, sourceModule: 'F02' }] : []; },
  }),
  mapping({
    slug: 'damage_claimed', type: 'rentals.damage.claimed', module: 'F05', privacy: 'P2', payload: z.object({ claimId: text(), renterId: text(128), ownerId: text(128).optional() }),
    derive: (p, env) => { const s = didOrUndefined(p.renterId); return s ? [{ ...d('damage_claimed'), subjectKey: s, sourceEventId: env.eventId, sourceKey: didOrUndefined(p.ownerId), evidenceRef: p.claimId, sourceModule: 'F05' }] : []; },
  }),
  mapping({
    slug: 'action_applied', type: 'moderation.action.applied', module: 'F12.S02.M01', privacy: 'P2', relayOnly: true, payload: z.object({ actionId: text(), kind: z.string().max(40), subjectKey: text(128) }),
    derive: (p, env) => {
      const weight = ({ warn: 10, restrict_feature: 20, suspend_relay_access: 40 } as Record<string, number>)[p.kind];
      const s = didOrUndefined(p.subjectKey);
      return s && weight !== undefined ? [{ ...d('report_actioned', { weight }), subjectKey: s, sourceEventId: p.actionId || env.eventId, evidenceRef: p.actionId, sourceModule: 'F12.S02.M01' }] : [];
    },
  }),
] as const;

const disputeResolvedView = defineEvent('commerce.dispute.resolved', 1, 'P2', z.object({ caseId: text(), resolution: z.string().max(40).optional() }));

/** Events the module maps to signals (fixed per rulesVersion), for composition-root wiring and contract tests. */
export const CONSUMED_EVENT_TYPES: readonly string[] = [...MAPPINGS.map((m) => m.type), 'commerce.dispute.resolved'];

// ---------------------------------------------------------------------------------------------- definitions

export interface SignalsOptions {
  /** `vault` (default): only the local principal reads and writes. `relay`: moderators with an open case, operators for summaries. */
  readonly mode?: 'vault' | 'relay';
  /** The unlocked local principal's key; required in vault mode. */
  readonly principalKey?: string;
  /** Relay: does this moderator have an open case on the subject? Required for moderator access in relay mode. */
  readonly hasOpenCase?: (moderatorKey: string, subjectKey: string) => boolean;
  /** Keys linked to a subject by a verified rotation statement held by this store (identity module); summaries include them. */
  readonly linkedKeys?: (subjectKey: string) => readonly string[];
  /** Maps the pseudonymous subjectKeyHash of moderation.spam.detected to the subject key (relay or vault lookup). */
  readonly resolveSubjectKey?: (subjectKeyHash: string) => string | undefined;
  readonly metrics?: MetricsRegistry;
}

/** Capability to role mapping for createRoleTableAuthz. */
export const SIGNALS_ROLES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'moderation.signal.record_manual': ['moderator', 'principal'],
  'moderation.signal.read_as_reviewer': ['moderator', 'principal'],
  'moderation.signal.read_summary': ['moderator', 'operator', 'principal'],
  'moderation.signal.read_categories': ['member', 'principal'],
});

const actorId = (a: { kind: string }): string | undefined => ('id' in a ? (a as { id: string }).id : undefined);

export function signalsDefinitions(options: SignalsOptions = {}) {
  const mode = options.mode ?? 'vault';
  const counter = options.metrics?.counter({ name: 'classrup_moderation_signals_total', help: 'Signals by outcome.', labels: ['outcome'] });

  /** Second authorization layer (vault principal or relay case access); the bus capability check already ran. */
  function access(actor: { kind: string; roles?: readonly string[] }, subjectKey: string, need: 'write' | 'review' | 'summary' | 'categories'): AppError | undefined {
    const id = actorId(actor);
    if (id === undefined) return appError('FORBIDDEN');
    if (mode === 'vault') return options.principalKey !== undefined && id === options.principalKey ? undefined : appError('NOT_FOUND');
    const roles = actor.roles ?? [];
    if (need === 'categories') return id === subjectKey || (roles.includes('moderator') && options.hasOpenCase?.(id, subjectKey) === true) ? undefined : appError('FORBIDDEN');
    if (need === 'summary' && roles.includes('operator')) return undefined;
    if (roles.includes('moderator') && options.hasOpenCase?.(id, subjectKey) === true) return undefined;
    return appError('FORBIDDEN');
  }

  const recordManual = defineCommand({
    name: 'moderation.signal.record_manual', module: SIGNALS_MODULE, capability: 'moderation.signal.record_manual', idempotent: true, surface: 'both',
    input: z.strictObject({
      subjectKey: subjectKeySchema, kind: z.enum(MANUAL_KINDS), weight: z.int().min(-100).max(100), halfLifeDays: z.int().min(7).max(180).optional(),
      reason: boundedString({ min: 10, max: 500 }), supersedesSignalId: z.string().min(1).max(64).optional(),
    }),
    output: z.strictObject({ signalId: z.string(), expiresAt: z.string() }),
    handler(ctx, input) {
      const author = actorId(ctx.actor);
      const denied = access(ctx.actor, input.subjectKey, 'write');
      if (denied) return err(denied);
      if (author === undefined || author === input.subjectKey) return err(appError('FORBIDDEN'));
      const bad = (path: string) => err(appError('VALIDATION_FAILED', { fields: [{ path, code: 'INVALID' }] }));
      if (input.kind === 'compensation' ? input.supersedesSignalId === undefined : input.supersedesSignalId !== undefined) return bad('supersedesSignalId');
      if (input.kind === 'manual_concern' && input.weight <= 0) return bad('weight');
      if (input.kind === 'manual_positive' && input.weight >= 0) return bad('weight');
      let halfLifeDays = input.halfLifeDays ?? KIND_DEFAULTS[input.kind].halfLifeDays;
      let weight = input.weight;
      let anchorAt: string | undefined;
      let expiresAt: string | undefined;
      if (input.supersedesSignalId !== undefined) {
        const target = ctx.tx.repo(signalRepo).get(input.supersedesSignalId);
        if (!target || target.data.subjectKey !== input.subjectKey || target.data.kind === 'compensation') return err(appError('NOT_FOUND'));
        if (input.weight !== -target.data.weight) return bad('weight');
        weight = -target.data.weight;
        halfLifeDays = target.data.halfLifeDays;
        anchorAt = target.data.anchorAt ?? target.data.observedAt;
        expiresAt = target.data.expiresAt;
      }
      const now = ctx.clock.now();
      // Manual cap: net manual weight about one subject within 30 days stays within +-20.
      const recent = subjectRows(ctx.tx, input.subjectKey, { sinceIso: new Date(now - MANUAL_WINDOW_MS).toISOString() }).filter((r) => r.data.sourceModule === 'manual');
      const net = recent.reduce((s, r) => s + r.data.weight, 0);
      if (Math.abs(net + weight) > MANUAL_CAP) { counter?.inc({ outcome: 'capped' }); return err(signalErrors.make('SIGNALS_MANUAL_CAP')); }
      // At most 10 manual signals per author per day.
      const day = ctx.tx.repo(signalRepo).query({ where: { source: { gte: `m${sep}${author}${sep}${new Date(now - DAY_MS).toISOString()}`, lt: `m${sep}${author}${sep}\u{10FFFF}` } }, limit: AUTHOR_PER_DAY });
      if (!day.ok) return day;
      if (day.value.items.length >= AUTHOR_PER_DAY) return err(appError('RATE_LIMITED', { retryAfterMs: DAY_MS, params: { retryAfterMs: DAY_MS } }));
      const r = insertSignal(ctx, {
        subjectKey: input.subjectKey, kind: input.kind, weight, halfLifeDays, sourceModule: 'manual', authorKey: author, reason: input.reason, anchorAt, expiresAt,
        ...(input.supersedesSignalId !== undefined ? { evidenceRef: `compensates:${input.supersedesSignalId}`, supersedesSignalId: input.supersedesSignalId } : {}),
      });
      if (!r.ok) return r;
      if (r.value.outcome === 'duplicate') return err(signalErrors.make('SIGNALS_DUPLICATE_SOURCE'));
      counter?.inc({ outcome: 'recorded' });
      return ok({ signalId: r.value.record.id, expiresAt: r.value.record.data.expiresAt });
    },
  });

  const listForSubject = defineQuery({
    name: 'moderation.signal.list_for_subject', module: SIGNALS_MODULE, capability: 'moderation.signal.read_as_reviewer', surface: 'both', hideForbidden: true,
    input: z.strictObject({ subjectKey: subjectKeySchema, since: timestamp().optional(), kind: z.enum(SIGNAL_KINDS).optional(), cursor: z.string().max(500).optional(), limit: z.int().min(1).max(100).default(50) }),
    handler(ctx, input) {
      const denied = access(ctx.actor, input.subjectKey, 'review');
      if (denied) return err(denied);
      const page = ctx.tx.repo(signalRepo).query({
        where: { subjectObs: { gte: `${input.subjectKey}${sep}${input.since ?? ''}`, lt: `${input.subjectKey}${sep}\u{10FFFF}` } }, orderBy: 'subjectObs', limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}),
      });
      if (!page.ok) return page;
      const now = ctx.clock.now();
      const items = page.value.items.filter((r) => input.kind === undefined || r.data.kind === input.kind)
        .map((r) => ({ signalId: r.id, ...r.data, decayedWeight: Date.parse(r.data.expiresAt) > now && !r.data.capped ? decayedWeight(r.data, now) : 0 }));
      return ok({ items, ...(page.value.nextCursor ? { nextCursor: page.value.nextCursor } : {}) });
    },
  });

  const summarize = defineQuery({
    name: 'moderation.signal.summarize', module: SIGNALS_MODULE, capability: 'moderation.signal.read_summary', surface: 'both', hideForbidden: true,
    input: z.strictObject({ subjectKey: subjectKeySchema, asOf: timestamp().optional() }),
    handler(ctx, input) {
      const denied = access(ctx.actor, input.subjectKey, 'summary');
      if (denied) return err(denied);
      const asOf = input.asOf !== undefined ? Date.parse(input.asOf) : ctx.clock.now();
      const keys = [input.subjectKey, ...(options.linkedKeys?.(input.subjectKey) ?? []).filter((k) => subjectKeySchema.safeParse(k).success && k !== input.subjectKey)];
      return ok(summarizeSignals(keys.flatMap((k) => subjectRows(ctx.tx, k).map((r) => r.data)), asOf));
    },
  });

  const categoriesOwn = defineQuery({
    name: 'moderation.signal.categories_own', module: SIGNALS_MODULE, capability: 'moderation.signal.read_categories', surface: 'both', hideForbidden: true,
    input: z.strictObject({ subjectKey: subjectKeySchema, windowDays: z.int().min(1).max(90).default(90) }),
    handler(ctx, input) {
      const denied = access(ctx.actor, input.subjectKey, 'categories');
      if (denied) return err(denied);
      const now = ctx.clock.now();
      const since = new Date(now - input.windowDays * DAY_MS).toISOString();
      const byKind: Record<string, number> = {};
      for (const r of subjectRows(ctx.tx, input.subjectKey, { sinceIso: since })) {
        if (r.data.capped || Date.parse(r.data.expiresAt) <= now) continue;
        byKind[r.data.kind] = (byKind[r.data.kind] ?? 0) + 1;
      }
      return ok({ byKind });
    },
  });

  /** Ingestion shared by every consumer: validated, deduplicated by source event, appended with its event. */
  function ingestAll(ctx: ConsumerContext, env: EventEnvelope, derived: readonly Derived[]): Result<void, AppError> {
    for (const x of derived) {
      const claimedAt = timestamp().safeParse(env.occurredAt).success ? env.occurredAt : undefined;
      const r = insertSignal(ctx, { ...x, claimedAt });
      if (!r.ok) return r;
      counter?.inc({ outcome: r.value.outcome === 'duplicate' ? 'duplicate' : r.value.outcome });
    }
    return ok(undefined);
  }
  /** In a vault, events that stem from remote statements need a verified signature; local events are produced by verified local state. */
  const trusted = (env: EventEnvelope): boolean => mode === 'relay' || env.actor.kind !== 'federated' || env.provenance.sig !== null;

  const subscribers = MAPPINGS.map((m) => {
    const view = defineEvent(m.type, 1, m.privacy, m.payload);
    return defineSubscriber({
      name: `moderation.signals_${m.slug}`, module: SIGNALS_MODULE, events: [view],
      handler(ctx: ConsumerContext, env) {
        if ((m.relayOnly && mode !== 'relay') || !trusted(env)) return ok(undefined);
        const parsed = m.payload.safeParse(env.payload);
        if (!parsed.success) return ok(undefined);
        return ingestAll(ctx, env, m.derive(parsed.data as never, env, { resolveSubjectKey: options.resolveSubjectKey }));
      },
    });
  });

  const onDisputeResolved = defineSubscriber({
    name: 'moderation.signals_dispute_resolved', module: SIGNALS_MODULE, events: [disputeResolvedView],
    handler(ctx: ConsumerContext, env) {
      if (!trusted(env)) return ok(undefined);
      const { caseId, resolution } = env.payload;
      const respondentPrevailed = resolution === 'no_fault_close' || resolution === 'lapsed';
      const openerPrevailed = resolution === 'refund_claimed' || resolution === 'return_agreed';
      if (!respondentPrevailed && !openerPrevailed) return ok(undefined);
      const page = ctx.tx.repo(signalRepo).query({ where: { ref: caseId }, limit: 100 });
      if (!page.ok) return page;
      for (const rec of page.value.items.filter((r) => r.data.kind === 'dispute_opened')) {
        const r = respondentPrevailed
          // A compensation cancels the opened signal exactly; both stay visible.
          ? insertSignal(ctx, {
            subjectKey: rec.data.subjectKey, kind: 'compensation', weight: -rec.data.weight, halfLifeDays: rec.data.halfLifeDays, sourceModule: 'F09', sourceEventId: `compensates:${rec.id}`,
            supersedesSignalId: rec.id, anchorAt: rec.data.observedAt, expiresAt: rec.data.expiresAt, evidenceRef: `compensates:${rec.id}`,
          })
          : insertSignal(ctx, { ...d('dispute_lost'), subjectKey: rec.data.subjectKey, sourceModule: 'F09', sourceEventId: `${caseId}#${rec.data.subjectKey}`, evidenceRef: caseId });
        if (!r.ok) return r;
        counter?.inc({ outcome: r.value.outcome === 'duplicate' ? 'duplicate' : r.value.outcome });
      }
      return ok(undefined);
    },
  });

  return {
    recordManual, listForSubject, summarize, categoriesOwn, subscribers, onDisputeResolved,
    all: [recordManual, listForSubject, summarize, categoriesOwn, ...subscribers, onDisputeResolved] as const,
  };
}
