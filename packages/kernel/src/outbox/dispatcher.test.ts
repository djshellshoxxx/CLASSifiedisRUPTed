import { describe, expect, it } from 'vitest';
import { ok } from '../errors/result.ts';
import { createTestKernel } from '../testing/harness.ts';
import { SAMPLE_MODULE, sampleDefinitions, type SampleCounters } from '../testing/sample-module.ts';
import { fullJitterDelay } from './backoff.ts';
import { MAX_DELIVERY_ATTEMPTS } from './dispatcher.ts';

function setup(random: () => number = () => 0.5) {
  const counters: SampleCounters = { create: 0, consumed: [], failConsumer: 0 };
  const k = createTestKernel({ definitions: sampleDefinitions(counters).all, random });
  return { k, counters };
}

async function createAndRename(k: ReturnType<typeof setup>['k'], renames: number) {
  const itemId = k.ids.next();
  await k.cmd('sample.item.create', { itemId, name: 'v1' });
  for (let rev = 1; rev <= renames; rev++) await k.cmd('sample.item.rename', { itemId, name: `v${rev + 1}`, expectedRevision: rev });
  return itemId;
}

describe('outbox dispatcher (PS-119)', () => {
  it('TEST-PS-119-09.T04 delivery in (aggregate, revision) order, inbox dedupe, full-jitter backoff and dead letter after 8 attempts', async () => {
    const { k, counters } = setup();
    const a = await createAndRename(k, 2);
    const b = await createAndRename(k, 1);
    counters.failConsumer = 1;
    const first = await k.outbox.runOnce();
    expect(first).toMatchObject({ delivered: 2, retried: 1 });
    expect(counters.consumed).toEqual([`sample.item.created:${b}:1`, `sample.item.renamed:${b}:2`]);
    const retryAt = await k.storage.read((tx) => tx.inbox.get('sample.item_projection', k.events[0]?.eventId ?? ''));
    expect(retryAt).toMatchObject({ status: 'retry', attempts: 1, nextAttemptAt: new Date(k.clock.now() + 250).toISOString(), lastError: 'DEPENDENCY_UNAVAILABLE' });
    expect((await k.outbox.runOnce()).delivered).toBe(0);
    k.clock.advance(250);
    await k.outbox.drain();
    expect(counters.consumed.slice(2)).toEqual([`sample.item.created:${a}:1`, `sample.item.renamed:${a}:2`, `sample.item.renamed:${a}:3`]);
    const env = k.events[0];
    if (!env) throw new Error('no event');
    expect(await k.outbox.deliver('sample.item_projection', env)).toBe('duplicate');
    expect(counters.consumed).toHaveLength(5);

    expect([1, 2, 3, 7, 8, 12].map((n) => fullJitterDelay(n, () => 0.999999))).toEqual([499, 999, 1999, 29_999, 29_999, 29_999]);
    expect(fullJitterDelay(5, () => 0)).toBe(0);

    const c = await createAndRename(k, 1);
    counters.failConsumer = 100;
    for (let i = 0; i < 2 * MAX_DELIVERY_ATTEMPTS + 2; i++) {
      await k.outbox.runOnce();
      k.clock.advance(30_000);
    }
    const dl = await k.storage.read((tx) => tx.deadLetters.list('sample.item_projection'));
    expect(dl.map((d) => [d.envelope.aggregate.id, d.attempts, d.errorCode])).toEqual([[c, 8, 'DEPENDENCY_UNAVAILABLE'], [c, 8, 'DEPENDENCY_UNAVAILABLE']]);
    counters.failConsumer = 0;
    await k.storage.transaction((tx) => {
      for (const d of dl) tx.deadLetters.requeue(d.consumer, d.eventId, k.clock.now());
      return ok(undefined);
    });
    await k.outbox.drain();
    expect(counters.consumed.slice(-2)).toEqual([`sample.item.created:${c}:1`, `sample.item.renamed:${c}:2`]);
  });

  it('TEST-PS-119-09.T04 disabled consumer modules pause without consuming attempts (FLG-3)', async () => {
    const { k, counters } = setup();
    await createAndRename(k, 0);
    k.flags.set(SAMPLE_MODULE, false);
    expect((await k.outbox.runOnce()).paused).toBe(1);
    const row = await k.storage.read((tx) => tx.inbox.get('sample.item_projection', k.events[0]?.eventId ?? ''));
    expect(row).toMatchObject({ status: 'retry', attempts: 0, lastError: 'FEATURE_DISABLED' });
    k.flags.set(SAMPLE_MODULE, true);
    k.clock.advance(60_000);
    await k.outbox.drain();
    expect(counters.consumed).toHaveLength(1);
  });

  it('TEST-PS-119-09.T10 dead letters and logs carry consumer, event ID and error code only, never payloads', async () => {
    const { k, counters } = setup();
    const itemId = k.ids.next();
    await k.cmd('sample.item.create', { itemId, name: 'private-name-xyz' });
    counters.failConsumer = 100;
    for (let i = 0; i < MAX_DELIVERY_ATTEMPTS; i++) {
      await k.outbox.runOnce();
      k.clock.advance(30_000);
    }
    const row = await k.storage.read((tx) => tx.inbox.get('sample.item_projection', k.events[0]?.eventId ?? ''));
    expect(row).toMatchObject({ status: 'dead', attempts: 8, lastError: 'DEPENDENCY_UNAVAILABLE' });
    const warn = k.logs.records().find((l) => l['msg'] === 'outbox.dead_lettered');
    expect(warn).toMatchObject({ level: 'warn', module: SAMPLE_MODULE, code: 'DEPENDENCY_UNAVAILABLE', consumer: 'sample.item_projection', type: 'sample.item.created' });
    const outboxLogs = k.logs.lines().filter((l) => l.includes('outbox.'));
    expect(outboxLogs.join('\n')).not.toContain('private-name-xyz');
  });

  it('TEST-PS-119-09.T11 classrup_outbox_lag_ms per consumer module and delivery outcome counters', async () => {
    const { k, counters } = setup();
    await createAndRename(k, 0);
    counters.failConsumer = 1;
    k.clock.advance(5_000);
    await k.outbox.runOnce();
    expect(k.metrics.value('classrup_outbox_lag_ms', { module: SAMPLE_MODULE })).toBe(5_000);
    expect(await k.outbox.lagMs()).toBe(5_000);
    k.clock.advance(1_000);
    await k.outbox.drain();
    expect(await k.outbox.lagMs()).toBe(0);
    const text = k.metrics.render();
    expect(text).toContain('classrup_outbox_deliveries_total{module="F99.S01.M01",outcome="retry"} 1');
    expect(text).toContain('classrup_outbox_deliveries_total{module="F99.S01.M01",outcome="delivered"} 1');
    expect(text).toContain('classrup_outbox_lag_ms{module="F99.S01.M01"} 0');
  });
});
