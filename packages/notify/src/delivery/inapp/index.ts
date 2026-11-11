// F13.S01.M03 (PS-103) In-app notifications: a local, content-free inbox derived from domain events through a routing table.
// Rows hold category, template key and an opaque reference only; titles are rendered on the device. Nothing here needs a relay.
import { appError, defineCommand, defineEvent, defineQuery, defineRepo, defineSubscriber, err, isUuidV7, ok, timestamp, uuidv7, z,
  type AppError, type CommandContext, type ConsumerContext, type EventEnvelope, type ReadScope, type Result, type StoredRecord } from '@classrup/kernel';
import { inAppEnabled, preferenceChanged } from '../../preferences/in/index.ts';
import { CATEGORIES, REF_TYPES, ROUTES, ROUTE_BY_TYPE, TEMPLATE_KEYS, URGENT_TEMPLATES, type NotifyCategory, type Route } from './routing.ts';

export { CATEGORIES, REF_TYPES, ROUTES, ROUTE_BY_TYPE, TEMPLATE_KEYS, URGENT_TEMPLATES, type NotifyCategory, type Route } from './routing.ts';
export const MODULE = 'F13.S01.M03';
export const INBOX_CAP = 500;
export const COLLAPSE_WINDOW_MS = 10 * 60_000;
export const RETENTION_MS = 30 * 86_400_000;
export const PER_SOURCE_DAILY_CAP = 50;
const DAY_MS = 86_400_000;
const MAX_COUNT = 9999;

const notificationSchema = z.strictObject({
  userDid: z.string().startsWith('did:key:').max(128), category: z.enum(CATEGORIES), templateKey: z.string().min(1).max(80),
  ref: z.strictObject({ type: z.enum(REF_TYPES), id: z.string() }).optional(), collapseKey: z.string().regex(/^[A-Za-z0-9_.-]{1,64}$/).optional(),
  count: z.int().min(1).max(MAX_COUNT), urgency: z.enum(['normal', 'urgent']), muted: z.boolean(), sourceEventIds: z.array(z.string()).max(20),
  status: z.enum(['unread', 'read']), createdAt: timestamp(), updatedAt: timestamp(), readAt: timestamp().optional(),
}).refine(d => d.urgency === 'normal' || d.category === 'security');
export type Notification = z.output<typeof notificationSchema>;
export const notificationRepo = defineRepo({ type: 'notify.notification', schema: notificationSchema, indexes: {
  status: d => d.status, category: d => d.category, created: d => d.createdAt,
  collapse: d => (d.status === 'unread' && d.collapseKey ? `${d.templateKey}\u0001${d.collapseKey}` : null),
} });
const seenRepo = defineRepo({ type: 'notify.notification_seen', schema: z.strictObject({ notificationId: z.string().nullable(), at: timestamp() }), indexes: { at: d => d.at } });
const dayRepo = defineRepo({ type: 'notify.notification_day', schema: z.strictObject({ count: z.int().min(0) }), indexes: {} });
const diagSchema = z.strictObject({ created: z.int().min(0), collapsed: z.int().min(0), read: z.int().min(0), dropped: z.int().min(0), hidden: z.int().min(0), total: z.int().min(0) });
type Diagnostics = z.output<typeof diagSchema>;
const diagRepo = defineRepo({ type: 'notify.notification_diag', schema: diagSchema, indexes: {} });
const ZERO: Diagnostics = { created: 0, collapsed: 0, read: 0, dropped: 0, hidden: 0, total: 0 };

export const notificationCreated = defineEvent('notify.notification.created', 1, 'P2', z.strictObject({
  notificationId: z.string(), category: z.enum(CATEGORIES), templateKey: z.string(), ref: z.strictObject({ type: z.enum(REF_TYPES), id: z.string() }).optional(),
  urgency: z.enum(['normal', 'urgent']), collapsed: z.boolean(), count: z.int().min(1).max(MAX_COUNT), muted: z.boolean(),
}));
export const notificationRead = defineEvent('notify.notification.read', 1, 'P2', z.strictObject({ notificationId: z.string(), category: z.enum(CATEGORIES), readAt: timestamp() }));
/** Routed events are declared by their spec names; payloads are read leniently and validated against the routing row. */
const routedEvents = ROUTES.map(row => defineEvent(row.type, 1, 'P2', z.looseObject({})));

