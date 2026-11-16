import type { OutboxDispatcher, Registry, Storage } from '../../../packages/kernel/src/index.ts';

/** Count outstanding state, not just this pass: backoff and dead letters survive a quiet drain. */
export async function drainNotificationDelivery(dispatcher: OutboxDispatcher, storage: Storage, registry: Registry): Promise<boolean> {
  await dispatcher.drain();
  return storage.read(tx => registry.subscribers().filter(sub => sub.name.startsWith('notify.')).some(sub =>
    tx.outbox.oldestUndelivered(sub.name, sub.types) !== undefined || tx.deadLetters.list(sub.name, 1).length > 0));
}
