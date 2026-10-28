/**
 * Command pipeline shared by every module. Guarantees for each state-changing command:
 *  1. feature flag check (optional modules can be disabled per tenant);
 *  2. idempotency: same key + same request replays the stored response, same key + different
 *     request fails with IDEMPOTENCY.KEY_REUSED;
 *  3. atomicity: handler writes, event-log append and idempotency record commit together;
 *  4. events are published to the bus only after commit.
 * Concurrency model: the store is synchronous and single-writer per process, so races surface
 * only through client-supplied `expectedVersion` (optimistic locking) -> STORE.VERSION_CONFLICT.
 */
import type { Actor } from './actor';
import type { Clock } from './clock';
import { HOUR } from './clock';
import { conflict, validationError } from './errors';
import type { DomainEvent, EventBus, EventInput } from './events';
import { isValidEventType } from './events';
import type { IdGenerator } from './ids';
import { fingerprint } from './json';
import type { Authorizer, FeatureFlags, Logger, Metrics } from './ports';
import { requireFeature } from './ports';
import type { DataStore } from './store';

export interface Deps {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly store: DataStore;
  readonly bus: EventBus;
  readonly logger: Logger;
  readonly flags: FeatureFlags;
  readonly authz: Authorizer;
  readonly metrics: Metrics;
}

export interface CommandContext {
  readonly actor: Actor;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly causationId?: string;
}

export interface CommandOutcome<R> {
  readonly result: R;
  readonly events?: readonly EventInput<unknown>[];
}

export interface CommandSpec {
  /** Stable command name, e.g. `bazaar.listing.create`. Used to scope idempotency keys. */
  readonly name: string;
  /** Feature flag that must be enabled for the actor's tenant. */
  readonly flag?: string;
  /** Request payload used for the idempotency fingerprint. */
  readonly request?: unknown;
  /** Idempotency record lifetime. Default 24h. */
  readonly idempotencyTtlMs?: number;
}

export const IDEMPOTENCY_TTL_MS = 24 * HOUR;

export function buildEvent<P>(deps: Pick<Deps, 'ids' | 'clock'>, ctx: CommandContext, input: EventInput<P>): DomainEvent<P> {
  if (!isValidEventType(input.type)) throw new TypeError(`invalid event type: ${input.type}`);
  if (!Number.isInteger(input.revision) || input.revision < 1) throw new TypeError('event revision must be >= 1');
  const ev: DomainEvent<P> = {
    eventId: deps.ids.next('evt'),
    type: input.type,
    schemaVersion: input.schemaVersion ?? 1,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    revision: input.revision,
    tenantId: ctx.actor.tenantId,
    actorId: ctx.actor.id,
    occurredAt: deps.clock.now(),
    correlationId: ctx.correlationId,
    provenance: { origin: 'local' },
    payload: input.payload,
    ...(ctx.causationId !== undefined || input.causationId !== undefined ? { causationId: input.causationId ?? ctx.causationId } : {}),
    ...(ctx.idempotencyKey !== undefined ? { idempotencyKey: ctx.idempotencyKey } : {}),
  };
  return ev;
}

export function runCommand<R>(deps: Deps, ctx: CommandContext, spec: CommandSpec, handler: () => CommandOutcome<R>): R {
  if (spec.flag) requireFeature(deps.flags, spec.flag, ctx.actor.tenantId);
  const now = deps.clock.now();
  const idemKey = ctx.idempotencyKey ? `${ctx.actor.tenantId}:${ctx.actor.id}:${spec.name}:${ctx.idempotencyKey}` : undefined;
  const fp = idemKey ? fingerprint(spec.request ?? null) : '';

  if (idemKey) {
    const prior = deps.store.idempotency.get(idemKey, now);
    if (prior) {
      if (prior.fingerprint !== fp) {
        throw conflict('IDEMPOTENCY.KEY_REUSED', 'idempotency key reused with a different request', { command: spec.name });
      }
      deps.metrics.increment('command.replayed', 1, { command: spec.name });
      return structuredClone(prior.response) as R;
    }
  }

  const started = deps.clock.now();
  const result = deps.store.transaction(() => {
    const outcome = handler();
    const events = (outcome.events ?? []).map((e) => buildEvent(deps, ctx, e));
    if (events.length > 0) deps.store.events.append(events);
    if (idemKey) {
      deps.store.idempotency.put({ key: idemKey, fingerprint: fp, response: outcome.result, expiresAt: now + (spec.idempotencyTtlMs ?? IDEMPOTENCY_TTL_MS) });
    }
    // Nested commands (e.g. a port call inside another command) publish only when the
    // outermost transaction commits, so subscribers never see rolled-back facts.
    if (events.length > 0) deps.store.afterCommit(() => deps.bus.publish(events));
    return outcome.result;
  });
  deps.metrics.increment('command.ok', 1, { command: spec.name });
  deps.metrics.observe('command.duration_ms', deps.clock.now() - started, { command: spec.name });
  return result;
}

/** Optimistic-locking guard for client-supplied versions. */
export function assertVersion(entity: string, actual: number, expected: number | undefined): void {
  if (expected !== undefined && expected !== actual) {
    throw conflict('STORE.VERSION_CONFLICT', `${entity} changed since it was read`, { expected, actual });
  }
}

/** Guard for state machines: throws `<area>.INVALID_TRANSITION`. */
export function assertTransition<S extends string>(area: string, from: S, to: S, allowed: Readonly<Record<S, readonly S[]>>): void {
  if (!(allowed[from] ?? []).includes(to)) {
    throw conflict(`${area}.INVALID_TRANSITION`, `cannot move from ${from} to ${to}`, { from, to });
  }
}

export function requireActorKind(actor: Actor, kinds: readonly Actor['kind'][]): void {
  if (!kinds.includes(actor.kind)) throw validationError('AUTH.ACTOR_KIND', 'actor kind not allowed', { kind: actor.kind });
}
