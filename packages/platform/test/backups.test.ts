import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { DomainEvent, Versioned } from '@classrup/kernel';
import { DAY, InMemoryDataStore, ManualClock, toJsonSafe } from '@classrup/kernel';
import { generateSigningKeyPair, keyIdOf } from '@classrup/security';
import type { BackupSnapshot } from '../src/index';
import {
  createBackup, DEFAULT_RETENTION, MemoryBackupStore, parseBackup, restoreBackup, selectBackupsToKeep, selectBackupsToPrune, serializeBackup,
  verifyBackup,
} from '../src/index';
import { admin, errorCode, eventTypes, expectDeclaredEvents, harness, operator, system, TENANT } from './helpers';

interface Item extends Versioned {
  readonly tenantId: string;
  readonly price: { currency: string; minor: bigint };
}

const KEY = generateSigningKeyPair();
const SIGNER = keyIdOf(KEY.publicKey);

const event = (n: number, tenantId = TENANT): DomainEvent => ({
  eventId: `evt_${n}`,
  type: 'bazaar.listing.created',
  schemaVersion: 1,
  aggregateType: 'listing',
  aggregateId: `lst_${n}`,
  revision: 1,
  tenantId,
  actorId: 'acct_1',
  occurredAt: 1000 + n,
  correlationId: `cor_${n}`,
  provenance: { origin: 'local' },
  payload: { n },
});

function populated(): InMemoryDataStore {
  const store = new InMemoryDataStore();
  const items = store.collection<Item>('bazaar_listings');
  items.put({ id: 'lst_a', tenantId: TENANT, price: { currency: 'USD', minor: 12_345_678_901_234_567_890n } }, 0);
  items.put({ id: 'lst_b', tenantId: 'tnt_other', price: { currency: 'EUR', minor: 5n } }, 0);
  const a = items.require('lst_a');
  items.put(a, a.version);
  items.put(items.require('lst_a'), 2);
  store.events.append([event(1), event(2, 'tnt_other'), event(3)]);
  return store;
}

describe('snapshot format', () => {
  it('builds a signed manifest whose hashes verify', () => {
    const snap = createBackup(populated(), KEY, 42);
    expect(snap.manifest).toMatchObject({ version: 1, createdAt: 42, eventsCount: 3, eventsLastPosition: 3, collections: { bazaar_listings: { count: 2 } } });
    expect(snap.manifest.tenant).toBeUndefined();
    expect(snap.signature.ctx).toBe('backup-manifest');
    expect(verifyBackup(snap, SIGNER)).toEqual({ ok: true, problems: [] });
  });

  it('survives serialization with bigint values intact', () => {
    const snap = createBackup(populated(), KEY, 42);
    const parsed = parseBackup(serializeBackup(snap));
    expect(verifyBackup(parsed, SIGNER).ok).toBe(true);
    expect((parsed.data.collections.bazaar_listings?.[0] as Item).price.minor).toBe(12_345_678_901_234_567_890n);
  });

  it('detects tampered records, events, manifests, signers and missing collections', () => {
    const snap = createBackup(populated(), KEY, 42);
    const clone = (): BackupSnapshot => parseBackup(serializeBackup(snap));
    const editedRecord = clone();
    (editedRecord.data.collections.bazaar_listings?.[0] as unknown as Item).price.minor = 1n;
    expect(verifyBackup(editedRecord, SIGNER).problems).toEqual(expect.arrayContaining(['collection bazaar_listings hash mismatch', 'data hash mismatch']));

    const editedEvents = clone();
    (editedEvents.data.events[0]?.event as { actorId: string }).actorId = 'acct_evil';
    expect(verifyBackup(editedEvents, SIGNER).problems).toContain('event hash mismatch');

    const droppedEvent = clone();
    (droppedEvent.data.events as unknown[]).pop();
    expect(verifyBackup(droppedEvent, SIGNER).problems).toEqual(expect.arrayContaining(['event count mismatch', 'last event position mismatch']));

    const editedManifest = clone();
    (editedManifest.manifest as { createdAt: number }).createdAt = 1;
    expect(verifyBackup(editedManifest, SIGNER).problems).toContain('manifest differs from signed manifest');

    expect(verifyBackup(snap, keyIdOf(generateSigningKeyPair().publicKey)).problems).toContain('signed by an untrusted key');

    const dropped = clone();
    delete (dropped.data.collections as Record<string, unknown>).bazaar_listings;
    expect(verifyBackup(dropped, SIGNER).problems).toContain('collection bazaar_listings missing from data');

    const resigned = createBackup(populated(), generateSigningKeyPair(), 42);
    expect(verifyBackup(resigned, SIGNER).ok).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(errorCode(() => parseBackup('not json'))).toBe('BACKUP.MALFORMED');
    expect(errorCode(() => parseBackup('{"manifest":{}}'))).toBe('BACKUP.MALFORMED');
  });

  it('tenant-scoped backups hold only that tenant and stay verifiable', () => {
    const snap = createBackup(populated(), KEY, 42, 'tnt_other');
    expect(snap.manifest.tenant).toBe('tnt_other');
    expect(Object.values(snap.data.collections).flat().map((r) => r.id)).toEqual(['lst_b']);
    expect(snap.data.events.map((e) => e.event.eventId)).toEqual(['evt_2']);
    expect(verifyBackup(snap, SIGNER).ok).toBe(true);
  });
});

