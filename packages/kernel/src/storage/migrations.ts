// Forward-only data migrations recorded in schema_migrations (CTR-SCH-001 SCH-4/SCH-5), isomorphic.
import type { Clock } from '../clock/clock.ts';
import type { AppError } from '../errors/app-error.ts';
import { ok, type Result } from '../errors/result.ts';
import type { Storage } from './storage.ts';
import type { Tx } from './tx.ts';

export interface Migration {
  /** Stable, unique, sortable ID, e.g. `bazaar:0002_backfill_offer_status`. */
  readonly id: string;
  /** Idempotent forward step run inside one transaction; returning err aborts and records nothing. */
  readonly up: (tx: Tx, now: number) => Result<void, AppError>;
}

export interface MigrationStatus {
  readonly applied: readonly string[];
  readonly pending: readonly string[];
}

function checkIds(list: readonly Migration[]): void {
  const seen = new Set<string>();
  for (const m of list) {
    if (seen.has(m.id)) throw new Error(`duplicate migration id ${m.id}`);
    seen.add(m.id);
  }
}

export async function migrationStatus(storage: Storage, list: readonly Migration[]): Promise<MigrationStatus> {
  const applied = await storage.read((tx) => tx.migrations.list().map((r) => r.id));
  const done = new Set(applied);
  return { applied, pending: list.filter((m) => !done.has(m.id)).map((m) => m.id) };
}

/** Applies pending migrations in list order, each in its own transaction; already applied ones are skipped. */
export async function runMigrations(storage: Storage, list: readonly Migration[], clock: Clock): Promise<Result<readonly string[], AppError>> {
  checkIds(list);
  const ran: string[] = [];
  for (const m of list) {
    const r = await storage.transaction((tx) => {
      if (tx.migrations.list().some((row) => row.id === m.id)) return ok(false);
      const step = m.up(tx, clock.now());
      if (!step.ok) return step;
      tx.migrations.insert({ id: m.id, checksum: 'data', appliedAt: clock.iso() });
      return ok(true);
    });
    if (!r.ok) return r;
    if (r.value) ran.push(m.id);
  }
  return ok(ran);
}
