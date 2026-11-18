# F07.S03.M01 — reputation

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Identity&Trust Lead (F07). **Parent:** F07.S03.

## Purpose and business behavior
Turns a pseudonym's (`prf_`) completed exchanges, confirmed outcomes, signed statements and dispute results into a coarse trust band (0–5) plus a status. Counts only events that reached confirmed finality from F09 or were signed by a counterparty; self-attested activity carries low weight. Publishes band and status only; counters are visible to the subject. Does not hold evidence records (mod_evidence), payment claims (F09), disputes (F09) or moderation cases (F12).

## User stories
- As a pseudonym holder, I see my own counters and why my band is what it is, without seeing who my counterparties were.
- As a counterparty, I see a coarse band for a pseudonym before I agree to an exchange.
- As a pseudonym holder, I see "insufficient data" rather than a misleading band when I have few counterparties.
- As Trust&Safety, I can freeze a band during review without exposing the counters.

## Scope
- [domain_schema.md](domain_schema.md) — PS-058-01
- [validation_rules.md](validation_rules.md) — PS-058-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-058-03
- [commands_queries_events.md](commands_queries_events.md) — PS-058-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-058-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-058-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-058-07
- [observability_performance.md](observability_performance.md) — PS-058-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-058-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-058-10

## Public interfaces
Queries `GetReputationBand`, `GetOwnReputation`; internal input commands from owning modules; events `reputation.band_changed`, `reputation.review_opened`, `reputation.review_closed` (CTR-EVT-001). Details in PS-058-04.

## Relationships, dependencies and integration
Upstream: F09 finality and dispute outcomes; mod_evidence summaries (`counterparty_signed`); exchange outcomes from F02–F05 and F08 handoff; mod_pseudonyms (`pseudonym.retired`); F12 review events. Downstream: listings, offers and messaging display band; mod_relevance may read band in a future decision (PS-058-07 R07). Canonical IDs: CTR-ID-001 `prf`.

## Data ownership
Owns counters, band, status and the diversity-window pair records. Does not own `prf_` lifecycle, evidence records, payment claims, disputes or review cases. Retention per PS-058-07.

## Risk considerations
Specific to reputation: (1) farming by repeated exchanges with one or a few friendly counterparties; (2) Sybil rings that create pseudonyms and trade among themselves; (3) band inference from small counts (a band can reveal a single exchange); (4) recording confirmed outcomes before finality, which overstates trust; (5) reputation used as a proxy for legal identity or safety; (6) score history allowing deanonymization. The band is an estimate from recorded events, not a verified fact.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-058-*.Rnn` mapped to `TEST-PS-058-*`; scoring weights and thresholds marked PROVISIONAL with sign-off; D07 approved or kept PROVISIONAL; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-058-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-058-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-058-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-058-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-058-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-058-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-058-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-058-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-058-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-058-10, SPEC-DRAFT-COMPLETE
