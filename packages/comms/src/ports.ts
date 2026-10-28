/** Consumer-side ports for @classrup/comms. The relay wires the owners' implementations. */
import type { AccountLookup, BlockPort, NotifyPort, RateLimitPort } from '@classrup/kernel';
import { noBlocks, noRateLimit } from '@classrup/kernel';

export interface CommsPorts {
  /** Owner F07 identity: account status plus active signing (ed25519) and box (x25519) key ids. */
  readonly accounts: AccountLookup;
  /** Owner F12 abuse. Default: nobody is blocked. */
  readonly blocks?: BlockPort;
  /** Owner F12 antifraud. Default: no limiting. */
  readonly rateLimit?: RateLimitPort;
  /** Owner F13 notifications. Default: drop. */
  readonly notify?: NotifyPort;
}

export type ResolvedCommsPorts = Required<CommsPorts>;

export const noNotifications: NotifyPort = { notify: () => undefined };

export function resolvePorts(ports: CommsPorts): ResolvedCommsPorts {
  return {
    accounts: ports.accounts,
    blocks: ports.blocks ?? noBlocks,
    rateLimit: ports.rateLimit ?? noRateLimit,
    notify: ports.notify ?? noNotifications,
  };
}
