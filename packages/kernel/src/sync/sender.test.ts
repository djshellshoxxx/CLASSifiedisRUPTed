import { describe, expect, it } from 'vitest';
import { appError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import { createTestKernel } from '../testing/harness.ts';
import { sampleDefinitions } from '../testing/sample-module.ts';
import type { SignedEnvelope } from '../storage/tx.ts';
import { createSyncSender, type TransportReceipt } from './sender.ts';

describe('sync outbox sender (IDM-7)', () => {
  it('TEST-PS-119-09.T05 sender: per-destination FIFO, transport ack, backoff on retryable errors, failed on fatal or 7-day expiry, peer ack', async () => {
    const k = createTestKernel({ definitions: sampleDefinitions().all });
    const sent: string[] = [];
    const plan: Record<string, Result<TransportReceipt>[]> = {};
    const transport = {
      send: async (destination: string, envelope: SignedEnvelope) => {
        sent.push(`${destination}:${envelope.cid}`);
        return plan[envelope.cid]?.shift() ?? ok({ receipt: { relay: destination, at: k.clock.iso() } });
      },
    };
    const sender = createSyncSender({ storage: k.storage, transport, clock: k.clock, random: () => 0.5 });
    const ids = [k.ids.next(), k.ids.next(), k.ids.next(), k.ids.next()];
    const publish = (i: number, dest: string) => k.cmd('sample.item.publish', { itemId: ids[i], destination: dest });
    await publish(0, 'relay:a');
    await publish(1, 'relay:a');
    await publish(2, 'relay:b');
    plan[`sha256-${ids[0]}`] = [err(appError('DEPENDENCY_UNAVAILABLE'))];
    plan[`sha256-${ids[2]}`] = [err(appError('VALIDATION_FAILED'))];
    expect(await sender.runOnce()).toEqual({ sent: 0, retried: 1, failed: 1 });
    expect(await sender.runOnce()).toEqual({ sent: 0, retried: 0, failed: 0 });
    k.clock.advance(250);
    expect(await sender.drain()).toMatchObject({ sent: 2 });
    expect(sent).toEqual([`relay:a:sha256-${ids[0]}`, `relay:b:sha256-${ids[2]}`, `relay:a:sha256-${ids[0]}`, `relay:a:sha256-${ids[1]}`]);
    const entries = await k.storage.read((tx) => tx.sync.list({}));
    expect(entries.map((e) => [e.destination, e.state, e.attempts, e.lastError])).toEqual([
      ['relay:a', 'transport_acknowledged', 2, null],
      ['relay:a', 'transport_acknowledged', 1, null],
      ['relay:b', 'failed', 1, 'VALIDATION_FAILED'],
    ]);
    const acked = await sender.recordPeerAck(k.tenantId, 'relay:a', `sha256-${ids[0]}`, { sig: 'peer-sig' });
    expect(acked.ok && acked.value.state).toBe('peer_accepted');
    const failedId = entries[2]?.id ?? '';
    const retried = await k.storage.transaction((tx) => tx.sync.transition(failedId, 'retry', { attempts: 0, nextAttemptAt: null }, k.clock.now()));
    expect(retried.ok && retried.value.state).toBe('prepared');
    await publish(3, 'relay:c');
    plan[`sha256-${ids[3]}`] = Array.from({ length: 50 }, () => err(appError('DEPENDENCY_UNAVAILABLE')));
    await sender.runOnce();
    k.clock.advance(7 * 24 * 3600_000);
    await sender.drain();
    const last = await k.storage.read((tx) => tx.sync.list({ destination: 'relay:c' }));
    expect(last[0]).toMatchObject({ state: 'failed', lastError: 'EXPIRED' });
  });
});
