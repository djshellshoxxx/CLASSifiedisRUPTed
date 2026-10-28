/** Shared wiring and small helpers used by every identity module. */
import type { CommandContext, Deps, EventInput, Operation, Permission, ResourceRef } from '@classrup/kernel';
import { notFound, requireFeature } from '@classrup/kernel';
import type { ResolvedIdentityPorts } from './ports';
import type { AccountRecord, IdentityStores } from './records';

export interface IdentityEnv {
  readonly deps: Deps;
  readonly ports: ResolvedIdentityPorts;
  readonly stores: IdentityStores;
}

export const FLAGS = {
  pseudonyms: 'identity.pseudonyms',
  sessions: 'identity.sessions',
  recovery: 'identity.recovery',
  profiles: 'identity.profiles',
  portable: 'identity.portable',
  reputation: 'identity.reputation',
  evidence: 'identity.evidence',
} as const;

export const EVENTS = {
  accountRegistered: 'identity.account.registered',
  accountStatusChanged: 'identity.account.status_changed',
  accountRoleGranted: 'identity.account.role_granted',
  accountRoleRevoked: 'identity.account.role_revoked',
  accountErased: 'identity.account.erased',
  deviceAdded: 'identity.device.added',
  deviceRevoked: 'identity.device.revoked',
  sessionCreated: 'identity.session.created',
  sessionRevoked: 'identity.session.revoked',
  sessionExpired: 'identity.session.expired',
  recoveryCodesIssued: 'identity.recovery.codes_issued',
  recoveryCompleted: 'identity.recovery.completed',
  profileUpdated: 'identity.profile.updated',
  portableImported: 'identity.portable.imported',
  feedbackSubmitted: 'identity.feedback.submitted',
  feedbackEdited: 'identity.feedback.edited',
  feedbackRemoved: 'identity.feedback.removed',
  evidenceClaimed: 'identity.evidence.claimed',
  evidenceAttested: 'identity.evidence.attested',
  evidenceRevoked: 'identity.evidence.revoked',
  evidenceExpired: 'identity.evidence.expired',
  attesterRegistered: 'identity.attester.registered',
  attesterRevoked: 'identity.attester.revoked',
} as const;

export function event<P>(type: string, aggregateType: string, aggregateId: string, revision: number, payload: P): EventInput<P> {
  return { type, aggregateType, aggregateId, revision, payload };
}

/** Records that exist 1:1 with an account derive their id from it, giving O(1) lookup without an index. */
export const deriveId = (prefix: string, accountId: string): string => `${prefix}_${accountId.slice(accountId.indexOf('_') + 1)}`;

export const ownerRef = (type: string, ownerId: string, tenantId: string, id?: string): ResourceRef => ({
  type,
  ownerId,
  tenantId,
  ...(id !== undefined ? { id } : {}),
});

export function authorize(env: IdentityEnv, ctx: CommandContext, permission: Permission, resource?: ResourceRef): void {
  env.deps.authz.authorize(ctx.actor, permission, resource);
}

export const checkFlag = (env: IdentityEnv, ctx: CommandContext, flag: string): void => requireFeature(env.deps.flags, flag, ctx.actor.tenantId);

/** Account lookup that treats other tenants' accounts as nonexistent. */
export function requireAccount(env: IdentityEnv, accountId: string, tenantId: string): AccountRecord {
  const account = env.stores.accounts.get(accountId);
  if (!account || account.tenantId !== tenantId) throw notFound('IDENTITY.ACCOUNT_NOT_FOUND', 'account not found');
  return account;
}

interface OpDef {
  readonly name: string;
  readonly flag: string;
  readonly summary: string;
  readonly public?: boolean;
}

/**
 * Binds a typed service method to the uniform `(ctx, unknown)` operation signature. The service method
 * always validates with zod first, so the cast only names the schema's input type.
 */
export function operation<I>(kind: Operation['kind'], def: OpDef, fn: (ctx: CommandContext, input: I) => unknown): Operation {
  return {
    name: def.name,
    kind,
    flag: def.flag,
    summary: def.summary,
    ...(def.public ? { public: true } : {}),
    handler: (ctx, input) => fn(ctx, input as I),
  };
}