describe('restore', () => {
  it('restores into an empty store preserving versions, bigint values and event order', () => {
    const source = populated();
    const snap = parseBackup(serializeBackup(createBackup(source, KEY, 42)));
    const target = new InMemoryDataStore();
    expect(restoreBackup(target, snap, SIGNER)).toEqual({ collections: 1, records: 2, events: 3 });
    expect(target.exportSnapshot()).toEqual(source.exportSnapshot());
    expect(target.collection<Item>('bazaar_listings').require('lst_a').version).toBe(3);
    expect(target.events.lastPosition()).toBe(3);
  });

  it('refuses a non-empty target and leaves it untouched', () => {
    const snap = createBackup(populated(), KEY, 42);
    const withEvents = new InMemoryDataStore();
    withEvents.events.append([event(9)]);
    expect(errorCode(() => restoreBackup(withEvents, snap, SIGNER))).toBe('BACKUP.TARGET_NOT_EMPTY');
    const withRecords = new InMemoryDataStore();
    withRecords.collection<Item>('other_things').put({ id: 'x', tenantId: TENANT, price: { currency: 'USD', minor: 1n } }, 0);
    expect(errorCode(() => restoreBackup(withRecords, snap, SIGNER))).toBe('BACKUP.TARGET_NOT_EMPTY');
    expect(withEvents.events.lastPosition()).toBe(1);
    expect(withRecords.collection('bazaar_listings').count()).toBe(0);
  });

  it('refuses tampered or untrusted backups before writing anything', () => {
    const snap = parseBackup(serializeBackup(createBackup(populated(), KEY, 42)));
    (snap.data.collections.bazaar_listings?.[0] as unknown as Item).price.minor = 2n;
    const target = new InMemoryDataStore();
    expect(errorCode(() => restoreBackup(target, snap, SIGNER))).toBe('BACKUP.INVALID');
    expect(target.exportSnapshot().events).toHaveLength(0);
  });

  it('property: backup then restore reproduces any store content', () => {
    const record = fc.record({ id: fc.string({ minLength: 1, maxLength: 8 }).map((s) => `r_${s.replace(/\W/g, 'x')}`), bumps: fc.nat(3), minor: fc.bigInt() });
    fc.assert(
      fc.property(fc.array(record, { maxLength: 8 }), fc.nat(5), (records, eventCount) => {
        const source = new InMemoryDataStore();
        const col = source.collection<Item>('bazaar_listings');
        for (const r of records) {
          if (col.get(r.id)) continue;
          col.put({ id: r.id, tenantId: TENANT, price: { currency: 'USD', minor: r.minor } }, 0);
          for (let v = 1; v <= r.bumps; v++) col.put(col.require(r.id), v);
        }
        source.events.append(Array.from({ length: eventCount }, (_, n) => event(n + 1)));
        const snap = parseBackup(serializeBackup(createBackup(source, KEY, 1)));
        const target = new InMemoryDataStore();
        restoreBackup(target, snap, SIGNER);
        const a = JSON.stringify(toJsonSafe(source.exportSnapshot().collections.bazaar_listings?.slice().sort((x, y) => (x.id < y.id ? -1 : 1)) ?? []));
        const b = JSON.stringify(toJsonSafe(target.exportSnapshot().collections.bazaar_listings?.slice().sort((x, y) => (x.id < y.id ? -1 : 1)) ?? []));
        return a === b && target.events.lastPosition() === eventCount;
      }),
    );
  });
});

