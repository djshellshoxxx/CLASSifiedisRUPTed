import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUnlockBackoff, createVaultAutoLock, VaultUnlockRateLimitError } from './session-policy.ts';

describe('vault automatic locking', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0); });
  afterEach(() => vi.useRealTimers());
  const setup = (idleMinutes?: number) => {
    const lock = vi.fn(async () => undefined);
    const onError = vi.fn();
    return { lock, onError, policy: createVaultAutoLock({ lock, onError, now: () => Date.now(), ...(idleMinutes === undefined ? {} : { idleMinutes }) }) };
  };
  it('locks once at the 15-minute idle boundary and cancels its timers', async () => {
    const { policy, lock } = setup();
    await vi.advanceTimersByTimeAsync(15 * 60_000 - 1);
    expect(lock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(lock).toHaveBeenCalledExactlyOnceWith('idle');
    policy.activity(); policy.visibilityChanged(false); policy.check();
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(lock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('extends idle time on activity but not hidden-tab time', async () => {
    const { policy, lock } = setup();
    await vi.advanceTimersByTimeAsync(14 * 60_000);
    policy.activity();
    await vi.advanceTimersByTimeAsync(14 * 60_000);
    expect(lock).not.toHaveBeenCalled();
    policy.activity(); policy.visibilityChanged(true);
    await vi.advanceTimersByTimeAsync(4 * 60_000);
    policy.activity(); policy.visibilityChanged(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(lock).toHaveBeenCalledExactlyOnceWith('hidden');
  });
  it('checks overdue deadlines before activity or tab visibility can reset them', () => {
    const idle = setup();
    vi.setSystemTime(16 * 60_000); // Browser suspension: scheduled callback has not run.
    idle.policy.activity();
    expect(idle.lock).toHaveBeenCalledExactlyOnceWith('idle');
    const hidden = setup();
    hidden.policy.visibilityChanged(true);
    vi.setSystemTime(21 * 60_000);
    hidden.policy.visibilityChanged(false);
    expect(hidden.lock).toHaveBeenCalledExactlyOnceWith('hidden');
    const changed = setup(1);
    vi.setSystemTime(23 * 60_000);
    changed.policy.setIdleMinutes(60);
    expect(changed.lock).toHaveBeenCalledExactlyOnceWith('idle');
  });
  it('cancels hidden deadline on timely return and applies changed idle duration to original activity', async () => {
    const { policy, lock } = setup();
    policy.visibilityChanged(true);
    await vi.advanceTimersByTimeAsync(4 * 60_000);
    policy.visibilityChanged(false);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(lock).not.toHaveBeenCalled();
    policy.setIdleMinutes(5);
    expect(lock).toHaveBeenCalledExactlyOnceWith('idle');
  });
  it('does not let a backwards clock extend the last observed inactivity window', () => {
    const { policy, lock } = setup(1);
    vi.setSystemTime(30_000); policy.check();
    vi.setSystemTime(0); policy.activity();
    vi.setSystemTime(90_000); policy.check();
    expect(lock).toHaveBeenCalledExactlyOnceWith('idle');
  });
  it('supports disposal, enforces configuration bounds, and surfaces lock failures once', async () => {
    const { policy, lock } = setup();
    expect(() => policy.setIdleMinutes(0)).toThrow();
    expect(() => policy.setIdleMinutes(61)).toThrow();
    expect(() => policy.setIdleMinutes(1.5)).toThrow();
    expect(() => setup(NaN)).toThrow();
    policy.dispose();
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(lock).not.toHaveBeenCalled();
    const failure = new Error('storage close failed');
    const onError = vi.fn();
    createVaultAutoLock({ lock: async () => { throw failure; }, onError, idleMinutes: 1, now: () => Date.now() });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
  });
});

describe('local unlock backoff', () => {
  it('starts on third failure, doubles to 60 seconds, does not advance on blocked attempts, and resets after success', () => {
    let at = 0;
    const backoff = createUnlockBackoff(() => at);
    backoff.failed(); backoff.check(); backoff.failed(); backoff.check();
    for (const delay of [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000]) {
      backoff.failed();
      for (let attempt = 0; attempt < 2; attempt++) {
        try { backoff.check(); throw new Error('Expected throttling'); }
        catch (error) { expect(error).toBeInstanceOf(VaultUnlockRateLimitError); expect((error as VaultUnlockRateLimitError).retryAfterMs).toBe(delay); }
      }
      at += delay - 1;
      expect(() => backoff.check()).toThrow(VaultUnlockRateLimitError);
      at++;
      expect(() => backoff.check()).not.toThrow();
    }
    backoff.succeeded(); backoff.failed(); backoff.failed();
    expect(() => backoff.check()).not.toThrow();
  });
});
