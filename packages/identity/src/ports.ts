/**
 * Consumer-side ports of @classrup/identity. The relay wires real implementations; every default
 * is the safe choice (deny, no-op), so a standalone package never grants trust it cannot verify.
 */
import type { BlockPort, NotifyPort, RateLimitPort } from '@classrup/kernel';
import { noBlocks, noRateLimit } from '@classrup/kernel';

/** Owner: whichever feature records trades/orders/bookings (bazaar, mutiny, services, rentals...). */
export interface InteractionVerifier {
  /** True only when `raterId` and `rateeId` were both real, completed counterparties of the subject. */
  wasCounterparty(raterId: string, rateeId: string, subjectType: string, subjectId: string): boolean;
}

/** Owner: comms/commerce. Decides whether `viewerId` shares a trade or thread with `ownerId`. */
export interface RelationPort {
  isParticipant(viewerId: string, ownerId: string): boolean;
}

export interface IdentityPorts {
  readonly rateLimit?: RateLimitPort;
  readonly interactions?: InteractionVerifier;
  readonly blocks?: BlockPort;
  readonly relations?: RelationPort;
  readonly notifier?: NotifyPort;
}

export interface ResolvedIdentityPorts {
  readonly rateLimit: RateLimitPort;
  readonly interactions: InteractionVerifier;
  readonly blocks: BlockPort;
  readonly relations: RelationPort;
  readonly notifier: NotifyPort;
}

export const denyAllInteractions: InteractionVerifier = { wasCounterparty: () => false };
export const noRelations: RelationPort = { isParticipant: () => false };
export const silentNotifier: NotifyPort = { notify: () => undefined };

export function resolvePorts(ports: IdentityPorts = {}): ResolvedIdentityPorts {
  return {
    rateLimit: ports.rateLimit ?? noRateLimit,
    interactions: ports.interactions ?? denyAllInteractions,
    blocks: ports.blocks ?? noBlocks,
    relations: ports.relations ?? noRelations,
    notifier: ports.notifier ?? silentNotifier,
  };
}
