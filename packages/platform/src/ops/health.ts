/**
 * F15.S03.M01 health checks. Checks are synchronous (the relay's storage is synchronous); the
 * per-check timeout is enforced by measuring elapsed time on the injected clock: a check that
 * returns after its budget is reported as failed ("timeout") even if it succeeded late.
 */
import type { Clock } from '@classrup/kernel';
import { isDomainError } from '@classrup/kernel';

export type HealthKind = 'liveness' | 'readiness';
export type HealthStatus = 'pass' | 'warn' | 'fail';

export interface CheckOutcome {
  readonly ok: boolean;
  /** Short, non-sensitive explanation. */
  readonly message?: string;
}

export interface HealthCheck {
  readonly name: string;
  readonly kind: HealthKind;
  /** A failing critical check fails the whole report; a failing non-critical one degrades it to `warn`. */
  readonly critical: boolean;
  readonly timeoutMs: number;
  run(): CheckOutcome;
}

export interface CheckResult {
  readonly name: string;
  readonly kind: HealthKind;
  readonly status: HealthStatus;
  readonly durationMs: number;
  readonly message?: string;
}

export interface HealthReport {
  readonly kind: HealthKind;
  readonly status: HealthStatus;
  readonly checks: readonly CheckResult[];
}

const NAME_RE = /^[a-z][a-z0-9_.-]{1,62}$/;

export class HealthRegistry {
  readonly #checks = new Map<string, HealthCheck>();
  readonly #clock: Clock;

  constructor(clock: Clock) {
    this.#clock = clock;
  }

  register(check: HealthCheck): void {
    if (!NAME_RE.test(check.name)) throw new TypeError(`invalid health check name ${check.name}`);
    if (this.#checks.has(check.name)) throw new TypeError(`duplicate health check ${check.name}`);
    if (!Number.isInteger(check.timeoutMs) || check.timeoutMs <= 0) throw new RangeError('timeoutMs must be a positive integer');
    this.#checks.set(check.name, check);
  }

  /** Liveness runs only liveness checks; readiness runs both kinds (a dead process is not ready). */
  run(kind: HealthKind): HealthReport {
    const selected = [...this.#checks.values()].filter((c) => kind === 'readiness' || c.kind === 'liveness');
    const checks = selected.map((c) => this.#runOne(c));
    return { kind, status: overall(checks), checks };
  }

  #runOne(check: HealthCheck): CheckResult {
    const started = this.#clock.now();
    let outcome: CheckOutcome;
    try {
      outcome = check.run();
    } catch (e) {
      outcome = { ok: false, message: isDomainError(e) ? e.code : e instanceof Error ? e.name : 'error' };
    }
    const durationMs = this.#clock.now() - started;
    const timedOut = durationMs > check.timeoutMs;
    const ok = outcome.ok && !timedOut;
    const message = timedOut ? `timeout after ${check.timeoutMs}ms` : outcome.message;
    return {
      name: check.name,
      kind: check.kind,
      status: ok ? 'pass' : check.critical ? 'fail' : 'warn',
      durationMs,
      ...(message !== undefined ? { message } : {}),
    };
  }
}

function overall(results: readonly CheckResult[]): HealthStatus {
  if (results.some((r) => r.status === 'fail')) return 'fail';
  return results.some((r) => r.status === 'warn') ? 'warn' : 'pass';
}
