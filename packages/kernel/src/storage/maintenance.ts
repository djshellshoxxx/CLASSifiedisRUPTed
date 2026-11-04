// Retention sweep (PS-119 privacy_retention_abuse, PS-117 IdempotencyRecord): in one transaction, dead
// letters older than 30 days, outbox events older than 7 days with their inbox rows, and expired idempotency
// rows are deleted. Relays run it on their maintenance schedule; the IndexedDB vault runs it when it opens.
import type { Clock } from '../clock/clock.ts';
import type { AppError } from '../errors/app-error.ts';
import { ok, type Result } from '../errors/result.ts';
import type { Storage } from './storage.ts';
import type { Tx } from './tx.ts';

const DAY = 24 * 60 * 60 * 1000;
/** OutboxEvent retention after occurredAt (FLG-3 window, RET-SHORT). */
export const OUTBOX_RETENTION_MS = 7 * DAY;
/** Dead letters are kept for replay for 30 days after they died (RET-SHORT). */
export const DEAD_LETTER_RETENTION_MS = 30 * DAY;

export interface RetentionOptions {
  readonly outboxRetentionMs?: number;
  readonly deadLetterRetentionMs?: number;
}

export interface RetentionReport {
  readonly deadLetters: number;
  readonly outbox: number;
  readonly idempotency: number;
}

/**
 * Dead letters go first so an event whose last dead letter expires is released for the outbox purge in
 * the same sweep; idempotency rows go once their own expiresAt has passed.
 */
export function sweepRetention(tx: Tx, now: number, opts: RetentionOptions = {}): RetentionReport {
  const deadLetters = tx.deadLetters.purgeBefore(now - (opts.deadLetterRetentionMs ?? DEAD_LETTER_RETENTION_MS));
  const outbox = tx.outbox.purgeBefore(now - (opts.outboxRetentionMs ?? OUTBOX_RETENTION_MS));
  const idempotency = tx.idempotency.purgeExpired(now);
  return { deadLetters, outbox, idempotency };
}

export function runRetentionSweep(storage: Storage, clock: Clock, opts: RetentionOptions = {}): Promise<Result<RetentionReport, AppError>> {
  return storage.transaction((tx) => ok(sweepRetention(tx, clock.now(), opts)));
}
