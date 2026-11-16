# F02.S02.M03 — N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S02](../SPEC.md). **Process IDs:** PS-018-01…PS-018-10. **Code:** `packages/mutiny/src/cycle_matching/n`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Bounded deterministic search for barter cycles of 2..Lmax participants over public want and have projections. It builds a directed compatibility graph, enumerates elementary cycles with a Johnson-style depth-first search restricted by the smallest-node-start rule, scores them with a fixed tuple and selects disjoint cycles greedily. The engine runs in the user's vault over retained signed projections (rooted at the local principal) or on a user-selected relay over the public projections that relay indexes. Its output is a CycleSuggestion, which is advice only. A suggestion binds nobody, reserves nothing and becomes a proposal only when a participant explicitly proposes it (F02.S03.M01).

## Responsibilities

- Build the CompatibilityGraph from retained public want and have projections, matching profiles, valuations and local block lists.
- Enumerate elementary cycles of length 2..Lmax (default 5, tenant maximum 8) in deterministic order within hard budgets of 100000 expanded nodes and 250 ms.
- Score cycles with the tuple (participants, minus relative value imbalance, minus max distance bucket, oldest-want age) and select disjoint cycles greedily.
- Persist CycleSuggestion records with a stable cycleKey, expiry (24 h) and a locally re-verifiable explanation, and import relay-computed suggestions only after local re-verification.

## Not responsible for

- Turning a suggestion into a proposal, collecting consent or reserving items (F02.S03.M01 and F02.S03.M02).
- Per-length thresholds and explanation text (F02.S02.M01, F02.S02.M02 register LengthProfile providers with this engine).
- Eligibility and opt-in data (F02.S02.M04) and the pure feasibility checks (F02.S02.M05).
- Future: exact maximum-weight cycle packing with an ILP solver behind the same CyclePackingPort (ADR-0005), multi-item bundles per leg, sharding across overlapping L1 cells, and learned ranking.

## User stories

- As a member who wants a bicycle and has a guitar, I am shown a 3-party cycle that includes me, with what I give, what I receive and why it was suggested, and nothing is reserved until I choose to propose it.
- As a member, I can dismiss a suggestion and it will not come back for 30 days.
- As a relay operator, I can enable public matching for my relay, which computes suggestions from the public projections I index and delivers them as encrypted envelopes, while members re-verify every suggestion in their own vault.

## Edge cases

- The graph contains no cycle; the run completes with zero suggestions and run_completed reports cyclesFound 0, never an error.
- The search exhausts 100000 expansions or 250 ms; the run is marked truncated and returns the deterministic prefix of the enumeration, and the UI says results may be incomplete.
- A relay-computed suggestion names an item whose listing was tombstoned; local re-verification fails and the suggestion is stored as unverified and cannot be proposed.
- Two members hold the same cycle (same cycleKey) in different vaults; each keeps its own CycleSuggestion, and proposing in both vaults is resolved by F02.S03.M01 duplicate-proposal rules.
- A participant opts out or is blocked between two runs; the next run supersedes every active suggestion containing that edge.
- The device clock is wrong; projection ages are computed against the local clock, so suggestions built from projections dated in the future are discarded as claims from the future.
- The vault is offline; the run uses retained projections only and labels the result with the age of the oldest projection used.

## UX and accessibility

- Suggestions list: cards showing cycle length, what I give and receive, indicative value gap, distance bucket, expiry countdown, and the 'verified in your vault' badge.
- Suggestion detail: ordered ring diagram of 2..8 participants with pseudonyms, item thumbnails and per-edge reason ('your want Bicycle matches Alice's listing'); buttons Propose this exchange and Dismiss.
- Matching settings link to F02.S02.M04 and a 'Last search' line with time, projection age, and truncated notice.

**States:** loading; empty; searching; results; truncated; stale-projections; offline; unverified-relay-suggestion; error

**Accessibility:** The ring diagram has a text alternative listing each hand-over in order ('Alice gives Lamp to Bob').; Expiry countdown and truncation notices are announced via an aria-live polite region.; Propose and Dismiss are buttons of at least 44 by 44 px with accessible names that include the cycle length.

## Owned data

- `CycleSuggestion` (classrup.mutiny.cycle_suggestion/v1, P2, RET-SHORT)
- `CompatibilityGraph` (classrup.mutiny.compatibility_graph/v1, P2, RET-EPHEMERAL)

## Interfaces

- Commands: `mutiny.suggestion.generate`, `mutiny.suggestion.import`, `mutiny.suggestion.dismiss`, `mutiny.suggestion.compute_public`
- Queries: `mutiny.suggestion.list_mine`, `mutiny.suggestion.get`, `mutiny.graph.get_stats`
- Emits: `mutiny.cycle.suggested`, `mutiny.matching.run_completed`
- Consumes: `bazaar.want.declared`, `bazaar.want.withdrawn`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.inventory.depleted`, `mutiny.matching_profile.updated`, `mutiny.valuation.declared`, `identity.block.added`, `mutiny.cycle.proposed`, `mutiny.cycle.declined`

## Dependencies

F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F11.S01.M02, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-018-01 | [Domain schema](domain_schema.md) | 4 |
| PS-018-02 | [Validation rules](validation_rules.md) | 3 |
| PS-018-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-018-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-018-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-018-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-018-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-018-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-018-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-018-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_matching/n/index.ts`.

## Acceptance criteria

- All tests T01–T20 pass in CI with seeds recorded.
- No suggestion is ever created as a proposal, reservation, consent or signed statement by the engine.
- Same inputHash and parameters produce identical suggestions on two different devices.
