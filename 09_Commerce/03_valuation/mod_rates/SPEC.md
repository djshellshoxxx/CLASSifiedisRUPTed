# F09.S03.M02 — rates

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F09). **Parent:** [F09.S03 valuation](../SPEC.md). **Canonical contracts:** CTR-COM-001 (quote object, R04 pinning, quote errors), CTR-ID-001 (`qte`), CTR-EVT-001, CTR-SCH-001, CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Purpose and business behavior
Issues pinned, expiring quotes (`qte_`) for cross-currency proposals and claims. Quotes come only from registered rate sources, are checked for staleness and divergence, and are fixed at the moment a party consents. Users cannot supply rates. A consented quote fixes the agreed value; a quote's expiry blocks new quotes only.

## User stories
- As a proposer, I see one agreed value in the other currency that I can accept or decline before consenting.
- As a counterparty, the quote I consent to cannot change after I agree.
- As an operator, I can see which sources are stale or disagree, and quotes stop being issued when they do.

## Scope
- In scope: source registration, quote issuance, divergence and staleness checks, quote hashing, quote expiry, consent-time pinning hook.
- Out of scope: currency registry (mod_currency), arithmetic (mod_precision), chain price oracles for on-chain assets beyond registered sources, trading or conversion execution (the platform does not convert funds).

## Public interfaces
Commands `quote.issue` (sys), `rate_source.register`, `rate_source.disable`. Queries `quote.get`. Events `quote.issued`, `quote.expired`, `rate_source.registered`, `rate_source.disabled`, `quote.refused` (internal audit). Prefix `qte_` exists in CTR-ID-001; `rsrc` source prefix is PENDING.

## Relationships, dependencies and integration
Upstream: `cur_` registry (mod_currency), external rate sources (registered adapters). Downstream: proposals (F02 mod_offers, mod_negotiation), claims (CTR-COM-001 `clm.submit` cross-currency), mod_precision for conversion, LocalMutiny value balancing (consumer).

## Data ownership
Owns quote records and source registry. Consumers reference `qte_` by full ID.

## Risk considerations
Oracle manipulation by a single source; stale data at consent; quote-shopping across sources; quote expiry before settlement; source outage leaving proposals unpriced; user-supplied rates; collusion between a source operator and a party.

## Completion criteria
Source list and divergence thresholds approved; HALF_EVEN golden vectors pass (with mod_precision); consent-pinning contract agreed with F02; source licensing reviewed.

## Required process specification inventory
- [x] `domain_schema.md` — PS-075-01
- [x] `validation_rules.md` — PS-075-02
- [x] `workflow_state_machine.md` — PS-075-03
- [x] `commands_queries_events.md` — PS-075-04
- [x] `authorization_capabilities.md` — PS-075-05
- [x] `failure_recovery_idempotency.md` — PS-075-06
- [x] `privacy_retention_abuse.md` — PS-075-07
- [x] `observability_performance.md` — PS-075-08
- [x] `contract_and_acceptance_tests.md` — PS-075-09
- [x] `import_export_backup_rollback.md` — PS-075-10