export interface InAppOptions {
  /** The unlocked local principal; a notification is only ever created for this DID (N4). */
  localPrincipal(): string;
  /** F07.S02.M02 isBlockedEither (N7): blocked actors never create notifications. */
  isBlocked(did: string): boolean;
  /** F08.S01.M02 thread mute: muted message alerts are created silently. */
  isThreadMuted(threadId: string): boolean;
}
type WriteCtx = Pick<CommandContext, 'tx' | 'emit' | 'clock' | 'ids'>;
type Row = StoredRecord<Notification>;
const iso = (ms: number) => new Date(ms).toISOString();
const present = (r: Row) => ({ id: r.id, revision: r.revision, ...r.data });

export interface CreateInput {
  readonly sourceEventId: string; readonly category: NotifyCategory; readonly templateKey: string;
  readonly ref?: { type: (typeof REF_TYPES)[number]; id: string } | undefined; readonly collapseKey?: string | undefined; readonly urgency?: 'normal' | 'urgent' | undefined;
  readonly muted?: boolean | undefined; /** Acting party of the source event, when it has one. */ readonly actorDid?: string | undefined; /** Occurrence time of the source event. */ readonly eventAt?: string | undefined;
}
export interface CreateOutput { notificationId: string | null; created: boolean; collapsed: boolean; count: number }

/** Generic text used when a template cannot be rendered, so no alert is lost (failure_recovery_idempotency). */
export const GENERIC_FALLBACK = Object.freeze({ title: 'New notification', line: 'Open the app to see what changed.' });
/** Renders on the device from the template key; a missing or failing renderer falls back to generic text. */
export function renderNotification(n: Pick<Notification, 'templateKey' | 'ref'>, render?: (templateKey: string, ref: Notification['ref']) => { title: string; line: string } | undefined): { title: string; line: string; fallback: boolean } {
  try {
    const out = render?.(n.templateKey, n.ref);
    if (out && out.title.length > 0) return { ...out, fallback: false };
  } catch { /* fall through to the generic text */ }
  return { ...GENERIC_FALLBACK, fallback: true };
}

export function readDiagnostics(tx: ReadScope): Diagnostics {
  return tx.repo(diagRepo).get('counters')?.data ?? ZERO;
}

