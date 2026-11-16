// F13.S02.M04 (PS-106) In-app notification preferences: the category x channel matrix in the user's vault.
// The in-app column never leaves the device; only the push and email columns are mirrored, as a signed statement, to relays that
// hold the user's channel consent (ADR-0016: a relay never authors or changes the user's matrix).
import { appError, canonicalJson, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, defineSubscriber, err, ok, timestamp, z,
  type AppError, type CommandContext, type ConsumerContext, type ReadScope, type Result, type SignedEnvelope, type StoredRecord } from '@classrup/kernel';
import { hasActiveConsent, optedIn, optedOut } from '../opt/index.ts';

export const MODULE = 'F13.S02.M04';
export const PREFERENCE_MIRROR_STATEMENT = 'classrup.notify.preference_mirror/v1';
export const CATEGORIES = ['offers', 'cycles', 'messages', 'auctions', 'bookings', 'moderation', 'security'] as const;
export type Category = (typeof CATEGORIES)[number];
export const DEFAULTS_VERSION = 1;
export const MAX_EDITS_PER_HOUR = 60;
export const MAX_MIRRORS_PER_HOUR = 30;
const HOUR_MS = 3_600_000;

export interface Cell { inApp: boolean; push: boolean; email: boolean }
/** Golden default matrix, defaults version 1: in-app on everywhere, push on except moderation, email only for security. */
export const DEFAULT_MATRIX: Readonly<Record<Category, Readonly<Cell>>> = Object.freeze({
  offers: { inApp: true, push: true, email: false }, cycles: { inApp: true, push: true, email: false }, messages: { inApp: true, push: true, email: false },
  auctions: { inApp: true, push: true, email: false }, bookings: { inApp: true, push: true, email: false }, moderation: { inApp: true, push: false, email: false },
  security: { inApp: true, push: true, email: true },
});
export const isCategory = (v: unknown): v is Category => typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);

export const prefErrors = defineErrors({ NOTIFY_PREF_LOCKED: { status: 422, retryable: false } });

const preferenceSchema = z.strictObject({
  userDid: z.string().startsWith('did:key:').max(128), category: z.enum(CATEGORIES), inApp: z.boolean(), push: z.boolean(), email: z.boolean(), inAppLocked: z.boolean(),
  defaultsVersion: z.int().min(1), mirrorSeq: z.int().min(0), updatedAtClaim: timestamp(),
}).refine(d => d.category !== 'security' || (d.inApp && d.inAppLocked), { message: 'security in-app is locked on' })
  .refine(d => d.inAppLocked === (d.category === 'security'));
export type NotificationPreference = z.output<typeof preferenceSchema>;
export const preferenceRepo = defineRepo({ type: 'notify.preference', schema: preferenceSchema, indexes: {} });
const stateRepo = defineRepo({ type: 'notify.pref_state', schema: z.strictObject({ mirrorSeq: z.int().min(0), lastMirrorCid: z.string().optional() }), indexes: {} });
const channelRepo = defineRepo({ type: 'notify.pref_channel', schema: z.strictObject({ relayIds: z.array(z.string().max(253)).max(32) }), indexes: {} });
const counterRepo = defineRepo({ type: 'notify.pref_counter', schema: z.strictObject({ count: z.int().min(0) }), indexes: {} });
const mirrorSchema = z.strictObject({ userDid: z.string(), seq: z.int().min(1), cid: z.string(), cells: z.array(z.strictObject({ category: z.enum(CATEGORIES), push: z.boolean(), email: z.boolean() })).length(7), receiptAt: timestamp() });
export const mirrorRepo = defineRepo({ type: 'notify.pref_mirror', schema: mirrorSchema, indexes: {} });

/** Mirror statement body: only category, push and email, plus userDid and a strictly increasing seq; no in-app column. */
export const mirrorStatementSchema = z.strictObject({
  userDid: z.string().startsWith('did:key:').max(128), seq: z.int().min(1),
  cells: z.array(z.strictObject({ category: z.enum(CATEGORIES), push: z.boolean(), email: z.boolean() })).length(7),
}).refine(v => new Set(v.cells.map(c => c.category)).size === 7);
export type MirrorStatement = z.output<typeof mirrorStatementSchema>;

