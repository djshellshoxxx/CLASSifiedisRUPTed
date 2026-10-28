/**
 * F11.S02.M01 delivery: per-peer outbox, batches of at most 100 records, exponential backoff with jitter,
 * dead-lettering after 8 failed attempts. Delivery is at-least-once: the receiver deduplicates, so a crash between
 * "transport accepted" and "outcome recorded" only causes a harmless re-send.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { assertTransition, defineOperations, notFound, parse, requireFeature, runCommand, schemas, z } from '@classrup/kernel';
import { signBatch } from '../protocol/signatures';
import type { Delivery, DeliveryStatus, Peer } from '../types';
import type { Env } from '../support';
import { BACKOFF_BASE_MS, BACKOFF_CAP_MS, col, COLLECTIONS, FLAGS, MAX_BATCH_RECORDS, MAX_DELIVERY_ATTEMPTS } from '../support';
import type { SendResult } from '../ports';

const TRANSITIONS: Readonly<Record<DeliveryStatus, readonly DeliveryStatus[]>> = {
  pending: ['pending', 'sent', 'dead', 'cancelled'],
  dead: ['pending'],
  sent: [],
  cancelled: [],
};

const requeueSchema = z.strictObject({ deliveryId: schemas.id('fdel') });
const statusSchema = z.strictObject({ peerId: schemas.id('peer').optional() });

/** 30s, 60s, 120s ... capped at 1h, plus up to 20% jitter. `attempts` is the number of failures so far (>= 1). */
export function backoffMs(attempts: number, random: number): number {
  const base = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** (attempts - 1));
  return base + Math.floor(random * (base / 5));
}

interface Planned {
  readonly peer: Peer;
  readonly deliveries: readonly Delivery[];
  readonly result: SendResult | 'error';
}

export interface DeliveryDto {
  readonly id: string;
  readonly peerId: string;
  readonly recordId: string;
  readonly revision: number;
  readonly status: DeliveryStatus;
  readonly attempts: number;
  readonly nextAttemptAt: number;
  readonly lastResult?: string;
}

const dto = (d: Delivery): DeliveryDto => ({
  id: d.id, peerId: d.peerId, recordId: d.recordId, revision: d.revision, status: d.status, attempts: d.attempts, nextAttemptAt: d.nextAttemptAt,
  ...(d.lastResult ? { lastResult: d.lastResult } : {}),
});

