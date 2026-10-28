import type { CommandContext, Deps, EventInput, Operation, Permission, ResourceRef } from '@classrup/kernel';
import { requireFeature } from '@classrup/kernel';
import type { ResolvedPrivacyPorts } from './ports';
import type { DataRegistry } from './registry';
import type { PrivacyStores } from './records';

export interface PrivacyEnv {
  readonly deps: Deps;
  readonly ports: ResolvedPrivacyPorts;
  readonly stores: PrivacyStores;
  readonly registry: DataRegistry;
}

export const FLAGS = {
  consent: 'privacy.consent',
  retention: 'privacy.retention',
  export: 'privacy.export',
  delete: 'privacy.delete',
  threat: 'privacy.threat',
  model: 'privacy.model',
  metadata: 'privacy.metadata',
} as const;

export const EVENTS = {
  consentGranted: 'privacy.consent.granted',
  consentWithdrawn: 'privacy.consent.withdrawn',
  retentionPolicyChanged: 'privacy.retention.policy_changed',
  holdPlaced: 'privacy.hold.placed',
  holdReleased: 'privacy.hold.released',
  exportRequested: 'privacy.export.requested',
  exportAvailable: 'privacy.export.available',
  exportFailed: 'privacy.export.failed',
  exportDownloaded: 'privacy.export.downloaded',
  exportExpired: 'privacy.export.expired',
  deletionRequested: 'privacy.deletion.requested',
  deletionCancelled: 'privacy.deletion.cancelled',
  deletionBlocked: 'privacy.deletion.blocked',
  deletionCompleted: 'privacy.deletion.completed',
  deletionFailed: 'privacy.deletion.failed',
} as const;

export function event<P>(type: string, aggregateType: string, aggregateId: string, revision: number, payload: P): EventInput<P> {
  return { type, aggregateType, aggregateId, revision, payload };
}

export const ownerRef = (type: string, ownerId: string, tenantId: string, id?: string): ResourceRef => ({
  type,
  ownerId,
  tenantId,
  ...(id !== undefined ? { id } : {}),
});

export const authorize = (env: PrivacyEnv, ctx: CommandContext, permission: Permission, resource?: ResourceRef): void =>
  env.deps.authz.authorize(ctx.actor, permission, resource);

export const checkFlag = (env: PrivacyEnv, ctx: CommandContext, flag: string): void => requireFeature(env.deps.flags, flag, ctx.actor.tenantId);

interface OpDef {
  readonly name: string;
  readonly flag: string;
  readonly summary: string;
}

/** Binds a typed service method to `(ctx, unknown)`; the method validates with zod before using the input. */
export function operation<I>(kind: Operation['kind'], def: OpDef, fn: (ctx: CommandContext, input: I) => unknown): Operation {
  return { name: def.name, kind, flag: def.flag, summary: def.summary, handler: (ctx, input) => fn(ctx, input as I) };
}