const CHANNELS_CHANGED = ['in_app', 'push', 'email'] as const;
export const preferenceChanged = defineEvent('notify.preference.changed', 1, 'P2', z.strictObject({
  userDid: z.string(), categories: z.array(z.enum(CATEGORIES)).max(7), channelsChanged: z.array(z.enum(CHANNELS_CHANGED)).max(3), mirrorSeq: z.int().min(1).optional(), defaultsVersion: z.int().min(1),
}));

export interface VerifiedStatement { readonly author: string; readonly type: string; readonly payload: unknown; readonly cid: string; readonly seq: number }
export interface PreferenceOptions {
  localPrincipal(): string;
  signStatement(type: string, payload: unknown, seq: number, previousCid: string | null): Promise<SignedEnvelope>;
  verifyStatement(envelope: unknown): Promise<VerifiedStatement>;
  /** Present only in a relay process. */
  readonly relay?: { readonly relayId: string; signReceipt(payload: unknown): Promise<string> };
}
export type MirrorState = 'none' | 'local_committed' | 'prepared' | 'transport_acknowledged' | 'peer_accepted';

const MIRROR_ORDER: readonly MirrorState[] = ['local_committed', 'prepared', 'transport_acknowledged', 'peer_accepted'];
/** Mirror state from the sync entries of get_matrix.mirrorRef (all destinations): the least advanced one, never ahead of any relay receipt. */
export function mirrorStateOf(entries: readonly { readonly state: string }[]): MirrorState {
  if (entries.length === 0) return 'none';
  return entries.reduce<MirrorState>((low, e) => {
    const s: MirrorState = e.state === 'failed' ? 'local_committed' : (e.state as MirrorState);
    return MIRROR_ORDER.indexOf(s) < MIRROR_ORDER.indexOf(low) ? s : low;
  }, 'peer_accepted');
}

type WriteCtx = Pick<CommandContext, 'tx' | 'emit' | 'clock' | 'ids'>;
const iso = (ms: number) => new Date(ms).toISOString();
type Row = StoredRecord<NotificationPreference>;
const present = (r: Row) => ({ id: r.id, revision: r.revision, ...r.data });
const cellOf = (d: Cell): Cell => ({ inApp: d.inApp, push: d.push, email: d.email });

/** In-app flag of a category for the routing of F13.S01.M03; security is always on and unknown categories default to on. */
export function inAppEnabled(tx: ReadScope, category: string): boolean {
  if (category === 'security') return true;
  const rec = isCategory(category) ? tx.repo(preferenceRepo).get(category) : undefined;
  return rec ? rec.data.inApp : true;
}

function materialize(ctx: WriteCtx, principal: string): Result<Row[], AppError> {
  const repo = ctx.tx.repo(preferenceRepo);
  const rows: Row[] = [];
  for (const category of CATEGORIES) {
    const cur = repo.get(category);
    if (cur) { rows.push(cur); continue; }
    const d = DEFAULT_MATRIX[category];
    const saved = repo.put(category, { userDid: principal, category, ...d, inAppLocked: category === 'security', defaultsVersion: DEFAULTS_VERSION, mirrorSeq: 0, updatedAtClaim: iso(ctx.clock.now()) }, { expectedRevision: 0 });
    if (!saved.ok) return saved;
    rows.push(saved.value);
  }
  return ok(rows);
}
function consume(ctx: WriteCtx, key: string, limit: number, windowMs: number): boolean {
  const repo = ctx.tx.repo(counterRepo);
  const id = `${key}/${Math.floor(ctx.clock.now() / windowMs)}`;
  const cur = repo.get(id);
  if ((cur?.data.count ?? 0) >= limit) return false;
  return repo.put(id, { count: (cur?.data.count ?? 0) + 1 }, { expectedRevision: cur?.revision ?? 0 }).ok;
}
function mirrorTargets(ctx: Pick<CommandContext, 'tx'>): string[] {
  const out = new Set<string>();
  for (const channel of ['push', 'email']) for (const id of ctx.tx.repo(channelRepo).get(channel)?.data.relayIds ?? []) out.add(id);
  return [...out];
}

