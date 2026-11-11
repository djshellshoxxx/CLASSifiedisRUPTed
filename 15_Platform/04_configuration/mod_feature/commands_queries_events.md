# PS-123-04 — Commands, queries and events: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-04.R01** The module exposes four read-only queries that run in the vault (local) and on a relay (relay query), with identical results for the same release.
- **PS-123-04.R02** There are no commands, statements or events because the registry never changes at runtime.
- **PS-123-04.R03** Query results are small enough to be served from memory in under 5 ms.
- **PS-123-04.R04** Settings > Features in the vault lists only modules with surface vault or both, and the operator console lists only relay or both, using the surface field of the registry.

## Specification

### Commands

_None._

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.feature.list_features` | platform.feature.read_registry | { featureId?, includeFuture?: boolean (default false), surface?: vault\|relay } — vault-local query, also served by a relay; surface vault returns modules with surface vault or both, surface relay returns relay or both | { version, hash, features: Feature[], modules: ModuleRecord[] } | NOT_FOUND |
| `platform.feature.get_dependencies` | platform.feature.read_registry | { key: moduleId\|featureId, transitive?: boolean (default true) } — vault-local query, also served by a relay | { key, dependsOn: id[], dependents: id[], contracts: CTR-ID[] } | NOT_FOUND |
| `platform.feature.get_order` | platform.feature.read_registry | { } (no input) — vault-local query | { order: id[] } (dependencies before dependents) |  |
| `platform.feature.verify_hash` | platform.feature.read_registry | { hash } — vault-local query used by a vault to compare with a relay's registry hash | { match: boolean, localHash } | VALIDATION_FAILED |

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_FEATURE_CYCLE | 422 | no | build-time failure, the depends_on graph contains a cycle (path reported) |
| PLATFORM_FEATURE_UNKNOWN_DEPENDENCY | 422 | no | build-time failure, a depends_on entry names a module that does not exist |
| PLATFORM_FEATURE_DEFAULT_VIOLATION | 422 | no | build-time failure, default states break the dependency rule or switch off a core module |
| PLATFORM_FEATURE_REGISTRY_STALE | 422 | no | build-time failure, generated registry differs from a fresh generation |
| PLATFORM_FEATURE_SPEC_MISSING | 422 | no | strict build-time failure, a catalog module has no module.spec.yaml; in normal mode the module is kept off |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Read-only module: no commands, no signed statements, no events.

### Example

```
$ node packages/platform/src/configuration/feature/generate.ts
registry: 18 features, 148 modules (current catalog), 412 edges, acyclic, 0 specs missing, hash sha256-Qm3...
platform.feature.get_dependencies({ key: "F02.S01.M01" })
-> { key: "F02.S01.M01", dependsOn: ["F01.S01.M01", "F07.S01.M01"], dependents: ["F02.S02.M01"], contracts: ["CTR-FED-001", "CTR-ID-001"] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T05 | contract | PS-123-04.R01, PS-123-04.R02, PS-123-04.R03 | call all four queries in the vault and on a relay | identical results for the same release; no commands or events exist; response within 5 ms |
| TEST-PS-123-09.T14 | a11y | PS-123-04.R04 | Settings > Features (vault) and Operator console > Modules scanned with axe | zero serious issues; dependency text is real list text; each list shows only its surface |
| TEST-PS-123-09.T17 | integration | PS-123-01.R02, PS-123-04.R04 | generate the real catalog, then list features with surface vault and surface relay and render both settings screens | F15.S03.M02 has surface relay and is absent from the vault list; F15.S01.M01 has surface vault and is absent from the operator console; packages modules appear in both |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
