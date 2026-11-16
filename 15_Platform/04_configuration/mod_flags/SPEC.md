# F15.S04.M02 — Feature flags

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S04](../SPEC.md). **Process IDs:** PS-124-01…PS-124-10. **Code:** `packages/platform/src/configuration/flags`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Flag values and their evaluation (CTR-FLG-001). Two independent scopes exist: the vault scope, set by the local user within the modules compiled into their build and evaluated entirely on the device, and the relay scope, set by a relay operator per community (tenant) hosted on that relay and evaluated by the relay for its relay commands. A flag value is off, on or beta(roles). The dependency rule (a module can be on only if all modules it depends_on are on, FLG-2) is checked when a value is written and again at evaluation, using the generated registry of F15.S04.M01. A disabled module returns FEATURE_DISABLED for its commands, stops its consumers and hides its entry points while keeping its data (FLG-3). There is no global flag service and no remote switch that can disable features inside someone's vault.

## Responsibilities

- Own the FlagSetting record for both scopes (vault and relay-community), with expectedRevision concurrency and a reason for each change.
- Evaluate effective state for a key and actor with the dependency rule, the feature-level cascade (feature off turns all its modules off) and defaults from the registry (FLG-4), caching results for at most 30 s and invalidating immediately in-process on change.
- Reject writes that would violate the dependency rule with PLATFORM_FLAG_DEPENDENCY, listing blocking or dependent modules, with an optional cascade that switches dependents off atomically.
- Protect core features (F15, F16) from being switched off with PLATFORM_FLAG_LOCKED.
- Emit platform.flag.changed for each changed key so local consumers (UI, command bus) refresh without polling.

## Not responsible for

- The graph and defaults (F15.S04.M01 mod_feature).
- Enforcing FEATURE_DISABLED on commands (F15.S02.M02 mod_api calls the evaluator).
- Hiding UI entry points (each feature's UI uses the evaluator).
- Tenants and their settings (F15.S04.M03 mod_tenants).
- Future: percentage rollouts and experiments; Future: signed remote flag advisories that a user can accept or ignore.

## User stories

- As a member, I can turn off modules I do not want, such as auctions, and the app hides them while keeping any data I already have.
- As a member, I am told exactly which other modules must be on before I can enable one, or which would also switch off.
- As a relay operator, I can enable beta features for operators only on my community before opening them to everyone, and my relay answers FEATURE_DISABLED for anything that is off.
- As a developer, I can rely on one evaluation function in the vault and on the relay with identical dependency semantics.

## Edge cases

- Turning on a module whose dependency is off; rejected with PLATFORM_FLAG_DEPENDENCY listing the missing dependency, no state changed.
- Turning off a module that other modules depend on while they are on; rejected unless cascade is true, in which case dependents switch off in one transaction and one platform.flag.changed event per key is emitted.
- Turning a whole feature off while a module of another feature depends on one of its modules; the same rule applies and cascade handles it.
- Two operator devices change the same flag at once; the second gets CONFLICT_REVISION and must re-read.
- A module is on in the relay scope but off in the vault scope; relay commands for it work for other users of that relay, while this vault hides its UI and does not run its consumers.
- A module is on in the vault scope but the selected relay has it off; the vault keeps local features working and shows relay-dependent actions as "this relay does not offer it", using FEATURE_DISABLED from the relay.
- A beta(roles) value names a role that does not exist or contains duplicates; rejected with VALIDATION_FAILED.
- Cache is stale by up to 30 s on another device; the relay is authoritative for relay commands at call time and the stale device sees FEATURE_DISABLED on its next call.

## UX and accessibility

- Settings > Features (vault scope): feature groups with module toggles, dependency text from the registry, a Show beta features switch, and explanations of what happens to data when off.
- Operator console > Flags (relay scope, part of the operator tool): table of keys with value, beta roles, last change, reason, with a Change dialog that shows blocking dependencies and a cascade checkbox.

**States:** loading; ready; saving; conflict; blocked-by-dependency; locked-core; offline-read-only

**Accessibility:** Toggles are real switches with accessible names including module title and dependency summary, and state changes are announced by aria-live polite.; The dependency dialog lists blocking modules as text and focus moves to its first action.; Targets are at least 44x44 px and the table is keyboard navigable.

## Owned data

- `FlagSetting` (classrup.platform.flag_setting/v1, P1, RET-STANDARD)

## Interfaces

- Commands: `platform.flag.set`, `platform.flag.set_relay`, `platform.flag.reset`
- Queries: `platform.flag.evaluate`, `platform.flag.list`
- Emits: `platform.flag.changed`
- Consumes: `platform.tenant.created`

## Dependencies

F15.S04.M01, F15.S04.M03, F15.S02.M03, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-124-01 | [Domain schema](domain_schema.md) | 3 |
| PS-124-02 | [Validation rules](validation_rules.md) | 3 |
| PS-124-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-124-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-124-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-124-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-124-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-124-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-124-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-124-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/platform/src/configuration/flags/index.ts`.

## Acceptance criteria

- All tests T01-T18 pass in CI.
- The dependency rule is never violated in stored or evaluated state for vault or relay scope.
- A disabled module returns FEATURE_DISABLED, stops its consumers and keeps its data.
- No remote party can change a vault's flags and a vault's flags are never transmitted.
