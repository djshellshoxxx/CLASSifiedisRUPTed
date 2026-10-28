/**
 * F15.S04.M01 module registry. Each package contributes its ModuleDescriptor list; the registry rejects
 * duplicate ids, unknown flags and event/collection names owned by a different package, and reports
 * the transitive flag dependencies between modules.
 */
import type { ModuleDescriptor } from '@classrup/kernel';
import { assertCollectionName, isValidEventType, MODULE_ID_RE } from '@classrup/kernel';
import type { FlagService } from './flags';

export interface RegisteredModule extends ModuleDescriptor {
  readonly source: string;
}

export interface ModuleListing {
  readonly id: string;
  readonly path: string;
  readonly source: string;
  readonly flag: string;
  readonly summary: string;
  readonly enabled: boolean;
  readonly permissions: readonly string[];
  readonly events: readonly string[];
  readonly collections: readonly string[];
}

export interface PublicModuleListing {
  readonly id: string;
  readonly flag: string;
  readonly summary: string;
  readonly enabled: boolean;
}

export interface ModuleDependency {
  readonly id: string;
  readonly source: string;
  readonly flag: string;
  /** Transitive flags that must be enabled for this module to run (excluding its own). */
  readonly requiresFlags: readonly string[];
  /** Registered modules gated by those flags. */
  readonly requiresModules: readonly string[];
}

export interface DependencyReport {
  readonly modules: readonly ModuleDependency[];
  /** Catalog flags that no registered module uses. */
  readonly unusedFlags: readonly string[];
}

type FlagView = Pick<FlagService, 'has' | 'definition' | 'definitions' | 'isEnabled'>;

export class ModuleRegistry {
  readonly #flags: FlagView;
  readonly #modules = new Map<string, RegisteredModule>();
  readonly #eventOwner = new Map<string, string>();
  readonly #collectionOwner = new Map<string, string>();

  constructor(flags: FlagView) {
    this.#flags = flags;
  }

  /** Registers all descriptors of one source atomically: either every module is accepted or none. */
  register(source: string, modules: readonly ModuleDescriptor[]): void {
    if (!/^[a-z][a-z0-9_]*$/.test(source)) throw new TypeError(`invalid module source ${source}`);
    const stagedEvents = new Map<string, string>();
    const stagedCollections = new Map<string, string>();
    const staged = new Set<string>();
    for (const m of modules) {
      this.#validate(source, m, staged, stagedEvents, stagedCollections);
      staged.add(m.id);
    }
    for (const m of modules) this.#modules.set(m.id, { ...m, source });
    for (const [k, v] of stagedEvents) this.#eventOwner.set(k, v);
    for (const [k, v] of stagedCollections) this.#collectionOwner.set(k, v);
  }

  get(id: string): RegisteredModule | undefined {
    return this.#modules.get(id);
  }

  all(): RegisteredModule[] {
    return [...this.#modules.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  list(tenantId: string): ModuleListing[] {
    return this.all().map((m) => ({
      id: m.id,
      path: m.path,
      source: m.source,
      flag: m.flag,
      summary: m.summary,
      enabled: this.#flags.isEnabled(m.flag, tenantId),
      permissions: m.permissions ?? [],
      events: m.events ?? [],
      collections: m.collections ?? [],
    }));
  }

  listPublic(tenantId: string): PublicModuleListing[] {
    return this.list(tenantId).map(({ id, flag, summary, enabled }) => ({ id, flag, summary, enabled }));
  }

  dependencyReport(): DependencyReport {
    const modulesByFlag = new Map<string, string[]>();
    for (const m of this.#modules.values()) modulesByFlag.set(m.flag, [...(modulesByFlag.get(m.flag) ?? []), m.id]);
    const modules = this.all().map((m): ModuleDependency => {
      const requiresFlags = [...this.#transitiveFlags(m.flag)].sort();
      const requiresModules = requiresFlags.flatMap((f) => modulesByFlag.get(f) ?? []).sort();
      return { id: m.id, source: m.source, flag: m.flag, requiresFlags, requiresModules };
    });
    const used = new Set(modulesByFlag.keys());
    const unusedFlags = this.#flags
      .definitions()
      .map((d) => d.key)
      .filter((k) => !used.has(k))
      .sort();
    return { modules, unusedFlags };
  }

  #transitiveFlags(flag: string): Set<string> {
    const out = new Set<string>();
    const stack = [...(this.#flags.definition(flag)?.dependsOn ?? [])];
    for (let f = stack.pop(); f !== undefined; f = stack.pop()) {
      if (out.has(f)) continue;
      out.add(f);
      stack.push(...(this.#flags.definition(f)?.dependsOn ?? []));
    }
    return out;
  }

  #validate(source: string, m: ModuleDescriptor, staged: ReadonlySet<string>, events: Map<string, string>, collections: Map<string, string>): void {
    if (!MODULE_ID_RE.test(m.id)) throw new TypeError(`invalid module id ${m.id}`);
    if (this.#modules.has(m.id) || staged.has(m.id)) throw new TypeError(`duplicate module id ${m.id}`);
    if (!this.#flags.has(m.flag)) throw new TypeError(`module ${m.id} uses unknown flag ${m.flag}`);
    for (const type of m.events ?? []) {
      if (!isValidEventType(type)) throw new TypeError(`module ${m.id} lists invalid event type ${type}`);
      this.#claim(this.#eventOwner, events, type, source, `event ${type}`);
    }
    for (const name of m.collections ?? []) {
      assertCollectionName(name);
      this.#claim(this.#collectionOwner, collections, name, source, `collection ${name}`);
    }
  }

  /** One canonical owner per event type / collection: a second source may not claim it. */
  #claim(registered: ReadonlyMap<string, string>, staged: Map<string, string>, name: string, source: string, label: string): void {
    const owner = registered.get(name) ?? staged.get(name);
    if (owner !== undefined && owner !== source) throw new TypeError(`${label} already owned by ${owner}`);
    staged.set(name, source);
  }
}
