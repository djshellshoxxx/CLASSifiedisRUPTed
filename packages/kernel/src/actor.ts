/**
 * CTR-CAP-001 types (owner F16 with F07). The evaluator lives in @classrup/security.
 * An actor is the authenticated principal of a command. `id` is an account id
 * (`acct_...`) for users, or a service identifier for system/relay actors.
 */
export type ActorKind = 'user' | 'operator' | 'system' | 'relay' | 'anonymous';

export type Role = 'member' | 'merchant' | 'moderator' | 'admin' | 'support' | 'system';

export interface Actor {
  readonly kind: ActorKind;
  readonly id: string;
  readonly roles: readonly Role[];
  readonly tenantId: string;
  /** Session id when authenticated interactively; absent for system actors. */
  readonly sessionId?: string;
}

/** Permission string `resource:action`, e.g. `listing:publish`. */
export type Permission = `${string}:${string}`;

export const ANONYMOUS = (tenantId: string): Actor => ({ kind: 'anonymous', id: 'anonymous', roles: [], tenantId });

export const systemActor = (tenantId: string, id = 'system'): Actor => ({ kind: 'system', id, roles: ['system'], tenantId });

export const hasRole = (actor: Actor, role: Role): boolean => actor.roles.includes(role);
