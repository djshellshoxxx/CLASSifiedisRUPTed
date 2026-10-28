/** Environment and constants shared by every federation module. */
import type { Collection, Deps } from '@classrup/kernel';
import { HOUR, MINUTE, requireFeature } from '@classrup/kernel';
import { keyIdOf } from '@classrup/security';
import type { ResolvedFederationPorts } from './ports';

export interface Env {
  readonly deps: Deps;
  readonly ports: ResolvedFederationPorts;
}

export const FLAGS = {
  portable: 'federation.portable',
  records: 'federation.records',
  signatures: 'federation.signatures',
  delivery: 'federation.delivery',
  dedup: 'federation.dedup',
  conflicts: 'federation.conflicts',
  trust: 'federation.trust',
  blocklists: 'federation.blocklists',
  migration: 'federation.migration',
} as const;

export const COLLECTIONS = {
  peers: 'federation_peers',
  peerStats: 'federation_peer_stats',
  records: 'federation_records',
  seen: 'federation_seen',
  nonces: 'federation_nonces',
  conflicts: 'federation_conflicts',
  deliveries: 'federation_deliveries',
  marks: 'federation_marks',
  blocks: 'federation_blocks',
  migrations: 'federation_migrations',
} as const;

export const MAX_RECORD_BYTES = 32 * 1024;
export const MAX_BATCH_RECORDS = 100;
export const MAX_DELIVERY_ATTEMPTS = 8;
export const BACKOFF_BASE_MS = 30_000;
export const BACKOFF_CAP_MS = HOUR;
export const CLOCK_SKEW_MS = 5 * MINUTE;
export const DEFAULT_LIMITS = { recordsPerMinute: 600, dailyByteQuota: 64 * 1024 * 1024 } as const;
/** A trusted peer that sends this many rejected records in a row is suspended automatically. */
export const AUTO_SUSPEND_AFTER = 25;

export function col<T extends { id: string; version: number }>(env: Env, name: string): Collection<T> {
  return env.deps.store.collection<T>(name);
}

export const recordKey = (originRelay: string, recordId: string): string => `${originRelay}|${recordId}`;

export const relayKeyId = (env: Env): string => keyIdOf(env.ports.relay.keys.publicKey);

/** The wire protocol modules (records, signatures, conflicts) have no operations of their own: their flags gate every path that uses them. */
export function requireProtocolFlags(env: Env, tenantId: string, ...extra: string[]): void {
  for (const flag of [FLAGS.records, FLAGS.signatures, ...extra]) requireFeature(env.deps.flags, flag, tenantId);
}
