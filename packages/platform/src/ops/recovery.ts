/**
 * F15.S03.M03 recovery: checkpointed event-log replay used for projection rebuilds and outbox
 * redelivery. Delivery is at-least-once: the checkpoint advances only after the handler succeeded,
 * so handlers must be idempotent (events carry stable ids for that purpose).
 */
import type { Collection, DataStore, DomainEvent, EventLog, StoredEvent, Versioned } from '@classrup/kernel';
import { isDomainError, unavailable } from '@classrup/kernel';

export type ReplaySource = Pick<EventLog, 'read' | 'lastPosition'>;

export interface CheckpointStore {
  get(name: string): number;
  set(name: string, position: number): void;
}

export class MemoryCheckpointStore implements CheckpointStore {
  readonly #positions = new Map<string, number>();
  get(name: string): number {
    return this.#positions.get(name) ?? 0;
  }
  set(name: string, position: number): void {
    this.#positions.set(name, position);
  }
}

interface CheckpointRecord extends Versioned {
  readonly position: number;
}

export const CHECKPOINTS_COLLECTION = 'platform_checkpoints';

/** Durable checkpoints in the data store, so a restart resumes where delivery stopped. */
export class StoreCheckpointStore implements CheckpointStore {
  readonly #records: Collection<CheckpointRecord>;

  constructor(store: DataStore) {
    this.#records = store.collection<CheckpointRecord>(CHECKPOINTS_COLLECTION);
  }

  get(name: string): number {
    return this.#records.get(name)?.position ?? 0;
  }

  set(name: string, position: number): void {
    this.#records.put({ id: name, position }, this.#records.get(name)?.version ?? 0);
  }
}

export interface ReplayOptions {
  /** Checkpoint name, e.g. `projection.bazaar_search` or `outbox.federation`. */
  readonly name: string;
  readonly batchSize?: number;
  /** Persist the checkpoint every N events (always persisted when the run ends). Default 100. */
  readonly checkpointEvery?: number;
  /** Start after this position instead of the stored checkpoint (e.g. 0 to rebuild). */
  readonly fromPosition?: number;
}

export interface ReplayFailure {
  readonly position: number;
  readonly code: string;
}

export interface ReplayResult {
  readonly processed: number;
  readonly lastPosition: number;
  readonly caughtUp: boolean;
  readonly failure?: ReplayFailure;
}

export type ReplayHandler = (event: DomainEvent, position: number) => void;

export function replayEvents(log: ReplaySource, handler: ReplayHandler, checkpoints: CheckpointStore, opts: ReplayOptions): ReplayResult {
  const batchSize = opts.batchSize ?? 500;
  const every = opts.checkpointEvery ?? 100;
  let position = opts.fromPosition ?? checkpoints.get(opts.name);
  let processed = 0;
  let sinceCheckpoint = 0;
  const finish = (failure?: ReplayFailure): ReplayResult => {
    if (sinceCheckpoint > 0) checkpoints.set(opts.name, position);
    return { processed, lastPosition: position, caughtUp: failure === undefined && position >= log.lastPosition(), ...(failure ? { failure } : {}) };
  };
  for (let batch = log.read(position, batchSize); batch.length > 0; batch = log.read(position, batchSize)) {
    for (const stored of batch) {
      const failure = deliver(handler, stored);
      if (failure) return finish(failure);
      position = stored.position;
      processed++;
      sinceCheckpoint++;
      if (sinceCheckpoint >= every) {
        checkpoints.set(opts.name, position);
        sinceCheckpoint = 0;
      }
    }
  }
  return finish();
}

function deliver(handler: ReplayHandler, stored: StoredEvent): ReplayFailure | undefined {
  try {
    handler(stored.event, stored.position);
    return undefined;
  } catch (e) {
    return { position: stored.position, code: isDomainError(e) ? e.code : 'RECOVERY.HANDLER_ERROR' };
  }
}

export interface ProjectionRebuild {
  readonly name: string;
  /** Clears the projection's derived state. */
  reset(): void;
  apply: ReplayHandler;
}

/** Derived state is disposable: clear it, restart from position 0 and replay the whole log. */
export function rebuildProjection(log: ReplaySource, projection: ProjectionRebuild, checkpoints: CheckpointStore): ReplayResult {
  projection.reset();
  checkpoints.set(projection.name, 0);
  const result = replayEvents(log, projection.apply, checkpoints, { name: projection.name, fromPosition: 0 });
  if (result.failure) {
    throw unavailable('RECOVERY.REPLAY_FAILED', 'projection rebuild stopped', { name: projection.name, position: result.failure.position, code: result.failure.code });
  }
  return result;
}

/** Resume delivery from the stored checkpoint; stops at the first failure and keeps order. */
export function redeliverOutbox(log: ReplaySource, send: ReplayHandler, checkpoints: CheckpointStore, name: string): ReplayResult {
  return replayEvents(log, send, checkpoints, { name, checkpointEvery: 1 });
}
