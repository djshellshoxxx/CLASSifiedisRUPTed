import { describe, expect, it } from 'vitest';
import { createTestKernel } from '../testing/harness.ts';
import { sampleDefinitions, type SampleCounters } from '../testing/sample-module.ts';

function setup() {
  const counters: SampleCounters = { create: 0, consumed: [], failConsumer: 0 };
  const k = createTestKernel({ definitions: sampleDefinitions(counters).all, random: () => 0.5 });
  return { k, counters };
}

describe('outbox isolation between independent aggregate streams', () => {
  it('retry of an aggregate in one tenant does not block another tenant in the same dispatch batch', async () => {
    const { k, counters } = setup();
    try {
      const sharedId = k.ids.next();
      expect((await k.cmd('sample.item.create', { itemId: sharedId, name: 'tenant A' })).ok).toBe(true);
      expect((await k.cmd('sample.item.create', { itemId: sharedId, name: 'tenant B' }, { tenantId: 'tenant-b' })).ok).toBe(true);
      counters.failConsumer = 1;
      expect(await k.outbox.runOnce()).toMatchObject({ delivered: 1, retried: 1 });
      const [first, second] = k.events;
      if (!first || !second) throw new Error('missing events');
      expect(await k.storage.read(tx => tx.inbox.get('sample.item_projection', first.eventId)?.status)).toBe('retry');
      expect(await k.storage.read(tx => tx.inbox.get('sample.item_projection', second.eventId)?.status)).toBe('done');
      expect(counters.consumed).toEqual([`sample.item.created:${sharedId}:1`]);
    } finally { await k.storage.close(); }
  });

  it('a not-yet-due retry must not hide another tenant with the same aggregate ID from later passes', async () => {
    const { k, counters } = setup();
    try {
      const sharedId = k.ids.next();
      expect((await k.cmd('sample.item.create', { itemId: sharedId, name: 'tenant A' })).ok).toBe(true);
      const original = k.events[0];
      if (!original) throw new Error('missing first event');
      counters.failConsumer = 1;
      expect(await k.outbox.runOnce()).toMatchObject({ retried: 1, delivered: 0 });
      const retry = await k.storage.read(tx => tx.inbox.get('sample.item_projection', original.eventId));
      expect(retry).toMatchObject({ status: 'retry', attempts: 1 });
      expect((await k.cmd('sample.item.create', { itemId: sharedId, name: 'tenant B' }, { tenantId: 'tenant-b' })).ok).toBe(true);
      const next = k.events[1];
      if (!next) throw new Error('missing second event');
      expect(await k.outbox.runOnce()).toMatchObject({ delivered: 1, retried: 0 });
      expect(await k.storage.read(tx => tx.inbox.get('sample.item_projection', next.eventId)?.status)).toBe('done');
      expect(await k.storage.read(tx => tx.inbox.get('sample.item_projection', original.eventId)?.status)).toBe('retry');
    } finally { await k.storage.close(); }
  });
});
