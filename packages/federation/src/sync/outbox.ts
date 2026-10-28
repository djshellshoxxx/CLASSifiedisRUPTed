/** Outbox helpers shared by publishing, migration and delivery: one delivery per trusted peer and record revision. */
import type { Delivery, Peer, StoredRecord } from '../types';
import type { Env } from '../support';
import { col, COLLECTIONS } from '../support';

export function trustedPeers(env: Env, tenantId: string): Peer[] {
  return col<Peer>(env, COLLECTIONS.peers).list((p) => p.tenantId === tenantId && p.status === 'trusted');
}

/** Queues the record's current envelope for every trusted peer. Returns the number of deliveries created. */
export function enqueueDeliveries(env: Env, tenantId: string, stored: StoredRecord): number {
  const deliveries = col<Delivery>(env, COLLECTIONS.deliveries);
  const now = env.deps.clock.now();
  const peers = trustedPeers(env, tenantId);
  for (const peer of peers) {
    deliveries.put(
      {
        id: env.deps.ids.next('fdel'), tenantId, peerId: peer.id, recordKey: stored.id, recordId: stored.recordId, revision: stored.revision, envelope: stored.envelope,
        status: 'pending', attempts: 0, nextAttemptAt: now, createdAt: now, updatedAt: now,
      },
      0,
    );
  }
  return peers.length;
}

/** Cancels deliveries of a record that have not been sent (used when the author withdraws federation consent). */
export function cancelPending(env: Env, tenantId: string, recordKeyValue: string): number {
  const deliveries = col<Delivery>(env, COLLECTIONS.deliveries);
  const pending = deliveries.list((d) => d.tenantId === tenantId && d.recordKey === recordKeyValue && d.status === 'pending');
  for (const d of pending) deliveries.put({ ...d, status: 'cancelled', updatedAt: env.deps.clock.now() }, d.version);
  return pending.length;
}
