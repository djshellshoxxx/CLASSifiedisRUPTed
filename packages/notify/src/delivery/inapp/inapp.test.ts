import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parse } from 'yaml';
import { defineCommand, defineEvent, ok, z, type Actor, type EventEnvelope } from '@classrup/kernel';
import { createTestKernel, type TestKernel } from '@classrup/kernel/testing';
import { prefDefinitions } from '../../preferences/in/index.ts';
import { GENERIC_FALLBACK, INBOX_CAP, ROUTES, ROUTE_BY_TYPE, URGENT_TEMPLATES, inAppDefinitions, notificationCreated, notificationRead, notificationRepo, readDiagnostics, renderNotification, type Route } from './index.ts';

type Res = { ok: boolean; value?: unknown; error?: { code: string } };
const val = <T>(r: Res): T => { if (!r.ok) throw new Error(r.error?.code); return (r.value as { value: T }).value; };
const code = (r: Res) => (r.ok ? 'ok' : r.error?.code);

interface Env { k: TestKernel; me: Actor; other: Actor; blocked: Actor; blockedDid: string; muted: Set<string>; defs: ReturnType<typeof inAppDefinitions> }
function setup(): Env {
  const k = createTestKernel();
  const me = k.actor;
  const other = k.user();
  const blocked = k.user();
  const muted = new Set<string>();
  const did = (a: Actor) => (a.kind === 'anonymous' ? '' : a.id);
  const defs = inAppDefinitions({ localPrincipal: () => did(me), isBlocked: d => d === did(blocked), isThreadMuted: t => muted.has(t) });
  const unavailable = async () => { throw new Error('no signer in this test'); };
  const prefs = prefDefinitions({ localPrincipal: () => did(me), signStatement: unavailable, verifyStatement: unavailable });
  const emit = defineCommand({ name: 'test.event.emit', module: 'F99.S01.M01', capability: 'test.event.emit', idempotent: false, input: z.strictObject({ type: z.string(), payload: z.record(z.string(), z.unknown()) }),
    handler(ctx, i) { ctx.emit(defineEvent(i.type, 1, 'P2', z.looseObject({})), { aggregate: { type: 'source', id: ctx.ids.next() }, revision: 1, payload: i.payload }); return ok(null); } });
  k.registry.add(...defs.all, ...prefs.all, emit);
  return { k, me, other, blocked, blockedDid: did(blocked), muted, defs };
}
const idOf = (k: TestKernel) => k.ids.next();
const didOf = (a: Actor) => (a.kind === 'anonymous' ? '' : a.id);
/** Builds a payload that satisfies a routing row for the local principal as recipient and `actor` as the acting party. */
function payloadFor(row: Route, me: string, other: string, k: TestKernel, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  row.to.forEach((f, i) => { p[f] = f === 'parties' ? [{ did: me, role: 'a' }, { did: other, role: 'b' }] : /Ids$/.test(f) ? [me, other] : i === 0 ? me : other; });
  if (row.actor) p[row.actor] = other;
  const id = idOf(k);
  p[row.collapse] = id;
  if (row.ref) p[row.ref.idField] = id;
  if (row.muted) p['threadId'] = id;
  return { ...p, ...overrides };
}
const emitEvent = (e: Env, type: string, payload: Record<string, unknown>, actor?: Actor) => e.k.cmd('test.event.emit', { type, payload }, { actor: actor ?? e.other });
const route = (type: string) => ROUTE_BY_TYPE.get(type) as Route;
const rowsOf = async (e: Env) => val<{ items: Array<Record<string, unknown> & { id: string; revision: number }> }>(await e.k.ask('notify.notification.list_mine', { limit: 50 }, { actor: e.me })).items;
const allRows = async (e: Env) => e.k.storage.read(tx => { const out: Array<{ id: string; revision: number; data: Record<string, unknown> }> = []; let cursor: string | undefined; do { const p = tx.records.query<Record<string, unknown>>({ tenant: e.k.tenantId, type: 'notify.notification', filters: [], orderSlot: 0, dir: 'asc', limit: 501, ...(cursor ? { after: { value: null, id: cursor } } : {}) }); out.push(...p.map(r => ({ id: r.id, revision: r.revision, data: r.data }))); cursor = undefined; } while (cursor); return out; });
const create = (e: Env, input: Record<string, unknown>, actor?: Actor) => e.k.cmd('notify.notification.create', { sourceEventId: idOf(e.k), category: 'offers', templateKey: 'notify.tpl.offers.made', ...input }, { actor: actor ?? e.me });
const diag = (e: Env) => e.k.storage.read(tx => tx.records.get<Record<string, number>>(e.k.tenantId, 'notify.notification_diag', 'counters')?.data ?? {});

