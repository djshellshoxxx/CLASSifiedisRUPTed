// Test helpers that bind implementations to their module.spec.yaml (ADR-0015 traceability).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

type Catalog = { modules: Array<{ id: string; ps: string; path: string; code: string }> };
let catalog: Catalog | undefined;

function loadCatalog(): Catalog {
  catalog ??= YAML.parse(readFileSync(join(ROOT, 'planning', 'modules.yaml'), 'utf8')) as Catalog;
  return catalog;
}

/** Parsed module.spec.yaml for a module ID such as "F01.S04.M01". */
export function specOf(moduleId: string): any {
  const m = loadCatalog().modules.find((x) => x.id === moduleId);
  if (!m) throw new Error(`unknown module ${moduleId}`);
  return YAML.parse(readFileSync(join(ROOT, m.path, 'module.spec.yaml'), 'utf8'));
}

/** Transitions declared in the spec for an entity, as "from->to" strings (sorted). */
export function specTransitions(moduleId: string, entity: string): string[] {
  const machines = specOf(moduleId).processes.workflow_state_machine.machines as Array<{ entity: string; transitions: string[] }>;
  const mach = machines.find((x) => x.entity === entity);
  if (!mach) throw new Error(`${moduleId}: no machine for ${entity}`);
  return mach.transitions.map((t) => t.split('|')[0]!.replace(/\s+/g, '')).sort();
}

/** Error codes declared by the module (module-specific only). */
export function specErrorCodes(moduleId: string): string[] {
  return (specOf(moduleId).processes.commands_queries_events.errors as string[]).map((r) => r.split('|')[0]!.trim());
}

/** Command, query and produced-event names declared by the module. */
export function specInterface(moduleId: string): { commands: string[]; queries: string[]; events: string[] } {
  const p = specOf(moduleId).processes.commands_queries_events;
  return {
    commands: (p.commands ?? []).map((c: { name: string }) => c.name).sort(),
    queries: (p.queries ?? []).map((q: { name: string }) => q.name).sort(),
    events: (p.events_produced ?? []).map((e: { type: string }) => e.type).sort(),
  };
}
