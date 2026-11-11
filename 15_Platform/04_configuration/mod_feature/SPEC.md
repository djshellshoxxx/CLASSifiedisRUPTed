# F15.S04.M01 — Feature registry

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S04](../SPEC.md). **Process IDs:** PS-123-01…PS-123-10. **Code:** `packages/platform/src/configuration/feature`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A static, generated, acyclic registry of every ClassRup feature and module listed in the current catalog (planning/modules.yaml) with its scope, surface (vault, relay or both), default state and depends_on edges. The registry is generated at build time from planning/modules.yaml and the depends_on lists of each module.spec.yaml, validated for cycles, unknown references and default-state consistency, and shipped inside the isomorphic package so that both the vault (PWA) and an optional relay read the same graph (CTR-FLG-001). It holds no per-user or per-relay values; those belong to F15.S04.M02.

## Responsibilities

- Generate registry.generated.json (features, modules, edges, defaults, content hash) deterministically from planning/modules.yaml and the module specs, and fail the build when the checked-in output is stale.
- [object Object]
- Mark FUTURE-scope modules default off and not registered (FLG-4), mark features F15 Platform and F16 Security as core (not switchable off), and keep a module whose module.spec.yaml is missing default off with dependsOnKnown false so it can never be switched on.
- Derive each module's surface (vault, relay or both) from its catalog code path so that Settings > Features in the vault and the operator console list only the modules that run there.
- Expose read-only registry queries (list, dependencies, dependents, topological order) that run locally in the vault and on a relay.

## Not responsible for

- Per-vault and per-relay flag values and evaluation (F15.S04.M02 mod_flags).
- Enforcement of FEATURE_DISABLED at the command bus (F15.S02.M02 mod_api).
- Authoring of module depends_on lists (each module spec owns its own).
- Future: signed registry updates delivered at runtime; Future: per-module version compatibility ranges.

## User stories

- As a developer, I can add a depends_on edge to a module spec and the build tells me immediately if it creates a cycle or points to a module that does not exist.
- As a member, I can see in Settings which optional features exist and which other features each one needs before I turn it on.
- As a relay operator, I can see which modules my relay can host and what each depends on.

## Edge cases

- A new dependency closes a cycle (F02.S01.M01 to F01.S01.M01 and back); generation fails with PLATFORM_FEATURE_CYCLE and prints the cycle path in stable order.
- A module spec lists a module ID that is not in planning/modules.yaml; generation fails with PLATFORM_FEATURE_UNKNOWN_DEPENDENCY naming the pair.
- An MVP module depends on a FUTURE module, so its default on state would violate the dependency rule; generation fails with PLATFORM_FEATURE_DEFAULT_VIOLATION.
- planning/modules.yaml changed but the generated file was not regenerated; the CI check fails with PLATFORM_FEATURE_REGISTRY_STALE.
- A module has no module.spec.yaml yet; generation emits it with dependsOn empty, dependsOnKnown false, defaultState off and registered false, so it can never be switched on and no dependent can default on, and strict mode fails with PLATFORM_FEATURE_SPEC_MISSING.
- A relay-only module (for example F15.S03.M02 backups, code under apps/relay) appears in the vault's Settings > Features; it does not, because its surface is relay and the vault lists only vault and both.
- A client asks for the dependencies of an unknown key; the query returns NOT_FOUND.

## UX and accessibility

- Settings > Features (vault): grouped list of features with module toggles for modules with surface vault or both (toggle behavior belongs to F15.S04.M02), each row showing 'Needs: <module names>' from this registry.
- Operator console > Modules (relay): the same list filtered to surface relay or both.

**States:** loading; ready; unknown-key

**Accessibility:** Dependency lists are real lists with module names, not icons only.; Group headings use heading levels and toggles are labelled with the module title and the dependency summary.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: `platform.feature.list_features`, `platform.feature.get_dependencies`, `platform.feature.get_order`, `platform.feature.verify_hash`
- Emits: none
- Consumes: none

## Dependencies

CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-123-01 | [Domain schema](domain_schema.md) | 3 |
| PS-123-02 | [Validation rules](validation_rules.md) | 4 |
| PS-123-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-123-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-123-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-123-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-123-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-123-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-123-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-123-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/platform/src/configuration/feature/index.ts`.

## Acceptance criteria

- All tests T01-T17 pass in CI.
- The real catalog generates an acyclic registry with defaults that satisfy the dependency rule.
- Adding a cycle or an unknown dependency to any module spec fails CI with a stable code and a readable path.
- The registry works fully offline and cannot be modified at runtime.
