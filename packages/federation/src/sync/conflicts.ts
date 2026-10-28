/**
 * F11.S02.M03 conflicts: deterministic, order-independent resolution of competing versions of one record.
 * Contenders are totally ordered by (revision, is-tombstone, smaller content hash), so every relay that sees the
 * same set of versions keeps the same winner regardless of arrival order. A tombstone therefore beats every
 * version of its own revision or lower, and only a strictly higher revision can supersede it.
 */
import type { ConflictKind, ConflictRecord, RecordType } from '../types';
import type { Env } from '../support';
import { col, COLLECTIONS } from '../support';

export interface Contender {
  readonly type: RecordType;
  readonly revision: number;
  readonly contentHash: string;
}

export type Winner = 'incoming' | 'existing' | 'same';

/** Positive when `a` outranks `b`. */
export function rank(a: Contender, b: Contender): number {
  if (a.revision !== b.revision) return a.revision - b.revision;
  const aTomb = a.type === 'tombstone';
  const bTomb = b.type === 'tombstone';
  if (aTomb !== bTomb) return aTomb ? 1 : -1;
  if (a.contentHash === b.contentHash) return 0;
  return a.contentHash < b.contentHash ? 1 : -1;
}

export function resolve(existing: Contender, incoming: Contender): Winner {
  const r = rank(incoming, existing);
  return r === 0 ? 'same' : r > 0 ? 'incoming' : 'existing';
}

/** Ordinary progression (a strictly newer revision) is not a conflict; everything else is evidence worth keeping. */
export function classify(existing: Contender, incoming: Contender): ConflictKind | undefined {
  if (incoming.revision < existing.revision) return 'rollback';
  if (incoming.revision === existing.revision && incoming.contentHash !== existing.contentHash) {
    return incoming.type !== existing.type ? 'tombstone_override' : 'fork';
  }
  return undefined;
}

export interface ConflictInput {
  readonly tenantId: string;
  readonly recordKey: string;
  readonly kind: ConflictKind;
  readonly winner: 'incoming' | 'existing';
  readonly existing: Contender;
  readonly incoming: Contender;
  readonly peerId?: string;
}

export function recordConflict(env: Env, input: ConflictInput): ConflictRecord {
  const row = {
    id: env.deps.ids.next('frec'), tenantId: input.tenantId, recordKey: input.recordKey, kind: input.kind, winner: input.winner,
    existingRevision: input.existing.revision, existingHash: input.existing.contentHash,
    incomingRevision: input.incoming.revision, incomingHash: input.incoming.contentHash,
    ...(input.peerId !== undefined ? { peerId: input.peerId } : {}), at: env.deps.clock.now(),
  };
  return col<ConflictRecord>(env, COLLECTIONS.conflicts).put(row, 0);
}

export const conflictEvent = (c: ConflictRecord) => ({
  type: 'federation.conflict.recorded', aggregateType: 'conflict', aggregateId: c.id, revision: c.version,
  payload: { recordKey: c.recordKey, kind: c.kind, winner: c.winner, existingRevision: c.existingRevision, incomingRevision: c.incomingRevision },
});