describe('F13.S01.M03 in-app notifications', () => {
  it('TEST-PS-103-09.T01 routing bazaar.offer.made to seller U stores category offers, template notify.tpl.offers.made, ref offer and no text fields', async () => {
    const e = setup();
    const offerId = idOf(e.k);
    const listing = idOf(e.k);
    val(await emitEvent(e, 'bazaar.offer.made', { sellerId: didOf(e.me), buyerId: didOf(e.other), offerListingId: listing, offerId, note: 'I will pay 50 dollars at 12 Main Street' }));
    await e.k.drainOutbox();
    const rows = await rowsOf(e);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userDid: didOf(e.me), category: 'offers', templateKey: 'notify.tpl.offers.made', ref: { type: 'offer', id: offerId }, collapseKey: listing, count: 1, urgency: 'normal', muted: false, status: 'unread', revision: 1 });
    // No free text: every stored string is a registry value, an id, a DID, a timestamp or a fixed enum.
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(['category', 'collapseKey', 'count', 'createdAt', 'id', 'muted', 'ref', 'revision', 'sourceEventIds', 'status', 'templateKey', 'updatedAt', 'urgency', 'userDid']);
    expect(JSON.stringify(rows)).not.toMatch(/dollars|Main Street|note/);
    const created = e.k.events.filter(x => x.type === 'notify.notification.created');
    expect(created).toHaveLength(1);
    expect(created[0]?.payload).toEqual({ notificationId: rows[0]?.id, category: 'offers', templateKey: 'notify.tpl.offers.made', ref: { type: 'offer', id: offerId }, urgency: 'normal', collapsed: false, count: 1, muted: false });
  });

  it('TEST-PS-103-09.T02 each rule V01 to V08 violated in turn returns its documented code and stores nothing', async () => {
    const e = setup();
    const snapshot = async () => JSON.stringify([await allRows(e), e.k.events.length, await diag(e)]);
    const before = await snapshot();
    // V03: template and reference registries, category/template agreement.
    expect(code(await create(e, { templateKey: 'notify.tpl.offers.unknown' }))).toBe('VALIDATION_FAILED');
    expect(code(await create(e, { templateKey: 'notify.tpl.cycles.proposed' }))).toBe('VALIDATION_FAILED');
    expect(code(await create(e, { ref: { type: 'spaceship', id: idOf(e.k) } }))).toBe('VALIDATION_FAILED');
    expect(code(await create(e, { collapseKey: 'has space' }))).toBe('VALIDATION_FAILED');
    expect(code(await create(e, { text: 'free text' }))).toBe('VALIDATION_FAILED');
    // V04: urgent only for the three urgent security templates.
    expect(code(await create(e, { urgency: 'urgent' }))).toBe('VALIDATION_FAILED');
    expect(code(await create(e, { category: 'security', templateKey: 'notify.tpl.security.session_revoked', urgency: 'urgent' }))).toBe('VALIDATION_FAILED');
    // V02: the actor is the local principal.
    expect(code(await create(e, { actorDid: didOf(e.me) }))).toBe('NOT_FOUND');
    // V05: blocked actor.
    expect(code(await create(e, { actorDid: e.blockedDid }))).toBe('BLOCKED_PARTY');
    // V08: event older than 30 days.
    expect(code(await create(e, { eventAt: new Date(e.k.clock.now() - 31 * 86_400_000).toISOString() }))).toBe('EXPIRED');
    // Foreign actors cannot create.
    expect(code(await create(e, {}, e.other))).toBe('FORBIDDEN');
    // V01: an event of a routed type that lacks the payload fields its row needs creates nothing.
    val(await emitEvent(e, 'bazaar.offer.made', { buyerId: didOf(e.other) }));
    val(await emitEvent(e, 'bazaar.offer.made', { sellerId: didOf(e.me), buyerId: didOf(e.other), offerListingId: 'not valid!' }));
    val(await emitEvent(e, 'bazaar.offer.made', { sellerId: didOf(e.me), buyerId: didOf(e.other), offerListingId: idOf(e.k), offerId: 'not-a-uuid' }));
    await e.k.drainOutbox();
    expect(await allRows(e)).toEqual([]);
    expect(e.k.events.filter(x => x.type === 'notify.notification.created')).toEqual([]);
    // Everything above left the stored notification state exactly as it was (only the three test events were added).
    expect(JSON.parse(await snapshot())[0]).toEqual(JSON.parse(before)[0]);
    expect(JSON.parse(await snapshot())[2]).toEqual(JSON.parse(before)[2]);
    // V06: the same source event id twice.
    const src = idOf(e.k);
    expect(code(await create(e, { sourceEventId: src }))).toBe('ok');
    expect(code(await create(e, { sourceEventId: src }))).toBe('CONFLICT_STATE');
    expect(await allRows(e)).toHaveLength(1);
    // V07: mark_read revision and ownership.
    const row = (await rowsOf(e))[0];
    expect(code(await e.k.cmd('notify.notification.mark_read', { notificationId: row?.id, expectedRevision: 7 }, { actor: e.me }))).toBe('CONFLICT_REVISION');
    expect(code(await e.k.cmd('notify.notification.mark_read', { notificationId: row?.id, expectedRevision: 1 }, { actor: e.other }))).toBe('NOT_FOUND');
    expect(code(await e.k.cmd('notify.notification.mark_read', { notificationId: idOf(e.k), expectedRevision: 1 }, { actor: e.me }))).toBe('NOT_FOUND');
    expect((await rowsOf(e))[0]).toMatchObject({ status: 'unread', revision: 1 });
  });

  it('TEST-PS-103-09.T03 random event, read and window sequences: count equals collapsed events, read never reopens, a new window creates a new row', async () => {
    const op = fc.oneof(
      fc.record({ kind: fc.constant('event' as const), key: fc.integer({ min: 0, max: 2 }), gap: fc.constantFrom(0, 60_000, 599_000, 601_000, 3_600_000) }),
      fc.record({ kind: fc.constant('read' as const), pick: fc.nat(50) }),
      fc.record({ kind: fc.constant('readAll' as const) }),
    );
    await fc.assert(fc.asyncProperty(fc.array(op, { minLength: 1, maxLength: 25 }), async ops => {
      const e = setup();
      const model: Array<{ id: string; key: number; createdAt: number; count: number; status: 'unread' | 'read' }> = [];
      for (const o of ops) {
        if (o.kind === 'event') {
          e.k.clock.advance(o.gap);
          const out = val<{ notificationId: string; created: boolean; collapsed: boolean; count: number }>(await create(e, { collapseKey: `key-${o.key}`, ref: undefined }));
          const open = [...model].reverse().find(m => m.key === o.key && m.status === 'unread');
          if (open && e.k.clock.now() - open.createdAt < 600_000) { open.count++; expect(out).toMatchObject({ created: false, collapsed: true, notificationId: open.id, count: open.count }); }
          else { const row = { id: out.notificationId, key: o.key, createdAt: e.k.clock.now(), count: 1, status: 'unread' as const }; model.push(row); expect(out).toMatchObject({ created: true, collapsed: false, count: 1 }); }
        } else if (o.kind === 'read' && model.length > 0) {
          const m = model[o.pick % model.length];
          if (!m) continue;
          const rev = (await rowsOf(e)).find(r => r.id === m.id)?.revision ?? 1;
          val(await e.k.cmd('notify.notification.mark_read', { notificationId: m.id, expectedRevision: rev }, { actor: e.me }));
          m.status = 'read';
        } else if (o.kind === 'readAll') {
          val(await e.k.cmd('notify.notification.mark_all_read', { beforeTimestamp: e.k.clock.iso() }, { actor: e.me }));
          for (const m of model) m.status = 'read';
        }
        const actual = await rowsOf(e);
        expect(actual).toHaveLength(model.length);
        for (const m of model) expect(actual.find(r => r.id === m.id), m.id).toMatchObject({ count: m.count, status: m.status });
        // The total of collapsed counts equals the events delivered.
        const events = ops.slice(0, ops.indexOf(o) + 1).filter(x => x.kind === 'event').length;
        expect(model.reduce((s, m) => s + m.count, 0)).toBe(events);
      }
      const unread = model.filter(m => m.status === 'unread').length;
      expect(val<{ total: number }>(await e.k.ask('notify.notification.unread_count', {}, { actor: e.me })).total).toBe(unread);
    }), { numRuns: 30 });
  });

  it('TEST-PS-103-09.T04 create, mark_read, mark_all_read, list and unread_count outputs and event payloads validate against the schemas', async () => {
    const e = setup();
    const out = val<{ notificationId: string; created: boolean; collapsed: boolean; count: number }>(await create(e, { category: 'cycles', templateKey: 'notify.tpl.cycles.proposed', ref: { type: 'cycle', id: idOf(e.k) }, collapseKey: 'c1', muted: true }));
    expect(z.strictObject({ notificationId: z.string(), created: z.literal(true), collapsed: z.literal(false), count: z.literal(1) }).safeParse(out).success).toBe(true);
    val(await create(e, { category: 'security', templateKey: 'notify.tpl.security.device_added', urgency: 'urgent', collapseKey: 'k1' }));
    const list = val<{ items: Array<Record<string, unknown> & { id: string; revision: number }>; nextCursor?: string }>(await e.k.ask('notify.notification.list_mine', { status: 'unread' }, { actor: e.me }));
    expect(list.items).toHaveLength(2);
    for (const i of list.items) { const { id: _id, revision: _revision, ...data } = i; expect(notificationRepo.schema.safeParse(data).success).toBe(true); }
    expect(list.items[0]?.templateKey).toBe('notify.tpl.security.device_added'); // newest first
    expect(val<{ items: unknown[] }>(await e.k.ask('notify.notification.list_mine', { category: 'cycles' }, { actor: e.me })).items).toHaveLength(1);
    const count = val<{ total: number; byCategory: Record<string, number> }>(await e.k.ask('notify.notification.unread_count', {}, { actor: e.me }));
    expect(count).toEqual({ total: 2, byCategory: { offers: 0, cycles: 1, messages: 0, auctions: 0, bookings: 0, moderation: 0, security: 1 } });
    const read = val<{ notificationId: string; status: string; revision: number }>(await e.k.cmd('notify.notification.mark_read', { notificationId: out.notificationId, expectedRevision: 1 }, { actor: e.me }));
    expect(read).toEqual({ notificationId: out.notificationId, status: 'read', revision: 2 });
    expect(val<{ status: string; revision: number }>(await e.k.cmd('notify.notification.mark_read', { notificationId: out.notificationId, expectedRevision: 1 }, { actor: e.me }))).toMatchObject({ status: 'read', revision: 2 }); // idempotent
    const all = val<{ marked: number; unreadCount: number }>(await e.k.cmd('notify.notification.mark_all_read', { category: 'security', beforeTimestamp: e.k.clock.iso() }, { actor: e.me }));
    expect(all).toEqual({ marked: 1, unreadCount: 0 });
    expect(val<{ marked: number }>(await e.k.cmd('notify.notification.mark_all_read', { beforeTimestamp: e.k.clock.iso() }, { actor: e.me })).marked).toBe(0);
    const created = e.k.events.filter(x => x.type === 'notify.notification.created');
    const reads = e.k.events.filter(x => x.type === 'notify.notification.read');
    expect(created).toHaveLength(2);
    expect(reads).toHaveLength(2);
    for (const ev of created) { expect(notificationCreated.payload.safeParse(ev.payload).success).toBe(true); expect(ev.privacy).toBe('P2'); }
    for (const ev of reads) expect(notificationRead.payload.safeParse(ev.payload).success).toBe(true);
    expect(created[0]?.payload).toMatchObject({ muted: true, urgency: 'normal' });
    expect(created[1]?.payload).toMatchObject({ urgency: 'urgent', category: 'security' });
    expect(code(await e.k.ask('notify.notification.list_mine', {}, { actor: e.other }))).toBe('FORBIDDEN');
    expect(code(await e.k.ask('notify.notification.unread_count', {}, { actor: e.other }))).toBe('FORBIDDEN');
  });

  it('TEST-PS-103-09.T05 every routed type is in modules.yaml emits, has a recipient rule and collapse key, and urgent is only on the 3 security templates', () => {
    const modules = (parse(readFileSync(new URL('../../../../../planning/modules.yaml', import.meta.url), 'utf8')) as { modules: Array<{ emits?: string[] }> }).modules;
    const catalog = new Set(modules.flatMap(m => m.emits ?? []));
    const spec = parse(readFileSync(new URL('../../../../../13_Notifications/01_delivery/mod_inapp/module.spec.yaml', import.meta.url), 'utf8')) as { processes: { commands_queries_events: { events_consumed: Array<{ type: string; effect: string }> } } };
    const consumed = spec.processes.commands_queries_events.events_consumed;
    expect(consumed).toHaveLength(49);
    expect(consumed.map(c => c.type).filter(t => t !== 'notify.preference.changed')).toEqual(ROUTES.map(r => r.type));
    expect(new Set(ROUTES.map(r => r.type)).size).toBe(ROUTES.length);
    const missing = ROUTES.map(r => r.type).filter(t => !catalog.has(t));
    expect(missing).toEqual([]);
    for (const [i, row] of ROUTES.entries()) {
      const effect = consumed[i]?.effect ?? '';
      expect(effect, row.type).toContain(`category ${row.category};`);
      expect(effect, row.type).toContain(`template ${row.template};`);
      expect(effect, row.type).toMatch(new RegExp(`collapse key ${row.collapse}(;|$)`));
      expect(row.template, row.type).toMatch(new RegExp(`^notify\\.tpl\\.${row.category}\\.[a-z_]+$`));
      expect(row.template.length).toBeLessThanOrEqual(80);
      expect(row.to.length > 0 || row.category === 'security' || row.type === 'comms.message.received', `${row.type} recipient rule`).toBe(true);
      expect(/urgency urgent/.test(effect), row.type).toBe(row.urgency === 'urgent');
      if (row.urgency === 'urgent') expect(row.category).toBe('security');
    }
    expect([...URGENT_TEMPLATES].sort()).toEqual(['notify.tpl.security.device_added', 'notify.tpl.security.device_revoked', 'notify.tpl.security.recovery_completed']);
    expect(ROUTES.filter(r => r.category === 'security').every(r => r.to.length === 0)).toBe(true);
  });

  it('TEST-PS-103-09.T06 delivering each routed event type twice in shuffled order creates exactly one row per rule', async () => {
    const e = setup();
    const envelopes: EventEnvelope[] = [];
    for (const row of ROUTES) {
      const before = e.k.events.length;
      val(await emitEvent(e, row.type, payloadFor(row, didOf(e.me), didOf(e.other), e.k), row.category === 'security' ? e.me : e.other));
      envelopes.push(...e.k.events.slice(before));
    }
    expect(envelopes).toHaveLength(ROUTES.length);
    const order = [...envelopes, ...envelopes].map((env, i) => ({ env, key: (i * 7919) % 97 })).sort((a, b) => a.key - b.key || 0).map(x => x.env);
    const outcomes: string[] = [];
    for (const env of order) outcomes.push(await e.k.outbox.deliver('notify.inapp_router', env));
    expect(outcomes.filter(o => o === 'delivered')).toHaveLength(ROUTES.length);
    expect(outcomes.filter(o => o === 'duplicate')).toHaveLength(ROUTES.length);
    const rows = await allRows(e);
    expect(rows).toHaveLength(ROUTES.length);
    expect(rows.map(r => r.data['templateKey']).sort()).toEqual(ROUTES.map(r => r.template).sort());
    const security = rows.filter(r => r.data['category'] === 'security');
    expect(security.map(r => [r.data['templateKey'], r.data['urgency']]).filter(([, u]) => u === 'urgent')).toHaveLength(3);
    expect(e.k.events.filter(x => x.type === 'notify.notification.created')).toHaveLength(ROUTES.length);
    // A full drain afterwards delivers the same events through the normal path and still adds nothing.
    await e.k.drainOutbox();
    expect(await allRows(e)).toHaveLength(ROUTES.length);
  });

  it('TEST-PS-103-09.T07 events from a blocked user, an unverified relay event and a foreign actor creating or reading rows produce no row and no access', async () => {
    const e = setup();
    const offer = route('bazaar.offer.made');
    val(await emitEvent(e, offer.type, payloadFor(offer, didOf(e.me), e.blockedDid, e.k), e.blocked));
    val(await emitEvent(e, offer.type, payloadFor(offer, didOf(e.me), didOf(e.other), e.k), { kind: 'relay', id: 'relay.example', roles: [] }));
    val(await emitEvent(e, offer.type, payloadFor(offer, didOf(e.other), didOf(e.me), e.k))); // someone else's offer: recipient rule fails
    val(await emitEvent(e, offer.type, payloadFor(offer, didOf(e.me), didOf(e.me), e.k), e.me)); // the user's own action
    const fakeSecurity = route('identity.device_key.added');
    val(await emitEvent(e, fakeSecurity.type, payloadFor(fakeSecurity, didOf(e.me), didOf(e.other), e.k), e.other)); // forged security notice from a peer
    val(await emitEvent(e, fakeSecurity.type, payloadFor(fakeSecurity, didOf(e.me), didOf(e.other), e.k), { kind: 'federated', id: 'peer', roles: [] }));
    await e.k.drainOutbox();
    expect(await allRows(e)).toEqual([]);
    expect(await diag(e)).toEqual({});
    // The genuine local identity event still works.
    val(await emitEvent(e, fakeSecurity.type, payloadFor(fakeSecurity, didOf(e.me), didOf(e.other), e.k), e.me));
    await e.k.drainOutbox();
    expect(await allRows(e)).toHaveLength(1);
    const row = (await rowsOf(e))[0];
    // A foreign actor cannot create, list, count or mark rows.
    expect(code(await create(e, {}, e.other))).toBe('FORBIDDEN');
    expect(code(await e.k.ask('notify.notification.list_mine', {}, { actor: e.other }))).toBe('FORBIDDEN');
    expect(code(await e.k.cmd('notify.notification.mark_read', { notificationId: row?.id, expectedRevision: 1 }, { actor: e.other }))).toBe('NOT_FOUND');
    expect(code(await e.k.cmd('notify.notification.mark_all_read', { beforeTimestamp: e.k.clock.iso() }, { actor: e.other }))).toBe('FORBIDDEN');
    expect((await rowsOf(e))[0]).toMatchObject({ status: 'unread' });
  });

  it('TEST-PS-103-09.T08 100 concurrent offer events for one listing give one collapsed row with count 100, and a template render failure falls back to generic text', async () => {
    const e = setup();
    const listing = idOf(e.k);
    const row = route('bazaar.offer.made');
    await Promise.all(Array.from({ length: 100 }, () => emitEvent(e, row.type, { sellerId: didOf(e.me), buyerId: `did:key:z6Mk${idOf(e.k).replace(/-/g, '')}`, offerListingId: listing, offerId: idOf(e.k) })));
    await e.k.drainOutbox();
    const rows = await rowsOf(e);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ count: 100, status: 'unread', collapseKey: listing });
    expect((rows[0]?.['sourceEventIds'] as string[]).length).toBe(20);
    const events = e.k.events.filter(x => x.type === 'notify.notification.created');
    expect(events).toHaveLength(100);
    expect(events.filter(x => (x.payload as { collapsed: boolean }).collapsed)).toHaveLength(99);
    expect((events.at(-1)?.payload as { count: number }).count).toBe(100);
    // Rendering never loses the alert: a throwing, empty or missing renderer yields the generic fallback.
    const n = { templateKey: 'notify.tpl.offers.made', ref: undefined };
    expect(renderNotification(n, () => { throw new Error('missing catalog'); })).toEqual({ ...GENERIC_FALLBACK, fallback: true });
    expect(renderNotification(n, () => undefined)).toMatchObject({ fallback: true });
    expect(renderNotification(n)).toMatchObject({ fallback: true });
    expect(renderNotification(n, () => ({ title: 'New offer', line: 'Someone made an offer' }))).toEqual({ title: 'New offer', line: 'Someone made an offer', fallback: false });
  });

  it('TEST-PS-103-09.T09 a muted thread is flagged, an off category leaves no row but a hidden counter, and security is created even when its preference is attempted off', async () => {
    const e = setup();
    const msg = route('comms.message.received');
    const mutedThread = idOf(e.k);
    e.muted.add(mutedThread);
    val(await emitEvent(e, msg.type, { senderId: didOf(e.other), threadId: mutedThread }));
    val(await emitEvent(e, msg.type, { senderId: didOf(e.other), threadId: idOf(e.k) }));
    await e.k.drainOutbox();
    const rows = await rowsOf(e);
    expect(rows.map(r => [r.collapseKey === mutedThread, r['muted']])).toEqual([[false, false], [true, true]]);
    // Category off: the notification is not created, the hidden counter increments.
    val(await e.k.cmd('notify.preference.set', { cells: [{ category: 'offers', inApp: false, expectedRevision: 1 }] }, { actor: e.me }));
    const offer = route('bazaar.offer.made');
    val(await emitEvent(e, offer.type, payloadFor(offer, didOf(e.me), didOf(e.other), e.k)));
    await e.k.drainOutbox();
    expect((await rowsOf(e)).filter(r => r['category'] === 'offers')).toEqual([]);
    expect((await diag(e))['hidden']).toBe(1);
    // Security ignores the preference and the preference cannot be turned off.
    expect(code(await e.k.cmd('notify.preference.set', { cells: [{ category: 'security', inApp: false, expectedRevision: 1 }] }, { actor: e.me }))).toBe('NOTIFY_PREF_LOCKED');
    const sec = route('identity.recovery.completed');
    val(await emitEvent(e, sec.type, payloadFor(sec, didOf(e.me), didOf(e.other), e.k), e.me));
    await e.k.drainOutbox();
    expect((await rowsOf(e)).find(r => r['category'] === 'security')).toMatchObject({ templateKey: 'notify.tpl.security.recovery_completed', urgency: 'urgent' });
    // Turning a category off removes its unread items (except security); turning it on again creates new ones.
    const before = (await rowsOf(e)).length;
    val(await e.k.cmd('notify.preference.set', { cells: [{ category: 'messages', inApp: false, expectedRevision: 1 }] }, { actor: e.me }));
    await e.k.drainOutbox();
    expect((await rowsOf(e)).filter(r => r['category'] === 'messages')).toEqual([]);
    expect((await rowsOf(e)).length).toBe(before - 2);
  });

  it('TEST-PS-103-09.T10 the 51st event from one actor in a day only bumps the hidden counter, the 501st row evicts read rows first, and diagnostics hold no content', async () => {
    const e = setup();
    for (let i = 0; i < 51; i++) val(await create(e, { collapseKey: `k${i}`, actorDid: didOf(e.other) }));
    expect(await rowsOf(e)).toHaveLength(50);
    expect((await diag(e))['hidden']).toBe(1);
    e.k.clock.advance(86_400_000);
    expect(code(await create(e, { collapseKey: 'next-day', actorDid: didOf(e.other) }))).toBe('ok');
    expect((await diag(e))['hidden']).toBe(1);
    // Fill to the cap, mark some read, then add more.
    const e2 = setup();
    const ids: string[] = [];
    for (let i = 0; i < INBOX_CAP; i++) ids.push(val<{ notificationId: string }>(await create(e2, { collapseKey: `k${i}`, category: i === 0 ? 'security' : 'offers', ...(i === 0 ? { templateKey: 'notify.tpl.security.session_revoked' } : {}) })).notificationId);
    expect((await diag(e2))['total']).toBe(INBOX_CAP);
    for (const id of [ids[5], ids[6]]) val(await e2.k.cmd('notify.notification.mark_read', { notificationId: id, expectedRevision: 1 }, { actor: e2.me }));
    val(await create(e2, { collapseKey: 'extra-1' }));
    let stored = await allRows(e2);
    expect(stored).toHaveLength(INBOX_CAP);
    expect(stored.find(r => r.id === ids[5])).toBeUndefined(); // oldest read row went first
    expect(stored.find(r => r.id === ids[6])).toBeDefined();
    val(await create(e2, { collapseKey: 'extra-2' }));
    stored = await allRows(e2);
    expect(stored.find(r => r.id === ids[6])).toBeUndefined();
    // With no read rows left, the oldest unread non-security row goes; the security row (oldest of all) stays.
    val(await create(e2, { collapseKey: 'extra-3' }));
    stored = await allRows(e2);
    expect(stored).toHaveLength(INBOX_CAP);
    expect(stored.find(r => r.id === ids[0])).toBeDefined();
    expect(stored.find(r => r.id === ids[1])).toBeUndefined();
    const d = await diag(e2);
    expect(d['dropped']).toBe(3);
    expect(d['total']).toBe(INBOX_CAP);
    expect(Object.values(d).every(v => typeof v === 'number')).toBe(true);
    expect(readDiagnostics({ repo: () => ({ get: () => ({ data: d }) }) } as never)).toEqual(d);
    expect(e2.k.logs.lines().join('\n')).not.toContain('notify.tpl');
  }, 30_000);

  it('removes rows older than 30 days in the daily sweep, security rows included, and keeps counters', async () => {
    const e = setup();
    val(await create(e, { collapseKey: 'old' }));
    val(await create(e, { category: 'security', templateKey: 'notify.tpl.security.export_ready', collapseKey: 'oldsec' }));
    e.k.clock.advance(29 * 86_400_000);
    val(await create(e, { collapseKey: 'fresh' }));
    const sweep = defineCommand({ name: 'test.sweep.run', module: 'F99.S01.M01', capability: 'test.sweep.run', idempotent: false, input: z.strictObject({}), handler: ctx => ok(e.defs.sweepNotifications(ctx)) });
    e.k.registry.add(sweep);
    expect(val<{ removed: number }>(await e.k.cmd('test.sweep.run', {}, { actor: e.me })).removed).toBe(0);
    e.k.clock.advance(2 * 86_400_000);
    expect(val<{ removed: number }>(await e.k.cmd('test.sweep.run', {}, { actor: e.me })).removed).toBe(2);
    expect((await allRows(e)).map(r => r.data['collapseKey'])).toEqual(['fresh']);
    expect(await diag(e)).toMatchObject({ created: 3, dropped: 2, total: 1 });
  });

  it('never creates notifications for events older than 30 days when delivered late (app closed for a month)', async () => {
    const e = setup();
    const offer = route('bazaar.offer.made');
    val(await emitEvent(e, offer.type, payloadFor(offer, didOf(e.me), didOf(e.other), e.k)));
    e.k.clock.advance(31 * 86_400_000);
    await e.k.drainOutbox();
    expect(await allRows(e)).toEqual([]);
  });
});
