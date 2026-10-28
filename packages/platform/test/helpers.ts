import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { ctxFor, createTestDeps, DomainError, systemActor, testActor } from '@classrup/kernel';
import type { TestDeps } from '@classrup/kernel';
import { PolicyAuthorizer } from '@classrup/security';
import { expect } from 'vitest';
import type { Platform, PlatformPorts } from '../src/index';
import { createPlatform, FlagService, MODULES, POLICIES } from '../src/index';

export const TENANT = 'tnt_default';
export const OTHER_TENANT = 'tnt_other';

export const admin = (tenantId = TENANT): Actor => testActor('acct_admin', ['admin'], tenantId);
export const operator = (): Actor => ({ kind: 'operator', id: 'operator_1', roles: ['admin'], tenantId: TENANT });
export const support = (): Actor => testActor('acct_support', ['support']);
export const moderator = (): Actor => testActor('acct_mod', ['moderator']);
export const member = (): Actor => testActor('acct_member', ['member']);
export const system = (): Actor => systemActor(TENANT);
export const anonymous = (): Actor => ({ kind: 'anonymous', id: 'anonymous', roles: [], tenantId: TENANT });

export interface Harness {
  readonly deps: TestDeps;
  readonly platform: Platform;
  /** Calls an operation by name as `actor`; commands get an idempotency key when `key` is given. */
  call(name: string, actor: Actor, input?: unknown, key?: string): unknown;
  op(name: string): Operation;
}

export function harness(ports: PlatformPorts = {}, startMs?: number): Harness {
  const base = createTestDeps({ authz: new PolicyAuthorizer(POLICIES), ...(startMs !== undefined ? { start: startMs } : {}) });
  const flags = ports.flags ?? new FlagService(base.store);
  const deps: TestDeps = { ...base, flags };
  const platform = createPlatform(deps, { flags, ...ports });
  const op = (name: string): Operation => {
    const found = platform.operations.find((o) => o.name === name);
    if (!found) throw new Error(`unknown operation ${name}`);
    return found;
  };
  return {
    deps,
    platform,
    op,
    call: (name, actor, input = {}, key) => op(name).handler(ctxFor(actor, key), input),
  };
}

export const ctx = (actor: Actor, key?: string): CommandContext => ctxFor(actor, key);

export function errorCode(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  throw new Error('expected a DomainError but nothing was thrown');
}

export async function asyncErrorCode(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  throw new Error('expected a DomainError but nothing was thrown');
}

const DECLARED_EVENTS = new Set(MODULES.flatMap((m) => m.events ?? []));

/** Every event the platform emitted must be declared by a module descriptor. */
export function expectDeclaredEvents(deps: TestDeps): void {
  const emitted = new Set(deps.store.events.read().map((e) => e.event.type));
  for (const type of emitted) expect(DECLARED_EVENTS.has(type), `undeclared event ${type}`).toBe(true);
}

export const eventTypes = (deps: TestDeps): string[] => deps.store.events.read().map((e) => e.event.type);

export const ACCT = 'acct_01J00000000000000000000000';
