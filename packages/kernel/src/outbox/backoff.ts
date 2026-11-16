// Exponential backoff with full jitter (CTR-IDM-001 IDM-4): base 500 ms, cap 30 s.
export interface BackoffOptions {
  readonly baseMs?: number;
  readonly capMs?: number;
}

/** Delay before attempt `attempt + 1`, where `attempt` (>= 1) failures have happened; random in [0, 1). */
export function fullJitterDelay(attempt: number, random: () => number, opts: BackoffOptions = {}): number {
  const base = opts.baseMs ?? 500;
  const cap = opts.capMs ?? 30_000;
  const ceiling = Math.min(cap, base * 2 ** Math.max(0, attempt - 1));
  return Math.floor(random() * ceiling);
}
