// Pure rate arithmetic for F12.S03.M03: GCRA (theoretical arrival time) and token bucket.
// No clock, no storage: callers pass a monotonic millisecond reading. Float comparisons use an epsilon far
// below the smallest difference the integer parameters can produce (1/6000 ms for GCRA, 1/60000 token).

const EPS_MS = 1e-6;
const EPS_TOKENS = 1e-9;

export interface RateParams {
  /** Sustained rate, 1..6000 per minute (after any penalty factor, may be fractional). */
  readonly ratePerMinute: number;
  /** Burst allowance, at least 1 (after multipliers, may be fractional only through penalties). */
  readonly burst: number;
}

export type GcraOutcome =
  | { readonly allowed: true; readonly tat: number; readonly remaining: number; readonly fullAt: number }
  | { readonly allowed: false; readonly tat: number; readonly retryAfterMs: number; readonly remaining: 0; readonly fullAt: number };

/** Emission interval T in ms between sustained arrivals. */
export function emissionIntervalMs(ratePerMinute: number): number {
  return 60_000 / ratePerMinute;
}

/**
 * GCRA virtual scheduling. A request of `cost` is allowed when max(tat, now) + cost*T - now <= burst*T.
 * `tat` is undefined for a fresh bucket (equivalent to tat = now). The returned tat only moves forward.
 */
export function gcraConsume(tat: number | undefined, now: number, p: RateParams, cost = 1): GcraOutcome {
  const t = emissionIntervalMs(p.ratePerMinute);
  const base = tat === undefined ? now : Math.max(tat, now);
  const next = base + cost * t;
  const excess = next - now - p.burst * t;
  if (excess > EPS_MS) {
    return { allowed: false, tat: base, retryAfterMs: Math.max(1, Math.ceil(excess - EPS_MS)), remaining: 0, fullAt: base };
  }
  const remaining = Math.max(0, Math.floor((p.burst * t - (next - now) + EPS_MS) / t));
  return { allowed: true, tat: next, remaining, fullAt: next };
}

/** Read-only view of a GCRA bucket (no consumption). */
export function gcraPeek(tat: number | undefined, now: number, p: RateParams): { remaining: number; fullAt: number } {
  const t = emissionIntervalMs(p.ratePerMinute);
  const base = tat === undefined ? now : Math.max(tat, now);
  return { remaining: Math.max(0, Math.floor((p.burst * t - (base - now) + EPS_MS) / t)), fullAt: base };
}

export interface TokenState {
  readonly tokens: number;
  readonly at: number;
}

export type TokenOutcome =
  | { readonly allowed: true; readonly state: TokenState; readonly remaining: number; readonly fullAt: number }
  | { readonly allowed: false; readonly state: TokenState; readonly retryAfterMs: number; readonly remaining: number; readonly fullAt: number };

function refill(state: TokenState | undefined, now: number, p: RateParams): TokenState {
  if (!state) return { tokens: p.burst, at: now };
  const dt = Math.max(0, now - state.at);
  return { tokens: Math.min(p.burst, state.tokens + (dt * p.ratePerMinute) / 60_000), at: Math.max(now, state.at) };
}

/** Token bucket with capacity = burst, refilled at ratePerMinute/60000 tokens per ms. */
export function tokenConsume(state: TokenState | undefined, now: number, p: RateParams, cost = 1): TokenOutcome {
  const cur = refill(state, now, p);
  const perMs = p.ratePerMinute / 60_000;
  const fullAt = (s: TokenState) => now + Math.ceil((p.burst - s.tokens) / perMs - EPS_MS);
  if (cur.tokens + EPS_TOKENS >= cost) {
    const next = { tokens: Math.max(0, cur.tokens - cost), at: cur.at };
    return { allowed: true, state: next, remaining: Math.floor(next.tokens + EPS_TOKENS), fullAt: fullAt(next) };
  }
  return { allowed: false, state: cur, retryAfterMs: Math.max(1, Math.ceil((cost - cur.tokens) / perMs - EPS_MS)), remaining: Math.floor(cur.tokens + EPS_TOKENS), fullAt: fullAt(cur) };
}

export function tokenPeek(state: TokenState | undefined, now: number, p: RateParams): { remaining: number; fullAt: number } {
  const cur = refill(state, now, p);
  return { remaining: Math.floor(cur.tokens + EPS_TOKENS), fullAt: now + Math.ceil((p.burst - cur.tokens) / (p.ratePerMinute / 60_000) - EPS_MS) };
}

/** A bucket is at full capacity (equivalent to a fresh one) at `now`. */
export function gcraIsFull(tat: number, now: number): boolean {
  return tat <= now + EPS_MS;
}

export function tokensAreFull(state: TokenState, now: number, p: RateParams): boolean {
  return refill(state, now, p).tokens >= p.burst - EPS_TOKENS;
}
