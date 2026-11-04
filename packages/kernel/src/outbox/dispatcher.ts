// Local outbox dispatcher (CTR-EVT-001 EVT-2/3/6/8): at-least-once delivery to registered subscribers in
// (aggregate, revision) order per aggregate, inbox dedupe per consumer, backoff, dead letter after 8 attempts.
import type { Clock } from '../clock/clock.ts';
import { AppErrorException, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import type { EventEnvelope, EventSink } from '../events/envelope.ts';
import type { IdGen } from '../ids/uuidv7.ts';
import { noopLogger, type Logger } from '../observability/logger.ts';
import type { MetricsRegistry } from '../observability/metrics.ts';
import { inboxMachine } from '../storage/machines.ts';
import { writeScope } from '../storage/scope.ts';
import type { Storage } from '../storage/storage.ts';
import type { AnySubscriber, Registry } from '../bus/define.ts';
import { makeEmitter } from '../bus/emit.ts';
import { allFlagsOn, type Actor, type FlagPort, type Ports } from '../bus/ports.ts';
import { fullJitterDelay, type BackoffOptions } from './backoff.ts';

export const MAX_DELIVERY_ATTEMPTS = 8;
const PAUSE_MS = 60_000;

export type DeliveryOutcome = 'delivered' | 'duplicate' | 'retry' | 'dead' | 'paused';

export interface DispatchStats {
  readonly delivered: number;
  readonly duplicates: number;
  readonly retried: number;
  readonly deadLettered: number;
  readonly paused: number;
}

export interface OutboxDispatcherOptions {
  readonly storage: Storage;
  readonly registry: Registry;
  readonly clock: Clock;
  readonly ids: IdGen;
  readonly flags?: FlagPort;
  readonly logger?: Logger;
  readonly metrics?: MetricsRegistry;
  readonly eventSink?: EventSink;
  readonly ports?: Ports;
  readonly origin?: string;
  /** Uniform [0, 1) source for jitter; inject a seeded one in tests. */
  readonly random?: () => number;
  readonly batchSize?: number;
  readonly maxAttempts?: number;
  readonly backoff?: BackoffOptions;
}

export interface OutboxDispatcher {
  /** One pass over every subscriber; returns what happened. */
  runOnce(): Promise<DispatchStats>;
  /** Runs passes until a pass makes no progress (bounded); for tests and startup catch-up. */
  drain(maxPasses?: number): Promise<DispatchStats>;
  /** Delivers one envelope to one consumer with inbox dedupe (used by runOnce). */
  deliver(consumer: string, envelope: EventEnvelope): Promise<DeliveryOutcome>;
  /** Largest per-consumer age of the oldest undelivered event, in ms (OBS-3, OBS-6). */
  lagMs(): Promise<number>;
  start(intervalMs?: number): void;
  stop(): Promise<void>;
}

function errorCode(e: unknown): string {
  if (e instanceof AppErrorException) return e.error.code;
  return 'INTERNAL';
}

/** Keeps the batch's interleaving across aggregates but orders each aggregate's events by revision. */
function orderBatch(list: readonly EventEnvelope[]): EventEnvelope[] {
  const groups = new Map<string, EventEnvelope[]>();
  for (const e of list) {
    const g = groups.get(e.aggregate.id);
    if (g) g.push(e);
    else groups.set(e.aggregate.id, [e]);
  }
  for (const g of groups.values()) g.sort((a, b) => a.revision - b.revision);
  const cursor = new Map<string, number>();
  return list.map((e) => {
    const i = cursor.get(e.aggregate.id) ?? 0;
    cursor.set(e.aggregate.id, i + 1);
    return groups.get(e.aggregate.id)?.[i] ?? e;
  });
}

export function createOutboxDispatcher(o: OutboxDispatcherOptions): OutboxDispatcher {
  const flags = o.flags ?? allFlagsOn;
  const log = o.logger ?? noopLogger;
  const random = o.random ?? Math.random;
  const maxAttempts = o.maxAttempts ?? MAX_DELIVERY_ATTEMPTS;
  const batch = o.batchSize ?? 100;
  const origin = o.origin ?? 'local';
  const deliveries = o.metrics?.counter({ name: 'classrup_outbox_deliveries_total', help: 'Outbox deliveries by consumer module and outcome.', labels: ['module', 'outcome'] });
  const lagGauge = o.metrics?.gauge({ name: 'classrup_outbox_lag_ms', help: 'Age of the oldest undelivered event per consumer module.', labels: ['module'] });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<unknown> = Promise.resolve();

  const systemActor = (sub: AnySubscriber): Actor => ({ kind: 'system', id: `consumer:${sub.name}`, roles: [] });

  async function invoke(sub: AnySubscriber, env: EventEnvelope): Promise<Result<DeliveryOutcome, AppError>> {
    const emitted: EventEnvelope[] = [];
    const r = await o.storage.transaction(async (tx): Promise<Result<DeliveryOutcome, AppError>> => {
      const seen = tx.inbox.get(sub.name, env.eventId);
      if (seen && (seen.status === 'done' || seen.status === 'dead')) return ok('duplicate');
      const actor = systemActor(sub);
      const scope = writeScope({ tx, tenantId: env.tenantId, clock: o.clock, ids: o.ids, deliveryEligible: sub.deliveryEligible === true });
      const emit = makeEmitter({ tx, tenantId: env.tenantId, actor, ids: o.ids, clock: o.clock, correlationId: env.correlationId, causationId: env.eventId, origin, collected: emitted });
      const ctx = { actor, tenantId: env.tenantId, correlationId: env.correlationId, causationId: env.eventId, clock: o.clock, ids: o.ids, ports: o.ports ?? {}, log: log.child({ module: sub.module, correlationId: env.correlationId }), tx: scope, emit };
      const out = await sub.handler(ctx, env);
      if (!out.ok) return err(out.error);
      tx.inbox.markDone({ consumer: sub.name, envelope: env, now: o.clock.now() }, (seen?.attempts ?? 0) + 1);
      return ok('delivered');
    });
    if (r.ok) publish(sub, env, emitted);
    return r;
  }

  /** After the consumer's 'done' row committed: a failing sink is logged and never becomes a delivery failure. */
  function publish(sub: AnySubscriber, env: EventEnvelope, emitted: readonly EventEnvelope[]): void {
    if (!o.eventSink || emitted.length === 0) return;
    try {
      o.eventSink.publish(emitted);
    } catch (e) {
      log.error('event_sink.failed', { module: sub.module, consumer: sub.name, eventId: env.eventId, correlationId: env.correlationId, count: emitted.length, error: e });
    }
  }

  async function recordFailure(sub: AnySubscriber, env: EventEnvelope, code: string): Promise<DeliveryOutcome> {
    const r = await o.storage.transaction((tx) => {
      const prior = tx.inbox.get(sub.name, env.eventId);
      const attempts = (prior?.attempts ?? 0) + 1;
      // A done or dead row is final for this delivery: the machine refuses fail from it, so nothing is overwritten.
      const from = prior?.status ?? 'pending';
      const event = attempts >= maxAttempts ? 'fail_final' : 'fail';
      const to = inboxMachine.next(from, event);
      if (!to.ok) return to;
      const mark = { consumer: sub.name, envelope: env, now: o.clock.now() };
      if (to.value === 'dead') tx.inbox.markDead(mark, attempts, code);
      else tx.inbox.markRetry(mark, attempts, o.clock.now() + fullJitterDelay(attempts, random, o.backoff), code);
      return ok(to.value === 'dead' ? ('dead' as const) : ('retry' as const));
    });
    if (!r.ok) return 'duplicate';
    if (r.value === 'dead') log.warn('outbox.dead_lettered', { module: sub.module, consumer: sub.name, eventId: env.eventId, type: env.type, code, correlationId: env.correlationId });
    return r.value;
  }

  async function pause(sub: AnySubscriber, env: EventEnvelope): Promise<DeliveryOutcome> {
    const r = await o.storage.transaction((tx): Result<DeliveryOutcome, AppError> => {
      const prior = tx.inbox.get(sub.name, env.eventId);
      if (prior && (prior.status === 'done' || prior.status === 'dead')) return ok('duplicate');
      tx.inbox.markRetry({ consumer: sub.name, envelope: env, now: o.clock.now() }, prior?.attempts ?? 0, o.clock.now() + PAUSE_MS, 'FEATURE_DISABLED');
      return ok('paused');
    });
    return r.ok ? r.value : 'paused';
  }

  async function deliverTo(sub: AnySubscriber, env: EventEnvelope): Promise<DeliveryOutcome> {
    if (!(await flags.isEnabled({ tenantId: env.tenantId, module: sub.module, actor: systemActor(sub), operation: sub.name }))) return pause(sub, env);
    let outcome: DeliveryOutcome;
    try {
      const r = await invoke(sub, env);
      outcome = r.ok ? r.value : await recordFailure(sub, env, r.error.code);
    } catch (e) {
      log.error('outbox.consumer_threw', { module: sub.module, consumer: sub.name, eventId: env.eventId, correlationId: env.correlationId, error: e });
      outcome = await recordFailure(sub, env, errorCode(e));
    }
    deliveries?.inc({ module: sub.module, outcome });
    return outcome;
  }

  async function runSubscriber(sub: AnySubscriber, stats: Record<keyof DispatchStats, number>): Promise<void> {
    const pending = await o.storage.read((tx) => tx.outbox.pending(sub.name, sub.types, o.clock.now(), batch).map((p) => p.envelope));
    const blocked = new Set<string>();
    for (const env of orderBatch(pending)) {
      if (blocked.has(env.aggregate.id)) continue;
      const outcome = await deliverTo(sub, env);
      if (outcome === 'retry' || outcome === 'paused') blocked.add(env.aggregate.id);
      const key = ({ delivered: 'delivered', duplicate: 'duplicates', retry: 'retried', dead: 'deadLettered', paused: 'paused' } as const)[outcome];
      stats[key] += 1;
    }
  }

  async function lagMs(): Promise<number> {
    let max = 0;
    for (const sub of o.registry.subscribers()) {
      const oldest = await o.storage.read((tx) => tx.outbox.oldestUndelivered(sub.name, sub.types));
      const lag = oldest ? Math.max(0, o.clock.now() - Date.parse(oldest.occurredAt)) : 0;
      lagGauge?.set({ module: sub.module }, lag);
      max = Math.max(max, lag);
    }
    return max;
  }

  async function runOnce(): Promise<DispatchStats> {
    const stats = { delivered: 0, duplicates: 0, retried: 0, deadLettered: 0, paused: 0 };
    for (const sub of o.registry.subscribers()) await runSubscriber(sub, stats);
    await lagMs();
    return stats;
  }

  const dispatcher: OutboxDispatcher = {
    runOnce,
    drain: async (maxPasses = 100) => {
      const total = { delivered: 0, duplicates: 0, retried: 0, deadLettered: 0, paused: 0 };
      for (let i = 0; i < maxPasses; i++) {
        const s = await runOnce();
        for (const k of Object.keys(total) as (keyof DispatchStats)[]) total[k] += s[k];
        if (s.delivered + s.deadLettered === 0) break;
      }
      return total;
    },
    deliver: async (consumer, envelope) => {
      const sub = o.registry.subscriber(consumer);
      if (!sub) throw new Error(`unknown consumer ${consumer}`);
      return deliverTo(sub, envelope);
    },
    lagMs,
    start: (intervalMs = 500) => {
      if (timer) return;
      const tick = (): void => {
        running = runOnce()
          .catch((e: unknown) => log.error('outbox.pass_failed', { error: e }))
          .finally(() => {
            if (timer) timer = setTimeout(tick, intervalMs);
          });
      };
      timer = setTimeout(tick, intervalMs);
    },
    stop: async () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      await running;
    },
  };
  return dispatcher;
}