export function prefDefinitions(options: PreferenceOptions) {
  const localActor = (ctx: Pick<CommandContext, 'actor'>) => (ctx.actor.kind === 'user' && ctx.actor.id === options.localPrincipal() ? ctx.actor.id : undefined);

  /** Signs the complete push and email columns with the next seq and queues it for each destination relay. */
  async function sendMirror(ctx: WriteCtx, rows: readonly Row[], destinations: readonly string[], principal: string): Promise<Result<number, AppError>> {
    const state = ctx.tx.repo(stateRepo).get('state');
    const seq = (state?.data.mirrorSeq ?? 0) + 1;
    const payload: MirrorStatement = { userDid: principal, seq, cells: CATEGORIES.map(category => { const r = rows.find(x => x.id === category); return { category, push: r?.data.push ?? false, email: r?.data.email ?? false }; }) };
    let envelope: SignedEnvelope;
    try {
      envelope = structuredClone(await options.signStatement(PREFERENCE_MIRROR_STATEMENT, payload, seq, state?.data.lastMirrorCid ?? null));
      const verified = await options.verifyStatement(envelope);
      if (verified.author !== principal || verified.type !== PREFERENCE_MIRROR_STATEMENT || canonicalJson(verified.payload) !== canonicalJson(payload) || verified.cid !== envelope.cid) return err(appError('FORBIDDEN'));
    } catch { return err(appError('VALIDATION_FAILED')); }
    const saved = ctx.tx.repo(stateRepo).put('state', { mirrorSeq: seq, lastMirrorCid: envelope.cid }, { expectedRevision: state?.revision ?? 0 });
    if (!saved.ok) return saved;
    for (const destination of destinations) ctx.tx.sync.enqueue(destination, envelope);
    return ok(seq);
  }

  /**
   * Plans, mirrors and writes target cell values (shared by set and reset): validates every cell revision first, signs the complete
   * push and email columns when they change and a relay holds consent, then writes each changed cell once and emits the event.
   */
  async function commit(ctx: WriteCtx, principal: string, rows: Row[], targets: ReadonlyMap<string, Partial<Cell>>, checkRevision: ReadonlyMap<string, number> | undefined): Promise<Result<{ mirrorState: MirrorState }, AppError>> {
    const plan: Array<{ row: Row; next: Cell }> = [];
    const channels = new Set<(typeof CHANNELS_CHANGED)[number]>();
    for (const [category, want] of targets) {
      const row = rows.find(r => r.id === category);
      if (!row) return err(appError('INTERNAL'));
      const next: Cell = { ...cellOf(row.data), ...want };
      const same = next.inApp === row.data.inApp && next.push === row.data.push && next.email === row.data.email;
      const expected = checkRevision?.get(category);
      if (expected !== undefined && expected !== row.revision && !same) return err(appError('CONFLICT_REVISION'));
      if (same) continue;
      plan.push({ row, next });
      if (next.inApp !== row.data.inApp) channels.add('in_app');
      if (next.push !== row.data.push) channels.add('push');
      if (next.email !== row.data.email) channels.add('email');
    }
    if (plan.length === 0) return ok({ mirrorState: 'none' });
    const destinations = mirrorTargets(ctx);
    let mirrorSeq: number | undefined;
    if ((channels.has('push') || channels.has('email')) && destinations.length > 0) {
      const prospective = rows.map(r => { const p = plan.find(x => x.row === r); return p ? { ...r, data: { ...r.data, ...p.next } } : r; });
      const sent = await sendMirror(ctx, prospective, destinations, principal);
      if (!sent.ok) return sent;
      mirrorSeq = sent.value;
    }
    const repo = ctx.tx.repo(preferenceRepo);
    for (const { row, next } of plan) {
      const saved = repo.put(row.id, { ...row.data, ...next, mirrorSeq: mirrorSeq ?? row.data.mirrorSeq, updatedAtClaim: iso(ctx.clock.now()) }, { expectedRevision: row.revision });
      if (!saved.ok) return saved;
      rows[rows.indexOf(row)] = saved.value;
    }
    ctx.emit(preferenceChanged, { aggregate: { type: 'preference_matrix', id: principal }, revision: Math.max(...rows.map(r => r.revision)), payload: {
      userDid: principal, categories: plan.map(p => p.row.id as Category), channelsChanged: [...channels], ...(mirrorSeq ? { mirrorSeq } : {}), defaultsVersion: DEFAULTS_VERSION } });
    return ok({ mirrorState: mirrorSeq ? 'local_committed' : 'none' });
  }

  const set = defineCommand({ name: 'notify.preference.set', module: MODULE, capability: 'notify.preference.set', idempotent: true, deliveryEligible: true,
    input: z.strictObject({ cells: z.array(z.strictObject({ category: z.string().min(1).max(32), inApp: z.boolean().optional(), push: z.boolean().optional(), email: z.boolean().optional(), expectedRevision: z.int().min(1) })).min(1).max(21) }),
    async handler(ctx, input) {
      const principal = localActor(ctx);
      if (!principal) return err(appError('FORBIDDEN'));
      const seen = new Set<string>();
      for (const c of input.cells) {
        if (!isCategory(c.category) || seen.has(c.category)) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'cells.category', code: 'UNKNOWN_OR_DUPLICATE' }] }));
        seen.add(c.category);
      }
      if (input.cells.some(c => c.category === 'security' && c.inApp === false)) return err(prefErrors.make('NOTIFY_PREF_LOCKED'));
      if (!consume(ctx, 'edit', MAX_EDITS_PER_HOUR, HOUR_MS)) return err(appError('RATE_LIMITED', { retryAfterMs: HOUR_MS }));
      const rows = materialize(ctx, principal);
      if (!rows.ok) return rows;
      const targets = new Map(input.cells.map(c => [c.category, { ...(c.inApp !== undefined ? { inApp: c.inApp } : {}), ...(c.push !== undefined ? { push: c.push } : {}), ...(c.email !== undefined ? { email: c.email } : {}) }]));
      const done = await commit(ctx, principal, rows.value, targets, new Map(input.cells.map(c => [c.category, c.expectedRevision])));
      if (!done.ok) return done;
      const touched = new Set(input.cells.map(c => c.category));
      return ok({ cells: rows.value.filter(r => touched.has(r.id)).map(present), mirrorState: done.value.mirrorState });
    },
  });

  const reset = defineCommand({ name: 'notify.preference.reset', module: MODULE, capability: 'notify.preference.set', idempotent: true, deliveryEligible: true,
    input: z.strictObject({ confirm: z.literal(true) }),
    async handler(ctx) {
      const principal = localActor(ctx);
      if (!principal) return err(appError('FORBIDDEN'));
      if (!consume(ctx, 'edit', MAX_EDITS_PER_HOUR, HOUR_MS)) return err(appError('RATE_LIMITED', { retryAfterMs: HOUR_MS }));
      const rows = materialize(ctx, principal);
      if (!rows.ok) return rows;
      const done = await commit(ctx, principal, rows.value, new Map(CATEGORIES.map(c => [c, DEFAULT_MATRIX[c]])), undefined);
      if (!done.ok) return done;
      return ok({ cells: rows.value.map(present), defaultsVersion: DEFAULTS_VERSION });
    },
  });

  const mirror = defineCommand({ name: 'notify.preference.mirror', module: MODULE, capability: 'notify.preference.mirror', surface: 'relay', idempotent: true,
    input: z.strictObject({ statement: z.unknown() }),
    async handler(ctx, input) {
      if (ctx.actor.kind === 'anonymous') return err(appError('UNAUTHENTICATED'));
      const relay = options.relay;
      if (!relay) return err(appError('FEATURE_DISABLED'));
      let verified: VerifiedStatement;
      try { verified = await options.verifyStatement(structuredClone(input.statement)); } catch { return err(appError('PRECONDITION_FAILED')); }
      const parsed = verified.type === PREFERENCE_MIRROR_STATEMENT ? mirrorStatementSchema.safeParse(verified.payload) : undefined;
      if (!parsed?.success) return err(appError('VALIDATION_FAILED'));
      const p = parsed.data;
      if (verified.author !== p.userDid || !hasActiveConsent(ctx.tx, p.userDid, relay.relayId, undefined, ctx.clock.now())) return err(appError('PRECONDITION_FAILED'));
      const repo = ctx.tx.repo(mirrorRepo);
      const cur = repo.get(p.userDid);
      const receipt = async (r: { seq: number; cid: string; receiptAt: string }) => ok({ seq: r.seq, relayReceiptAt: r.receiptAt, relayReceiptSig: await relay.signReceipt({ userDid: p.userDid, seq: r.seq, statementCid: r.cid, relayReceiptAt: r.receiptAt }) });
      if (cur && p.seq <= cur.data.seq) return p.seq === cur.data.seq && cur.data.cid === verified.cid ? receipt(cur.data) : err(appError('CONFLICT_STATE'));
      if (!consume(ctx, `mirror/${p.userDid}`, MAX_MIRRORS_PER_HOUR, HOUR_MS)) return err(appError('RATE_LIMITED', { retryAfterMs: HOUR_MS }));
      const data = { userDid: p.userDid, seq: p.seq, cid: verified.cid, cells: p.cells, receiptAt: iso(ctx.clock.now()) };
      const saved = repo.put(p.userDid, data, { expectedRevision: cur?.revision ?? 0 });
      return saved.ok ? receipt(data) : saved;
    },
  });

  const getMatrix = defineQuery({ name: 'notify.preference.get_matrix', module: MODULE, capability: 'notify.preference.read_own', input: z.strictObject({}),
    handler(ctx) {
      if (ctx.actor.kind !== 'user' || ctx.actor.id !== options.localPrincipal()) return err(appError('FORBIDDEN'));
      const repo = ctx.tx.repo(preferenceRepo);
      const stored = CATEGORIES.map(c => repo.get(c));
      const cells = CATEGORIES.map((category, i) => { const r = stored[i]; return r ? present(r)
        : { id: category, revision: 1, userDid: ctx.actor.kind === 'user' ? ctx.actor.id : '', category, ...DEFAULT_MATRIX[category], inAppLocked: category === 'security', defaultsVersion: DEFAULTS_VERSION, mirrorSeq: 0, updatedAtClaim: iso(ctx.clock.now()) }; });
      const active = (c: string) => (ctx.tx.repo(channelRepo).get(c)?.data.relayIds.length ?? 0) > 0;
      const mirrorRef = ctx.tx.repo(stateRepo).get('state')?.data.lastMirrorCid ?? null;
      return ok({ cells, channelStatus: { push: active('push'), email: active('email') }, defaultsVersion: DEFAULTS_VERSION, mirrorRef });
    },
  });

  const resolve = defineQuery({ name: 'notify.preference.resolve', module: MODULE, capability: 'notify.preference.resolve', surface: 'relay',
    input: z.strictObject({ userDid: z.string().startsWith('did:key:').max(128), category: z.string().min(1).max(32), channel: z.enum(['push', 'email']) }),
    handler(ctx, input) {
      // Relay-internal: only the relay's own dispatch gate (a system or relay actor) may ask; no user can read another user's matrix.
      if (ctx.actor.kind !== 'system' && ctx.actor.kind !== 'relay') return err(appError('FORBIDDEN'));
      const relay = options.relay;
      if (!relay) return err(appError('FEATURE_DISABLED'));
      const rec = ctx.tx.repo(mirrorRepo).get(input.userDid);
      if (!rec) return err(appError('NOT_FOUND'));
      const cell = rec.data.cells.find(c => c.category === input.category);
      const allowed = cell !== undefined && cell[input.channel] && hasActiveConsent(ctx.tx, input.userDid, relay.relayId, input.channel, ctx.clock.now());
      return ok({ allowed, seq: rec.data.seq });
    },
  });

  /** The relay that now holds the consent gets the complete push and email columns. */
  const onOptedIn = defineSubscriber({ name: 'notify.preference_channel_opted_in', module: MODULE, events: [optedIn], deliveryEligible: true,
    async handler(ctx: ConsumerContext, env) {
      const principal = options.localPrincipal();
      if (env.payload.userDid !== principal) return ok(undefined);
      const repo = ctx.tx.repo(channelRepo);
      const cur = repo.get(env.payload.channel);
      const relayIds = [...new Set([...(cur?.data.relayIds ?? []), env.payload.relayId])];
      const saved = repo.put(env.payload.channel, { relayIds }, { expectedRevision: cur?.revision ?? 0 });
      if (!saved.ok) return saved;
      const rows = materialize(ctx, principal);
      if (!rows.ok) return rows;
      const sent = await sendMirror(ctx, rows.value, [env.payload.relayId], principal);
      return sent.ok ? ok(undefined) : sent;
    } });
  /** The channel shows inactive; stored flags are kept (the relay already stops sending). */
  const onOptedOut = defineSubscriber({ name: 'notify.preference_channel_opted_out', module: MODULE, events: [optedOut],
    handler(ctx: ConsumerContext, env) {
      if (env.payload.userDid !== options.localPrincipal()) return ok(undefined);
      const repo = ctx.tx.repo(channelRepo);
      const cur = repo.get(env.payload.channel);
      if (!cur) return ok(undefined);
      const saved = repo.put(env.payload.channel, { relayIds: cur.data.relayIds.filter(id => id !== env.payload.relayId) }, { expectedRevision: cur.revision });
      return saved.ok ? ok(undefined) : saved;
    } });

  return { set, reset, mirror, getMatrix, resolve, onOptedIn, onOptedOut, all: [set, reset, mirror, getMatrix, resolve, onOptedIn, onOptedOut] as const };
}
