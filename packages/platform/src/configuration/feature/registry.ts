// The compiled-in registry of this release, deep-frozen so that no runtime path can mutate it (T06).
import { deepFreeze } from './rules.ts';
import { GENERATED_REGISTRY } from './registry.generated.ts';
import type { Registry } from './schema.ts';

export const registry: Registry = deepFreeze(GENERATED_REGISTRY);
