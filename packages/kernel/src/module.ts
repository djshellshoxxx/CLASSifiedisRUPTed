/** Module descriptor: binds code to a planning-hierarchy module id (e.g. `F01.S01.M01`). */
import type { Permission } from './actor';

export interface ModuleDescriptor {
  /** Hierarchy id from INDEX.md, e.g. `F01.S01.M01`. */
  readonly id: string;
  /** Planning directory, e.g. `01_LocalBazaar/01_listings/mod_create`. */
  readonly path: string;
  /** Feature flag gating the module's commands. */
  readonly flag: string;
  readonly summary: string;
  readonly permissions?: readonly Permission[];
  readonly events?: readonly string[];
  readonly collections?: readonly string[];
}

export const MODULE_ID_RE = /^F\d{2}\.S\d{2}\.M\d{2}$/;

export function defineModules(mods: readonly ModuleDescriptor[]): readonly ModuleDescriptor[] {
  const seen = new Set<string>();
  for (const m of mods) {
    if (!MODULE_ID_RE.test(m.id)) throw new TypeError(`invalid module id ${m.id}`);
    if (seen.has(m.id)) throw new TypeError(`duplicate module id ${m.id}`);
    seen.add(m.id);
  }
  return Object.freeze([...mods]);
}
