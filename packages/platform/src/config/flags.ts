/**
 * F15.S04.M02 feature flags. Evaluation order (first match wins):
 *  unknown flag -> off; static kill switch -> off; runtime kill -> off; tenant override or default
 *  must be on; every `dependsOn` flag must itself be enabled for the tenant.
 * Decisions are cached per (flag, tenant) and the cache is dropped whenever a flag changes.
 */
import type { Collection, DataStore, FeatureFlags, Versioned } from '@classrup/kernel';
import { assertVersion, precondition, notFound } from '@classrup/kernel';
import { DEFAULT_FLAGS } from './catalog';

export interface FlagDefinition {
  readonly key: string;
  readonly description: string;
  readonly default: boolean;
  readonly dependsOn: readonly string[];
  /** Statically engaged kill switch (deployment configuration): forces the flag off for every tenant. */
  readonly killSwitch: boolean;
}

export interface FlagState extends Versioned {
  /** Same as id: the flag key. */
  readonly key: string;
  readonly killed: boolean;
  readonly killReason?: string;
  readonly overrides: Readonly<Record<string, boolean>>;
  readonly updatedAt: number;
}

export type FlagReason = 'unknown_flag' | 'kill_switch' | 'runtime_kill' | 'default_off' | 'override_off' | 'dependency_off' | 'default_on' | 'override_on';

export interface FlagDecision {
  readonly enabled: boolean;
  readonly reason: FlagReason;
  /** The dependency that switched the flag off (reason `dependency_off`). */
  readonly via?: string;
}

export const FLAGS_COLLECTION = 'platform_flags';

/** The flag guarding the admin surface can never be disabled, or operators could lock themselves out. */
export const PROTECTED_FLAGS: ReadonlySet<string> = new Set(['platform.configuration']);

const FLAG_KEY_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** Validates keys, dependency existence and acyclicity. Throws TypeError (definition-time wiring error). */
export function validateFlagGraph(defs: readonly FlagDefinition[]): void {
  const byKey = new Map<string, FlagDefinition>();
  for (const d of defs) {
    if (!FLAG_KEY_RE.test(d.key)) throw new TypeError(`invalid flag key ${d.key}`);
    if (byKey.has(d.key)) throw new TypeError(`duplicate flag ${d.key}`);
    byKey.set(d.key, d);
  }
  for (const d of defs) {
    for (const dep of d.dependsOn) {
      if (!byKey.has(dep)) throw new TypeError(`flag ${d.key} depends on unknown flag ${dep}`);
    }
  }
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (key: string, path: readonly string[]): void => {
    const seen = state.get(key);
    if (seen === 'done') return;
    if (seen === 'visiting') throw new TypeError(`flag dependency cycle: ${[...path, key].join(' -> ')}`);
    state.set(key, 'visiting');
    for (const dep of (byKey.get(key) as FlagDefinition).dependsOn) visit(dep, [...path, key]);
    state.set(key, 'done');
  };
  for (const d of defs) visit(d.key, []);
}

export class FlagService implements FeatureFlags {
  readonly #store: DataStore;
  readonly #defs = new Map<string, FlagDefinition>();
  readonly #collection: Collection<FlagState>;
  readonly #cache = new Map<string, FlagDecision>();
  #states: Map<string, FlagState> | undefined;

  constructor(store: DataStore, definitions: readonly FlagDefinition[] = DEFAULT_FLAGS) {
    validateFlagGraph(definitions);
    this.#store = store;
    this.#collection = store.collection<FlagState>(FLAGS_COLLECTION);
    for (const d of definitions) this.#defs.set(d.key, d);
  }

