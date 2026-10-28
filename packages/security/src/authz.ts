/**
 * F16.S01.M01 authorization (CTR-CAP-001). Deny by default.
 * Each feature package exports `PolicyRule[]`; the relay merges them into one PolicyAuthorizer.
 * Evaluation order: tenant isolation -> anonymous handling -> first matching rule that allows.
 */
import type { Actor, Authorizer, Permission, ResourceRef, Role } from '@classrup/kernel';
import { forbidden, unauthenticated } from '@classrup/kernel';

export type Predicate = (actor: Actor, resource: ResourceRef | undefined) => boolean;

export interface PolicyRule {
  /** Exact permission or wildcard `resource:*`. */
  readonly permission: Permission;
  readonly allow: Predicate;
  readonly description: string;
  /** If true, anonymous actors may be granted this permission. Default false. */
  readonly public?: boolean;
}

export const authenticated: Predicate = (a) => a.kind !== 'anonymous';
export const anyone: Predicate = () => true;
export const hasAnyRole =
  (...roles: Role[]): Predicate =>
  (a) =>
    roles.some((r) => a.roles.includes(r));
export const isOwner: Predicate = (a, r) => a.kind !== 'anonymous' && r?.ownerId !== undefined && r.ownerId === a.id;
export const isParticipant: Predicate = (a, r) => a.kind !== 'anonymous' && (r?.participantIds ?? []).includes(a.id);
export const isSystem: Predicate = (a) => a.kind === 'system' || a.roles.includes('system');
export const anyOf =
  (...ps: Predicate[]): Predicate =>
  (a, r) =>
    ps.some((p) => p(a, r));
export const allOf =
  (...ps: Predicate[]): Predicate =>
  (a, r) =>
    ps.every((p) => p(a, r));
export const not =
  (p: Predicate): Predicate =>
  (a, r) =>
    !p(a, r);

function matches(rule: Permission, perm: Permission): boolean {
  if (rule === perm) return true;
  return rule.endsWith(':*') && perm.startsWith(rule.slice(0, -1));
}

export class PolicyAuthorizer implements Authorizer {
  readonly #rules: PolicyRule[] = [];

  constructor(rules: readonly PolicyRule[] = []) {
    this.add(rules);
  }

  add(rules: readonly PolicyRule[]): void {
    for (const r of rules) {
      if (!/^[a-z][a-z0-9_.]*:([a-z][a-z0-9_.]*|\*)$/.test(r.permission)) throw new TypeError(`invalid permission ${r.permission}`);
      this.#rules.push(r);
    }
  }

  permissions(): Permission[] {
    return [...new Set(this.#rules.map((r) => r.permission))].sort();
  }

  can(actor: Actor, permission: Permission, resource?: ResourceRef): boolean {
    if (resource?.tenantId !== undefined && resource.tenantId !== actor.tenantId) return false;
    for (const rule of this.#rules) {
      if (!matches(rule.permission, permission)) continue;
      if (actor.kind === 'anonymous' && !rule.public) continue;
      if (rule.allow(actor, resource)) return true;
    }
    return false;
  }

  authorize(actor: Actor, permission: Permission, resource?: ResourceRef): void {
    if (this.can(actor, permission, resource)) return;
    if (actor.kind === 'anonymous') throw unauthenticated('AUTH.REQUIRED', 'authentication required', { permission });
    throw forbidden('AUTHZ.FORBIDDEN', 'not permitted', { permission });
  }
}
