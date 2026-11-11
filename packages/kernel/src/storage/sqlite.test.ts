import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createFakeClock } from '../clock/clock.ts';
import { appError, AppErrorException } from '../errors/app-error.ts';
import { err, ok } from '../errors/result.ts';
import { createDeterministicIds } from '../ids/uuidv7.ts';
import { createBus } from '../bus/bus.ts';
import { createRegistry } from '../bus/define.ts';
import { allowAllAuthz } from '../bus/ports.ts';
import { sampleDefinitions } from '../testing/sample-module.ts';
import { migrationStatus, runMigrations } from './migrations.ts';
import { defineRepo, type Page } from './repo.ts';
import { writeScope } from './scope.ts';
import { openSqliteStorage } from './sqlite.ts';
import { createMemoryStorage, type Storage } from './storage.ts';
import type { StoredRecord, Tx } from './tx.ts';

const dir = mkdtempSync(join(tmpdir(), 'classrup-kernel-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const clock = createFakeClock('2026-11-04T10:00:00.000Z');
const ids = createDeterministicIds({ seed: 11, now: () => clock.now() });
const note = defineRepo({ type: 'test.note', schema: z.strictObject({ owner: z.string(), text: z.string() }), indexes: { owner: (d) => d.owner } });
const scope = (tx: Tx, tenantId = 'tenant-a') => writeScope({ tx, tenantId, clock, ids, deliveryEligible: false });

function p95(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? 0;
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const t = performance.now();
  await fn();
  return performance.now() - t;
}

describe('SQLite relay adapter (PS-119)', () => {
  it('TEST-PS-119-09.T07 WAL and busy_timeout are set; a database locked by another writer maps to DEPENDENCY_UNAVAILABLE', async () => {
    const path = join(dir, 'busy.db');
    const s = openSqliteStorage({ path, busyTimeoutMs: 50 });
    expect(s.pragmas()).toEqual({ journalMode: 'wal', busyTimeoutMs: 50 });
    const defaults = openSqliteStorage({ path: join(dir, 'default.db') });
    expect(defaults.pragmas().busyTimeoutMs).toBe(5000);
    await defaults.close();
    const other = new DatabaseSync(path);
    other.exec('BEGIN IMMEDIATE');
    const e = await s.transaction(() => ok(1)).catch((x: unknown) => x);
    expect(e instanceof AppErrorException && e.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    const bus = createBus({ registry: createRegistry().add(...sampleDefinitions().all), storage: s, clock, ids, authz: allowAllAuthz });
    const r = await bus.dispatch({ actor: { kind: 'user', id: 'u', roles: [] }, tenantId: 't' }, 'sample.item.create', { itemId: ids.next(), name: 'x' }, { idempotencyKey: ids.next() });
    expect(!r.ok && r.error).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', retryable: true });
    other.exec('ROLLBACK');
    other.close();
    expect(await s.ping()).toBe(true);
    await s.close();
  });

  it('TEST-PS-119-09.T12 load: with 5 000 records, get+put p95 ≤ 5 ms and a 50-item index query p95 ≤ 20 ms', async () => {
    const s = openSqliteStorage({ path: join(dir, 'load.db') });
    await s.transaction((tx) => {
      const repo = scope(tx).repo(note);
      for (let i = 0; i < 5000; i++) repo.put(`n${String(i).padStart(5, '0')}`, { owner: `o${i % 50}`, text: 'x'.repeat(200) }, { expectedRevision: 0 });
      return ok(undefined);
    });
    const writes: number[] = [];
    for (let i = 0; i < 200; i++) {
      const id = `n${String(i * 7).padStart(5, '0')}`;
      writes.push(await time(() => s.transaction((tx) => {
        const repo = scope(tx).repo(note);
        const cur = repo.get(id);
        return cur ? repo.put(id, { ...cur.data, text: `t${i}` }, { expectedRevision: cur.revision }) : err(appError('NOT_FOUND'));
      })));
    }
    const reads: number[] = [];
    for (let i = 0; i < 100; i++) reads.push(await time(() => s.read((tx) => scope(tx).repo(note).query({ where: { owner: `o${i % 50}` }, limit: 50 }))));
    expect(p95(writes)).toBeLessThanOrEqual(5);
    expect(p95(reads)).toBeLessThanOrEqual(20);
    await s.close();
  });

  it('TEST-PS-119-09.T13 export by ordered scan and restore into another adapter keep IDs, revisions and data; conflicts are rejected', async () => {
    const source = createMemoryStorage();
    await source.transaction((tx) => {
      const repo = scope(tx).repo(note);
      for (let i = 0; i < 120; i++) repo.put(`n${String(i).padStart(3, '0')}`, { owner: `o${i % 3}`, text: `t${i}` }, { expectedRevision: 0 });
      return repo.put('n000', { owner: 'o0', text: 'edited' }, { expectedRevision: 1 });
    });
    const exportAll = async (st: Storage): Promise<StoredRecord<unknown>[]> => {
      const out: StoredRecord<unknown>[] = [];
      let cursor: string | undefined;
      do {
        const page = await st.read((tx) => scope(tx).repo(note).query({ limit: 50, ...(cursor ? { cursor } : {}) }));
        if (!page.ok) throw new Error(page.error.code);
        const v: Page<unknown> = page.value;
        out.push(...v.items);
        cursor = v.nextCursor;
      } while (cursor);
      return out;
    };
    const dump = await exportAll(source);
    expect(dump).toHaveLength(120);
    const target = openSqliteStorage({ path: ':memory:' });
    const restored = await target.transaction((tx) => {
      const repo = scope(tx).repo(note);
      for (const rec of dump) {
        const r = repo.restore(rec as StoredRecord<{ owner: string; text: string }>);
        if (!r.ok) return r;
      }
      return ok(undefined);
    });
    expect(restored.ok).toBe(true);
    expect(await exportAll(target)).toEqual(dump);
    const again = await target.transaction((tx) => scope(tx).repo(note).restore(dump[0] as StoredRecord<{ owner: string; text: string }>));
    expect(again.ok && again.value).toBe('identical');
    const conflict = await target.transaction((tx) => scope(tx).repo(note).restore({ ...(dump[0] as StoredRecord<{ owner: string; text: string }>), data: { owner: 'o0', text: 'forged' } }));
    expect(!conflict.ok && conflict.error.code).toBe('CONFLICT_REVISION');
    const owned = await target.read((tx) => scope(tx).repo(note).query({ where: { owner: 'o1' }, limit: 500 }));
    expect(owned.ok && owned.value.items).toHaveLength(40);
    await target.close();
  });

  it('TEST-PS-119-09.T14 migrations are forward-only and recorded once; checksum drift stops startup', async () => {
    const path = join(dir, 'mig.db');
    const s1 = openSqliteStorage({ path });
    await s1.close();
    const s2 = openSqliteStorage({ path });
    const kernelRows = await s2.read((tx) => tx.migrations.list().map((m) => m.id));
    expect(kernelRows).toEqual(['kernel:0001_base', 'kernel:0002_media_blobs']);
    const backfill = { id: 'test:0002_backfill', up: (tx: Tx, now: number) => scope(tx).repo(note).put('seed', { owner: 'sys', text: String(now) }, { expectedRevision: 0 }).ok ? ok(undefined) : err(appError('CONFLICT_STATE')) };
    const broken = { id: 'test:0003_broken', up: () => err(appError('PRECONDITION_FAILED')) };
    for (const st of [s2, createMemoryStorage()]) {
      expect(await migrationStatus(st, [backfill])).toMatchObject({ pending: ['test:0002_backfill'] });
      const first = await runMigrations(st, [backfill], clock);
      expect(first.ok && first.value).toEqual(['test:0002_backfill']);
      const second = await runMigrations(st, [backfill], clock);
      expect(second.ok && second.value).toEqual([]);
      const failed = await runMigrations(st, [backfill, broken], clock);
      expect(!failed.ok && failed.error.code).toBe('PRECONDITION_FAILED');
      expect((await migrationStatus(st, [backfill, broken])).pending).toEqual(['test:0003_broken']);
      await expect(runMigrations(st, [backfill, backfill], clock)).rejects.toThrow('duplicate');
    }
    await s2.close();
    const raw = new DatabaseSync(path);
    raw.prepare("UPDATE schema_migrations SET checksum = 'tampered' WHERE id = 'kernel:0001_base'").run();
    raw.close();
    let drift: unknown;
    try {
      openSqliteStorage({ path });
    } catch (e) {
      drift = e;
    }
    expect(drift instanceof AppErrorException && drift.error.code).toBe('PLATFORM_STORE_MIGRATION_DRIFT');
  });
});
