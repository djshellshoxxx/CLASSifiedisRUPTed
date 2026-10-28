/**
 * Registries through which every feature plugs its own data into export (F10.S01.M03) and erasure
 * (F10.S01.M04). The relay registers one exporter and one eraser per owning area at startup.
 */
import type { JsonValue } from '@classrup/kernel';

export interface EraserResult {
  readonly erased: number;
  /**
   * Items deliberately kept, as `<retentionClass>:<what>` (for example
   * `commerce_evidence:payment receipts, counterparties pseudonymised`). The reason is derived from policy.
   */
  readonly retained: readonly string[];
}

export type Exporter = (accountId: string) => JsonValue;
export type Eraser = (accountId: string) => EraserResult;

const AREA_RE = /^[a-z][a-z0-9_]{1,30}$/;

export class DataRegistry {
  readonly #exporters = new Map<string, Exporter>();
  readonly #erasers = new Map<string, Eraser>();

  registerExporter(area: string, exporter: Exporter): void {
    register(this.#exporters, area, exporter, 'exporter');
  }

  /** Erasers must be idempotent: a failed deletion is retried and runs every eraser again. */
  registerEraser(area: string, eraser: Eraser): void {
    register(this.#erasers, area, eraser, 'eraser');
  }

  exporters(): readonly (readonly [string, Exporter])[] {
    return [...this.#exporters].sort(([a], [b]) => (a < b ? -1 : 1));
  }

  erasers(): readonly (readonly [string, Eraser])[] {
    return [...this.#erasers];
  }
}

function register<T>(map: Map<string, T>, area: string, fn: T, kind: string): void {
  if (!AREA_RE.test(area)) throw new TypeError(`invalid ${kind} area: ${area}`);
  if (map.has(area)) throw new TypeError(`${kind} already registered for area ${area}`);
  map.set(area, fn);
}
