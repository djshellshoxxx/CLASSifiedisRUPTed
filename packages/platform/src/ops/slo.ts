/**
 * F15.S03.M01 SLO error budgets. An SLO is a target success ratio over a window; the budget is the
 * number of bad events the target tolerates. Burn rate 1 means the budget would be spent exactly at the
 * end of the window; multi-window burn alerts follow the usual fast/slow pattern.
 */
import type { Clock } from '@classrup/kernel';
import { MINUTE } from '@classrup/kernel';

export interface SloTarget {
  readonly name: string;
  /** Required ratio of good events, in (0, 1). */
  readonly objective: number;
  readonly windowMs: number;
}

export interface BudgetStatus {
  readonly sli: number;
  readonly allowedBad: number;
  readonly actualBad: number;
  /** Fraction of the budget left; negative once overspent. 1 when no events were seen. */
  readonly budgetRemaining: number;
  readonly burnRate: number;
  readonly exhausted: boolean;
}

export function errorBudget(objective: number, good: number, total: number): BudgetStatus {
  if (!(objective > 0 && objective < 1)) throw new RangeError('objective must be within (0, 1)');
  if (!Number.isInteger(good) || !Number.isInteger(total) || good < 0 || total < good) throw new RangeError('invalid event counts');
  const allowedBad = total * (1 - objective);
  const actualBad = total - good;
  const burnRate = allowedBad === 0 ? 0 : actualBad / allowedBad;
  return {
    sli: total === 0 ? 1 : good / total,
    allowedBad,
    actualBad,
    budgetRemaining: total === 0 ? 1 : 1 - burnRate,
    burnRate,
    exhausted: actualBad > allowedBad,
  };
}

export interface BurnWindow {
  readonly lookbackMs: number;
  /** Alert when the burn rate over the lookback reaches this multiple. */
  readonly threshold: number;
}

/** Google SRE style pairs for a 30 day SLO: fast burn (1h) and slow burn (6h). */
export const DEFAULT_BURN_WINDOWS: readonly BurnWindow[] = [
  { lookbackMs: 60 * MINUTE, threshold: 14.4 },
  { lookbackMs: 6 * 60 * MINUTE, threshold: 6 },
];

interface Bucket {
  readonly minute: number;
  good: number;
  bad: number;
}

/** Per-minute buckets of good/bad events, trimmed to the SLO window. */
export class SloTracker {
  readonly #target: SloTarget;
  readonly #clock: Clock;
  readonly #buckets: Bucket[] = [];

  constructor(target: SloTarget, clock: Clock) {
    if (!(target.objective > 0 && target.objective < 1) || target.windowMs < MINUTE) throw new RangeError('invalid SLO target');
    this.#target = target;
    this.#clock = clock;
  }

  record(good: boolean): void {
    const minute = Math.floor(this.#clock.now() / MINUTE);
    let bucket = this.#buckets[this.#buckets.length - 1];
    if (bucket?.minute !== minute) {
      bucket = { minute, good: 0, bad: 0 };
      this.#buckets.push(bucket);
    }
    if (good) bucket.good += 1;
    else bucket.bad += 1;
    this.#trim();
  }

  counts(lookbackMs: number = this.#target.windowMs): { good: number; total: number } {
    this.#trim();
    const from = Math.floor((this.#clock.now() - lookbackMs) / MINUTE);
    let good = 0;
    let bad = 0;
    for (const b of this.#buckets) {
      if (b.minute <= from) continue;
      good += b.good;
      bad += b.bad;
    }
    return { good, total: good + bad };
  }

  status(): BudgetStatus & { readonly name: string } {
    const { good, total } = this.counts();
    return { name: this.#target.name, ...errorBudget(this.#target.objective, good, total) };
  }

  /** Windows whose burn rate currently reaches the alert threshold. */
  alerts(windows: readonly BurnWindow[] = DEFAULT_BURN_WINDOWS): BurnWindow[] {
    return windows.filter((w) => {
      const { good, total } = this.counts(w.lookbackMs);
      return errorBudget(this.#target.objective, good, total).burnRate >= w.threshold;
    });
  }

  #trim(): void {
    const oldest = Math.floor((this.#clock.now() - this.#target.windowMs) / MINUTE);
    while (this.#buckets.length > 0 && (this.#buckets[0] as Bucket).minute <= oldest) this.#buckets.shift();
  }
}
