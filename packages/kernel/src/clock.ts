/** Injectable time source. All timestamps are integer milliseconds since Unix epoch (UTC). */
export interface Clock {
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

/** Deterministic clock for tests and simulations. */
export class ManualClock implements Clock {
  #t: number;
  constructor(start = Date.UTC(2026, 0, 1)) {
    this.#t = start;
  }
  now(): number {
    return this.#t;
  }
  set(t: number): void {
    this.#t = t;
  }
  advance(ms: number): number {
    if (ms < 0) throw new RangeError('clock cannot go backwards');
    this.#t += ms;
    return this.#t;
  }
}

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const toIso = (ms: number): string => new Date(ms).toISOString();
