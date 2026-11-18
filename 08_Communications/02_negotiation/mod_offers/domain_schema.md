# PS-063-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02 minor units, R03 currency, R04 quote), CTR-ID-001 (`ofr_` PENDING), CTR-EVT-001, CTR-PRV-001, CTR-SCH-001

**Canonical owner (B-06):** the negotiation offer record class (`ofr_`) is owned by **F08.S02.M01** (this module), PROVISIONAL, unapproved. Consumers by full ID: F01.S04.M01 (pricing), F02.S01.M03 (trade proposal offers, `mod_offer`). Their own pricing or proposal records are not `ofr_`.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-01.R01 | An offer binds: target (`lst_` or `cyc_` slot), offerer `acc_`, recipient `acc_`, and a `terms` object (price, compensation lines, items). | MVP |
| PS-063-01.R02 | Price: `amount_minor` decimal string (≤ 39 digits, no leading zero except `0`), `currency` (fiat or asset), `exponent` from currency registry (CTR-COM-001 R02, R03). Floats rejected. | MVP |
| PS-063-01.R03 | Compensation lines (mixed-value barter): ≤ 10 lines, each with `kind` (`money`, `item`, `service`), value in `reference_currency` pinned by `quote_id` when currency differs. | MVP |
| PS-063-01.R04 | Each offer version is immutable. A change creates a new version with `counter_of` pointing to the prior `ofr_` version. | MVP |
| PS-063-01.R05 | Expiry: `expires_at` ≤ `created_at` + 14 days (ASSUMPTION), default 72 h. | MVP |
| PS-063-01.R06 | Counter depth ≤ 20 per target (ASSUMPTION). | MVP |

## Data / schema
```json
{"offer_id":"ofr_…","target":{"type":"listing|cycle_slot","ref":"lst_…|cyc_…/par_…"},"offerer":"acc_…","recipient":"acc_…","version":2,"counter_of":"ofr_…|null","terms":{"price":{"amount_minor":"250000","currency":{"kind":"fiat","code":"EUR","exponent":2}},"compensation":[{"kind":"item","ref":"lst_…","reference_value":{"amount_minor":"0","currency":{"kind":"fiat","code":"EUR","exponent":2}}}],"quote_id":"qte_…|null"},"terms_digest":"64 hex","state":"open|countered|accepted|declined|withdrawn|expired","expires_at":"RFC3339 ms Z","schema_version":"1.0.0"}
```
Data class: `terms` amounts = FINANCIAL_EVIDENCE; identifiers PSEUDONYMOUS.

## Commands / queries / events
See [PS-063-04](commands_queries_events.md). Schema `offer.v1`.

## States & transitions
See [PS-063-03](workflow_state_machine.md).

## Validation & errors
See [PS-063-02](validation_rules.md). Error slug `OFFERS`.

## Authorization
Offerer, recipient and participant rules in [PS-063-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Version chain is append-only; concurrent counters rejected by revision ([PS-063-06](failure_recovery_idempotency.md)).

## Privacy, retention, abuse
Amounts never logged or federated (CTR-PRV-001 FINANCIAL_EVIDENCE). See [PS-063-07](privacy_retention_abuse.md).

## Observability & budgets
Counters by `state` and `currency.kind` only, never by amount.

## Tests
- TEST-PS-063-01-01 (unit): `amount_minor` with leading zero or float rejected.
- TEST-PS-063-01-02 (unit): compensation of 11 lines rejected.
- TEST-PS-063-01-03 (property): `terms_digest` changes iff terms change; version chain has no gaps.

## Acceptance criteria
1. Money fields conform to CTR-COM-001 R02 and R03 (TEST-PS-063-01-01).
2. Version chain is append-only (TEST-PS-063-01-03).

## Assumptions & open decisions
- PENDING CTR-ID-001 registry entry for `ofr_` (proposed ulid, owner F08).
- D03 (mixed currency valuation): PROVISIONAL (D03 default, unapproved) — pinned quote, integer minor units, expiry.
