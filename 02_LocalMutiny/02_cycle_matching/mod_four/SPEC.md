# F02.S02.M02 — Four-party cycles

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S02](../SPEC.md). **Process IDs:** PS-017-01…PS-017-10. **Code:** `packages/mutiny/src/cycle_matching/four`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The length-4 profile of the cycle engine. Four-party cycles are riskier because a single dropout invalidates four trades, so this profile applies the FLOW-05 value tolerance (at most 5 percent of the larger side) to every leg, a stricter distance constraint than the 3-party profile (each adjacent pair within 10-25 km) and requires every participant to accept at least 4 participants. It registers its LengthProfile with the F02.S02.M05 registry, which the engine F02.S02.M03 reads, explains 4-party suggestions to each participant and owns no records. Suggestions stay advice; a proposal needs explicit signed consent from all four.

## Responsibilities

- Define and register with the F02.S02.M05 registry the length-4 profile: tolerance 500 basis points of the larger side per leg (FLOW-05), absolute minimum reference 5.00 EUR converted with the pinned quote, every adjacent pair within distance bucket ordinal 2 (10_25, the stricter part of this profile), imbalance quantum 10 permille, minimum want age 15 minutes, and maxOtherOpenCycles 2 read by the consent-time guard of F02.S03.M01.
- Require that all four participants have maxCycleLength at least 4 and opted in as profile admission rules; the limit of 2 other open cycles is not an admission rule, because other participants' counts are private, and each participant's own vault enforces it at consent time (F02.S03.M01).
- Produce the participant-facing explanation of a 4-party suggestion including the dropout risk notice that one withdrawal cancels all four trades before handover.

## Not responsible for

- Enumeration, scoring order and selection (F02.S02.M03).
- Feasibility verdicts (F02.S02.M05) and proposals and consent (F02.S03.M01).
- Profiles for other lengths (F02.S02.M01 and engine defaults).
- Future: partial-cycle fallbacks that split a failed 4-party cycle into two 2-party cycles; this would be a new suggestion needing fresh consent, never an automatic reroute.

## User stories

- As a member in a 4-party suggestion, I see a plain notice that all four of us must consent and reserve before anything is committed, and that nothing is automatic.
- As a member, I can see that the 5 percent tolerance applies to every leg of a 4-party cycle and that each neighbour in the ring is within 10-25 km, stricter than for 3-party cycles.

## Edge cases

- One participant is within 10 km of the previous participant but 30 km from the next; the pair constraint fails for that edge and the cycle is not suggested.
- A participant already has 2 other open cycles; the suggestion is still shown, and that participant's own vault refuses consent with MUTINY_PARTICIPANT_OVERLOADED at consent time without revealing the count to anyone.
- A 4-party suggestion has needsCompensation true; the explanation names who would pay whom as a plan to review, not a commitment.
- A relay computed the suggestion with an older profile version (p4.1, 3 percent) while the vault uses p4.2 (5 percent per leg); the vault re-verifies with its own values and shows both.
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

F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

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
- The golden 4-party example reproduces gaps 100, 200, 300, 400 and tolerances 1000, 1000, 990, 995 exactly, matching FLOW-05.
- The module emits no events and no statements and holds no records.
