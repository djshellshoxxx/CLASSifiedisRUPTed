// One storage contract suite for every adapter (PS-119 TEST-PS-119-09.T01..T05, T09): memory, SQLite, IndexedDB.
import { afterEach, describe, expect, it } from 'vitest';
import * as z from 'zod';
import { appError } from '../errors/app-error.ts';
import { err, ok } from '../errors/result.ts';
import type { EventEnvelope } from '../events/envelope.ts';
import { defineRepo } from './repo.ts';
import { writeScope } from './scope.ts';
import type { Storage } from './storage.ts';
import type { Tx } from './tx.ts';
import { createFakeClock } from '../clock/clock.ts';
import { createDeterministicIds } from '../ids/uuidv7.ts';

export type StorageFactory = () => Promise<Storage> | Storage;

const T0 = Date.parse('2026-11-04T10:00:00.000Z');
const item = defineRepo({
  type: 'test.item',
  schema: z.strictObject({ name: z.string(), status: z.string(), price: z.string().optional(), tag: z.string().nullable().optional() }),
  indexes: { status: (d) => d.status, price: (d) => d.price ?? null, name: (d) => d.name },
});

function env(id: string, aggregateId: string, revision: number, type = 'test.item.changed'): EventEnvelope {
  return {
    eventId: id,
    type,
    version: 1,
    tenantId: 'tenant-a',
    aggregate: { type: 'item', id: aggregateId },
    revision,
    actor: { kind: 'system', id: 'test' },
    occurredAt: new Date(T0).toISOString(),
    correlationId: 'c',
    causationId: 'c',
    privacy: 'P1',
    payload: { n: revision },
    provenance: { origin: 'test', sig: null },
  };
}

