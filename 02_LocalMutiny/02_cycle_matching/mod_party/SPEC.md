# F02.S02.M04 — Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S02](../SPEC.md). **Process IDs:** PS-019-01…PS-019-10. **Code:** `packages/mutiny/src/cycle_matching/party`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Each member decides in their own vault whether to take part in cycle matching, how long a cycle they accept (2..8, default 4), how far away counterparties may be (distance bucket), whether they accept compensation legs, whom to exclude, and when to pause. Only a coarse signed projection (opt-in, maximum length, distance bucket, compensation flag) is published to relays the member selects; the exclusion list stays in the vault and is applied locally. Eligibility is a pure function used by the engine and the feasibility checks.

## Responsibilities

- Own the MatchingProfile record per principal with explicit, versioned opt-in text and defaults of opted out, maxCycleLength 4, distance bucket 10-25 km and no compensation.
- Publish a signed public projection (classrup.mutiny.matching_profile/v1) of the non-private fields and a signed tombstone when the member opts out; ingest other members' projections with signature, sequence and tombstone checks.
- Provide the eligibility function (opted in, not paused, not locally blocked, within cycle participation limits, region known) used by F02.S02.M03 and F02.S02.M05.

## Not responsible for

- Enumeration and scoring of cycles (F02.S02.M03).
- Block list storage (F07.S02.M02); this module only reads it.
- Global suspension; there is none (ADR-0016). A relay's hosting policy may stop indexing a projection, which only removes the projection from that relay.
- Future: per-category opt-in, time-of-day availability windows, and reputation thresholds.

## User stories

- As a member, I opt in to matching after reading plainly what is published (my coarse preferences, not my exclusions), and I can opt out at any time with a signed tombstone.
- As a member, I limit cycles to at most 3 participants within 10 km and exclude two people I do not want to trade with, without those people ever being told.
- As a member, I pause matching for 14 days while I am away.

## Edge cases

- The member opts out; copies of the projection already fetched by other vaults cannot be recalled and the confirmation dialog says so before opting in.
- Two devices of the same member edit the profile concurrently; the higher seq wins for the public projection and the vault shows a resolve prompt for the private fields, never merging silently.
- A member has no home region (no location permission); opt-in is refused until a manual L1 region is entered, because distance buckets cannot be computed.
- A peer projection arrives with a seq lower than the stored one or a broken prev chain; it is ignored and counted, and the stored one is kept.
- A peer projection carries maxCycleLength 9 or a bucket outside the enum; it is quarantined with reason and excluded from the graph.
- The excluded list reaches 200 entries; adding another returns a validation error instead of dropping an entry.

## UX and accessibility

- Matching settings: opt-in toggle with plain-language disclosure, max cycle length slider 2..8, distance bucket selector, 'accept compensation' switch, pause date picker, excluded people list with search.
- Disclosure sheet: lists exactly the four published fields, the relays selected, and states that fetched copies cannot be recalled.

**States:** loading; opted-out; opted-in; paused; region-missing; publishing; publish-failed-offline; error

**Accessibility:** Every control has a visible label; the slider exposes aria-valuetext such as 'up to 4 participants'.; Opt-in disclosure is readable by screen readers and the confirm button names the action 'Opt in to matching'.; Status changes such as published or paused are announced in an aria-live polite region.

## Owned data

- `MatchingProfile` (classrup.mutiny.matching_profile/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `mutiny.matching_profile.update`, `mutiny.matching_profile.ingest`
- Queries: `mutiny.matching_profile.get_mine`, `mutiny.matching_profile.list_known`, `mutiny.matching_profile.check_eligible`
- Emits: `mutiny.matching_profile.updated`
- Consumes: `identity.block.added`, `identity.block.removed`, `discovery.location.updated`

## Dependencies

F07.S01.M01, F07.S02.M02, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-019-01 | [Domain schema](domain_schema.md) | 3 |
| PS-019-02 | [Validation rules](validation_rules.md) | 3 |
| PS-019-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-019-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-019-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-019-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-019-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-019-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-019-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-019-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_matching/party/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- Exclusions are never present in any projection, event payload, log line or relay request (privacy suite).
- Opt-in requires explicit versioned confirmation and opt-out always produces a signed tombstone.
