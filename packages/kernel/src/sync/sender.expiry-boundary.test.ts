import { describe, expect, it } from 'vitest';
import { ok } from '../errors/result.ts';
import type { SignedEnvelope } from '../storage/tx.ts';
import { createTestKernel } from '../testing/harness.ts';
import { sampleDefinitions } from '../testing/sample-module.ts';
import { createSyncSender, SYNC_EXPIRY_MS } from './sender.ts';

describe('sync outbox expiry at transport dispatch boundary (IDM-7)', () => {
  it('never sends a queued head that expires while an earlier transport send is pending', async () => {
    const k = createTestKernel({ definitions: sampleDefinitions().all });
    const sent: string[] = [];
    let startFirst: () => void = () => {};
    let releaseFirst: () => void = () => {};
    const firstStarted = new Promise<void>((resolve) => { startFirst = resolve; });
    const firstCanFinish = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const transport = {
      send: async (_destination: string, envelope: SignedEnvelope) => {
        sent.push(envelope.cid);
        if (sent.length === 1) {
          startFirst();
          await firstCanFinish;
        }
        return ok({});
      },
    };
    const ids = [k.ids.next(), k.ids.next()];
    await k.cmd('sample.item.publish', { itemId: ids[0], destination: 'relay:a' });
    await k.cmd('sample.item.publish', { itemId: ids[1], destination: 'relay:b' });

    const sender = createSyncSender({ storage: k.storage, transport, clock: k.clock });
    k.clock.advance(SYNC_EXPIRY_MS - 1);
    const pendingPass = sender.runOnce();
    await firstStarted;
    k.clock.advance(2);
    releaseFirst();

    expect(await pendingPass).toEqual({ sent: 1, retried: 0, failed: 1 });
    expect(sent).toHaveLength(1);
    const entries = await k.storage.read((tx) => tx.sync.list({}));
    expect(entries.filter((entry) => entry.state === 'transport_acknowledged')).toHaveLength(1);
    const expired = entries.filter((entry) => entry.state === 'failed');
    expect(expired).toHaveLength(1);
    expect(expired[0]).toMatchObject({ attempts: 0, lastError: 'EXPIRED' });
    expect(sent).not.toContain(expired[0]?.ref);
  });
});