export function createDelivery(env: Env) {
  const { deps, ports } = env;
  const deliveries = () => col<Delivery>(env, COLLECTIONS.deliveries);
  const peers = () => col<Peer>(env, COLLECTIONS.peers);

  function due(tenantId: string, peer: Peer, now: number): Delivery[] {
    return deliveries()
      .list((d) => d.tenantId === tenantId && d.peerId === peer.id && d.status === 'pending' && d.nextAttemptAt <= now)
      .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
      .slice(0, MAX_BATCH_RECORDS);
  }

  function attempt(peer: Peer, batch: readonly Delivery[], now: number): SendResult | 'error' {
    const signed = signBatch(ports.relay.keys, { v: 1, batchId: deps.ids.ulid(), from: ports.relay.relayId, sentAt: now, records: batch.map((d) => d.envelope) });
    try {
      return ports.transport.send({ peerId: peer.id, relayId: peer.relayId }, signed);
    } catch {
      return 'error';
    }
  }

  function applyOutcome(d: Delivery, result: SendResult | 'error') {
    const now = deps.clock.now();
    const attempts = d.attempts + 1;
    if (result === 'ok') return { saved: move(d, 'sent', { attempts, updatedAt: now }), type: 'federation.delivery.sent' };
    const lastResult = result;
    if (result === 'rejected' || attempts >= MAX_DELIVERY_ATTEMPTS) return { saved: move(d, 'dead', { attempts, lastResult, updatedAt: now }), type: 'federation.delivery.dead_lettered' };
    const nextAttemptAt = now + backoffMs(attempts, ports.random());
    return { saved: move(d, 'pending', { attempts, lastResult, nextAttemptAt, updatedAt: now }), type: 'federation.delivery.retry_scheduled' };
  }

  function move(d: Delivery, to: DeliveryStatus, changes: Partial<Delivery>): Delivery {
    assertTransition('FEDERATION_DELIVERY', d.status, to, TRANSITIONS);
    return deliveries().put({ ...d, ...changes, status: to }, d.version);
  }

  /** Sweeper: one signed batch per trusted peer with due deliveries. The relay calls this on a timer with a system actor. */
  function sendDue(ctx: CommandContext): { batches: number; sent: number; retried: number; dead: number } {
    const { actor } = ctx;
    requireFeature(deps.flags, FLAGS.delivery, actor.tenantId);
    deps.authz.authorize(actor, 'federation.delivery:send', { type: 'federation.delivery', tenantId: actor.tenantId });
    const now = deps.clock.now();
    const planned: Planned[] = peers()
      .list((p) => p.tenantId === actor.tenantId && p.status === 'trusted')
      .map((peer) => ({ peer, deliveries: due(actor.tenantId, peer, now) }))
      .filter((p) => p.deliveries.length > 0)
      .map((p) => ({ ...p, result: attempt(p.peer, p.deliveries, now) }));
    return runCommand(deps, ctx, { name: 'federation.delivery.send_due', flag: FLAGS.delivery, request: {} }, () => {
      const tally = { batches: planned.length, sent: 0, retried: 0, dead: 0 };
      const events = planned.flatMap((p) =>
        p.deliveries.map((d) => {
          const { saved, type } = applyOutcome(d, p.result);
          if (saved.status === 'sent') tally.sent++;
          else if (saved.status === 'dead') tally.dead++;
          else tally.retried++;
          return { type, aggregateType: 'delivery', aggregateId: saved.id, revision: saved.version, payload: { deliveryId: saved.id, peerId: saved.peerId, recordId: saved.recordId, revision: saved.revision, attempts: saved.attempts } };
        }),
      );
      return { result: tally, events };
    });
  }

  function requeue(ctx: CommandContext, input: unknown): DeliveryDto {
    const req = parse(requeueSchema, input);
    return runCommand(deps, ctx, { name: 'federation.delivery.requeue', flag: FLAGS.delivery, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'federation.delivery:manage', { type: 'federation.delivery', tenantId: actor.tenantId });
      const d = deliveries().get(req.deliveryId);
      if (!d || d.tenantId !== actor.tenantId) throw notFound('FEDERATION.DELIVERY_NOT_FOUND', 'delivery not found');
      const saved = move(d, 'pending', { attempts: 0, nextAttemptAt: deps.clock.now(), updatedAt: deps.clock.now() });
      return {
        result: dto(saved),
        events: [{ type: 'federation.delivery.requeued', aggregateType: 'delivery', aggregateId: saved.id, revision: saved.version, payload: { deliveryId: saved.id, peerId: saved.peerId } }],
      };
    });
  }

  /** Per-status counts and the dead-letter list, optionally for one peer. */
  function status(actor: Actor, input: unknown): { counts: Record<DeliveryStatus, number>; dead: DeliveryDto[] } {
    const req = parse(statusSchema, input ?? {});
    requireFeature(deps.flags, FLAGS.delivery, actor.tenantId);
    deps.authz.authorize(actor, 'federation.delivery:manage', { type: 'federation.delivery', tenantId: actor.tenantId });
    const all = deliveries().list((d) => d.tenantId === actor.tenantId && (req.peerId === undefined || d.peerId === req.peerId));
    const counts: Record<DeliveryStatus, number> = { pending: 0, sent: 0, dead: 0, cancelled: 0 };
    for (const d of all) counts[d.status]++;
    return { counts, dead: all.filter((d) => d.status === 'dead').map(dto) };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'federation.delivery.send_due', kind: 'command', flag: FLAGS.delivery, summary: 'System: send due outbox batches to trusted peers', handler: (ctx) => sendDue(ctx) },
    { name: 'federation.delivery.requeue', kind: 'command', flag: FLAGS.delivery, summary: 'Operator: retry a dead-lettered delivery', handler: requeue },
    { name: 'federation.delivery.status', kind: 'query', flag: FLAGS.delivery, summary: 'Delivery counts and dead letters', handler: (ctx, input) => status(ctx.actor, input) },
  ]);

  return { sendDue, requeue, status, operations };
}
