# F06.S03.M01 — Relevance ranking

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S03](../SPEC.md). **Process IDs:** PS-051-01…PS-051-10. **Code:** `packages/discovery/src/ranking/relevance`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Deterministic relevance scoring for search results. The score combines BM25 text relevance, a recency decay anchored on local first-seen time, and a distance-bucket weight, with an optional paid-promotion multiplier capped at 1.25 that exists only on a relay that chose to sell promotion and is always labelled 'Promoted'. The vault uses the bundled default RankingConfig; a relay operator may publish its own versioned RankingConfig as a signed statement so clients can read how that relay ranks. Same inputs and same config always give the same order.

## Responsibilities

- Define and own RankingConfig - weights, half-life, BM25 field weights, distance bucket weights and the promotion cap - with strict bounds and immutable versions.
- Provide pure score() and explainComponents() functions used identically by the vault and the relay, with fixed tie-breaking.
- Let a relay operator publish and roll back RankingConfig versions, emitting a signed statement and the event discovery.ranking_config.published.
- Anchor recency on the index's local firstSeenAt clamped by the author's claim, never on claims alone.

## Not responsible for

- Diversity, new-author exposure and explanation strings for the user interface (F06.S03.M02).
- Text index and query parsing (F06.S01.M01, F06.S01.M02).
- Selling promotion, billing and promotion claims (a relay-local policy; payment evidence is F09 claims, never custody).
- Future: learned ranking, per-user personalization, click feedback; none is allowed without a new decision record because they would profile users.

## User stories

- As a buyer, I see the best text match first, with newer and closer items ranked a bit higher, and I can see why each result is ranked where it is.
- As a buyer, promoted results are clearly labelled 'Promoted' and cannot jump more than a capped amount.
- As a relay operator, I can publish a ranking configuration and roll it back, and my users can read it.
- As a developer, the same query on the same data gives the same order on every device.

## Edge cases

- A query has no text terms (browse by filters); the text term is dropped and the remaining weights are renormalized.
- Two results have equal scores to six decimals; the newer firstSeenAt wins, then the smaller documentId.
- A document's claimedPublishedAt is in the future; recency uses min(claim, firstSeenAt), so it gains nothing.
- A promotion has expired (promotedUntil in the past) but the flag was not cleared; the multiplier is not applied and the label is not shown.
- An operator publishes weights that do not sum to 1.0 or a boost above 0.25; rejected with RANKING_CONFIG_INVALID.
- A vault has no relay config; it uses the bundled default config and states 'default ranking' in the explanation.
- A rollback is requested to a version that never existed; NOT_FOUND.

## UX and accessibility

- Relay ranking page: shows the active RankingConfig version, weights, half-life, promotion cap and the signed statement fingerprint; operator console adds Publish and Roll back with a diff preview.

**States:** loading; active; publishing; error

**Accessibility:** Weights are shown as a table with headers; Publish and Roll back buttons are at least 44 by 44 px with confirmation dialogs.; Result 'Promoted' labels are text, not colour only.

## Owned data

- `RankingConfig` (classrup.discovery.ranking_config/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `discovery.ranking_config.publish`, `discovery.ranking_config.rollback`
- Queries: `discovery.ranking_config.get_active`
- Emits: `discovery.ranking_config.published`
- Consumes: none

## Dependencies

F06.S02.M01, F06.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-051-01 | [Domain schema](domain_schema.md) | 3 |
| PS-051-02 | [Validation rules](validation_rules.md) | 3 |
| PS-051-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-051-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-051-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-051-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-051-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-051-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-051-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-051-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/ranking/relevance/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI.
- Golden score vectors match on Node and in the browser test runner.
- No configuration can produce a promotion multiplier above 1.25 or an unlabelled promoted result.
