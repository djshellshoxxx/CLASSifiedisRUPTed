// Clock port (CTR-ID-001 ID-7): epoch milliseconds and RFC 3339 UTC millisecond strings.
export interface Clock {
  /** Epoch milliseconds. */
  now(): number;
  /** RFC 3339 UTC with millisecond precision, e.g. 2026-11-04T10:15:30.123Z. */
  iso(): string;
}

export interface FakeClock extends Clock {
  advance(ms: number): void;
  set(at: number | string): void;
}

export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function parseIso(iso: string): number {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new RangeError(`invalid timestamp ${iso}`);
  return ms;
}

export function createSystemClock(): Clock {
  return { now: () => Date.now(), iso: () => new Date().toISOString() };
}

function toMs(at: number | string): number {
  return typeof at === 'number' ? at : parseIso(at);
}

/** Deterministic clock for tests (CTR-TST-001 TST-3). Time only moves through advance/set. */
export function createFakeClock(start: number | string = '2026-11-04T10:00:00.000Z'): FakeClock {
  let current = toMs(start);
  return {
    now: () => current,
    iso: () => toIso(current),
    advance: (ms) => {
      if (!Number.isFinite(ms) || ms < 0) throw new RangeError('advance requires a non-negative finite ms');
      current += ms;
    },
    set: (at) => {
      current = toMs(at);
    },
  };
}
