# F01.S04.M02 — negotiation

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** F01.S04 ([pricing SPEC](../SPEC.md)).

## Purpose and business behavior
Lets one buyer open a price or value negotiation on one active listing with the listing's seller. The parties exchange counter-proposals in strict turns, then accept, reject, withdraw, or let the negotiation expire. Agreement is a recorded state (`AGREED`) with pinned terms. It creates no exchange, payment, custody or completed sale; a separate explicit handoff to F09 does that. Every transition is authorized, emits an event, and is recoverable after failure.

## User stories
- As a buyer, I can open a negotiation on an active listing under my pseudonym, and the seller never sees my account ID.
- As a seller, I can counter, accept or reject one buyer's terms within 72 hours, and I see only negotiations on my listing.
- As a seller, I cannot accept terms after I edit the listing. The system tells me why and I can ask the buyer to re-open.
- As a buyer, I can see whether my last terms are waiting for the seller, were rejected, expired, or were voided because the listing was removed.
- As an operator, I can turn negotiation off without affecting listing publication or other pricing features.

## Scope
- [domain_schema.md](domain_schema.md) — PS-010-01, negotiation record and terms
- [validation_rules.md](validation_rules.md) — PS-010-02, bounds, quote and listing checks, error table
- [workflow_state_machine.md](workflow_state_machine.md) — PS-010-03, six states and turn rule
- [commands_queries_events.md](commands_queries_events.md) — PS-010-04, `neg.*` commands and `negotiation.*` events
- [authorization_capabilities.md](authorization_capabilities.md) — PS-010-05, action matrix and field visibility
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-010-06, unique pairs, revisions, offline replay
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-010-07, classes, retention, abuse controls
- [observability_performance.md](observability_performance.md) — PS-010-08, metrics, latency, log redaction
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-010-09, contract and property suites
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-010-10, owner export, restore, flag rollback

## User stories and scope limits
Out of scope: pickup or meeting arrangement (F05, F08), payment claims and verification (F09, CTR-COM-001), formal offer records (mod_offers), cycle consent (F02), and any custody of funds.

## Public interfaces
Commands: `neg.open`, `neg.counter`, `neg.accept`, `neg.reject`, `neg.withdraw`; system-only `neg.expire`, `neg.void`. Queries: `neg.get`, `neg.list`, `neg.history`. Events: `negotiation.opened`, `.countered`, `.agreed`, `.rejected`, `.withdrawn`, `.expired`, `.voided`. Errors: `NEG.*` codes in [validation_rules.md](validation_rules.md), shared `SYS.*`, `COM.*` and `EVT.*` by reference. Detail: [commands_queries_events.md](commands_queries_events.md). All state-changing commands require an idempotency key and `expected_revision`.

## Relationships, dependencies and integration
- Upstream: F01 listing (`lst_`, active status, listing version); F07 identity (`acc_`, `prf_` views); F10 privacy classes; F16 authorization and grants; CTR-COM-001 quote (`qte_`) for cross-currency terms.
- Downstream: F09 for explicit handoff of `AGREED` terms to `trx_` (outside this module); F08 message thread (`thr_`) for free-text discussion; F13 generic notifications; F12 moderation via reports (`rpt_`, `cas_`).
- Consent: acceptance is an explicit party act. The consent record owner is PENDING B-06 resolution (see TODO).
- Integration requires contract tests and explicit timeout and retry behavior (see PS-010-06).

## Data ownership
This module owns negotiation records, their terms history, and the `negotiation.*` event stream. Listings belong to F01, messages to F08, quotes and claims to F09, and identity to F07. Terms reference those records by ID only. Export and deletion follow retention and legal-hold policy.

## Risk considerations
- Bait-and-switch: listing edits during an open negotiation changing the value the buyer agreed to. Mitigated by listing version snapshot and accept block (`NEG.LISTING_CHANGED`).
- Price anchoring and ratio abuse by either party. Mitigated by 0.10×–10.00× bounds and a 10-round cap (ASSUMPTION).
- Identity linkage: seller learning the buyer's account across negotiations. Mitigated by `prf_`-only views; pseudonyms do not guarantee anonymity.
- Enumeration of other buyers on the same listing. Mitigated by uniform `SYS.NOT_FOUND`.
- Race conditions: accept versus expiry, accept versus listing edit, double accept after offline replay.
- Quote expiry between counter and accept. Mitigated by re-check at accept (`COM.QUOTE_EXPIRED`).
- Misreading `AGREED` as payment or completed sale. Labels must not use "paid", "payment received" or "settled" (CTR-COM-001 R15).
- No platform custody of money. No platform wallet or balance field exists.

## Completion criteria
All ten process specs exist and are approved; every process spec is implemented and tested in later phases; privacy and security review, error handling and traceability (PS-010 to TEST-PS-010) pass.

## Required process specification inventory
- [x] `domain_schema.md` — PS-010-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-010-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-010-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-010-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-010-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-010-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-010-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-010-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-010-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-010-10, SPEC-DRAFT-COMPLETE (pending approval)
