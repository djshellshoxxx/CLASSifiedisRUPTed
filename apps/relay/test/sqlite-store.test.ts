import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createIdGenerator, ctxFor, InMemoryEventBus, ManualClock, MemoryLogger, allFlagsEnabled, allowAll, nullMetrics, runCommand, testActor } from '@classrup/kernel';
import { SqliteDataStore } from '../src/storage';

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'classrup-'));
  dirs.push(d);
  return join(d, 'relay.sqlite');
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

type Thing = { id: string; version: number; n: bigint };

describe('SqliteDataStore', () => {
  it('persists records, events and idempotency across reopen', () => {
    const path = tmp();
    const clock = new ManualClock();
    const store = new SqliteDataStore(path);
    const deps = { clock, ids: createIdGenerator(clock), store, bus: new InMemoryEventBus(), logger: new MemoryLogger(), flags: allFlagsEnabled, authz: allowAll, metrics: nullMetrics };
    const ctx = ctxFor(testActor('acct_a'), 'key-0000001');
    const res = runCommand(deps, ctx, { name: 't.thing.create', request: { n: '5' } }, () => ({
      result: store.collection<Thing>('things').put({ id: 't1', n: 5n }, 0),
      events: [{ type: 't.thing.created', aggregateType: 'thing', aggregateId: 't1', revision: 1, payload: { n: 5n } }],
    }));
    expect(res.version).toBe(1);
    store.close();

    const reopened = new SqliteDataStore(path);
    expect(reopened.collection<Thing>('things').require('t1').n).toBe(5n);
    expect(reopened.events.lastPosition()).toBe(1);
    expect(reopened.events.byAggregate('t1')[0]?.payload).toEqual({ n: 5n });
    expect(reopened.idempotency.get(`tnt_default:acct_a:t.thing.create:key-0000001`, clock.now())).toBeDefined();
    reopened.close();
  });

  it('rolls back atomically including the cache and discards afterCommit callbacks', () => {
    const store = new SqliteDataStore(tmp());
    const things = store.collection<Thing>('things');
    let called = false;
    expect(() =>
      store.transaction(() => {
        things.put({ id: 'a', n: 1n }, 0);
        store.events.append([{ eventId: 'e', type: 'a.b.c', aggregateId: 'a' } as never]);
        store.afterCommit(() => {
          called = true;
        });
        throw new Error('fail');
      }),
    ).toThrow('fail');
    expect(things.get('a')).toBeUndefined();
    expect(store.events.lastPosition()).toBe(0);
    expect(called).toBe(false);
    things.put({ id: 'a', n: 1n }, 0);
    expect(() => things.put({ id: 'a', n: 2n }, 0)).toThrow(/concurrently/);
    expect(store.exportSnapshot().collections.things).toHaveLength(1);
    store.close();
  });
});
