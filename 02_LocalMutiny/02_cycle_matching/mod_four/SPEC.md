# F02.S02.M02 — Four-party cycles

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S02](../SPEC.md). **Process IDs:** PS-017-01…PS-017-10. **Code:** `packages/mutiny/src/cycle_matching/four`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The length-4 profile of the cycle engine. Four-party cycles are riskier because a single dropout invalidates four trades, so this profile applies a stricter value tolerance and a tighter distance constraint than the 3-party profile and requires every participant to accept at least 4 participants. It registers a LengthProfile provider with F02.S02.M03, explains 4-party suggestions to each participant and owns no records. Suggestions stay advice; a proposal needs explicit signed consent from all four.

## Responsibilities

- [object Object]
- Require that all four participants have maxCycleLength at least 4 and opted in, and that none has more than 2 other non-terminal cycles open, as profile admission rules.
- Produce the participant-facing explanation of a 4-party suggestion including the dropout risk notice that one withdrawal cancels all four trades before handover.

## Not responsible for

- Enumeration, scoring order and selection (F02.S02.M03).
- Feasibility verdicts (F02.S02.M05) and proposals and consent (F02.S03.M01).
- Profiles for other lengths (F02.S02.M01 and engine defaults).
- Future: partial-cycle fallbacks that split a failed 4-party cycle into two 2-party cycles; this would be a new suggestion needing fresh consent, never an automatic reroute.

## User stories

- As a member in a 4-party suggestion, I see a plain notice that all four of us must consent and reserve before anything is committed, and that nothing is automatic.
- As a member, I can see that the 4-party tolerance is stricter (3 percent) than the 3-party tolerance and that the two other cities are within 25 km of the neighbours in the ring.

## Edge cases

- One participant is within 10 km of the previous participant but 30 km from the next; the pair constraint fails for that edge and the cycle is not suggested.
- A participant already has 2 other open cycles; the profile admission rule excludes them from 4-party suggestions but not from 2-party ones.
- A 4-party suggestion has needsCompensation true; the explanation names who would pay whom as a plan to review, not a commitment.
- A relay computed the suggestion with the 3 percent tolerance but the vault override is 5 percent; the vault re-verifies with its own values and shows both.
- Explanation requested for a 3-party suggestion; the query rejects it as a length mismatch.

## UX and accessibility

- Explanation panel for 4-party suggestions: four rows, a 'what could go wrong' notice about dropouts, and the distance bucket of each hand-over.
- Profile info sheet with the stricter numbers and the profile version.

**States:** loading; ready; override-applied; error

**Accessibility:** The dropout notice is plain text in a region with an accessible heading, not only an icon.; Each of the four participant rows is a list item with a complete sentence; gap and tolerance are not conveyed by color alone.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: `mutiny.cycle4.get_profile`, `mutiny.cycle4.explain`
- Emits: none
- Consumes: `mutiny.cycle.suggested`, `mutiny.matching_profile.updated`

## Dependencies

F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-017-01 | [Domain schema](domain_schema.md) | 3 |
| PS-017-02 | [Validation rules](validation_rules.md) | 3 |
| PS-017-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-017-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-017-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-017-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-017-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-017-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-017-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-017-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_matching/four/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- The golden 4-party example reproduces gaps 100, 200, 300, 400 and tolerances 600, 600, 594, 597 exactly.
- The module emits no events and no statements and holds no records.
