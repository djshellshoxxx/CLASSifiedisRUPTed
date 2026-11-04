# F12.S02.M02 — Spam detection

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S02](../SPEC.md). **Process IDs:** PS-097-01…PS-097-10. **Code:** `packages/moderation/src/policy/spam`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Deterministic spam heuristics that run in two places: on a relay when a signed public projection is submitted for indexing, and in a user's vault as a local filter over incoming statements. Heuristics are duplicate content hash, link density, posting velocity and new-key limits. Results are explainable signals with a score from 0 to 100, never automatic bans. The only automatic effect is a short velocity throttle on the relay's own intake, which expires within 1 hour and is labelled automated. Local use only labels or folds content for that user.

## Responsibilities

- Evaluate submitted text and metadata with fixed, versioned heuristics and return a score, matched heuristic names and evidence values.
- Emit moderation.spam.detected with score, heuristics and an optional recommended throttle, from relay intake and from the vault filter.
- Maintain a derived, rebuildable fingerprint index (normalized SHA-256 and 64-bit simhash) with a 30-day window for duplicate checks.
- [object Object]

## Not responsible for

- Banning, removing or suspending anything (F12.S02.M01 decides from signals; relays throttle only through F12.S03.M03).
- Signal storage and decay (F12.S03.M02) and risk levels (F12.S03.M01).
- Prohibited goods detection (F18.S01.M02).
- Future: language-specific classifiers; image perceptual hashing; shared fingerprint feeds between relays.

## User stories

- As a relay operator, I see why a submission was flagged (for example 'identical text posted 4 times in 10 minutes') and can tune thresholds for my relay.
- As a member, I can fold likely spam in my own feed without any relay deciding for me.
- As a new member posting my first listings, I am not blocked by heuristics that only apply above stated limits.

## Edge cases

- A legitimate seller posts 12 near-identical listings for variants of one product; duplicate score rises but the result is a signal and a throttle of at most 1 hour, not removal.
- Text in a script without spaces (for example Chinese); word-based link density uses character counts so the ratio stays defined and never divides by zero.
- [object Object]
- Clock changes or replayed old statements make velocity look huge; velocity uses the relay's receipt clock and ignores statements whose own timestamp is older than 24 h.
- Fingerprint index lost after restart; it is rebuilt from the index within 5 minutes and duplicate checks run in degraded mode (exact hash only) meanwhile.
- Many different new keys posting the same text in 24 h; coordinated flag is raised with the number of distinct keys but no key is penalized beyond signals.

## UX and accessibility

- Relay moderator case view: spam panel listing heuristic, threshold, measured value and score contribution.
- Settings > Safety: toggle 'Fold likely spam in my feed' with a short explanation and list of recently folded items.

**States:** off; on; folded-item; shown-anyway

**Accessibility:** [object Object]; Toggle has a visible label and is operable by keyboard.; Scores are conveyed as text, not color alone.

Headless library. Visible surfaces are the relay moderator case view (heuristic names and values for flagged submissions) and an optional local feed filter setting 'Fold likely spam' (off by default) showing a 'Folded: likely spam, show' row.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: `moderation.spam.detected`
- Consumes: `bazaar.listing.published`, `identity.account.created`, `moderation.rate.exceeded`

## Dependencies

F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-097-01 | [Domain schema](domain_schema.md) | 3 |
| PS-097-02 | [Validation rules](validation_rules.md) | 3 |
| PS-097-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-097-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-097-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-097-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-097-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-097-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-097-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-097-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/policy/spam/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- On the labelled corpus, recall ≥ 80% and false-positive rate ≤ 2% at score threshold 50.
- No heuristic result ever causes removal, suspension or ban without a human or published rule in F12.S02.M01.