describe('retention', () => {
  const stamp = (id: string, day: number, hour = 12) => ({ id, createdAt: Date.UTC(2026, 0, 1) + day * DAY + hour * 3_600_000 });

  it('keeps the latest per day, week and month and prunes the rest', () => {
    const backups = Array.from({ length: 120 }, (_, d) => stamp(`b${d}`, d));
    const keep = selectBackupsToKeep(backups);
    expect(keep.has('b119')).toBe(true);
    for (let d = 113; d <= 119; d++) expect(keep.has(`b${d}`)).toBe(true);
    expect(keep.has('b100')).toBe(false);
    expect(keep.size).toBeLessThanOrEqual(7 + 4 + 12);
    expect(selectBackupsToPrune(backups)).toHaveLength(120 - keep.size);
  });

  it('keeps only the latest snapshot of a day and counts buckets that exist, not calendar gaps', () => {
    const backups = [stamp('early', 0, 1), stamp('late', 0, 23), stamp('old', -400)];
    const keep = selectBackupsToKeep(backups, { daily: 1, weekly: 1, monthly: 2 });
    expect([...keep].sort()).toEqual(['late', 'old']);
    expect(selectBackupsToPrune(backups, { daily: 1, weekly: 1, monthly: 2 })).toEqual(['early']);
    expect(selectBackupsToKeep([])).toEqual(new Set());
  });

  it('property: newest is kept, result is bounded, order independent and idempotent', () => {
    const arb = fc.uniqueArray(fc.integer({ min: 0, max: 900 * 24 }), { minLength: 1, maxLength: 80 });
    fc.assert(
      fc.property(arb, (hours) => {
        const backups = hours.map((h, i) => ({ id: `b${i}`, createdAt: Date.UTC(2025, 0, 1) + h * 3_600_000 }));
        const keep = selectBackupsToKeep(backups);
        const newest = backups.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
        const reversed = selectBackupsToKeep([...backups].reverse());
        const kept = backups.filter((b) => keep.has(b.id));
        const again = selectBackupsToKeep(kept);
        const bound = DEFAULT_RETENTION.daily + DEFAULT_RETENTION.weekly + DEFAULT_RETENTION.monthly;
        return keep.has(newest.id) && keep.size <= bound && [...keep].sort().join() === [...reversed].sort().join() && again.size === kept.length;
      }),
    );
  });
});

