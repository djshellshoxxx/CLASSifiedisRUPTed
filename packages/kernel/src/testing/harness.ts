// In-memory kernel harness for feature package tests (CTR-TST-001 TST-3): fake clock, deterministic IDs,
// memory storage, allow-all or role-table authz, collected events/audit/logs, outbox drain.
import { createFakeClock, type FakeClock } from '../clock/clock.ts';
import type { AppError } from '../errors/app-error.ts';
import type { Result } from '../errors/result.ts';
import { collectingSink, type EventEnvelope } from '../events/envelope.ts';
import { createDeterministicIds, type Id, type IdGen } from '../ids/uuidv7.ts';
import { createLogger, createRingBufferSink, type Logger, type RingBufferSink } from '../observability/logger.ts';
import { createMetricsRegistry, type MetricsRegistry } from '../observability/metrics.ts';
import { createOutboxDispatcher, type DispatchStats, type OutboxDispatcher } from '../outbox/dispatcher.ts';
import { createMemoryStorage, type Storage } from '../storage/storage.ts';
import { createBus, type Bus, type CommandOutcome, type DispatchContext, type QueryOutcome } from '../bus/bus.ts';
import { createRegistry, type AnyDefinition, type Registry } from '../bus/define.ts';
import {
  allowAllAuthz,
  createMemoryAudit,
  createRoleTableAuthz,
  createStaticFlags,
  unlimitedRate,
  type Actor,
  type AuditEntry,
  type AuthzPort,
  type Ports,
  type RateLimitPort,
  type RoleTable,
} from '../bus/ports.ts';

export interface TestKernelOptions {
  readonly start?: string | number;
  readonly seed?: number;
  readonly definitions?: readonly AnyDefinition[];
  /** 'allow-all' (default), a capability → roles table, or a custom port. */
  readonly authz?: 'allow-all' | RoleTable | AuthzPort;
  readonly disabledModules?: readonly string[];
  readonly rateLimit?: RateLimitPort;
  readonly ports?: Ports;
  /** Uniform [0,1) source for outbox jitter; default always 0.5. */
  readonly random?: () => number;
}

export interface CallOptions {
  readonly actor?: Actor;
  readonly tenantId?: string;
  /** Explicit key, or 'auto' (default) for a fresh UUIDv7 when the command is idempotent. */
  readonly idempotencyKey?: string | 'auto' | 'none';
  readonly expectedRevision?: number;
  readonly correlationId?: string;
}

export interface TestKernel {
  readonly clock: FakeClock;
  readonly ids: IdGen;
  readonly storage: Storage;
  readonly registry: Registry;
  readonly bus: Bus;
  readonly outbox: OutboxDispatcher;
  readonly metrics: MetricsRegistry;
  readonly logs: RingBufferSink;
  readonly logger: Logger;
  /** Envelopes published after commit, in order. */
  readonly events: EventEnvelope[];
  readonly audit: AuditEntry[];
  readonly tenantId: Id<'Tenant'>;
  /** Local principal with role member. */
  readonly actor: Actor;
  readonly flags: { set(module: string, enabled: boolean): void };
  /** Builds another user actor with the given roles. */
  user(roles?: readonly string[]): Actor;
  cmd(name: string, input: unknown, opts?: CallOptions): Promise<Result<CommandOutcome, AppError>>;
  ask(name: string, input: unknown, opts?: CallOptions): Promise<Result<QueryOutcome, AppError>>;
  drainOutbox(): Promise<DispatchStats>;
}

function authzOf(a: TestKernelOptions['authz']): AuthzPort {
  if (a === undefined || a === 'allow-all') return allowAllAuthz;
  if ('authorize' in a && typeof a.authorize === 'function') return a as AuthzPort;
  return createRoleTableAuthz(a as RoleTable);
}

export function createTestKernel(opts: TestKernelOptions = {}): TestKernel {
  const clock = createFakeClock(opts.start ?? '2026-11-04T10:00:00.000Z');
  const ids = createDeterministicIds({ seed: opts.seed ?? 1, now: () => clock.now() });
  const storage = createMemoryStorage();
  const registry = createRegistry().add(...(opts.definitions ?? []));
  const sink = collectingSink();
  const audit = createMemoryAudit();
  const logs = createRingBufferSink(10_000);
  const logger = createLogger({ sink: logs.sink, clock, level: 'debug' });
  const metrics = createMetricsRegistry();
  const flags = createStaticFlags(opts.disabledModules ?? []);
  const ports = opts.ports ?? {};
  const bus = createBus({ registry, storage, clock, ids, authz: authzOf(opts.authz), audit, flags, rateLimit: opts.rateLimit ?? unlimitedRate, eventSink: sink, logger, metrics, ports, origin: 'vault:test' });
  const outbox = createOutboxDispatcher({ storage, registry, clock, ids, flags, logger, metrics, eventSink: sink, ports, origin: 'vault:test', random: opts.random ?? (() => 0.5) });
  const tenantId = ids.next<'Tenant'>();
  const user = (roles: readonly string[] = ['member']): Actor => ({ kind: 'user', id: `did:key:z6Mk${ids.next().replace(/-/g, '')}`, roles });
  const actor = user();
  const ctxOf = (o: CallOptions): DispatchContext => ({ actor: o.actor ?? actor, tenantId: o.tenantId ?? tenantId, ...(o.correlationId ? { correlationId: o.correlationId } : {}) });
  const keyOf = (name: string, o: CallOptions): string | undefined => {
    if (o.idempotencyKey === 'none') return undefined;
    if (o.idempotencyKey && o.idempotencyKey !== 'auto') return o.idempotencyKey;
    return registry.command(name)?.idempotent ? ids.next() : undefined;
  };
  return {
    clock,
    ids,
    storage,
    registry,
    bus,
    outbox,
    metrics,
    logs,
    logger,
    events: sink.events,
    audit: audit.entries,
    tenantId,
    actor,
    flags,
    user,
    cmd: (name, input, o = {}) => {
      const key = keyOf(name, o);
      return bus.dispatch(ctxOf(o), name, input, { ...(key ? { idempotencyKey: key } : {}), ...(o.expectedRevision !== undefined ? { expectedRevision: o.expectedRevision } : {}) });
    },
    ask: (name, input, o = {}) => bus.query(ctxOf(o), name, input),
    drainOutbox: () => outbox.drain(),
  };
}
