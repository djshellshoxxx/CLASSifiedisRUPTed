// Sync outbox sender (CTR-IDM-001 IDM-7): per-destination FIFO delivery of signed statements through a
// transport port; prepared → transport_acknowledged, retry with backoff, failed when non-retryable or
// older than 7 days. Peer acceptance is recorded separately when a verified signed ack arrives.
import type { Clock } from '../clock/clock.ts';
import { appError, type AppError } from '../errors/app-error.ts';
import { ok, type Result } from '../errors/result.ts';
import { noopLogger, type Logger } from '../observability/logger.ts';
import type { MetricsRegistry } from '../observability/metrics.ts';
import { fullJitterDelay, type BackoffOptions } from '../outbox/backoff.ts';
import { recordPeerAck } from '../storage/scope.ts';
import type { Storage } from '../storage/storage.ts';
import type { SignedEnvelope, SyncEntry } from '../storage/tx.ts';

export const SYNC_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface TransportReceipt {
  /** Relay-signed receipt or transport acknowledgement; evidence only of that relay's clock (ADR-0016 §5). */
  readonly receipt?: unknown;
}

/** Delivers a signed envelope to a destination (relay mailbox or direct peer). */
export interface SyncTransport {
  send(destination: string, envelope: SignedEnvelope): Promise<Result<TransportReceipt, AppError>>;
}

export interface SyncStats {
  readonly sent: number;
  readonly retried: number;
  readonly failed: number;
}

export interface SyncSenderOptions {
  readonly storage: Storage;
  readonly transport: SyncTransport;
  readonly clock: Clock;
  readonly random?: () => number;
  readonly backoff?: BackoffOptions;
  readonly expireAfterMs?: number;
  readonly batchSize?: number;
  readonly logger?: Logger;
  readonly metrics?: MetricsRegistry;
}

export interface SyncSender {
  runOnce(): Promise<SyncStats>;
  /** Repeats runOnce until a pass sends or fails nothing (bounded). */
  drain(maxPasses?: number): Promise<SyncStats>;
  /** Records a verified signed peer acknowledgement (the primitive behind platform.outbox.record_peer_ack). */
  recordPeerAck(tenantId: string, destination: string, ref: string, ack: unknown): Promise<Result<SyncEntry, AppError>>;
  start(intervalMs?: number): void;
  stop(): Promise<void>;
}

type Step = 'sent' | 'retried' | 'failed';

export function createSyncSender(o: SyncSenderOptions): SyncSender {
  const random = o.random ?? Math.random;
  const expireAfter = o.expireAfterMs ?? SYNC_EXPIRY_MS;
  const log = o.logger ?? noopLogger;
  const total = o.metrics?.counter({ name: 'classrup_sync_sends_total', help: 'Sync outbox send attempts by outcome.', labels: ['outcome', 'code'] });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<unknown> = Promise.resolve();

  async function apply(entry: SyncEntry, r: Result<TransportReceipt, AppError>): Promise<Step> {
    const now = o.clock.now();
    const attempts = entry.attempts + 1;
    const res = await o.storage.transaction((tx) => {
      if (r.ok) return tx.sync.transition(entry.id, 'transport_ack', { attempts, receipt: { transport: r.value.receipt ?? null }, nextAttemptAt: null, lastError: null }, now);
      const expired = now - Date.parse(entry.createdAt) >= expireAfter;
      if (!r.error.retryable || expired) return tx.sync.transition(entry.id, 'fail', { attempts, lastError: expired ? 'EXPIRED' : r.error.code, nextAttemptAt: null }, now);
      const next = new Date(now + fullJitterDelay(attempts, random, o.backoff)).toISOString();
      return tx.sync.transition(entry.id, 'retry_later', { attempts, lastError: r.error.code, nextAttemptAt: next }, now);
    });
    if (!res.ok) return 'retried';
    const step: Step = res.value.state === 'transport_acknowledged' ? 'sent' : res.value.state === 'failed' ? 'failed' : 'retried';
    total?.inc({ outcome: step, code: r.ok ? 'OK' : r.error.code });
    if (step === 'failed') log.warn('sync.failed', { code: res.value.lastError ?? undefined, entryId: entry.id, ref: entry.ref });
    return step;
  }

  async function sendOne(entry: SyncEntry): Promise<Step> {
    let r: Result<TransportReceipt, AppError>;
    try {
      r = await o.transport.send(entry.destination, entry.envelope);
    } catch {
      r = { ok: false, error: appError('DEPENDENCY_UNAVAILABLE') };
    }
    return apply(entry, r);
  }

  async function runOnce(): Promise<SyncStats> {
    const stats = { sent: 0, retried: 0, failed: 0 };
    const heads = await o.storage.read((tx) => tx.sync.heads(o.clock.now(), o.batchSize ?? 100));
    for (const head of heads) stats[await sendOne(head)] += 1;
    return stats;
  }

  return {
    runOnce,
    drain: async (maxPasses = 100) => {
      const sum = { sent: 0, retried: 0, failed: 0 };
      for (let i = 0; i < maxPasses; i++) {
        const s = await runOnce();
        sum.sent += s.sent;
        sum.retried += s.retried;
        sum.failed += s.failed;
        if (s.sent + s.failed === 0) break;
      }
      return sum;
    },
    recordPeerAck: (tenantId, destination, ref, ack) => o.storage.transaction((tx) => recordPeerAck(tx, tenantId, destination, ref, ack, o.clock.now())),
    start: (intervalMs = 1000) => {
      if (timer) return;
      const tick = (): void => {
        running = runOnce()
          .catch((e: unknown) => log.error('sync.pass_failed', { error: e }))
          .finally(() => {
            if (timer) timer = setTimeout(tick, intervalMs);
          });
      };
      timer = setTimeout(tick, intervalMs);
    },
    stop: async () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      await running;
    },
  };
}

export function syncOk(receipt?: unknown): Result<TransportReceipt, AppError> {
  return ok(receipt === undefined ? {} : { receipt });
}
