/** Consumer-side ports for @classrup/federation. The relay wires the owners' implementations. */
import type { AccountLookup, ListingLookup } from '@classrup/kernel';
import type { SignedEnvelope, SigningKeyPair } from '@classrup/security';
import type { FederationBatch } from './types';

export type SendResult = 'ok' | 'retry' | 'rejected';

export interface PeerRef {
  readonly peerId: string;
  readonly relayId: string;
}

/**
 * Delivers one signed batch to a peer relay (HTTP in production). `retry` = transient failure,
 * `rejected` = the peer refused permanently. Implementations must not throw for network errors;
 * a throw is treated as `retry`.
 */
export interface FederationTransportPort {
  send(peer: PeerRef, batch: SignedEnvelope<FederationBatch>): SendResult;
}

/** Owner F10 privacy. Purpose-scoped consent check; federation needs explicit opt-in. */
export interface ConsentPort {
  hasConsent(accountId: string, purpose: 'federation'): boolean;
}

/** The relay's own federation identity. The secret key stays in the relay's secret store. */
export interface RelayIdentity {
  readonly relayId: string;
  readonly keys: SigningKeyPair;
}

export interface FederationPorts {
  readonly relay: RelayIdentity;
  /** Owner F07 identity. */
  readonly accounts: AccountLookup;
  /** Owner F01 bazaar. */
  readonly listings: ListingLookup;
  /** Default: no consent for anyone (nothing is exported). */
  readonly consent?: ConsentPort;
  /** Default: always `retry`. */
  readonly transport?: FederationTransportPort;
  /** Uniform [0,1) source for backoff jitter; injected so tests are deterministic. Default: always 0.5. */
  readonly random?: () => number;
}

export type ResolvedFederationPorts = Required<FederationPorts>;

export const denyAllConsent: ConsentPort = { hasConsent: () => false };
export const retryTransport: FederationTransportPort = { send: () => 'retry' };

export function resolvePorts(ports: FederationPorts): ResolvedFederationPorts {
  return {
    relay: ports.relay,
    accounts: ports.accounts,
    listings: ports.listings,
    consent: ports.consent ?? denyAllConsent,
    transport: ports.transport ?? retryTransport,
    random: ports.random ?? (() => 0.5),
  };
}