  /** Adds a definition after validating the extended graph (cycle detection happens here). */
  define(def: FlagDefinition): void {
    validateFlagGraph([...this.#defs.values(), def]);
    this.#defs.set(def.key, def);
    this.invalidate();
  }

  has(key: string): boolean {
    return this.#defs.has(key);
  }

  definition(key: string): FlagDefinition | undefined {
    return this.#defs.get(key);
  }

  definitions(): FlagDefinition[] {
    return [...this.#defs.values()];
  }

  /** Drop cached decisions; call after external changes to the flag collection (restore, other process). */
  invalidate(): void {
    this.#cache.clear();
    this.#states = undefined;
  }

  state(key: string): FlagState | undefined {
    return this.#collection.get(key);
  }

  isEnabled(flag: string, tenantId: string): boolean {
    return this.decide(flag, tenantId).enabled;
  }

  decide(flag: string, tenantId: string): FlagDecision {
    const cacheKey = `${flag}|${tenantId}`;
    const hit = this.#cache.get(cacheKey);
    if (hit) return hit;
    const decision = this.#evaluate(flag, tenantId);
    this.#cache.set(cacheKey, decision);
    return decision;
  }

  setOverride(key: string, tenantId: string, enabled: boolean, now: number, expectedVersion?: number): FlagState {
    this.#requireKnown(key);
    if (!enabled && PROTECTED_FLAGS.has(key)) throw precondition('FLAG.PROTECTED', 'flag cannot be disabled', { flag: key });
    return this.#write(key, now, expectedVersion, (s) => ({ ...s, overrides: { ...s.overrides, [tenantId]: enabled } }));
  }

  clearOverride(key: string, tenantId: string, now: number, expectedVersion?: number): FlagState {
    this.#requireKnown(key);
    const current = this.#collection.get(key);
    if (current?.overrides[tenantId] === undefined) throw notFound('FLAG.OVERRIDE_NOT_FOUND', 'no override for tenant', { flag: key, tenantId });
    return this.#write(key, now, expectedVersion, (s) => {
      const { [tenantId]: _removed, ...rest } = s.overrides;
      return { ...s, overrides: rest };
    });
  }

  setKilled(key: string, killed: boolean, reason: string, now: number, expectedVersion?: number): FlagState {
    this.#requireKnown(key);
    if (killed && PROTECTED_FLAGS.has(key)) throw precondition('FLAG.PROTECTED', 'flag cannot be killed', { flag: key });
    return this.#write(key, now, expectedVersion, (s) => {
      const { killReason: _previous, ...rest } = s;
      return killed ? { ...rest, killed, killReason: reason } : { ...rest, killed };
    });
  }

  #requireKnown(key: string): void {
    if (!this.#defs.has(key)) throw notFound('FLAG.UNKNOWN', 'unknown flag', { flag: key });
  }

  #write(key: string, now: number, expectedVersion: number | undefined, change: (s: FlagState) => FlagState): FlagState {
    const current = this.#collection.get(key);
    const version = current?.version ?? 0;
    assertVersion('flag', version, expectedVersion);
    const base: FlagState = current ?? { id: key, key, killed: false, overrides: {}, updatedAt: now, version: 0 };
    const stored = this.#collection.put({ ...change(base), updatedAt: now }, version);
    this.invalidate();
    this.#store.afterCommit(() => this.invalidate());
    return stored;
  }

  #loadStates(): Map<string, FlagState> {
    if (!this.#states) this.#states = new Map(this.#collection.list().map((s) => [s.key, s]));
    return this.#states;
  }

  #evaluate(flag: string, tenantId: string): FlagDecision {
    const def = this.#defs.get(flag);
    if (!def) return { enabled: false, reason: 'unknown_flag' };
    if (def.killSwitch) return { enabled: false, reason: 'kill_switch' };
    const state = this.#loadStates().get(flag);
    if (state?.killed) return { enabled: false, reason: 'runtime_kill' };
    const override = state?.overrides[tenantId];
    if (!(override ?? def.default)) return { enabled: false, reason: override === undefined ? 'default_off' : 'override_off' };
    for (const dep of def.dependsOn) {
      if (!this.decide(dep, tenantId).enabled) return { enabled: false, reason: 'dependency_off', via: dep };
    }
    return { enabled: true, reason: override === undefined ? 'default_on' : 'override_on' };
  }
}
