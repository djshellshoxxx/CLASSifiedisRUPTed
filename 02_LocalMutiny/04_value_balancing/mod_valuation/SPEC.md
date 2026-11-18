# F02.S04.M03 — valuation

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F02). **Parent:** F02.S04.

## Purpose and business behavior
Computes the valuation snapshot for a LocalMutiny proposal revision: each item line (listing reference or self-declared value) is converted to the reference currency using pinned quotes from F09.S03 and rounded under the F09.S03.M03 policy, then netted per party. The snapshot is the basis on which mod_mixed declares compensation legs and on which participants give consent. This module does not set market prices, issue quotes, or own rounding rules.

## User stories
- As a proposer, I see how my declared item value converts to the agreed currency and which quote was used.
- As a counterparty, I can see whether a value is a listing reference or a self-declared figure before I consent.
- As an operator, I can see how many snapshots went stale because a quote expired, without seeing any values.

## Scope
- Owns: valuation snapshot rows keyed by (`cyc_` ID, `revision`), snapshot states, declared-value lines.
- Consumes: pinned quotes and rounding policy (F09.S03.M02 `mod_rates`, F09.S03.M03 `mod_precision`), listing references (F01).
- Provides to: F02.S04.M01 `mod_mixed`, F02.S01.M04 `mod_counteroffer`, F02.S02.M05 `mod_feasibility`.
- Process specs: the ten canonical files listed below.

## Public interfaces
Commands `valuation.compute`, `valuation.declare_value`; query `valuation.get`; events `valuation.snapshot_computed`, `valuation.snapshot_stale`, `valuation.value_declared`. Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F09.S03.M02 `mod_rates` (quotes, CTR-COM-001 quote object), F09.S03.M03 `mod_precision` (rounding and exponent), F01 listings (reference prices). Downstream: F02.S04.M01, F02.S01.M04, F02.S02.M05. Contracts: CTR-COM-001, CTR-SCH-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

## Data ownership
Canonical owner of valuation-basis records: F02.S04.M03 (this module), keyed by (`cyc_`, revision). Canonical owner of pinned quotes (`qte_`), rates and rounding policy: F09.S03 (Commerce Lead), per review M-16 fix. Canonical owner of the currency registry: F09.S03.M01. This module consumes those by full ID.

## Risk considerations
- Self-declared values can inflate or deflate compensation between participants; mitigated by visible `value_source`, advisory signals to F12, and listing-reference preference.
- Quote expiry during consent; mitigated by stale-state transitions and hash-bound consent.
- Rounding drift across many lines; mitigated by exact integer arithmetic and per-line rounding.
- Valuation details leaking to non-participants or public surfaces.
- Disputes over basis; handled through F09.S02.M02 `mod_disputes`.

## Completion criteria
All ten process specs (PS-027-01 to PS-027-10) are SPEC-DRAFT-COMPLETE; rounding and quote authority is cited to F09.S03; error codes registered; implementation, tests and security review are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-027-01
- [x] [validation_rules.md](validation_rules.md) — PS-027-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-027-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-027-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-027-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-027-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-027-07
- [x] [observability_performance.md](observability_performance.md) — PS-027-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-027-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-027-10
