/** Test fixtures for building Deps and actors deterministically. Exported for all packages' tests. */
import type { Actor, Role } from './actor';
import { ManualClock } from './clock';
import { InMemoryEventBus } from './events';
import { createIdGenerator, seededRandom } from './ids';
import type { Authorizer, FeatureFlags, Logger, Metrics } from './ports';
import { allFlagsEnabled, allowAll, MemoryLogger, nullMetrics } from './ports';
import type { CommandContext, Deps } from './runtime';
import { InMemoryDataStore } from './store';

export interface TestDeps extends Deps {
  readonly clock: ManualClock;
  readonly store: InMemoryDataStore;
  readonly bus: InMemoryEventBus;
  readonly logger: MemoryLogger;
}

export function createTestDeps(overrides: { seed?: number; authz?: Authorizer; flags?: FeatureFlags; metrics?: Metrics; logger?: Logger; start?: number } = {}): TestDeps {
  const clock = new ManualClock(overrides.start);
  return {
    clock,
    ids: createIdGenerator(clock, seededRandom(overrides.seed ?? 42)),
    store: new InMemoryDataStore(),
    bus: new InMemoryEventBus({
      onHandlerError: (e) => {
        throw e;
      },
    }),
    logger: (overrides.logger as MemoryLogger | undefined) ?? new MemoryLogger(),
    flags: overrides.flags ?? allFlagsEnabled,
    authz: overrides.authz ?? allowAll,
    metrics: overrides.metrics ?? nullMetrics,
  };
}

let counter = 0;

export function testActor(id: string, roles: Role[] = ['member'], tenantId = 'tnt_default'): Actor {
  return { kind: 'user', id, roles, tenantId, sessionId: `ses_${id}` };
}

export function ctxFor(actor: Actor, idempotencyKey?: string): CommandContext {
  counter++;
  return { actor, correlationId: `cor_test_${counter}`, ...(idempotencyKey ? { idempotencyKey } : {}) };
}