export function storageContractSuite(adapter: string, factory: StorageFactory): void {
  describe(`storage contract: ${adapter}`, () => {
    const open: Storage[] = [];
    const make = async (): Promise<Storage> => {
      const s = await factory();
      open.push(s);
      return s;
    };
    afterEach(async () => {
      for (const s of open.splice(0)) await s.close();
    });
    const clock = createFakeClock(T0);
    const ids = createDeterministicIds({ seed: 7, now: () => clock.now() });
    const scoped = (tx: Tx, tenantId = 'tenant-a') => writeScope({ tx, tenantId, clock, ids, deliveryEligible: true });

    it(`TEST-PS-119-09.T01 ${adapter}: create, get, CAS update, conflicts, remove and JSON round trip`, async () => {
      const s = await make();
      const created = await s.transaction((tx) => scoped(tx).repo(item).put('a', { name: 'lamp', status: 'draft', tag: null }, { expectedRevision: 0 }));
      expect(created.ok && created.value.revision).toBe(1);
      const dup = await s.transaction((tx) => scoped(tx).repo(item).put('a', { name: 'x', status: 'draft' }, { expectedRevision: 0 }));
      expect(!dup.ok && dup.error.code).toBe('CONFLICT_REVISION');
      expect(!dup.ok && dup.error.params).toEqual({ currentRevision: 1 });
      const missing = await s.transaction((tx) => scoped(tx).repo(item).put('zz', { name: 'x', status: 'draft' }, { expectedRevision: 3 }));
      expect(!missing.ok && missing.error.code).toBe('NOT_FOUND');
      const upd = await s.transaction((tx) => scoped(tx).repo(item).put('a', { name: 'lamp', status: 'published', price: '0100' }, { expectedRevision: 1 }));
      expect(upd.ok && upd.value.revision).toBe(2);
      const stale = await s.transaction((tx) => scoped(tx).repo(item).put('a', { name: 'lamp', status: 'x' }, { expectedRevision: 1 }));
      expect(!stale.ok && stale.error).toMatchObject({ code: 'CONFLICT_REVISION', params: { currentRevision: 2 } });
      const got = await s.read((tx) => scoped(tx).repo(item).get('a'));
      expect(got).toMatchObject({ id: 'a', tenantId: 'tenant-a', type: 'test.item', revision: 2, data: { name: 'lamp', status: 'published', price: '0100' } });
      expect(got?.createdAt).toBe('2026-11-04T10:00:00.000Z');
      const badRemove = await s.transaction((tx) => scoped(tx).repo(item).remove('a', { expectedRevision: 1 }));
      expect(!badRemove.ok && badRemove.error.code).toBe('CONFLICT_REVISION');
      const removed = await s.transaction((tx) => scoped(tx).repo(item).remove('a', { expectedRevision: 2 }));
      expect(removed.ok).toBe(true);
      const gone = await s.transaction((tx) => scoped(tx).repo(item).remove('a', { expectedRevision: 2 }));
      expect(!gone.ok && gone.error.code).toBe('NOT_FOUND');
    });

    it(`TEST-PS-119-09.T01 ${adapter}: query by index equality, range, order and cursor pagination`, async () => {
      const s = await make();
      await s.transaction((tx) => {
        const r = scoped(tx).repo(item);
        const rows: [string, string, string | undefined][] = [['i1', 'made', '0300'], ['i2', 'made', '0100'], ['i3', 'made', '0200'], ['i4', 'done', '0050'], ['i5', 'made', undefined], ['i6', 'made', '0100']];
        for (const [id, status, price] of rows) {
          const p = r.put(id, { name: `n-${id}`, status, ...(price ? { price } : {}) }, { expectedRevision: 0 });
          if (!p.ok) return p;
        }
        const other = scoped(tx, 'tenant-b').repo(item).put('i1', { name: 'other', status: 'made' }, { expectedRevision: 0 });
        return other.ok ? ok(undefined) : other;
      });
      const q = (fn: (r: ReturnType<ReturnType<typeof scoped>['repo']>) => unknown) => s.read((tx) => fn(scoped(tx).repo(item)));
      const made = (await q((r) => r.query({ where: { status: 'made' } }))) as { ok: true; value: { items: { id: string }[] } };
      expect(made.value.items.map((i) => i.id)).toEqual(['i1', 'i2', 'i3', 'i5', 'i6']);
      const byPrice = (await q((r) => r.query({ where: { status: 'made' }, orderBy: 'price', dir: 'desc' }))) as { ok: true; value: { items: { id: string }[] } };
      expect(byPrice.value.items.map((i) => i.id)).toEqual(['i1', 'i3', 'i6', 'i2']);
      const range = (await q((r) => r.query({ where: { price: { gte: '0100', lt: '0300' } }, orderBy: 'price' }))) as { ok: true; value: { items: { id: string }[] } };
      expect(range.value.items.map((i) => i.id)).toEqual(['i2', 'i6', 'i3']);
      const seen: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 5; page++) {
        const r = (await q((rp) => rp.query({ orderBy: 'price', limit: 2, ...(cursor ? { cursor } : {}) }))) as { ok: true; value: { items: { id: string }[]; nextCursor?: string } };
        seen.push(...r.value.items.map((i) => i.id));
        cursor = r.value.nextCursor;
        if (!cursor) break;
      }
      expect(seen).toEqual(['i4', 'i2', 'i6', 'i3', 'i1']);
      const bad = (await q((r) => r.query({ cursor: '!!' }))) as { ok: false; error: { code: string } };
      expect(bad.error.code).toBe('VALIDATION_FAILED');
      const big = (await q((r) => r.query({ limit: 501 }))) as { ok: false; error: { code: string } };
      expect(big.error.code).toBe('VALIDATION_FAILED');
    });

    it(`TEST-PS-119-09.T02 ${adapter}: err or exception rolls back records, outbox, idempotency, leases and sync together`, async () => {
      const s = await make();
      const write = (tx: Tx) => {
        const sc = scoped(tx);
        sc.repo(item).put('r1', { name: 'n', status: 's' }, { expectedRevision: 0 });
        tx.outbox.append(env('e-1', 'r1', 1));
        tx.idempotency.save({ tenant: 'tenant-a', actor: 'a', command: 'test.item.create', key: 'k', requestHash: 'h', status: 200, response: { ok: 1 }, createdAt: clock.iso(), expiresAt: new Date(clock.now() + 1000).toISOString() });
        sc.leases.acquire('res-1', 'holder-1');
        sc.sync.enqueue('relay:a', { cid: 'sha256-x', type: 'classrup.test.statement/v1' });
      };
      const failed = await s.transaction((tx) => {
        write(tx);
        return err(appError('CONFLICT_STATE'));
      });
      expect(failed.ok).toBe(false);
      await expect(
        s.transaction((tx) => {
          write(tx);
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
      const state = await s.read((tx) => ({
        rec: scoped(tx).repo(item).get('r1'),
        ev: tx.outbox.get('e-1'),
        idem: tx.idempotency.lookup({ tenant: 'tenant-a', actor: 'a', command: 'test.item.create', key: 'k' }, clock.now()),
        lease: scoped(tx).leases.get('res-1'),
        sync: tx.sync.list({}),
      }));
      expect(state).toEqual({ rec: undefined, ev: undefined, idem: undefined, lease: undefined, sync: [] });
      const committed = await s.transaction((tx) => {
        write(tx);
        return ok(undefined);
      });
      expect(committed.ok).toBe(true);
      const after = await s.read((tx) => [scoped(tx).repo(item).get('r1')?.revision, tx.outbox.get('e-1')?.eventId, tx.sync.list({}).length]);
      expect(after).toEqual([1, 'e-1', 1]);
    });

    it(`TEST-PS-119-09.T03 ${adapter}: lease acquire CAS, renew, release, expiry and fencing`, async () => {
      const s = await make();
      const c = createFakeClock(T0);
      const lease = (tx: Tx) => writeScope({ tx, tenantId: 'tenant-a', clock: c, ids, deliveryEligible: false }).leases;
      const a = await s.transaction((tx) => lease(tx).acquire('item-1', 'cycle-A', 60_000));
      expect(a.ok && a.value).toMatchObject({ holder: 'cycle-A', fence: 1, expiresAt: '2026-11-04T10:01:00.000Z' });
      const b = await s.transaction((tx) => lease(tx).acquire('item-1', 'cycle-B', 60_000));
      expect(!b.ok && b.error.code).toBe('PRECONDITION_FAILED');
      const rel = await s.transaction((tx) => lease(tx).release('item-1', 'cycle-B'));
      expect(!rel.ok && rel.error.code).toBe('PRECONDITION_FAILED');
      c.advance(30_000);
      const renewed = await s.transaction((tx) => lease(tx).renew('item-1', 'cycle-A', 60_000));
      expect(renewed.ok && renewed.value.expiresAt).toBe('2026-11-04T10:01:30.000Z');
      c.advance(60_000);
      expect(await s.read((tx) => lease(tx).get('item-1'))).toBeUndefined();
      const late = await s.transaction((tx) => lease(tx).renew('item-1', 'cycle-A'));
      expect(!late.ok && late.error.code).toBe('EXPIRED');
      const b2 = await s.transaction((tx) => lease(tx).acquire('item-1', 'cycle-B'));
      expect(b2.ok && b2.value).toMatchObject({ holder: 'cycle-B', fence: 2, expiresAt: '2026-11-04T10:16:30.000Z' });
      const freed = await s.transaction((tx) => lease(tx).release('item-1', 'cycle-B'));
      expect(freed.ok).toBe(true);
      const a2 = await s.transaction((tx) => lease(tx).acquire('item-1', 'cycle-A'));
      expect(a2.ok && a2.value.fence).toBe(3);
      expect(() => lease({} as Tx).acquire('x', 'y', 0)).toThrow();
    });

    it(`TEST-PS-119-09.T04 ${adapter}: pending skips delivered, dead and aggregates blocked by a future retry`, async () => {
      const s = await make();
      await s.transaction((tx) => {
        for (const [id, agg, rev] of [['e1', 'A', 1], ['e2', 'A', 2], ['e3', 'B', 1], ['e4', 'C', 1], ['e5', 'D', 1]] as const) tx.outbox.append(env(id, agg, rev));
        tx.outbox.append(env('e6', 'E', 1, 'test.other.changed'));
        const now = clock.now();
        tx.inbox.markRetry({ consumer: 'c1', envelope: env('e1', 'A', 1), now }, 1, now + 5000, 'INTERNAL');
        tx.inbox.markDone({ consumer: 'c1', envelope: env('e3', 'B', 1), now }, 1);
        tx.inbox.markDead({ consumer: 'c1', envelope: env('e4', 'C', 1), now }, 8, 'INTERNAL');
        tx.inbox.markRetry({ consumer: 'c1', envelope: env('e5', 'D', 1), now }, 2, now, 'INTERNAL');
        return ok(undefined);
      });
      const pending = await s.read((tx) => tx.outbox.pending('c1', ['test.item.changed'], clock.now(), 10).map((p) => p.envelope.eventId));
      expect(pending).toEqual(['e5']);
      const other = await s.read((tx) => tx.outbox.pending('c2', ['test.item.changed', 'test.other.changed'], clock.now(), 10).map((p) => p.envelope.eventId));
      expect(other).toEqual(['e1', 'e2', 'e3', 'e4', 'e5', 'e6']);
      const later = await s.read((tx) => tx.outbox.pending('c1', ['test.item.changed'], clock.now() + 5000, 10).map((p) => p.envelope.eventId));
      expect(later).toEqual(['e1', 'e2', 'e5']);
      expect(await s.read((tx) => tx.outbox.oldestUndelivered('c1', ['test.item.changed'])?.eventId)).toBe('e1');
      const dl = await s.read((tx) => tx.deadLetters.list('c1'));
      expect(dl.map((d) => [d.eventId, d.attempts, d.errorCode])).toEqual([['e4', 8, 'INTERNAL']]);
      const rq = await s.transaction((tx) => tx.deadLetters.requeue('c1', 'e4', clock.now()));
      expect(rq.ok).toBe(true);
      expect(await s.read((tx) => [tx.deadLetters.list('c1').length, tx.inbox.get('c1', 'e4')?.status, tx.inbox.get('c1', 'e4')?.attempts])).toEqual([0, 'retry', 0]);
      const seqs = await s.read((tx) => tx.outbox.pending('c2', ['test.item.changed'], clock.now(), 10).map((p) => p.seq));
      expect([...seqs].sort((x, y) => x - y)).toEqual(seqs);
    });

    it(`TEST-PS-119-09.T05 ${adapter}: sync outbox FIFO heads per destination and declared transitions only`, async () => {
      const s = await make();
      const c = createFakeClock(T0);
      const sc = (tx: Tx) => writeScope({ tx, tenantId: 'tenant-a', clock: c, ids, deliveryEligible: true }).sync;
      const first = await s.transaction((tx) => ok(sc(tx).enqueue('relay:a', { cid: 'sha256-1', type: 't/v1' })));
      c.advance(1);
      await s.transaction((tx) => ok(sc(tx).enqueue('relay:a', { cid: 'sha256-2', type: 't/v1' })));
      await s.transaction((tx) => ok(sc(tx).enqueue('peer:b', { cid: 'sha256-3', type: 't/v1' })));
      const heads = await s.read((tx) => tx.sync.heads(c.now(), 10).map((h) => h.ref));
      expect(heads).toEqual(['sha256-1', 'sha256-3']);
      const id = first.ok ? first.value.id : '';
      const later = new Date(c.now() + 1000).toISOString();
      await s.transaction((tx) => tx.sync.transition(id, 'retry_later', { attempts: 1, nextAttemptAt: later, lastError: 'DEPENDENCY_UNAVAILABLE' }, c.now()));
      expect(await s.read((tx) => tx.sync.heads(c.now(), 10).map((h) => h.ref))).toEqual(['sha256-3']);
      const ack = await s.transaction((tx) => tx.sync.transition(id, 'transport_ack', { receipt: { relaySig: 'r' }, nextAttemptAt: null }, c.now()));
      expect(ack.ok && ack.value).toMatchObject({ state: 'transport_acknowledged', receipt: { relaySig: 'r' } });
      expect(await s.read((tx) => tx.sync.heads(c.now(), 10).map((h) => h.ref))).toEqual(['sha256-2', 'sha256-3']);
      const bad = await s.transaction((tx) => tx.sync.transition(id, 'retry_later', {}, c.now()));
      expect(!bad.ok && bad.error).toMatchObject({ code: 'CONFLICT_STATE', params: { state: 'transport_acknowledged' } });
      const peer = await s.transaction((tx) => sc(tx).recordPeerAck('relay:a', 'sha256-1', { sig: 'peer' }));
      expect(peer.ok && peer.value.state).toBe('peer_accepted');
      const again = await s.transaction((tx) => sc(tx).recordPeerAck('relay:a', 'sha256-1', { sig: 'peer' }));
      expect(again.ok && again.value.state).toBe('peer_accepted');
      const unknown = await s.transaction((tx) => sc(tx).recordPeerAck('relay:a', 'sha256-9', {}));
      expect(!unknown.ok && unknown.error.code).toBe('NOT_FOUND');
      expect(() => writeScope({ tx: {} as Tx, tenantId: 't', clock: c, ids, deliveryEligible: false }).sync.enqueue('x', { cid: 'c', type: 't' })).toThrow('deliveryEligible');
    });

    it(`TEST-PS-119-09.T17 ${adapter}: MediaBlob content addressing, 5 MiB limit, dedupe and refcounted delete with records`, async () => {
      const s = await make();
      const listing = defineRepo({ type: 'test.listing', schema: z.strictObject({ photos: z.array(z.string()) }), blobs: (d) => d.photos });
      const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
      const jpg = new Uint8Array([255, 216, 255, 9, 9]);
      const put = (bytes: Uint8Array, privacy: 'P0' | 'P2' | 'P3' = 'P0', encrypted = false) => s.transaction((tx) => scoped(tx).blobs.put(bytes, { contentType: 'image/png', privacy, encrypted }));
      const a = await put(png);
      expect(a.ok && a.value).toMatchObject({ ref: expect.stringMatching(/^blob:sha256-[A-Za-z0-9_-]{43}$/), size: 7, privacy: 'P0', holders: 0 });
      const refA = a.ok ? a.value.ref : '';
      const again = await put(png);
      expect(again.ok && again.value.ref).toBe(refA);
      expect(await s.read((tx) => Array.from(scoped(tx).blobs.get(refA)?.bytes ?? []))).toEqual(Array.from(png));
      const tooBig = await put(new Uint8Array(5 * 1024 * 1024 + 1));
      expect(!tooBig.ok && tooBig.error.code).toBe('PAYLOAD_TOO_LARGE');
      const badType = await s.transaction((tx) => scoped(tx).blobs.put(png, { contentType: 'PNG', privacy: 'P0' }));
      expect(!badType.ok && badType.error.code).toBe('VALIDATION_FAILED');
      const plain = await put(jpg, 'P2', false);
      expect(plain.ok).toBe(s.kind !== 'sqlite');
      const sealed = await put(new Uint8Array([1, 1, 1]), 'P2', true);
      expect(sealed.ok).toBe(true);
      const refS = sealed.ok ? sealed.value.ref : '';
      const b = await put(jpg, 'P0');
      const refB = b.ok ? b.value.ref : '';
      await s.transaction((tx) => scoped(tx).repo(listing).put('L1', { photos: [refA, refB] }, { expectedRevision: 0 }));
      await s.transaction((tx) => scoped(tx).repo(listing).put('L2', { photos: [refA] }, { expectedRevision: 0 }));
      expect(await s.read((tx) => [scoped(tx).blobs.info(refA)?.holders, scoped(tx).blobs.info(refB)?.holders])).toEqual([2, 1]);
      await s.transaction((tx) => scoped(tx).repo(listing).put('L1', { photos: [refA] }, { expectedRevision: 1 }));
      expect(await s.read((tx) => [scoped(tx).blobs.info(refA)?.holders, scoped(tx).blobs.info(refB)])).toEqual([2, undefined]);
      const failing = await s.transaction((tx) => {
        scoped(tx).repo(listing).remove('L2', { expectedRevision: 1 });
        return err(appError('CONFLICT_STATE'));
      });
      expect(failing.ok).toBe(false);
      expect(await s.read((tx) => scoped(tx).blobs.info(refA)?.holders)).toBe(2);
      await s.transaction((tx) => scoped(tx).repo(listing).remove('L2', { expectedRevision: 1 }));
      await s.transaction((tx) => scoped(tx).repo(listing).remove('L1', { expectedRevision: 2 }));
      expect(await s.read((tx) => scoped(tx).blobs.get(refA))).toBeUndefined();
      const attached = await s.transaction((tx) => scoped(tx).blobs.attach(refS, 'test.thread/T1'));
      expect(attached.ok && attached.value).toEqual({ holders: 1, present: true });
      const shred = await s.transaction((tx) => ok(scoped(tx).blobs.detach(refS, 'test.thread/T1')));
      expect(shred.ok && shred.value).toEqual({ deleted: true, shred: true });
      const bad = await s.transaction((tx) => scoped(tx).blobs.attach('blob:md5-x', 'h'));
      expect(!bad.ok && bad.error.code).toBe('VALIDATION_FAILED');
      await put(new Uint8Array([7, 7, 7]), 'P3', true);
      const orphanCount = await s.transaction((tx) => ok(tx.blobs.collectOrphans(clock.now() + 1)));
      expect(orphanCount.ok && orphanCount.value).toBe(1);
      const draft = await put(new Uint8Array([4, 2]), 'P3', true);
      const published = await put(new Uint8Array([4, 2]), 'P0', true);
      expect([draft.ok && draft.value.privacy, published.ok && published.value.privacy]).toEqual(['P3', 'P0']);
    });

    it(`TEST-PS-119-09.T09 ${adapter}: purge removes expired idempotency rows and outbox rows older than the cutoff`, async () => {
      const s = await make();
      await s.transaction((tx) => {
        for (const [key, exp] of [['old', T0 - 1], ['edge', T0], ['new', T0 + 1]] as const) {
          tx.idempotency.save({ tenant: 't', actor: 'a', command: 'c.d.e', key, requestHash: 'h', status: 200, response: null, createdAt: new Date(exp - 86_400_000).toISOString(), expiresAt: new Date(exp).toISOString() });
        }
        tx.outbox.append({ ...env('o1', 'A', 1), occurredAt: '2026-10-01T00:00:00.000Z' });
        tx.outbox.append(env('o2', 'A', 2));
        return ok(undefined);
      });
      const purged = await s.transaction((tx) => ok([tx.idempotency.purgeExpired(T0), tx.outbox.purgeBefore(T0 - 7 * 86_400_000)]));
      expect(purged.ok && purged.value).toEqual([2, 1]);
      const left = await s.read((tx) => [tx.idempotency.lookup({ tenant: 't', actor: 'a', command: 'c.d.e', key: 'new' }, T0)?.key, tx.outbox.get('o1'), tx.outbox.get('o2')?.eventId]);
      expect(left).toEqual(['new', undefined, 'o2']);
    });
  });
}