export function inAppDefinitions(options: InAppOptions) {
  const diagOf = (ctx: WriteCtx) => ctx.tx.repo(diagRepo).get('counters');
  function bump(ctx: WriteCtx, delta: Partial<Diagnostics>): void {
    const cur = diagOf(ctx);
    const base = cur?.data ?? ZERO;
    const next = { ...base }; for (const k of Object.keys(delta) as (keyof Diagnostics)[]) next[k] = Math.max(0, base[k] + (delta[k] ?? 0));
    ctx.tx.repo(diagRepo).put('counters', next, { expectedRevision: cur?.revision ?? 0 });
  }
  function remove(ctx: WriteCtx, rec: Row): void {
    ctx.tx.repo(notificationRepo).remove(rec.id, { expectedRevision: rec.revision });
    bump(ctx, { total: -1, dropped: 1 });
  }
  /** Cap of 500: oldest read first, then oldest unread non-security, security last and only after 30 days. */
  function makeRoom(ctx: WriteCtx): boolean {
    const repo = ctx.tx.repo(notificationRepo);
    while ((diagOf(ctx)?.data.total ?? 0) >= INBOX_CAP) {
      const read = repo.query({ where: { status: 'read' }, orderBy: 'created', dir: 'asc', limit: 1 });
      let victim: Row | undefined = read.ok ? read.value.items[0] : undefined;
      if (!victim) {
        let cursor: string | undefined;
        do {
          const page = repo.query({ where: { status: 'unread' }, orderBy: 'created', dir: 'asc', limit: 100, ...(cursor ? { cursor } : {}) });
          if (!page.ok) return false;
          victim = page.value.items.find(r => r.data.category !== 'security') ?? page.value.items.find(r => ctx.clock.now() - Date.parse(r.data.createdAt) >= RETENTION_MS);
          cursor = victim ? undefined : page.value.nextCursor;
        } while (!victim && cursor);
      }
      if (!victim) return false;
      remove(ctx, victim);
    }
    return true;
  }

  /** Shared by the create command and the routing consumers; runs inside the caller's transaction. */
  function createNotification(ctx: WriteCtx, input: CreateInput): Result<CreateOutput, AppError> {
    const principal = options.localPrincipal();
    const urgency = input.urgency ?? 'normal';
    // V03/V04
    if (!TEMPLATE_KEYS.has(input.templateKey) || !input.templateKey.startsWith(`notify.tpl.${input.category}.`)) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'templateKey', code: 'UNKNOWN_TEMPLATE' }] }));
    if (urgency === 'urgent' && (input.category !== 'security' || !URGENT_TEMPLATES.has(input.templateKey))) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'urgency', code: 'URGENT_NOT_ALLOWED' }] }));
    // V08
    const now = ctx.clock.now();
    const eventAt = input.eventAt === undefined ? now : Date.parse(input.eventAt);
    if (!Number.isFinite(eventAt)) return err(appError('VALIDATION_FAILED'));
    if (now - eventAt > RETENTION_MS) return err(appError('EXPIRED'));
    // V02, V05
    if (input.actorDid !== undefined && input.actorDid === principal) return err(appError('NOT_FOUND'));
    if (input.actorDid !== undefined && options.isBlocked(input.actorDid)) return err(appError('BLOCKED_PARTY'));
    // V06
    const seen = ctx.tx.repo(seenRepo);
    if (seen.get(input.sourceEventId)) return err(appError('CONFLICT_STATE'));
    const markSeen = (notificationId: string | null) => { seen.put(input.sourceEventId, { notificationId, at: iso(now) }, { expectedRevision: 0 }); };
    const hide = (): Result<CreateOutput, AppError> => { markSeen(null); bump(ctx, { hidden: 1 }); return ok({ notificationId: null, created: false, collapsed: false, count: 0 }); };
    // Preference of F13.S02.M04: off categories create no row but a hidden counter; security ignores the preference.
    if (input.category !== 'security' && !inAppEnabled(ctx.tx, input.category)) return hide();
    if (input.actorDid !== undefined) {
      const day = ctx.tx.repo(dayRepo);
      const key = `${Math.floor(now / DAY_MS)}/${input.actorDid}`;
      const cur = day.get(key);
      if ((cur?.data.count ?? 0) >= PER_SOURCE_DAILY_CAP) return hide();
      day.put(key, { count: (cur?.data.count ?? 0) + 1 }, { expectedRevision: cur?.revision ?? 0 });
    }
    const repo = ctx.tx.repo(notificationRepo);
    const muted = input.muted ?? false;
    if (input.collapseKey !== undefined) {
      const page = repo.query({ where: { collapse: `${input.templateKey}\u0001${input.collapseKey}` }, orderBy: 'created', dir: 'desc', limit: 1 });
      const row = page?.ok ? page.value.items[0] : undefined;
      if (row && now - Date.parse(row.data.createdAt) < COLLAPSE_WINDOW_MS) {
        const saved = repo.put(row.id, { ...row.data, count: Math.min(MAX_COUNT, row.data.count + 1), muted: row.data.muted && muted, updatedAt: iso(now), sourceEventIds: [...row.data.sourceEventIds, input.sourceEventId].slice(-20) }, { expectedRevision: row.revision });
        if (!saved.ok) return saved;
        markSeen(row.id);
        bump(ctx, { collapsed: 1 });
        ctx.emit(notificationCreated, { aggregate: { type: 'notification', id: row.id }, revision: saved.value.revision, payload: payloadOf(row.id, saved.value.data, true) });
        return ok({ notificationId: row.id, created: false, collapsed: true, count: saved.value.data.count });
      }
    }
    if (!makeRoom(ctx)) return hide();
    const id = ctx.ids.next();
    const data: Notification = { userDid: principal, category: input.category, templateKey: input.templateKey, ...(input.ref ? { ref: input.ref } : {}), ...(input.collapseKey !== undefined ? { collapseKey: input.collapseKey } : {}),
      count: 1, urgency, muted, sourceEventIds: [input.sourceEventId], status: 'unread', createdAt: iso(now), updatedAt: iso(now) };
    const saved = repo.put(id, data, { expectedRevision: 0 });
    if (!saved.ok) return saved;
    markSeen(id);
    bump(ctx, { created: 1, total: 1 });
    ctx.emit(notificationCreated, { aggregate: { type: 'notification', id }, revision: saved.value.revision, payload: payloadOf(id, data, false) });
    return ok({ notificationId: id, created: true, collapsed: false, count: 1 });
  }
  const payloadOf = (id: string, d: Notification, collapsed: boolean) => ({ notificationId: id, category: d.category, templateKey: d.templateKey, ...(d.ref ? { ref: d.ref } : {}), urgency: d.urgency, collapsed, count: d.count, muted: d.muted });
  const isLocal = (ctx: Pick<CommandContext, 'actor'>) => ctx.actor.kind === 'user' && ctx.actor.id === options.localPrincipal();

  const create = defineCommand({ name: 'notify.notification.create', module: MODULE, capability: 'notify.notification.create', idempotent: true,
    input: z.strictObject({
      sourceEventId: uuidv7(), category: z.enum(CATEGORIES), templateKey: z.string().min(1).max(80), ref: z.strictObject({ type: z.enum(REF_TYPES), id: uuidv7() }).optional(),
      collapseKey: z.string().regex(/^[A-Za-z0-9_.-]{1,64}$/).optional(), urgency: z.enum(['normal', 'urgent']).optional(), muted: z.boolean().optional(),
      actorDid: z.string().startsWith('did:key:').max(128).optional(), eventAt: timestamp().optional(),
    }),
    handler(ctx, input) {
      // Vault-internal: the local principal or the vault's own consumers act; nobody else can create rows.
      if (!isLocal(ctx) && ctx.actor.kind !== 'system') return err(appError('FORBIDDEN'));
      return createNotification(ctx, input);
    },
  });

  function markRead(ctx: WriteCtx, rec: Row): Result<Row, AppError> {
    const readAt = iso(ctx.clock.now());
    const saved = ctx.tx.repo(notificationRepo).put(rec.id, { ...rec.data, status: 'read', readAt, updatedAt: readAt }, { expectedRevision: rec.revision });
    if (!saved.ok) return saved;
    bump(ctx, { read: 1 });
    ctx.emit(notificationRead, { aggregate: { type: 'notification', id: rec.id }, revision: saved.value.revision, payload: { notificationId: rec.id, category: rec.data.category, readAt } });
    return saved;
  }
  const unreadTotal = (tx: ReadScope, category?: NotifyCategory): number => {
    const q = tx.repo(notificationRepo).query({ where: { status: 'unread', ...(category ? { category } : {}) }, limit: 500 });
    return q.ok ? q.value.items.length : 0;
  };
  const mark = defineCommand({ name: 'notify.notification.mark_read', module: MODULE, capability: 'notify.notification.mark_read', idempotent: true,
    input: z.strictObject({ notificationId: z.string().min(1).max(64), expectedRevision: z.int().min(1) }),
    handler(ctx, input) {
      const rec = isLocal(ctx) ? ctx.tx.repo(notificationRepo).get(input.notificationId) : undefined;
      if (!rec || rec.data.userDid !== options.localPrincipal()) return err(appError('NOT_FOUND'));
      if (rec.data.status === 'read') return ok({ notificationId: rec.id, status: 'read' as const, revision: rec.revision });
      if (rec.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      const saved = markRead(ctx, rec);
      return saved.ok ? ok({ notificationId: rec.id, status: 'read' as const, revision: saved.value.revision }) : saved;
    },
  });
  const markAll = defineCommand({ name: 'notify.notification.mark_all_read', module: MODULE, capability: 'notify.notification.mark_read', idempotent: true,
    input: z.strictObject({ category: z.enum(CATEGORIES).optional(), beforeTimestamp: timestamp() }),
    handler(ctx, input) {
      if (!isLocal(ctx)) return err(appError('FORBIDDEN'));
      const repo = ctx.tx.repo(notificationRepo);
      let marked = 0;
      for (;;) {
        const page = repo.query({ where: { status: 'unread', created: { lte: input.beforeTimestamp }, ...(input.category ? { category: input.category } : {}) }, orderBy: 'created', dir: 'asc', limit: 200 });
        if (!page.ok) return page;
        for (const rec of page.value.items) { const done = markRead(ctx, rec); if (!done.ok) return done; marked++; }
        if (page.value.items.length < 200) break;
      }
      return ok({ marked, unreadCount: unreadTotal(ctx.tx) });
    },
  });
  const listMine = defineQuery({ name: 'notify.notification.list_mine', module: MODULE, capability: 'notify.notification.read_own',
    input: z.strictObject({ status: z.enum(['unread', 'all']).optional(), category: z.enum(CATEGORIES).optional(), cursor: z.string().max(500).optional(), limit: z.int().min(1).max(50).default(50) }),
    handler(ctx, input) {
      if (ctx.actor.kind !== 'user' || ctx.actor.id !== options.localPrincipal()) return err(appError('FORBIDDEN'));
      const page = ctx.tx.repo(notificationRepo).query({ where: { ...(input.status === 'unread' ? { status: 'unread' } : {}), ...(input.category ? { category: input.category } : {}) }, orderBy: 'created', dir: 'desc', limit: input.limit, ...(input.cursor ? { cursor: input.cursor } : {}) });
      if (!page.ok) return page;
      return ok({ items: page.value.items.map(present), ...(page.value.nextCursor ? { nextCursor: page.value.nextCursor } : {}) });
    },
  });
  const unreadCount = defineQuery({ name: 'notify.notification.unread_count', module: MODULE, capability: 'notify.notification.read_own', input: z.strictObject({}),
    handler(ctx) {
      if (ctx.actor.kind !== 'user' || ctx.actor.id !== options.localPrincipal()) return err(appError('FORBIDDEN'));
      const byCategory = Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Record<NotifyCategory, number>;
      const page = ctx.tx.repo(notificationRepo).query({ where: { status: 'unread' }, limit: 500 });
      if (!page.ok) return page;
      for (const r of page.value.items) byCategory[r.data.category]++;
      return ok({ total: page.value.items.length, byCategory });
    },
  });

  function didsOf(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(didsOf);
    if (typeof value === 'object' && value !== null && typeof (value as { did?: unknown }).did === 'string') return [(value as { did: string }).did];
    return [];
  }
  /** Routes one event; "no notification" outcomes (not the recipient, own action, blocked, duplicate, too old) are successful skips. */
  function route(ctx: ConsumerContext, env: EventEnvelope<Record<string, unknown>>): Result<void, AppError> {
    const row = ROUTE_BY_TYPE.get(env.type);
    if (!row) return err(appError('VALIDATION_FAILED'));
    // Only events of locally verified data: never raw relay events, and security notices only from local identity events (T02, T04).
    if (env.actor.kind === 'relay' || (row.category === 'security' && env.actor.kind !== 'system' && !(env.actor.kind === 'user' && env.actor.id === options.localPrincipal()))) return err(appError('FORBIDDEN'));
    const payload = env.payload;
    const principal = options.localPrincipal();
    if (row.to.length > 0) {
      const recipients = row.to.flatMap(f => didsOf(payload[f]));
      if (recipients.length === 0) return err(appError('VALIDATION_FAILED', { fields: [{ path: row.to[0] ?? 'to', code: 'REQUIRED' }] }));
      if (!recipients.includes(principal)) return ok(undefined);
    }
    let actorDid: string | undefined;
    if (row.actor) {
      actorDid = didsOf(payload[row.actor])[0];
      if (actorDid === undefined) return err(appError('VALIDATION_FAILED', { fields: [{ path: row.actor, code: 'REQUIRED' }] }));
    }
    const collapse = payload[row.collapse];
    if (typeof collapse !== 'string' || !/^[A-Za-z0-9_.-]{1,64}$/.test(collapse)) return err(appError('VALIDATION_FAILED', { fields: [{ path: row.collapse, code: 'INVALID_COLLAPSE_KEY' }] }));
    let ref: CreateInput['ref'];
    if (row.ref) {
      const id = payload[row.ref.idField];
      if (id !== undefined) {
        if (typeof id !== 'string' || !isUuidV7(id)) return err(appError('VALIDATION_FAILED', { fields: [{ path: row.ref.idField, code: 'INVALID_UUIDV7' }] }));
        ref = { type: row.ref.type, id };
      }
    }
    const muted = row.muted === 'thread' && options.isThreadMuted(String(payload['threadId'] ?? ''));
    const out = createNotification(ctx, { sourceEventId: env.eventId, category: row.category, templateKey: row.template, ...(ref ? { ref } : {}), collapseKey: collapse,
      urgency: row.urgency ?? 'normal', muted, ...(actorDid ? { actorDid } : {}), eventAt: env.occurredAt });
    if (out.ok) return ok(undefined);
    return ['NOT_FOUND', 'BLOCKED_PARTY', 'CONFLICT_STATE', 'EXPIRED'].includes(out.error.code) ? ok(undefined) : out;
  }
  const router = defineSubscriber({ name: 'notify.inapp_router', module: MODULE, events: routedEvents, handler: (ctx, env) => route(ctx, env as EventEnvelope<Record<string, unknown>>) });
  /** notify.preference.changed: remove unread items of categories whose in-app column is now off, except security. */
  const onPreferenceChanged = defineSubscriber({ name: 'notify.inapp_preference_changed', module: MODULE, events: [preferenceChanged],
    handler(ctx, env) {
      if (!env.payload.channelsChanged.includes('in_app')) return ok(undefined);
      const repo = ctx.tx.repo(notificationRepo);
      for (const category of env.payload.categories) {
        if (category === 'security' || inAppEnabled(ctx.tx, category)) continue;
        for (;;) {
          const page = repo.query({ where: { status: 'unread', category }, limit: 200 });
          if (!page.ok) return page;
          for (const rec of page.value.items) remove(ctx, rec);
          if (page.value.items.length < 200) break;
        }
      }
      return ok(undefined);
    } });

  /** Daily local sweep: rows and dedupe records older than 30 days are removed (security rows too); counters are kept. */
  function sweepNotifications(ctx: WriteCtx): { removed: number } {
    const cutoff = iso(ctx.clock.now() - RETENTION_MS);
    const repo = ctx.tx.repo(notificationRepo);
    let removed = 0;
    for (;;) {
      const page = repo.query({ where: { created: { lt: cutoff } }, orderBy: 'created', dir: 'asc', limit: 200 });
      if (!page.ok) break;
      for (const rec of page.value.items) { remove(ctx, rec); removed++; }
      if (page.value.items.length < 200) break;
    }
    const seen = ctx.tx.repo(seenRepo);
    for (;;) {
      const page = seen.query({ where: { at: { lt: cutoff } }, orderBy: 'at', dir: 'asc', limit: 200 });
      if (!page.ok) break;
      for (const rec of page.value.items) seen.remove(rec.id, { expectedRevision: rec.revision });
      if (page.value.items.length < 200) break;
    }
    return { removed };
  }

  return { create, markRead: mark, markAllRead: markAll, listMine, unreadCount, router, onPreferenceChanged, sweepNotifications, createNotification,
    all: [create, mark, markAll, listMine, unreadCount, router, onPreferenceChanged] as const };
}
