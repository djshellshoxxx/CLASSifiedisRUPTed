# F12.S02.M02 — Spam detection

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S02](../SPEC.md). **Process IDs:** PS-097-01…PS-097-10. **Code:** `packages/moderation/src/policy/spam`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Deterministic spam heuristics exposed as the in-process query moderation.spam.evaluate (N19) and run in three modes: in the author's vault on a draft before it is signed (author_presign, used by F01.S01.M03 publish), on a relay through the index-intake hook when a signed public projection arrives for indexing (relay_intake), and in a user's vault as a local filter over incoming listings (vault_filter). Heuristics are duplicate content hash, near-duplicate simhash, link density, posting velocity counted by the store's own receipt time, backdated claims and new-key limits from the store's own first observation of a key. Results are explainable signals with a score from 0 to 100, never automatic bans. The only automatic effect is a short velocity throttle on the relay's own intake, which expires within 1 hour and is labelled automated. Local use only labels or folds content for that user, and the author's pre-sign check only asks the author to confirm.

## Responsibilities

- Evaluate submitted text and metadata with fixed, versioned heuristics and return a score, matched heuristic names, measured values, thresholds and a degraded flag.
- Expose moderation.spam.evaluate in-process for author_presign (F01.S01.M03, N19), relay_intake (relay index-intake hook) and vault_filter; it is a registered vault and relay query on the command bus (capability moderation.spam.evaluate), and the SpamEvaluator port is only its implementation.
- Emit moderation.spam.detected with the subject did:key, score, heuristics and an optional recommended throttle, from relay intake and from the vault filter, never from an author's pre-sign check.
- Maintain derived, rebuildable fingerprint and key-observation indexes (normalized SHA-256, 64-bit simhash, store receipt time, first-seen time) keyed by a store-salted key hash, with a 30-day window.
- Keep the heuristic set deterministic: same input and same state give the same output, with the rule version and thresholds recorded in every result.

## Not responsible for

- Banning, removing or suspending anything (F12.S02.M01 decides from signals; relays throttle only through F12.S03.M03).
- Signal storage and decay (F12.S03.M02) and risk levels (F12.S03.M01).
- Prohibited goods detection (F18.S01.M02).
- Deciding whether a draft is published (F01.S01.M03 holds it for owner confirmation).
- Future: language-specific classifiers; image perceptual hashing; shared fingerprint feeds between relays.

## User stories

- As a relay operator, I see why a submission was flagged (for example 'identical text posted 4 times in 10 minutes') and can tune thresholds for my relay.
- As a member, I can fold likely spam in my own feed without any relay deciding for me.
- As a new member posting my first listings, I am not blocked by heuristics that only apply above stated limits, and my own device tells me before signing if my listing looks like spam.

## Edge cases

- A legitimate seller posts 12 near-identical listings for variants of one product; duplicate score rises but the result is a signal and a throttle of at most 1 hour, not removal.
- Text in a script without spaces (for example Chinese); word-based link density uses character counts so the ratio stays defined and never divides by zero.
- Normalization collisions: two different texts normalize to the same hash; the result records both content ids so moderators see the difference.
- A spammer backdates createdAt by 25 hours on 20 fresh statements; velocity counts every first-seen content id by the store's receipt time, so velocity still triggers and backdated_claim is added.
- Replayed old statements are excluded by content id dedupe, never by their claimed timestamp; the device or relay clock is the only time used for windows.
- Fingerprint index lost after restart; it is rebuilt from the index within 5 minutes and duplicate checks run in degraded mode (exact hash only) meanwhile.
- Many different new keys posting the same text in 24 h; coordinated flag is raised with the number of distinct keys but no key is penalized beyond signals.
- The author's own pre-sign check scores a draft 70; F01.S01.M03 holds the draft for confirmation; no event is emitted and no fingerprint is stored for an unsigned draft.

## UX and accessibility

- Relay moderator case view: spam panel listing heuristic, threshold, measured value and score contribution.
- Settings > Safety: toggle 'Fold likely spam in my feed' with a short explanation and list of recently folded items.

**States:** off; on; folded-item; shown-anyway; degraded

**Accessibility:** Folded rows are announced as 'Folded: likely spam' with an accessible button to show the item.; Toggle has a visible label and is operable by keyboard.; Scores are conveyed as text, not color alone.

Headless library. Visible surfaces are the relay moderator case view (heuristic names and values for flagged submissions), the author's publish confirmation (shown by F01.S01.M03 from the pre-sign result) and an optional local feed filter setting 'Fold likely spam' (off by default) showing a 'Folded: likely spam, show' row.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: `moderation.spam.evaluate`
- Emits: `moderation.spam.detected`
- Consumes: `identity.session.started`, `federation.record.accepted`

## Dependencies

F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-097-01 | [Domain schema](domain_schema.md) | 4 |
| PS-097-02 | [Validation rules](validation_rules.md) | 3 |
| PS-097-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-097-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-097-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-097-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-097-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-097-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-097-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-097-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/policy/spam/index.ts`.

## Acceptance criteria

- All tests T01–T19 pass in CI.
- On the labelled corpus, recall ≥ 80% and false-positive rate ≤ 2% at score threshold 50.
- No heuristic result ever causes removal, suspension or ban without a human or published rule in F12.S02.M01.
