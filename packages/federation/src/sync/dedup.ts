/**
 * F11.S02.M02 dedup: batch replay protection backed by a persistent nonce collection, and a registry of
 * already-processed (origin, record, revision, content hash) tuples so a re-delivered envelope is acknowledged
 * as a duplicate instead of being re-imported or counted against the sending peer.
 */
import type { Collection } from '@classrup/kernel';
import { DAY } from '@classrup/kernel';
import type { NonceStore } from '@classrup/security';
import { ReplayGuard } from '@classrup/security';
import type { NonceRow, SeenMarker } from '../types';
import type { Env } from '../support';
import { CLOCK_SKEW_MS, col, COLLECTIONS } from '../support';

export const SEEN_RETENTION_MS = 30 * DAY;

/** Nonce store on the relay's durable collection, so replay protection survives restarts. */
export class CollectionNonceStore implements NonceStore {
  constructor(private readonly rows: Collection<NonceRow>) {}

  remember(nonce: string, expiresAt: number, now: number): boolean {
    const prior = this.rows.get(nonce);
    if (prior && prior.expiresAt > now) return false;
    this.rows.put({ id: nonce, expiresAt }, prior?.version ?? 0);
    return true;
  }
}

export function createReplayGuard(env: Env): ReplayGuard {
  return new ReplayGuard(new CollectionNonceStore(col<NonceRow>(env, COLLECTIONS.nonces)), CLOCK_SKEW_MS);
}

export const seenKey = (originRelay: string, recordId: string, revision: number, contentHash: string): string => `${originRelay}|${recordId}|${revision}|${contentHash}`;

export const wasSeen = (env: Env, key: string): boolean => col<SeenMarker>(env, COLLECTIONS.seen).get(key) !== undefined;

export function markSeen(env: Env, tenantId: string, key: string): void {
  col<SeenMarker>(env, COLLECTIONS.seen).put({ id: key, tenantId, seenAt: env.deps.clock.now() }, 0);
}

/** Housekeeping: drops expired nonces and old seen markers; returns how many rows were removed. */
export function purgeExpired(env: Env, tenantId: string): { nonces: number; seen: number } {
  const now = env.deps.clock.now();
  const nonces = col<NonceRow>(env, COLLECTIONS.nonces);
  const seen = col<SeenMarker>(env, COLLECTIONS.seen);
  const oldNonces = nonces.list((n) => n.expiresAt <= now);
  const oldSeen = seen.list((s) => s.tenantId === tenantId && s.seenAt + SEEN_RETENTION_MS <= now);
  for (const n of oldNonces) nonces.delete(n.id, n.version);
  for (const s of oldSeen) seen.delete(s.id, s.version);
  return { nonces: oldNonces.length, seen: oldSeen.length };
}
