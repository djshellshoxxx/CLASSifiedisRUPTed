# F12.S03.M01 — Risk scoring

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S03](../SPEC.md). **Process IDs:** PS-100-01…PS-100-10. **Code:** `packages/moderation/src/antifraud/risk`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Combines the signals a store holds about a key into an explainable risk level (low, medium, high) with a 0 to 100 score and a list of factors whose points sum to the score, using the published points table risk/1. A high level triggers friction only: an extra confirmation before a deal step, lower relay limits, or a manual review queue entry on a relay. It never bans, hides or silently downgrades anyone. The assessment is local to the store that computed it: a vault shows its owner a caution about a counterparty based on the owner's own history, a relay uses its own signals for its hosting limits, and the author's vault runs the N19 query moderation.risk.assess on its own listing publication before signing. Level rises and drops are both emitted, so frictions lift as soon as decay lowers a level.

## Responsibilities

- Own the RiskAssessment record per subject key, per proposed transaction and per own listing publication, with level, score, factors and validity window.
- Compute the score from decayed signals (F12.S03.M02), the store's own first observation of a key, completed dealings recorded as signals and, for transactions, the amount bucket, with the fixed versioned points table risk/1.
- Emit moderation.risk.elevated when a level rises and moderation.risk.lowered when hysteresis lets it drop, and keep the factors visible to the subject on a relay and to the owner in a vault.
- Expose moderation.risk.assess in-process (N19) for transaction and listing_publication subjects.
- Recommend frictions by level and leave their enforcement to the consumer (local confirmation UI, F01.S01.M03 hold for confirmation, F12.S03.M04 limits, F12.S02.M01 review queue).

## Not responsible for

- Signal ingestion and decay storage (F12.S03.M02).
- Applying limits (F12.S03.M04), holding publications (F01.S01.M03) and suspensions (F12.S02.M01).
- Reputation display (F07.S03.M01).
- Future: calibrated models with feedback from outcomes; sharing of levels between relays by signed attestation.

## User stories

- As a user about to accept a trade with someone whose history on my device includes two no-shows, I see 'Be careful: 2 no-shows in your history' and, at level high, must confirm once more.
- As a relay member limited by a high level, I can see the factors that led to it and what lowers it, nothing is hidden from me, and the limit lifts as soon as the level drops.
- As a relay moderator, I see factors, not just a number, and cannot use the level as the sole reason for removal.
- As a new member publishing many listings in my first day, my own device asks me to confirm before signing, and nothing is sent anywhere because of it.

## Edge cases

- A brand-new key with no signals; the score is 0 and level low, and a new-key factor of at most 10 points applies only on relays that enable it, measured from the relay's own first observation of the key.
- One severe signal (shill suspicion, weight 40) alone; score 40 is medium and cannot reach high without a second independent factor.
- Signals decay and the score drops; hysteresis returns high to medium only below 60 (high threshold 70) and medium to low only below 25 (medium threshold 35), and the recompute is scheduled at the computed crossing time, so moderation.risk.lowered is emitted then rather than at a daily sweep.
- Two assessments are computed concurrently after bursts of signals; the later computation by input digest wins and the earlier is discarded idempotently.
- The subject disputes their level; the UI explains factors and offers the appeal route only for enforcement actions, and says levels are not actions.
- A transaction assessment is requested for a counterparty never seen; the result is level low with factor 'no history' and confidence unknown.
- identity.account.created describes only the local principal; it feeds only the own-publication factor and is never used as another key's age.

## UX and accessibility

- Caution banner on counterparty profiles and on trade confirmation steps: level label, up to 3 factor sentences, 'Why am I seeing this?' link, extra confirmation checkbox when level is high.
- My safety status (relay members): own level, factors with points, frictions currently applied, and when each factor is expected to decay below its threshold.
- Relay moderator case view: level, factor table, input digest, model version.

**States:** loading; low; medium; high; unknown-history; stale

**Accessibility:** Levels are conveyed with text labels and icons, not color alone.; Factor lists are semantic lists and the extra confirmation uses a labelled checkbox of at least 44 by 44 px.; Banner changes are announced in an aria-live polite region.

## Owned data

- `RiskAssessment` (classrup.moderation.riskassessment/v1, P2, RET-SHORT)

## Interfaces

- Commands: `moderation.riskassessment.recompute`
- Queries: `moderation.riskassessment.get`, `moderation.riskassessment.get_mine`, `moderation.risk.assess`
- Emits: `moderation.risk.elevated`, `moderation.risk.lowered`
- Consumes: `moderation.signal.recorded`, `identity.session.started`, `federation.record.accepted`, `identity.account.created`

## Dependencies

F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-100-01 | [Domain schema](domain_schema.md) | 4 |
| PS-100-02 | [Validation rules](validation_rules.md) | 3 |
| PS-100-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-100-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-100-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-100-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-100-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-100-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-100-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-100-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/antifraud/risk/index.ts`.

## Acceptance criteria

- All tests T01–T19 pass in CI.
- Every high level shows its factors to the subject on a relay and to the vault owner locally, and triggers friction only.
- Identical inputs always yield identical level, score and factors, and frictions lift when a level drops.
