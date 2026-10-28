/**
 * Runs system sweeper operations (expiry, retries, deadlines) on an interval as the system
 * actor. Each sweep is isolated: one failing sweeper never blocks the others.
 */
import type { CommandContext, Logger, Operation } from '@classrup/kernel';
import { systemActor } from '@classrup/kernel';

export interface Sweeper {
  readonly op: Operation;
  readonly input?: unknown;
}

export function runSweepers(sweepers: readonly Sweeper[], tenantId: string, logger: Logger, now: number): { ran: number; failed: string[] } {
  const failed: string[] = [];
  for (const s of sweepers) {
    const ctx: CommandContext = { actor: systemActor(tenantId), correlationId: `cor_sweep_${now}_${s.op.name}` };
    try {
      s.op.handler(ctx, s.input ?? {});
    } catch (e) {
      failed.push(s.op.name);
      logger.log('error', 'sweeper failed', { op: s.op.name, error: e instanceof Error ? e : String(e) });
    }
  }
  return { ran: sweepers.length, failed };
}

/** Operations whose name ends with a sweeper verb are scheduled automatically. */
export const SWEEPER_SUFFIXES = ['.expire_due', '.close_due', '.retry_due', '.send_due', '.sweep_due', '.escalate_due', '.purge_due', '.timeout_due'] as const;

export const isSweeperOp = (op: Operation): boolean => SWEEPER_SUFFIXES.some((s) => op.name.endsWith(s));

export function startScheduler(sweepers: readonly Sweeper[], tenantId: string, logger: Logger, intervalMs: number, now: () => number): () => void {
  const timer = setInterval(() => runSweepers(sweepers, tenantId, logger, now()), intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
