/** Local session controls; these are not a defense against offline passphrase guessing. */
export type AutoLockReason = 'idle' | 'hidden';
export interface SessionTimer {
  schedule(callback: () => void, delayMs: number): unknown;
  cancel(handle: unknown): void;
}
const defaultTimer: SessionTimer = {
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
const HIDDEN_LIMIT_MS = 5 * 60_000;

export interface AutoLockOptions {
  readonly lock: (reason: AutoLockReason) => Promise<void>;
  readonly onError: (error: unknown) => void;
  readonly idleMinutes?: number;
  /** Monotonic milliseconds; defaults to performance.now, not the device wall clock. */
  readonly now?: () => number;
  readonly timer?: SessionTimer;
}

/** The UI supplies user activity and visibility signals, and disposes this on session teardown. */
export function createVaultAutoLock(options: AutoLockOptions) {
  const minutes = options.idleMinutes ?? 15;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) throw new Error('Auto-lock must be 1–60 minutes');
  const now = options.now ?? (() => performance.now());
  const timer = options.timer ?? defaultTimer;
  let idleMs = minutes * 60_000;
  let latest = now();
  if (!Number.isFinite(latest)) throw new Error('Invalid session clock');
  let lastActivity = latest;
  let hiddenSince: number | undefined;
  let handle: unknown;
  let disposed = false;
  const observe = (): number => {
    const value = now();
    if (!Number.isFinite(value)) throw new Error('Invalid session clock');
    latest = Math.max(latest, value);
    return latest;
  };
  const dispose = (): void => {
    disposed = true;
    if (handle !== undefined) timer.cancel(handle);
    handle = undefined;
  };
  const check = (): boolean => {
    if (disposed) return false;
    const at = observe();
    const reason = hiddenSince !== undefined && at - hiddenSince >= HIDDEN_LIMIT_MS ? 'hidden'
      : at - lastActivity >= idleMs ? 'idle' : undefined;
    if (!reason) return true;
    dispose();
    // Revoke immediately. In particular, do not enqueue this behind an awaited user action.
    try { void options.lock(reason).catch(options.onError); }
    catch (error) { options.onError(error); }
    return false;
  };
  const schedule = (): void => {
    if (handle !== undefined) timer.cancel(handle);
    if (disposed) return;
    const deadline = Math.min(lastActivity + idleMs, hiddenSince === undefined ? Infinity : hiddenSince + HIDDEN_LIMIT_MS);
    handle = timer.schedule(() => { handle = undefined; if (check()) schedule(); }, Math.max(0, deadline - observe()));
  };
  schedule();
  return {
    /** Call for real user input, never for background refreshes or delivery retries. */
    activity(): void {
      if (!check()) return;
      lastActivity = observe();
      schedule();
    },
    visibilityChanged(hidden: boolean): void {
      if (!check()) return;
      if (hidden) hiddenSince ??= observe();
      else hiddenSince = undefined;
      schedule();
    },
    setIdleMinutes(minutes: number): void {
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) throw new Error('Auto-lock must be 1–60 minutes');
      if (!check()) return;
      idleMs = minutes * 60_000;
      if (check()) schedule();
    },
    check,
    dispose,
  };
}

export class VaultUnlockRateLimitError extends Error {
  readonly retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Too many unlock attempts. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`);
    this.name = 'VaultUnlockRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/** In-memory backoff survives reconnects in one page; reloads and other devices reset it. */
export function createUnlockBackoff(now: () => number = () => performance.now()) {
  let failures = 0;
  let blockedUntil = 0;
  let latest = 0;
  const observe = (): number => {
    const value = now();
    if (!Number.isFinite(value)) throw new Error('Invalid unlock clock');
    latest = Math.max(latest, value);
    return latest;
  };
  return {
    check(): void {
      const remaining = blockedUntil - observe();
      if (remaining > 0) throw new VaultUnlockRateLimitError(remaining);
    },
    failed(): void {
      failures = Math.min(failures + 1, 9);
      blockedUntil = observe() + (failures < 3 ? 0 : Math.min(60_000, 1000 * 2 ** (failures - 3)));
    },
    succeeded(): void { failures = 0; blockedUntil = 0; },
  };
}
export type UnlockBackoff = ReturnType<typeof createUnlockBackoff>;
