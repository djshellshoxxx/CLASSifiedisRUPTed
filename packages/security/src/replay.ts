/**
 * Replay protection for signed requests and federated envelopes: a message is accepted once
 * per nonce, and only within a clock-skew window. Nonces are remembered for twice the window.
 */
import { unauthenticated } from '@classrup/kernel';

export interface NonceStore {
  /** Returns false if the nonce was already recorded and has not expired. */
  remember(nonce: string, expiresAt: number, now: number): boolean;
}

export class MemoryNonceStore implements NonceStore {
  readonly #seen = new Map<string, number>();
  constructor(private readonly maxEntries = 100_000) {}

  remember(nonce: string, expiresAt: number, now: number): boolean {
    const prior = this.#seen.get(nonce);
    if (prior !== undefined && prior > now) return false;
    if (this.#seen.size >= this.maxEntries) this.#evict(now);
    this.#seen.set(nonce, expiresAt);
    return true;
  }

  #evict(now: number): void {
    for (const [k, exp] of this.#seen) if (exp <= now) this.#seen.delete(k);
    // Still full of live nonces: drop oldest insertions (Map keeps insertion order).
    while (this.#seen.size >= this.maxEntries) {
      const first = this.#seen.keys().next().value as string;
      this.#seen.delete(first);
    }
  }
}

export class ReplayGuard {
  constructor(
    private readonly store: NonceStore,
    private readonly skewMs = 5 * 60 * 1000,
  ) {}

  check(nonce: string, timestamp: number, now: number): void {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) throw unauthenticated('REPLAY.NONCE_INVALID', 'invalid nonce');
    if (Math.abs(now - timestamp) > this.skewMs) throw unauthenticated('REPLAY.STALE', 'timestamp outside allowed window');
    if (!this.store.remember(nonce, now + 2 * this.skewMs, now)) throw unauthenticated('REPLAY.DUPLICATE', 'request replayed');
  }
}
