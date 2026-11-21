// One storage contract suite for every adapter (PS-119 TEST-PS-119-09.T01..T05, T09): memory, SQLite, IndexedDB.
import { afterEach, describe, expect, it } from 'vitest';
import * as z from 'zod';
import { appError } from '../errors/app-error.ts';
import { err, ok } from '../errors/result.ts';
import type { EventEnvelope } from '../events/envelope.ts';
import { sweepRetention } from './maintenance.ts';
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

    it(`${adapter}: orphan sweep validates limits, honors holders and cutoff, and requests encrypted shredding`, async () => {
      const s = await make();
      const upload = async (tenant: string, values: readonly number[], now: number, encrypted = false): Promise<string> => {
        const result = await s.transaction(tx => tx.blobs.put({
          tenant, bytes: Uint8Array.from(values), contentType: 'application/octet-stream',
          privacy: encrypted ? 'P1' : 'P0', encrypted, now,
        }));
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error('Could not create orphan-sweep fixture');
        return result.value.ref;
      };
      const orphan = await upload('tenant-a', [1, 2, 3], T0 - 60_000, true);
      const held = await upload('tenant-a', [4, 5, 6], T0 - 60_000);
      const recent = await upload('tenant-a', [7, 8, 9], T0 + 60_000);
      const foreign = await upload('tenant-b', [10, 11, 12], T0 - 60_000);
      const attachment = await s.transaction(tx => tx.blobs.attach('tenant-a', held, 'listing/current'));
      expect(attachment.ok).toBe(true);

      // A rolled-back sweep may stage shredding, but must not remove durable bytes.
      const aborted = await s.transaction(tx => {
        expect(tx.blobs.collectOrphans(T0, 1)).toBe(1);
        expect(tx.blobs.shredded()).toEqual([{ tenant: 'tenant-a', ref: orphan }]);
        return err(appError('CONFLICT_STATE'));
      });
      expect(aborted.ok).toBe(false);
      expect(await s.read(tx => tx.blobs.info('tenant-a', orphan))).toBeDefined();

      // Reject malformed limits before an adapter's SELECT/slice can delete blobs.
      for (const invalid of [-1, 0, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        await expect(s.transaction(tx => ok(tx.blobs.collectOrphans(T0, invalid))))
          .rejects.toThrow(RangeError);
        for (const [tenant, ref] of [
          ['tenant-a', orphan], ['tenant-a', held], ['tenant-a', recent], ['tenant-b', foreign],
        ] as const) {
          expect(await s.read(tx => tx.blobs.info(tenant, ref))).toBeDefined();
        }
      }

      // The oldest eligible, unattached owner blob is removed in a bounded batch.
      const first = await s.transaction(tx => ok({
        removed: tx.blobs.collectOrphans(T0, 1), shredded: tx.blobs.shredded(),
      }));
      expect(first).toEqual(ok({
        removed: 1, shredded: [{ tenant: 'tenant-a', ref: orphan }],
      }));
      expect(await s.read(tx => tx.blobs.info('tenant-a', orphan))).toBeUndefined();
      expect(await s.read(tx => tx.blobs.info('tenant-a', held))).toMatchObject({ holders: 1 });
      expect(await s.read(tx => tx.blobs.info('tenant-a', recent))).toBeDefined();
      expect(await s.read(tx => tx.blobs.info('tenant-b', foreign))).toBeDefined();

      // A second bounded batch removes the other tenant's orphan, not live or recent data.
      const second = await s.transaction(tx => ok({
        removed: tx.blobs.collectOrphans(T0, 1), shredded: tx.blobs.shredded(),
      }));
      expect(second).toEqual(ok({ removed: 1, shredded: [] }));
      expect(await s.read(tx => tx.blobs.info('tenant-b', foreign))).toBeUndefined();
      expect(await s.read(tx => tx.blobs.info('tenant-a', held))).toMatchObject({ holders: 1 });
      expect(await s.read(tx => tx.blobs.info('tenant-a', recent))).toBeDefined();
      expect(await s.transaction(tx => ok(tx.blobs.collectOrphans(T0, 1)))).toEqual(ok(0));
    });

    it(`${adapter}: reinserted encrypted blob retains its key after same-transaction final-holder detach`, async () => {
      const s = await make();
      const tenant = 'tenant-a';
      const holder = 'listing/current';
      const bytes = Uint8Array.from([51, 52, 53, 54]);
      const input = () => ({
        tenant, bytes: bytes.slice(), contentType: 'application/octet-stream',
        privacy: 'P1' as const, encrypted: true, now: T0 - 60_000,
      });
      const initial = await s.transaction(async tx => {
        const created = await tx.blobs.put(input());
        expect(created.ok).toBe(true);
        if (!created.ok) throw new Error('Could not create encrypted fixture');
        expect(tx.blobs.attach(tenant, created.value.ref, holder).ok).toBe(true);
        return ok(created.value.ref);
      });
      expect(initial.ok).toBe(true);
      if (!initial.ok) throw new Error('Could not commit encrypted fixture');
      const ref = initial.value;
      const foreign = await s.transaction(async tx => {
        const created = await tx.blobs.put({ ...input(), tenant: 'tenant-b' });
        expect(created.ok).toBe(true);
        if (!created.ok) throw new Error('Could not create foreign encrypted fixture');
        expect(tx.blobs.attach('tenant-b', created.value.ref, holder).ok).toBe(true);
        return ok(created.value.ref);
      });
      expect(foreign).toEqual(ok(ref));

      // This deletes and recreates the identical content address before commit.
      // A stale shred request for a live restored blob would destroy its key.
      const renewed = await s.transaction(async tx => {
        // The foreign tenant has the same ref and must retain its own shred request.
        expect(tx.blobs.detach('tenant-b', ref, holder)).toEqual({ deleted: true, shred: true });
        expect(tx.blobs.detach(tenant, ref, holder)).toEqual({ deleted: true, shred: true });
        expect(tx.blobs.shredded()).toEqual([{ tenant: 'tenant-b', ref }, { tenant, ref }]);
        const replaced = await tx.blobs.put(input());
        expect(replaced.ok).toBe(true);
        if (!replaced.ok) throw new Error('Could not restore same-content blob');
        expect(replaced.value.ref).toBe(ref);
        expect(tx.blobs.attach(tenant, ref, holder).ok).toBe(true);
        return ok({ pendingShreds: tx.blobs.shredded(), holders: tx.blobs.info(tenant, ref)?.holders });
      });
      expect(renewed).toEqual(ok({ pendingShreds: [{ tenant: 'tenant-b', ref }], holders: 1 }));
      expect(await s.read(tx => tx.blobs.get(tenant, ref)?.bytes)).toEqual(bytes);
      expect(await s.read(tx => tx.blobs.info('tenant-b', ref))).toBeUndefined();

      // A later genuine final deletion still must request key shredding.
      const removed = await s.transaction(tx => ok({
        detached: tx.blobs.detach(tenant, ref, holder),
        pendingShreds: tx.blobs.shredded(),
      }));
      expect(removed).toEqual(ok({
        detached: { deleted: true, shred: true }, pendingShreds: [{ tenant, ref }],
      }));
      expect(await s.read(tx => tx.blobs.info(tenant, ref))).toBeUndefined();
    });

    it(`${adapter}: plaintext replacement still shreds the removed encrypted blob's obsolete key`, async () => {
      const s = await make();
      const tenant = 'tenant-a';
      const bytes = Uint8Array.from([71, 72, 73, 74]);
      const initial = await s.transaction(async tx => {
        const created = await tx.blobs.put({
          tenant, bytes: bytes.slice(), contentType: 'application/octet-stream',
          privacy: 'P1', encrypted: true, now: T0 - 60_000,
        });
        expect(created.ok).toBe(true);
        if (!created.ok) throw new Error('Could not create encrypted fixture');
        expect(tx.blobs.attach(tenant, created.value.ref, 'listing/old').ok).toBe(true);
        return ok(created.value.ref);
      });
      expect(initial.ok).toBe(true);
      if (!initial.ok) throw new Error('Could not commit encrypted fixture');
      const ref = initial.value;

      // The content address stays the same, but the final row no longer needs
      // the *old encrypted object's key*. A same-byte plaintext replacement
      // must not cancel that key-destruction intent.
      const replacement = await s.transaction(async tx => {
        expect(tx.blobs.detach(tenant, ref, 'listing/old')).toEqual({ deleted: true, shred: true });
        const added = await tx.blobs.put({
          tenant, bytes: bytes.slice(), contentType: 'application/octet-stream',
          privacy: 'P0', encrypted: false, now: T0,
        });
        expect(added.ok).toBe(true);
        if (!added.ok) throw new Error('Could not create unencrypted replacement');
        expect(added.value.ref).toBe(ref);
        expect(tx.blobs.attach(tenant, ref, 'listing/new').ok).toBe(true);
        return ok({ pendingShreds: tx.blobs.shredded(), encrypted: tx.blobs.info(tenant, ref)?.encrypted });
      });
      expect(replacement).toEqual(ok({ pendingShreds: [{ tenant, ref }], encrypted: false }));
      expect(await s.read(tx => tx.blobs.get(tenant, ref)?.bytes)).toEqual(bytes);
      expect(await s.read(tx => tx.blobs.info(tenant, ref))).toMatchObject({ encrypted: false, holders: 1 });
    });

    it(`${adapter}: shredded() report mutations cannot redirect pending key deletion`, async () => {
      const s = await make();
      const tenant = 'tenant-a';
      const stored = await s.transaction(async tx => {
        const created = await tx.blobs.put({
          tenant, bytes: Uint8Array.from([81, 82, 83]), contentType: 'application/octet-stream',
          privacy: 'P1', encrypted: true, now: T0 - 60_000,
        });
        return created.ok ? ok(created.value.ref) : created;
      });
      expect(stored.ok).toBe(true);
      if (!stored.ok) throw new Error('Could not create encrypted fixture');
      const ref = stored.value;

      const removed = await s.transaction(tx => {
        expect(tx.blobs.collectOrphans(T0, 1)).toBe(1);
        const first = tx.blobs.shredded();
        expect(first).toEqual([{ tenant, ref }]);
        const exposed = first[0];
        if (!exposed) throw new Error('Missing pending shred fixture');
        // ShreddedBlob is readonly in TypeScript, but its runtime objects were
        // directly shared with the internal map. A consumer can mutate them.
        Object.assign(exposed, { tenant: 'tenant-b', ref: 'blob:sha256-forged' });
        return ok(tx.blobs.shredded());
      });
      expect(removed).toEqual(ok([{ tenant, ref }]));
      expect(await s.read(tx => tx.blobs.info(tenant, ref))).toBeUndefined();
    });

    it(`${adapter}: dead-letter listing rejects invalid limits and preserves bounded ordering`, async () => {
      const s = await make();
      const first = env('dead-limit-1', 'dead-aggregate-1', 1);
      const second = env('dead-limit-2', 'dead-aggregate-2', 1);
      const stored = await s.transaction(tx => {
        tx.inbox.markDead({ consumer: 'dead-limit-consumer', envelope: first, now: T0 }, 1, 'TEST_FAILURE');
        tx.inbox.markDead({ consumer: 'dead-limit-consumer', envelope: second, now: T0 + 1000 }, 2, 'TEST_FAILURE');
        return ok(undefined);
      });
      expect(stored.ok).toBe(true);

      const list = (limit: number, consumer?: string) => s.read(
        tx => tx.deadLetters.list(consumer, limit),
      );
      // SQLite treats LIMIT -1 as unlimited, while memory slices off one row.
      for (const invalid of [-1, -2, 0.5, Number.NaN, -Infinity, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        await expect(list(invalid)).rejects.toThrow(RangeError);
        await expect(list(invalid, 'dead-limit-consumer')).rejects.toThrow(RangeError);
      }
      expect(await list(0)).toEqual([]);
      expect((await list(1, 'dead-limit-consumer')).map(d => d.eventId)).toEqual(['dead-limit-1']);
      expect((await list(2)).map(d => d.eventId)).toEqual(['dead-limit-1', 'dead-limit-2']);
      expect((await s.read(tx => tx.deadLetters.list('dead-limit-consumer'))).length).toBe(2);
      expect((await list(2, 'other-consumer'))).toEqual([]);
    });

    it(`${adapter}: pending outbox reads reject malformed limits before unbounded delivery queries`, async () => {
      const s = await make();
      const stored = await s.transaction(tx => {
        tx.outbox.append(env('limit-event-1', 'limit-aggregate-1', 1));
        tx.outbox.append(env('limit-event-2', 'limit-aggregate-2', 1));
        return ok(undefined);
      });
      expect(stored.ok).toBe(true);

      const pending = (limit: number) => s.read(tx => tx.outbox.pending(
        'limit-consumer', ['test.item.changed'], T0, limit,
      ));
      // SQLite interprets LIMIT -1 as unbounded; memory's slice(0, -1)
      // silently returns nearly every row instead of rejecting the request.
      for (const invalid of [-1, -2, 0.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        await expect(pending(invalid)).rejects.toThrow(RangeError);
      }
      // Preserve the existing zero-result meaning and normal FIFO pagination.
      expect(await pending(0)).toEqual([]);
      expect((await pending(1)).map(e => e.envelope.eventId)).toEqual(['limit-event-1']);
      expect((await pending(2)).map(e => e.envelope.eventId)).toEqual(['limit-event-1', 'limit-event-2']);
    });

    it(`${adapter}: inbox reads cannot mutate committed delivery state without a write`, async () => {
      const s = await make();
      const consumer = 'isolation-consumer';
      const envelope = env('inbox-read-isolation', 'isolation-aggregate', 1);
      const stored = await s.transaction(tx => {
        tx.inbox.markDone({ consumer, envelope, now: T0 }, 1);
        return ok(undefined);
      });
      expect(stored.ok).toBe(true);

      const exposed = await s.read(tx => tx.inbox.get(consumer, envelope.eventId));
      expect(exposed).toMatchObject({ status: 'done', attempts: 1, nextAttemptAt: null });
      if (!exposed) throw new Error('Missing committed inbox row');
      // Types are readonly, but an object retained from a read-only transaction
      // must not alias the memory/IndexedDB working set after that transaction.
      Object.assign(exposed, {
        status: 'retry', attempts: 999, nextAttemptAt: new Date(T0).toISOString(),
      });

      const committed = await s.read(tx => tx.inbox.get(consumer, envelope.eventId));
      expect(committed).toMatchObject({ status: 'done', attempts: 1, nextAttemptAt: null });
    });

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

    it(`${adapter}: sync listing and head queries reject malformed limits before driver reads`, async () => {
      const s = await make();
      const saved = await s.transaction(tx => {
        tx.sync.enqueue({
          id: 'sync-limit-a', tenant: 'tenant-a', destination: 'relay:a',
          envelope: { cid: 'sha256-limit-a', type: 't/v1' }, now: T0,
        });
        tx.sync.enqueue({
          id: 'sync-limit-b', tenant: 'tenant-b', destination: 'relay:b',
          envelope: { cid: 'sha256-limit-b', type: 't/v1' }, now: T0,
        });
        return ok(undefined);
      });
      expect(saved.ok).toBe(true);

      const list = (limit: number) => s.read(tx => tx.sync.list({ limit }));
      const heads = (limit: number) => s.read(tx => tx.sync.heads(T0, limit));
      // SQLite LIMIT -1 is unlimited; memory's negative slice selects a
      // different and still unexpectedly broad set of rows.
      for (const invalid of [-2, -1, 0.5, Number.NaN, -Infinity, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        await expect(list(invalid)).rejects.toThrow(RangeError);
        await expect(heads(invalid)).rejects.toThrow(RangeError);
      }
      expect(await list(0)).toEqual([]);
      expect(await heads(0)).toEqual([]);
      expect((await list(1)).map(v => v.ref)).toEqual(['sha256-limit-a']);
      expect((await heads(1)).map(v => v.ref)).toEqual(['sha256-limit-a']);
      expect((await list(2)).map(v => v.ref)).toEqual(['sha256-limit-a', 'sha256-limit-b']);
      expect((await heads(2)).map(v => v.ref)).toEqual(['sha256-limit-a', 'sha256-limit-b']);
      expect((await s.read(tx => tx.sync.list())).length).toBe(2);
      expect((await s.read(tx => tx.sync.list({ tenant: 'tenant-b', limit: 2 }))).map(v => v.ref))
        .toEqual(['sha256-limit-b']);
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

    it(`${adapter}: content-addressed blobs cannot silently cross encryption classifications`, async () => {
      const s = await make();
      const bytes = new Uint8Array([137, 80, 78, 71, 5, 6, 7]);
      const put = (tenant: string, encrypted: boolean, privacy: 'P0' | 'P2') =>
        s.transaction(tx => tx.blobs.put({ tenant, bytes, contentType: 'image/png', privacy, encrypted, now: T0 }));
      const sealed = await put('tenant-sealed', true, 'P2');
      const plain = await put('tenant-plain', false, 'P0');
      expect(sealed.ok && plain.ok).toBe(true);
      const ref = sealed.ok ? sealed.value.ref : '';
      expect(plain.ok && plain.value.ref).toBe(ref);

      const originalSealed = await s.read(tx => tx.blobs.info('tenant-sealed', ref));
      const originalPlain = await s.read(tx => tx.blobs.info('tenant-plain', ref));
      // Both conflicts must fail before changing privacy or encryption metadata.
      const asPlain = await put('tenant-sealed', false, 'P0');
      const asEncrypted = await put('tenant-plain', true, 'P2');
      expect(!asPlain.ok && asPlain.error.code).toBe('CONFLICT_STATE');
      expect(!asEncrypted.ok && asEncrypted.error.code).toBe('CONFLICT_STATE');
      expect(await s.read(tx => tx.blobs.info('tenant-sealed', ref))).toEqual(originalSealed);
      expect(await s.read(tx => tx.blobs.info('tenant-plain', ref))).toEqual(originalPlain);
      expect(Array.from((await s.read(tx => tx.blobs.get('tenant-sealed', ref)))?.bytes ?? []))
        .toEqual(Array.from(bytes));
      expect(Array.from((await s.read(tx => tx.blobs.get('tenant-plain', ref)))?.bytes ?? []))
        .toEqual(Array.from(bytes));

      // Matching encryption metadata remains idempotent, including intended publication.
      const publish = await put('tenant-sealed', true, 'P0');
      expect(publish.ok && publish.value).toMatchObject({ ref, encrypted: true, privacy: 'P0' });
      const repeatPlain = await put('tenant-plain', false, 'P0');
      expect(repeatPlain.ok && repeatPlain.value).toMatchObject({ ref, encrypted: false, privacy: 'P0' });
    });

    it(`${adapter}: duplicate blob bytes cannot silently change declared content types`, async () => {
      const s = await make();
      const bytes = new Uint8Array([60, 115, 118, 103, 62]);
      const put = (tenant: string, contentType: string, privacy: 'P0' | 'P2', encrypted = true) =>
        s.transaction(tx => tx.blobs.put({ tenant, bytes, contentType, privacy, encrypted, now: T0 }));
      const image = await put('tenant-image', 'image/png', 'P2');
      const text = await put('tenant-text', 'text/plain', 'P2');
      expect(image.ok && text.ok).toBe(true);
      const ref = image.ok ? image.value.ref : '';
      expect(text.ok && text.value.ref).toBe(ref);

      const beforeImage = await s.read(tx => tx.blobs.info('tenant-image', ref));
      const beforeText = await s.read(tx => tx.blobs.info('tenant-text', ref));
      // Both type conflicts must fail before lowering the stored privacy.
      const asHtml = await put('tenant-image', 'text/html', 'P0');
      const asImage = await put('tenant-text', 'image/png', 'P0');
      expect(!asHtml.ok && asHtml.error.code).toBe('CONFLICT_STATE');
      expect(!asImage.ok && asImage.error.code).toBe('CONFLICT_STATE');
      expect(await s.read(tx => tx.blobs.info('tenant-image', ref))).toEqual(beforeImage);
      expect(await s.read(tx => tx.blobs.info('tenant-text', ref))).toEqual(beforeText);
      expect(Array.from((await s.read(tx => tx.blobs.get('tenant-image', ref)))?.bytes ?? []))
        .toEqual(Array.from(bytes));

      // Matching content types can still be deduplicated and published.
      const published = await put('tenant-image', 'image/png', 'P0');
      expect(published.ok && published.value).toMatchObject({ ref, contentType: 'image/png', privacy: 'P0', encrypted: true });
      const repeated = await put('tenant-text', 'text/plain', 'P2');
      expect(repeated.ok && repeated.value).toMatchObject({ ref, contentType: 'text/plain', privacy: 'P2', encrypted: true });

      // Public plaintext dedupe must enforce the same MIME boundary.
      const publicImage = await put('tenant-public', 'image/png', 'P0', false);
      expect(publicImage.ok && publicImage.value).toMatchObject({ ref, contentType: 'image/png', encrypted: false });
      const publicAsHtml = await put('tenant-public', 'text/html', 'P0', false);
      expect(!publicAsHtml.ok && publicAsHtml.error.code).toBe('CONFLICT_STATE');
      expect(await s.read(tx => tx.blobs.info('tenant-public', ref)))
        .toMatchObject({ contentType: 'image/png', encrypted: false });
    });

    it(`TEST-PS-119-09.T17 ${adapter}: encrypted blobs released by repository writes or the orphan sweep are reported as shredded in that transaction`, async () => {
      const s = await make();
      const thread = defineRepo({ type: 'test.thread', schema: z.strictObject({ media: z.array(z.string()) }), blobs: (d) => d.media });
      const put = async (bytes: number[], encrypted: boolean, tenantId = 'tenant-a') => {
        const r = await s.transaction((tx) => scoped(tx, tenantId).blobs.put(new Uint8Array(bytes), { contentType: 'image/png', privacy: encrypted ? 'P2' : 'P0', encrypted }));
        return r.ok ? r.value.ref : '';
      };
      const sealed = await put([9, 1], true);
      const sealed2 = await put([9, 2], true);
      const plain = await put([9, 3], false);
      await s.transaction((tx) => scoped(tx).repo(thread).put('t1', { media: [sealed, sealed2, plain] }, { expectedRevision: 0 }));
      const swap = await s.transaction((tx) => {
        const r = scoped(tx).repo(thread).put('t1', { media: [sealed2] }, { expectedRevision: 1 });
        return r.ok ? ok(scoped(tx).blobs.shredded()) : r;
      });
      expect(swap.ok && swap.value).toEqual([sealed]);
      expect(await s.read((tx) => [scoped(tx).blobs.info(sealed), scoped(tx).blobs.info(plain)])).toEqual([undefined, undefined]);
      const rolledBack = await s.transaction((tx) => {
        const r = scoped(tx).repo(thread).remove('t1', { expectedRevision: 2 });
        return r.ok ? err(appError('CONFLICT_STATE', { params: { shredded: scoped(tx).blobs.shredded() } })) : r;
      });
      expect(!rolledBack.ok && rolledBack.error.params).toEqual({ shredded: [sealed2] });
      expect(await s.read((tx) => [scoped(tx).blobs.info(sealed2)?.holders, tx.blobs.shredded()])).toEqual([1, []]);
      const removed = await s.transaction((tx) => {
        const r = scoped(tx).repo(thread).remove('t1', { expectedRevision: 2 });
        return r.ok ? ok({ mine: scoped(tx).blobs.shredded(), other: scoped(tx, 'tenant-b').blobs.shredded() }) : r;
      });
      expect(removed.ok && removed.value).toEqual({ mine: [sealed2], other: [] });
      expect(await s.read((tx) => scoped(tx).blobs.get(sealed2))).toBeUndefined();
      const orphan = await put([9, 4], true, 'tenant-b');
      await put([9, 5], false, 'tenant-b');
      const swept = await s.transaction((tx) => ok({ n: tx.blobs.collectOrphans(clock.now() + 1), all: tx.blobs.shredded(), b: scoped(tx, 'tenant-b').blobs.shredded() }));
      expect(swept.ok && swept.value).toEqual({ n: 2, all: [{ tenant: 'tenant-b', ref: orphan }], b: [orphan] });
    });

    it(`TEST-PS-119-09.T09 ${adapter}: inbox rows are pruned with their events; dead letters are kept 30 days and hold their event until purged`, async () => {
      const s = await make();
      const DAY = 86_400_000;
      const at = T0 - 15 * DAY;
      const old = (id: string, agg: string) => ({ ...env(id, agg, 1), occurredAt: new Date(at).toISOString() });
      await s.transaction((tx) => {
        for (const e of [old('p1', 'A'), old('p2', 'B'), old('p3', 'C'), env('n1', 'D', 1)]) tx.outbox.append(e);
        tx.inbox.markDone({ consumer: 'c1', envelope: old('p1', 'A'), now: at }, 1);
        tx.inbox.markDone({ consumer: 'c2', envelope: old('p1', 'A'), now: at }, 1);
        tx.inbox.markDead({ consumer: 'c1', envelope: old('p2', 'B'), now: at }, 8, 'INTERNAL');
        tx.inbox.markDone({ consumer: 'c2', envelope: old('p2', 'B'), now: at }, 1);
        tx.inbox.markRetry({ consumer: 'c1', envelope: old('p3', 'C'), now: at }, 2, at + 1000, 'INTERNAL');
        tx.inbox.markDone({ consumer: 'c1', envelope: env('n1', 'D', 1), now: T0 }, 1);
        return ok(undefined);
      });
      const rows = (tx: Tx) => ({
        outbox: ['p1', 'p2', 'p3', 'n1'].filter((id) => tx.outbox.get(id)),
        inbox: (['c1:p1', 'c2:p1', 'c1:p2', 'c2:p2', 'c1:p3', 'c1:n1'] as const).filter((key) => {
          const [consumer = '', eventId = ''] = key.split(':');
          return tx.inbox.get(consumer, eventId) !== undefined;
        }),
        dead: tx.deadLetters.list(undefined).map((d) => d.eventId),
      });
      const first = await s.transaction((tx) => ok(sweepRetention(tx, T0)));
      expect(first.ok && first.value).toEqual({ deadLetters: 0, outbox: 2, idempotency: 0 });
      expect(await s.read(rows)).toEqual({ outbox: ['p2', 'n1'], inbox: ['c1:p2', 'c2:p2', 'c1:n1'], dead: ['p2'] });
      const edge = await s.transaction((tx) => ok(tx.deadLetters.purgeBefore(at)));
      expect(edge.ok && edge.value).toBe(0);
      const later = await s.transaction((tx) => ok(sweepRetention(tx, at + 30 * DAY + 1)));
      expect(later.ok && later.value).toEqual({ deadLetters: 1, outbox: 2, idempotency: 0 });
      expect(await s.read(rows)).toEqual({ outbox: [], inbox: [], dead: [] });
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
