// Health and readiness (CTR-OBS-001 OBS-6): storage writable, migrations current, outbox lag < 60 s.
import { migrationStatus, type Migration } from '../storage/migrations.ts';
import type { Storage } from '../storage/storage.ts';

export interface ReadinessReport {
  readonly ready: boolean;
  readonly checks: { readonly storage: boolean; readonly migrations: boolean; readonly outboxLag: boolean };
  readonly lagMs: number;
}

export interface ReadinessProbe {
  check(): Promise<ReadinessReport>;
}

export interface ReadinessOptions {
  readonly storage: Storage;
  readonly migrations?: readonly Migration[];
  /** Current outbox lag in ms (OutboxDispatcher.lagMs). */
  readonly lagMs?: () => number;
  readonly maxLagMs?: number;
}

async function safe<T>(fn: () => Promise<T> | T, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function createReadiness(opts: ReadinessOptions): ReadinessProbe {
  const maxLag = opts.maxLagMs ?? 60_000;
  return {
    check: async () => {
      const storage = await safe(() => opts.storage.ping(), false);
      const migrations = storage ? await safe(async () => (await migrationStatus(opts.storage, opts.migrations ?? [])).pending.length === 0, false) : false;
      const lagMs = await safe(() => opts.lagMs?.() ?? 0, Number.POSITIVE_INFINITY);
      const outboxLag = lagMs < maxLag;
      return { ready: storage && migrations && outboxLag, checks: { storage, migrations, outboxLag }, lagMs: Number.isFinite(lagMs) ? lagMs : -1 };
    },
  };
}
