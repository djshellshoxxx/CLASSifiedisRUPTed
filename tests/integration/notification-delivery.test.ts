import { describe, expect, it } from 'vitest';
import { defineCommand, defineEvent, ok, z } from '../../packages/kernel/src/index.ts';
import { createTestKernel } from '../../packages/kernel/src/testing/harness.ts';
import { localNotificationDefinitions } from '../../packages/notify/src/index.ts';
import { drainNotificationDelivery } from '../../apps/pwa/src/notification-delivery.ts';

function setup() {
  const k = createTestKernel();
  const principal = k.actor.kind === 'user' ? k.actor.id : '';
  let failing = true;
  k.registry.add(...localNotificationDefinitions({ localPrincipal: () => principal, isThreadMuted: () => false,
    isBlocked() { if (failing) throw new Error('Injected unavailable dependency'); return false; },
  }).all);
  k.registry.add(defineCommand({ name: 'test.notice.emit', module: 'F99.S01.M01', capability: 'test.notice.emit', idempotent: false,
    input: z.strictObject({}), handler(ctx) {
      ctx.emit(defineEvent('mutiny.coordination.observed', 1, 'P2', z.looseObject({})), {
        aggregate: { type: 'coordination', id: ctx.ids.next() }, revision: 1,
        payload: { subjectId: ctx.ids.next(), participantIds: [principal, 'did:key:peer'], actorId: 'did:key:peer' },
      }); return ok(null);
    },
  }));
  return { k, recover() { failing = false; }, drain: () => drainNotificationDelivery(k.outbox, k.storage, k.registry) };
}
describe('local notification delivery health', () => {
  it('keeps failures visible through backoff and clears them only after successful retry', async () => {
    const f = setup();
    expect((await f.k.cmd('test.notice.emit', {})).ok).toBe(true);
    expect(await f.drain()).toBe(true);
    f.recover();
    expect(await f.drain()).toBe(true); // Nothing is due; the pending event still exists.
    f.k.clock.advance(60_000);
    expect(await f.drain()).toBe(false);
    const count = await f.k.ask('notify.notification.unread_count', {});
    expect(count).toMatchObject({ ok: true, value: { value: { total: 1 } } });
    expect(await f.drain()).toBe(false);
  });
  it('keeps a dead letter visible across subsequent quiet drains', async () => {
    const f = setup();
    expect((await f.k.cmd('test.notice.emit', {})).ok).toBe(true);
    const event = f.k.events[0]!;
    await f.k.storage.transaction(tx => {
      tx.inbox.markDead({ consumer: 'notify.inapp_router', envelope: event, now: f.k.clock.now() }, 8, 'INTERNAL');
      return ok(null);
    });
    f.recover();
    expect(await f.drain()).toBe(true);
    expect(await f.drain()).toBe(true);
  });
});