describe('backup operations', () => {
  const setup = () => {
    const backupStore = new MemoryBackupStore();
    const h = harness({ operatorKey: KEY, backupStore });
    h.deps.store.collection<Item>('bazaar_listings').put({ id: 'lst_a', tenantId: TENANT, price: { currency: 'USD', minor: 99n } }, 0);
    return { h, backupStore };
  };

  it('creates, lists and verifies backups; the operator and system may, admins may not', () => {
    const { h, backupStore } = setup();
    const created = h.call('platform.backup.create', operator(), {}, 'key-backup-01') as { id: string; collections: number; signer: string; sizeBytes: number };
    expect(created.id).toMatch(/^bkp_/);
    expect(created.signer).toBe(SIGNER);
    expect(backupStore.get(created.id)?.length).toBe(created.sizeBytes);
    expect(h.call('platform.backup.create', operator(), {}, 'key-backup-01')).toEqual(created);
    expect(errorCode(() => h.call('platform.backup.create', admin(), {}))).toBe('AUTHZ.FORBIDDEN');
    const verified = h.call('platform.backup.verify', system(), { backupId: created.id }) as { ok: boolean; problems: string[]; lastVerificationOk: boolean };
    expect(verified).toMatchObject({ ok: true, problems: [], lastVerificationOk: true });
    expect(h.call('platform.backup.list', operator())).toHaveLength(1);
    expect(errorCode(() => h.call('platform.backup.list', admin()))).toBe('AUTHZ.FORBIDDEN');
    expect(eventTypes(h.deps)).toEqual(['platform.backup.created', 'platform.backup.verified']);
    expectDeclaredEvents(h.deps);
  });

  it('records a failed verification when the stored blob was tampered with', () => {
    const { h, backupStore } = setup();
    const created = h.call('platform.backup.create', operator()) as { id: string };
    backupStore.put(created.id, (backupStore.get(created.id) as string).replace('"minor":{"$bigint":"99"}', '"minor":{"$bigint":"1"}'));
    const result = h.call('platform.backup.verify', operator(), { backupId: created.id }) as { ok: boolean; problems: string[] };
    expect(result.ok).toBe(false);
    expect(result.problems).toContain('data hash mismatch');
    expect((h.call('platform.backup.list', operator()) as { lastVerificationOk: boolean }[])[0]?.lastVerificationOk).toBe(false);
  });

  it('is unavailable without an operator key and validates ids', () => {
    const h = harness();
    expect(errorCode(() => h.call('platform.backup.create', operator()))).toBe('BACKUP.NOT_CONFIGURED');
    const { h: h2 } = setup();
    expect(errorCode(() => h2.call('platform.backup.verify', operator(), { backupId: 'nope' }))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => h2.call('platform.backup.verify', operator(), { backupId: 'bkp_00000000000000000000000000' }))).toBe('PLATFORM_BACKUPS.NOT_FOUND');
  });

  it('purges backups outside the retention policy over time and keeps an audit record', () => {
    const { h, backupStore } = setup();
    const clock = h.deps.clock as ManualClock;
    const ids: string[] = [];
    for (let d = 0; d < 40; d++) {
      ids.push((h.call('platform.backup.create', operator()) as { id: string }).id);
      clock.advance(DAY);
    }
    const result = h.call('platform.backup.purge_due', system(), {}) as { pruned: string[] };
    expect(result.pruned.length).toBeGreaterThan(0);
    for (const id of result.pruned) expect(backupStore.get(id)).toBeUndefined();
    expect(backupStore.get(ids[ids.length - 1] as string)).toBeDefined();
    const listed = h.call('platform.backup.list', operator()) as { id: string; status: string }[];
    expect(listed).toHaveLength(40);
    expect(listed.filter((b) => b.status === 'pruned').map((b) => b.id).sort()).toEqual([...result.pruned].sort());
    expect((h.call('platform.backup.purge_due', system(), {}) as { pruned: string[] }).pruned).toEqual([]);
    expect(errorCode(() => h.call('platform.backup.purge_due', admin(), {}))).toBe('AUTHZ.FORBIDDEN');
  });

  it('platform.backups.restore verifies with the configured operator key', () => {
    const { h, backupStore } = setup();
    const created = h.call('platform.backup.create', operator()) as { id: string };
    const target = new InMemoryDataStore();
    expect(h.platform.backups.restore(target, backupStore.get(created.id) as string)).toMatchObject({ records: 1 });
    expect(target.collection<Item>('bazaar_listings').require('lst_a').price.minor).toBe(99n);
    expect(() => harness().platform.backups.restore(new InMemoryDataStore(), backupStore.get(created.id) as string)).toThrow(/operatorKey/);
  });
});
