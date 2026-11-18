# F12.S03.M02 — signals

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead (F12). **Parent:** F12.S03.

## Purpose and business behavior
Produce typed, expiring, privacy-minimized abuse-risk signals from upstream modules: listing velocity, message velocity, report density, authentication bursts and bid patterns. Serve them as per-case inputs to moderation and as k-anonymous aggregates to scoring and rate limiting. A signal records a behaviour pattern. It is not a finding of wrongdoing and never triggers a sanction alone.

## User stories
- As a participant, I can appeal a restriction and learn which signal type and bucket contributed, without seeing raw data.
- As a moderator, I can read signals for a case under a time-limited, purpose-bound grant and suppress signals that were wrong.
- As an operator, I can disable a noisy producer without deleting any record.

## Scope
- PS-101-01 `domain_schema.md`
- PS-101-02 `validation_rules.md`
- PS-101-03 `workflow_state_machine.md`
- PS-101-04 `commands_queries_events.md`
- PS-101-05 `authorization_capabilities.md`
- PS-101-06 `failure_recovery_idempotency.md`
- PS-101-07 `privacy_retention_abuse.md`
- PS-101-08 `observability_performance.md`
- PS-101-09 `contract_and_acceptance_tests.md`
- PS-101-10 `import_export_backup_rollback.md`

## Public interfaces
Commands `sgn.create`, `sgn.update`. Queries `sgn.list_by_subject`, `sgn_aggregate.read`. Events `signal.recorded`, `signal.suppressed`, `signal.expired`, `signal.redacted`. Errors `SIGNAL.*` (CTR-ERR-001). Details: PS-101-04.

## Relationships, dependencies and integration
Upstream: F10.S02.M03 `10_Privacy/02_security_boundaries/mod_metadata` (metadata minimization); F15.S03.M01 `15_Platform/03_operations/mod_observability` (telemetry source).
Downstream: F04.S02.M01 `04_Auctions/02_auction_integrity/mod_anti`; F07.S03.M01 `07_Identity/03_trust/mod_evidence`; F12.S02.M02 `12_Moderation/02_policy/mod_spam`; F12.S03.M01 `12_Moderation/03_antifraud/mod_risk`; F12.S03.M03 `12_Moderation/03_antifraud/mod_rate`.
Consumers reference `sgn_` IDs and aggregate outputs by full ID only.

## Data ownership
Canonical owner of the signal record class (`sgn_`). Does not own accounts (F07.S01.M01), reports and cases (F12.S01), grants (F16.S01.M01) or the consent record class (F10.S01.M01). Export and deletion follow CTR-PRV-001 retention and legal-hold rules.

## Risk considerations
Signals encode behaviour and can deanonymize a pseudonymous account when combined with timing or graph data. False positives harm honest users, for example on launch days. Coordinated false reports can frame targets. A compromised producer can poison scoring. Scoring feedback loops can amplify early errors. Mitigations: derived features only, K_MIN = 5 aggregation, per-reporter caps, no sanction on signals alone, appeal path, revision-checked suppression. Pseudonyms do not guarantee anonymity.

## Completion criteria
All child SPEC/TODO chains exist; every process spec is implemented and tested in later phases; privacy/security review, error handling and traceability pass.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-101-01 — SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-101-02 — SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-101-03 — SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-101-04 — SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-101-05 — SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-101-06 — SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-101-07 — SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-101-08 — SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-101-09 — SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-101-10 — SPEC-DRAFT-COMPLETE
