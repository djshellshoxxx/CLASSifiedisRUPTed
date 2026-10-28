/**
 * F12.S03.M03 rate: persisted token bucket. Tokens are stored scaled by the refill interval
 * (`units = tokens * refillIntervalMs`), so refill is exact integer arithmetic and the bound
 * `consumed <= capacity + refillTokens * elapsed / refillIntervalMs` holds without rounding.
 */
import type { Deps, RateLimitPort } from '@classrup/kernel';
import { DAY, HOUR, MINUTE, rateLimited, validationError } from '@classrup/kernel';
import type { Cols } from '../common';

export interface RatePolicy {
  /** Key prefix, e.g. `report:`. The empty prefix is the default policy. */
  readonly prefix: string;
  readonly capacity: number;
  readonly refillTokens: number;
  readonly refillIntervalMs: number;
}

export const DEFAULT_RATE_POLICIES: readonly RatePolicy[] = [
  { prefix: '', capacity: 60, refillTokens: 60, refillIntervalMs: MINUTE },
  { prefix: 'report:', capacity: 5, refillTokens: 1, refillIntervalMs: HOUR },
  { prefix: 'message.send:', capacity: 30, refillTokens: 30, refillIntervalMs: MINUTE },
  { prefix: 'listing.publish:', capacity: 10, refillTokens: 10, refillIntervalMs: DAY },
  { prefix: 'auth.challenge:', capacity: 10, refillTokens: 10, refillIntervalMs: 5 * MINUTE },
];

export interface RateLimiter extends RateLimitPort {
  policyFor(key: string): RatePolicy;
  /** Whole tokens currently available, without consuming. */
  available(key: string): number;
}

function validatePolicies(policies: readonly RatePolicy[]): void {
  if (!policies.some((p) => p.prefix === '')) throw new TypeError('rate policies need a default policy with empty prefix');
  for (const p of policies) {
    const ok = [p.capacity, p.refillTokens, p.refillIntervalMs].every((n) => Number.isSafeInteger(n) && n >= 1);
    if (!ok || p.capacity * p.refillIntervalMs > Number.MAX_SAFE_INTEGER / 2) throw new TypeError(`invalid rate policy ${p.prefix || '(default)'}`);
  }
}

export function createRateLimiter(deps: Deps, cols: Cols, policies: readonly RatePolicy[] = DEFAULT_RATE_POLICIES): RateLimiter {
  validatePolicies(policies);
  const ordered = [...policies].sort((a, b) => b.prefix.length - a.prefix.length);
  const policyFor = (key: string): RatePolicy => ordered.find((p) => key.startsWith(p.prefix)) as RatePolicy;

  /** Units available now, after refill since the last write. */
  const unitsNow = (key: string, policy: RatePolicy, now: number): { units: number; version: number } => {
    const full = policy.capacity * policy.refillIntervalMs;
    const rec = cols.buckets.get(key);
    if (!rec) return { units: full, version: 0 };
    const elapsed = Math.min(Math.max(0, now - rec.updatedAt), full);
    return { units: Math.min(full, rec.units + policy.refillTokens * elapsed), version: rec.version };
  };

  return {
    policyFor,
    available(key) {
      const policy = policyFor(key);
      return Math.floor(unitsNow(key, policy, deps.clock.now()).units / policy.refillIntervalMs);
    },
    consume(key, cost = 1) {
      const policy = policyFor(key);
      if (!Number.isInteger(cost) || cost < 1 || cost > policy.capacity) {
        throw validationError('RATE.INVALID_COST', 'cost must be an integer between 1 and the bucket capacity', { capacity: policy.capacity });
      }
      deps.store.transaction(() => {
        const now = deps.clock.now();
        const { units, version } = unitsNow(key, policy, now);
        const need = cost * policy.refillIntervalMs;
        if (units < need) {
          const retryAfterMs = Math.ceil((need - units) / policy.refillTokens);
          throw rateLimited('RATE.LIMITED', 'rate limit exceeded', { retryAfterMs, bucket: policy.prefix || 'default' });
        }
        cols.buckets.put({ id: key, units: units - need, updatedAt: now }, version);
      });
    },
  };
}
