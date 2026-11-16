# F02.S02.M01 — Three-party cycles

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S02](../SPEC.md). **Process IDs:** PS-020-01…PS-020-10. **Code:** `packages/mutiny/src/cycle_matching/three`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The length-3 profile of the cycle engine. It fixes the thresholds that apply to exactly three participants (value tolerance, distance, want age, imbalance quantum) and the plain-language explanation shown to each participant of a 3-party suggestion. It registers a LengthProfile provider with F02.S02.M03 and owns no records. The engine in the vault or on a relay remains the only producer of suggestions, and a suggestion remains advice.

## Responsibilities

- [object Object]
- Allow tenant or vault settings to override the profile only inside bounds (tolerance 0..1000 bps, absolute minimum 0..100 major units) and record the effective profile version used for each suggestion.
- Produce the participant-facing explanation of a 3-party suggestion, naming for each participant what they give, what they receive, the value gap against tolerance, distance bucket and the facts that are only claims of others.

## Not responsible for

- Enumeration, scoring order and selection (F02.S02.M03); this module supplies parameters only.
- Feasibility verdicts (F02.S02.M05) and proposals (F02.S03.M01).
- Profiles for 2 and 4+ participants (the engine default profile, F02.S02.M02 and the engine N profile).
- Future: per-region profile variants and user-adjustable tolerance shown as a slider.

## User stories

- As a member in a 3-party suggestion, I can read why it was suggested and see that my gap of 5.00 EUR is within the 5 percent tolerance.
- As a relay operator, I can see which length-3 profile version my relay uses for public matching.

## Edge cases

- A participant's gap is exactly at tolerance; the explanation says within tolerance and the engine kept the cycle.
- A tenant override sets tolerance to 1000 bps; the engine records profile version with the override and the explanation shows the effective numbers, not the defaults.
- A relay-imported suggestion was computed with a different profile version than the vault's; the vault shows both and re-verifies with its own profile.
- Participant settlement currency has zero decimals (JPY); the absolute minimum is 5 times 10 to the exponent 0, i.e. 5 minor units, and the explanation uses the currency's own formatting.
- Explanation requested for a suggestion of another length; the query returns VALIDATION_FAILED instead of a wrong explanation.

## UX and accessibility

- Explanation panel inside suggestion detail: three rows (one per participant) with gives, receives, gap, tolerance, distance bucket and a basis chip.
- Profile info sheet: values used for 3-party cycles and the profile version.

**States:** loading; ready; override-applied; error

**Accessibility:** Each participant row is a list item with a single sentence readable by screen readers, such as 'You give Lamp worth 120.00 EUR and receive Chair worth 115.00 EUR; the 5.00 difference is within tolerance'.; Numbers are formatted with the user's locale and currency; no meaning is conveyed by color alone.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: `mutiny.cycle3.get_profile`, `mutiny.cycle3.explain`
- Emits: none
- Consumes: `mutiny.cycle.suggested`, `mutiny.matching_profile.updated`

## Dependencies

F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-020-01 | [Domain schema](domain_schema.md) | 3 |
| PS-020-02 | [Validation rules](validation_rules.md) | 3 |
| PS-020-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-020-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-020-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-020-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-020-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-020-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-020-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-020-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_matching/three/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- The golden 3-party example reproduces gaps 500, 200, 300 and tolerances 600, 600, 590 exactly.
- The module emits no events and no statements and holds no records.
